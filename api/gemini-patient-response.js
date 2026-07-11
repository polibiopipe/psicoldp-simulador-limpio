import { cases } from "../src/data/cases.js";
import { patientFacts } from "../src/data/patientFacts.js";
import { patientMasterRecords } from "../src/data/patients/index.js";
import { clinicalSimulationProfiles } from "../src/data/clinicalAvatars/clinicalSimulationProfiles.js";
import { generateLocalPatientResponse } from "../src/engine/localMiniAI.js";
import { createClient } from "@supabase/supabase-js";
import {
  MAX_CONTEXT_TURNS,
  MAX_STUDENT_TURNS,
  SESSION_DURATION_MINUTES,
  SIMULATION_TIMEZONE,
  getSimulationUsagePolicy,
  getZonedDateKey
} from "../src/engine/simulationUsagePolicy.js";

const DEFAULT_MODEL = "gemini-2.5-flash";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const MAX_HISTORY_TURNS = MAX_CONTEXT_TURNS;
const MAX_REQUEST_BODY_CHARS = 24000;
const INVALID_FINAL_WORDS = new Set([
  "a",
  "al",
  "de",
  "del",
  "en",
  "con",
  "por",
  "para",
  "un",
  "una",
  "el",
  "la",
  "los",
  "las",
  "lo",
  "que",
  "como",
  "cuando",
  "porque",
  "pero",
  "aunque",
  "desde",
  "hacia",
  "sobre",
  "entre",
  "unos",
  "unas"
]);

export default async function handler(req, res) {
  applyHeaders(res, corsHeaders());

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim() || "";
  const model = sanitizeModel(process.env.GEMINI_MODEL) || DEFAULT_MODEL;

  if (req.method === "GET") {
    sendJson(res, 200, {
      ok: true,
      provider: "vercel",
      function: "gemini-patient-response",
      hasGeminiKey: Boolean(apiKey),
      model
    });
    return;
  }

  if (req.method !== "POST") {
    applyHeaders(res, { Allow: "GET, POST, OPTIONS" });
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  let payload;
  try {
    payload = parseRequestBody(req);
  } catch (error) {
    if (error?.code === "REQUEST_BODY_TOO_LARGE") {
      sendJson(res, 413, {
        ok: false,
        code: "REQUEST_BODY_TOO_LARGE",
        errorType: "REQUEST_BODY_TOO_LARGE",
        message: "La solicitud es demasiado extensa para procesarse con seguridad.",
        retryable: false
      });
      return;
    }
    sendJson(res, 400, { error: "Invalid JSON payload" });
    return;
  }

  const caseId = sanitizeId(payload.caseId);
  const studentMessage = cleanText(payload.studentMessage, 1600);
  if (!caseId || !studentMessage) {
    sendJson(res, 400, { error: "caseId and studentMessage are required" });
    return;
  }

  const usageValidation = await validateUsageBeforeGemini({ req, payload, caseId });
  if (!usageValidation.ok) {
    sendJson(res, usageValidation.statusCode || 409, {
      ok: false,
      code: usageValidation.code,
      errorType: usageValidation.code,
      message: usageValidation.message,
      fallbackReason: usageValidation.code,
      retryable: Boolean(usageValidation.retryable)
    });
    return;
  }

  if (usageValidation.cachedResponse?.text) {
    sendJson(res, 200, {
      text: usageValidation.cachedResponse.text,
      responseText: usageValidation.cachedResponse.text,
      source: usageValidation.cachedResponse.source || "gemini",
      provider: usageValidation.cachedResponse.source || "gemini",
      model,
      textLength: usageValidation.cachedResponse.text.length,
      cached: true
    });
    console.info("[gemini] response source", {
      caseId,
      source: usageValidation.cachedResponse.source || "gemini",
      cached: true,
      textLength: usageValidation.cachedResponse.text.length
    });
    return;
  }

  const localFallback = (fallbackReason) => localFallbackResponse({
    payload,
    caseId,
    studentMessage,
    fallbackReason
  });
  const sendLocalFallback = async (fallbackReason) => {
    const fallback = localFallback(fallbackReason);
    if (fallback?.text) {
      const completion = await completeReservedIntervention(usageValidation, fallback.text, "local");
      if (!completion.ok) {
        sendStructuredUsageError(res, completion);
        return;
      }
    } else {
      await releaseReservedIntervention(usageValidation);
      sendStructuredUsageError(
        res,
        usageError(
          "PATIENT_RESPONSE_UNAVAILABLE",
          "No pudimos obtener una respuesta segura del paciente. Intenta reenviar la intervencion.",
          502,
          true
        )
      );
      return;
    }
    sendJson(res, 200, fallback);
  };

  if (!apiKey) {
    await sendLocalFallback("GEMINI_API_KEY missing in Vercel environment");
    return;
  }

  const caseContext = buildCaseContext({
    caseId,
    clientCaseData: payload.caseData
  });
  console.info("[gemini] request context", {
    caseId,
    caseName: caseContext?.minimumClinicalProfile?.name || caseContext?.visibleCase?.name || "unknown",
    profileLoaded: Boolean(
      caseContext?.masterRecord?.identity ||
      caseContext?.clinicalProfile?.identity ||
      caseContext?.visibleCase?.name
    ),
    sessionNumber: toSafeNumber(payload.sessionNumber) || null
  });
  const recentHistory = normalizeHistory(payload.conversationHistory);
  const sessionContext = {
    sessionNumber: toSafeNumber(payload.sessionNumber) || null,
    stage: cleanText(payload.interviewStage || payload.sessionStage, 160),
    selectedInterventionType: cleanText(payload.selectedInterventionType, 160),
    previousSessionSummary: cleanText(payload.previousSessionSummary, 1200)
  };

  const requestBody = {
    systemInstruction: {
      parts: [{ text: buildSystemInstruction() }]
    },
    contents: [
      {
        role: "user",
        parts: [
          {
            text: buildUserPrompt({
              caseContext,
              recentHistory,
              sessionContext,
              studentMessage
            })
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.72,
      topP: 0.9,
      candidateCount: 1,
      maxOutputTokens: 900
    }
  };

  let providerResponse;
  try {
    providerResponse = await fetchGeminiCompletion({ apiKey, model, requestBody });
  } catch (error) {
    console.error("GEMINI_PATIENT_RESPONSE_NETWORK_ERROR", {
      provider: "vercel",
      caseId,
      message: safeErrorMessage(error)
    });
    await sendLocalFallback("Gemini network error");
    return;
  }

  const providerBody = await readJson(providerResponse);
  if (!providerResponse.ok) {
    const providerReason = providerBody?.error?.message || providerBody?.message || `Gemini HTTP ${providerResponse.status}`;
    console.error("GEMINI_PATIENT_RESPONSE_PROVIDER_ERROR", {
      provider: "vercel",
      caseId,
      status: providerResponse.status,
      message: providerReason
    });
    await sendLocalFallback(cleanText(`Gemini provider error: ${providerReason}`, 220));
    return;
  }

  const finishReason = extractGeminiFinishReason(providerBody);
  const responseText = sanitizePatientResponse(extractGeminiText(providerBody));
  if (!responseText) {
    await sendLocalFallback("Gemini returned empty text");
    return;
  }

  if (isIncompleteGeminiResponse(responseText, finishReason)) {
    console.warn("GEMINI_PATIENT_RESPONSE_INCOMPLETE", {
      provider: "vercel",
      caseId,
      finishReason: finishReason || "unknown",
      textLength: responseText.length
    });

    const retryRequestBody = buildRetryRequestBody(requestBody);
    let retryProviderResponse;
    try {
      retryProviderResponse = await fetchGeminiCompletion({ apiKey, model, requestBody: retryRequestBody });
    } catch (retryError) {
      console.error("GEMINI_PATIENT_RESPONSE_RETRY_NETWORK_ERROR", {
        provider: "vercel",
        caseId,
        message: safeErrorMessage(retryError)
      });
      await sendLocalFallback("incomplete gemini response");
      return;
    }

    const retryProviderBody = await readJson(retryProviderResponse);
    if (!retryProviderResponse.ok) {
      const retryReason =
        retryProviderBody?.error?.message || retryProviderBody?.message || `Gemini retry HTTP ${retryProviderResponse.status}`;
      console.error("GEMINI_PATIENT_RESPONSE_RETRY_PROVIDER_ERROR", {
        provider: "vercel",
        caseId,
        status: retryProviderResponse.status,
        message: retryReason
      });
      await sendLocalFallback("incomplete gemini response");
      return;
    }

    const retryFinishReason = extractGeminiFinishReason(retryProviderBody);
    const retryResponseText = sanitizePatientResponse(extractGeminiText(retryProviderBody));
    if (retryResponseText && !isIncompleteGeminiResponse(retryResponseText, retryFinishReason)) {
      const completion = await completeReservedIntervention(usageValidation, retryResponseText, "gemini");
      if (!completion.ok) {
        sendStructuredUsageError(res, completion);
        return;
      }
      sendJson(res, 200, {
        text: retryResponseText,
        responseText: retryResponseText,
        source: "gemini",
        provider: "gemini",
        model,
        finishReason: retryFinishReason,
        textLength: retryResponseText.length,
        retry: true
      });
      console.info("[gemini] response source", {
        caseId,
        source: "gemini",
        retry: true,
        textLength: retryResponseText.length
      });
      return;
    }

    console.warn("GEMINI_PATIENT_RESPONSE_RETRY_INCOMPLETE", {
      provider: "vercel",
      caseId,
      finishReason: retryFinishReason || "unknown",
      textLength: retryResponseText.length
    });
    await sendLocalFallback("incomplete gemini response");
    return;
  }

  const completion = await completeReservedIntervention(usageValidation, responseText, "gemini");
  if (!completion.ok) {
    sendStructuredUsageError(res, completion);
    return;
  }
  sendJson(res, 200, {
    text: responseText,
    responseText,
    source: "gemini",
    provider: "gemini",
    model,
    finishReason,
    textLength: responseText.length
  });
  console.info("[gemini] response source", {
    caseId,
    source: "gemini",
    retry: false,
    textLength: responseText.length
  });
}

function fetchGeminiCompletion({ apiKey, model, requestBody }) {
  return fetch(
    `${GEMINI_API_BASE}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    }
  );
}

async function validateUsageBeforeGemini({ req, payload, caseId }) {
  const accessToken = extractBearerToken(req);
  if (!accessToken) {
    return usageError("AUTH_REQUIRED", "Debes iniciar sesion para usar una entrevista simulada.", 401);
  }

  const supabaseUrl = process.env.SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!supabaseUrl || !serviceRoleKey) {
    return usageError("SERVER_USAGE_CONFIG_MISSING", "Falta configuracion segura para validar el uso de sesiones.", 500);
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });
  const { data: userData, error: userError } = await serviceClient.auth.getUser(accessToken);
  const user = userData?.user || null;
  if (userError || !user) {
    return usageError("AUTH_INVALID", "No pudimos validar tu sesion. Vuelve a iniciar sesion.", 401);
  }

  const { data: profile, error: profileError } = await serviceClient
    .from("user_profiles")
    .select("id,email,approved,role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return usageError("PROFILE_LOOKUP_FAILED", "No pudimos verificar tu perfil de acceso.", 500);
  }
  if (!profile?.approved) {
    return usageError("ACCESS_NOT_APPROVED", "Tu acceso aun no esta aprobado para iniciar sesiones.", 403);
  }

  const policy = getSimulationUsagePolicy({ role: profile.role });
  const appointmentId = sanitizeUuid(payload.appointmentId);
  const sessionRecordId = sanitizeUuid(payload.sessionRecordId);
  const interventionId = sanitizeUuid(payload.interventionId);
  if (!appointmentId) {
    return usageError("APPOINTMENT_REQUIRED", "Agenda la sesion antes de iniciar la entrevista.", 409);
  }
  if (!interventionId) {
    return usageError("INTERVENTION_ID_REQUIRED", "No pudimos identificar la intervencion para reintentar con seguridad.", 400);
  }

  const { data: appointment, error: appointmentError } = await serviceClient
    .from("simulation_appointments")
    .select("*")
    .eq("id", appointmentId)
    .maybeSingle();

  if (appointmentError) {
    return usageError("APPOINTMENT_LOOKUP_FAILED", "No pudimos validar la cita de la sesion.", 500);
  }
  if (!appointment || appointment.user_id !== user.id) {
    return usageError("APPOINTMENT_REQUIRED", "Agenda la sesion antes de iniciar la entrevista.", 409);
  }
  if (appointment.case_id !== caseId) {
    return usageError("APPOINTMENT_CASE_MISMATCH", "La cita no corresponde al paciente seleccionado.", 409);
  }
  if (["cancelled", "completed"].includes(appointment.status)) {
    return usageError("SESSION_ALREADY_CLOSED", "Esta sesion ya fue cerrada o cancelada.", 409);
  }
  if (appointment.status === "closure_pending") {
    return usageError("CLOSURE_PENDING", "Esta sesion tiene cierre pendiente. Retoma la decision clinica antes de volver al chat.", 409);
  }

  let sessionRecord = null;
  if (sessionRecordId) {
    const { data: sessionData, error: sessionError } = await serviceClient
      .from("simulation_sessions")
      .select("id,user_id,case_id,status,appointment_id,session_number")
      .eq("id", sessionRecordId)
      .maybeSingle();

    if (sessionError) {
      return usageError("SESSION_LOOKUP_FAILED", "No pudimos validar la sesion activa.", 500);
    }
    if (sessionData) {
      sessionRecord = sessionData;
      if (sessionData.user_id !== user.id) {
        return usageError("SESSION_NOT_OWNED", "La sesion activa no pertenece a tu usuario.", 403);
      }
      if (sessionData.case_id !== caseId) {
        return usageError("SESSION_CASE_MISMATCH", "La sesion activa no corresponde al paciente seleccionado.", 409);
      }
      if (sessionData.appointment_id && sessionData.appointment_id !== appointment.id) {
        return usageError("SESSION_APPOINTMENT_MISMATCH", "La sesion activa no corresponde a la cita seleccionada.", 409);
      }
      if (sessionData.status === "closure_pending") {
        return usageError("CLOSURE_PENDING", "Esta sesion tiene cierre pendiente. Retoma la decision clinica antes de volver al chat.", 409);
      }
      if (sessionData.status === "completed") {
        return usageError("SESSION_ALREADY_CLOSED", "Esta sesion ya fue cerrada.", 409);
      }
    }
  }

  if (!policy.hasBypass) {
    const today = getZonedDateKey(new Date(), SIMULATION_TIMEZONE);
    const scheduledLocalDate = String(appointment.scheduled_local_date || "").slice(0, 10);
    if (appointment.status === "scheduled" && scheduledLocalDate !== today) {
      return usageError("APPOINTMENT_NOT_TODAY", "Esta sesion esta programada para otro dia.", 409);
    }

    if (appointment.started_at) {
      const startedAt = new Date(appointment.started_at);
      const duration = Number(appointment.duration_minutes) || SESSION_DURATION_MINUTES;
      const expiresAt = startedAt.getTime() + duration * 60 * 1000;
      if (Date.now() > expiresAt) {
        return usageError(
          "SESSION_TIME_EXPIRED",
          "El tiempo de entrevista ha finalizado. Continua con el cierre y la retroalimentacion.",
          409
        );
      }
    }
  }

  const { data: reservation, error: reserveError } = await serviceClient.rpc("reserve_simulation_intervention", {
    p_appointment_id: appointment.id,
    p_session_id: sessionRecordId || null,
    p_intervention_id: interventionId,
    p_user_id: user.id,
    p_case_id: caseId,
    p_max_turns: policy.hasBypass ? 100000 : MAX_STUDENT_TURNS
  });

  if (reserveError) {
    return usageError(
      "INTERVENTION_RESERVE_FAILED",
      "No pudimos reservar la intervencion de forma segura. Intenta nuevamente.",
      500,
      true
    );
  }

  if (!reservation?.ok) {
    const code = cleanText(reservation?.code || "INTERVENTION_RESERVE_REJECTED", 80);
    return usageError(
      code,
      usageMessageForCode(code),
      statusForUsageCode(code),
      isRetryableUsageCode(code)
    );
  }

  if (reservation?.duplicate && reservation?.responseText) {
    return {
      ok: true,
      serviceClient,
      user,
      profile,
      policy,
      appointment,
      appointmentId,
      sessionRecordId,
      interventionId,
      sessionRecord,
      cachedResponse: {
        text: cleanText(reservation.responseText, 3200),
        source: cleanText(reservation.source || "gemini", 80) || "gemini"
      }
    };
  }

  console.info("[usage] validation ok", {
    userId: user.id,
    caseId,
    appointmentId,
    sessionRecordId: sessionRecordId || null,
    interventionId,
    role: profile.role,
    bypass: policy.hasBypass
  });

  return {
    ok: true,
    serviceClient,
    user,
    profile,
    policy,
    appointment,
    appointmentId,
    sessionRecordId,
    interventionId,
    sessionRecord,
    reservedIntervention: true
  };
}

async function completeReservedIntervention(validation, responseText, responseSource = "gemini") {
  if (!validation?.reservedIntervention || !validation.serviceClient) return { ok: true };
  const cleanResponse = cleanText(responseText, 3200);
  if (!cleanResponse) {
    await releaseReservedIntervention(validation);
    return usageError("EMPTY_PATIENT_RESPONSE", "La respuesta del paciente llego vacia. Intenta nuevamente.", 502, true);
  }

  const { data, error } = await validation.serviceClient.rpc("complete_simulation_intervention", {
    p_appointment_id: validation.appointmentId,
    p_intervention_id: validation.interventionId,
    p_user_id: validation.user.id,
    p_response_text: cleanResponse,
    p_response_source: cleanText(responseSource, 80) || "gemini"
  });

  if (error) {
    console.warn("[usage] intervention completion failed", {
      appointmentId: validation.appointmentId,
      interventionId: validation.interventionId,
      message: error.message,
      code: error.code || null
    });
    return usageError(
      "INTERVENTION_COMPLETE_FAILED",
      "No pudimos confirmar el turno de forma segura. Intenta nuevamente.",
      500,
      true
    );
  }

  if (!data?.ok) {
    const code = cleanText(data?.code || "INTERVENTION_COMPLETE_REJECTED", 80);
    return usageError(
      code,
      usageMessageForCode(code),
      statusForUsageCode(code),
      isRetryableUsageCode(code)
    );
  }

  return { ok: true, data };
}

async function releaseReservedIntervention(validation) {
  if (!validation?.reservedIntervention || !validation.serviceClient) return;
  const { error } = await validation.serviceClient.rpc("fail_simulation_intervention", {
    p_appointment_id: validation.appointmentId,
    p_intervention_id: validation.interventionId,
    p_user_id: validation.user.id
  });

  if (error) {
    console.warn("[usage] intervention release failed", {
      appointmentId: validation.appointmentId,
      interventionId: validation.interventionId,
      message: error.message,
      code: error.code || null
    });
  }
}

function sendStructuredUsageError(res, error) {
  sendJson(res, error.statusCode || 409, {
    ok: false,
    code: error.code,
    errorType: error.code,
    message: error.message,
    fallbackReason: error.code,
    retryable: Boolean(error.retryable)
  });
}

function usageError(code, message, statusCode = 409, retryable = false) {
  console.warn("[usage] validation failed", { code, statusCode, retryable });
  return { ok: false, code, message, statusCode, retryable };
}

function usageMessageForCode(code) {
  const messages = {
    APPOINTMENT_NOT_FOUND: "Agenda la sesion antes de iniciar la entrevista.",
    APPOINTMENT_NOT_OWNED: "La cita no pertenece a tu usuario.",
    APPOINTMENT_REQUIRED: "Agenda la sesion antes de iniciar la entrevista.",
    CASE_MISMATCH: "La cita no corresponde al paciente seleccionado.",
    CLOSURE_PENDING: "Esta sesion tiene cierre pendiente. Retoma la decision clinica antes de volver al chat.",
    INTERVENTION_ALREADY_PROCESSING: "Ya hay una respuesta en proceso para esta intervencion. Espera unos segundos e intenta nuevamente.",
    INTERVENTION_ALREADY_RESERVED: "Ya hay una respuesta en proceso para esta intervencion. Espera unos segundos e intenta nuevamente.",
    SESSION_ALREADY_ACTIVE: "Ya hay una respuesta en proceso para esta sesion. Espera unos segundos e intenta nuevamente.",
    SESSION_ALREADY_CLOSED: "Esta sesion ya fue cerrada o cancelada.",
    SESSION_TIME_EXPIRED: "El tiempo de entrevista ha finalizado. Continua con el cierre y la retroalimentacion.",
    TURN_LIMIT_REACHED: "Alcanzaste el maximo de intervenciones. Continua con el cierre."
  };
  return messages[code] || "No pudimos validar esta intervencion de forma segura.";
}

function statusForUsageCode(code) {
  if (code === "TURN_LIMIT_REACHED") return 429;
  if (code === "APPOINTMENT_NOT_OWNED") return 403;
  if (code === "INTERVENTION_ALREADY_PROCESSING" || code === "INTERVENTION_ALREADY_RESERVED" || code === "SESSION_ALREADY_ACTIVE") return 409;
  if (code === "APPOINTMENT_NOT_FOUND" || code === "APPOINTMENT_REQUIRED") return 409;
  if (code === "INTERVENTION_RESERVE_FAILED" || code === "INTERVENTION_COMPLETE_FAILED") return 500;
  return 409;
}

function isRetryableUsageCode(code) {
  return [
    "INTERVENTION_ALREADY_PROCESSING",
    "INTERVENTION_ALREADY_RESERVED",
    "SESSION_ALREADY_ACTIVE",
    "INTERVENTION_RESERVE_FAILED",
    "INTERVENTION_COMPLETE_FAILED"
  ].includes(code);
}

function extractBearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || "";
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

function sanitizeUuid(value) {
  const text = String(value || "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)
    ? text
    : "";
}

function buildRetryRequestBody(requestBody) {
  const retryBody = JSON.parse(JSON.stringify(requestBody));
  retryBody.generationConfig = {
    ...retryBody.generationConfig,
    temperature: 0.62,
    maxOutputTokens: Math.max(Number(retryBody.generationConfig?.maxOutputTokens) || 0, 700)
  };

  const retryInstruction =
    "REINTENTO POR RESPUESTA INCOMPLETA: Completa una respuesta breve y natural como paciente, máximo 2 frases, sin dejar la idea inconclusa. Cierra la respuesta con puntuación.";
  const firstContent = retryBody.contents?.[0];
  const firstPart = firstContent?.parts?.[0];
  if (firstPart && typeof firstPart.text === "string") {
    firstPart.text = `${firstPart.text}\n\n${retryInstruction}`;
  }
  return retryBody;
}

function localFallbackResponse({ payload, caseId, studentMessage, fallbackReason }) {
  try {
    const localResult = generateLocalPatientResponse({
      caseId,
      studentMessage,
      history: normalizeLocalHistory(payload.conversationHistory),
      difficulty: cleanText(payload.difficulty, 80) || "intermedio",
      sessionNumber: toSafeNumber(payload.sessionNumber) || 1,
      selectedInterventionType: cleanText(payload.selectedInterventionType, 160),
      conversationStage: payload.sessionStage || payload.interviewStage || null,
      previousSessionSummary: payload.previousSessionSummary || null
    });

    return {
      text: localResult.responseText,
      responseText: localResult.responseText,
      source: "local",
      fallbackReason,
      local: {
        responseId: localResult.responseId,
        detectedIntent: localResult.intent,
        confidence: localResult.confidence,
        fallbackUsed: localResult.fallbackUsed
      }
    };
  } catch (error) {
    console.error("GEMINI_PATIENT_RESPONSE_LOCAL_FALLBACK_ERROR", {
      provider: "vercel",
      caseId,
      message: safeErrorMessage(error)
    });
    return {
      text: "",
      responseText: "",
      source: "local",
      fallbackReason: `${fallbackReason}; local fallback failed`
    };
  }
}

function buildSystemInstruction() {
  return [
    "Actua como un paciente virtual dentro de un simulador formativo de entrevista psicologica.",
    "Responde siempre como el paciente asignado, en primera persona.",
    "No actues como terapeuta, asistente, evaluador ni IA. No digas que eres IA.",
    "No expliques teorias psicologicas. No des consejos clinicos al estudiante.",
    "No inventes datos biograficos fuera del expediente entregado.",
    "No reveles toda la informacion de inmediato. Entrega datos de manera progresiva segun la calidad, calidez y pertinencia de la pregunta.",
    "Si el estudiante pregunta con empatia y respeto, puedes abrirte un poco mas. Si pregunta de forma fria, invasiva o apresurada, responde con mas reserva.",
    "Si el estudiante repara una intervencion fria o confusa, puedes recuperar algo de confianza de forma gradual.",
    "Si el estudiante hace muchas preguntas juntas, responde solo una parte de forma natural.",
    "Usa lenguaje cotidiano, humano y emocionalmente creible.",
    "Maximo 2 parrafos breves. Evita respuestas perfectas, extensas o tipo ensayo."
  ].join("\n");
}

function buildUserPrompt({ caseContext, recentHistory, sessionContext, studentMessage }) {
  return [
    "EXPEDIENTE Y CONTEXTO DEL PACIENTE SIMULADO:",
    safeJson(caseContext),
    "",
    "CONTEXTO DE SESION:",
    safeJson(sessionContext),
    "",
    "HISTORIAL RECIENTE:",
    formatHistory(recentHistory),
    "",
    "MENSAJE ACTUAL DEL ESTUDIANTE:",
    studentMessage,
    "",
    "Responde ahora solo como el paciente. No agregues etiquetas, analisis ni notas fuera de personaje."
  ].join("\n");
}

function buildCaseContext({ caseId, clientCaseData }) {
  const catalogCase = cases.find((item) => item.id === caseId) || null;
  const facts = patientFacts[caseId] || {};
  const masterRecord = patientMasterRecords[caseId] || null;
  const simulationProfile = clinicalSimulationProfiles[caseId] || null;
  const minimumClinicalProfile = buildMinimumClinicalProfile({
    caseId,
    catalogCase,
    facts,
    masterRecord,
    simulationProfile,
    clientCaseData
  });

  return trimContext({
    caseId,
    minimumClinicalProfile,
    visibleCase: pickDefined({
      name: catalogCase?.name || clientCaseData?.name,
      age: catalogCase?.age || clientCaseData?.age,
      motive: catalogCase?.motive || clientCaseData?.motive,
      shortTitle: catalogCase?.shortTitle || clientCaseData?.shortTitle,
      communicationStyle: catalogCase?.communicationStyle || clientCaseData?.communicationStyle,
      expectedResponses: catalogCase?.expectedResponses || clientCaseData?.expectedResponses,
      openingLine: catalogCase?.openingLine || clientCaseData?.openingLine,
      learningObjectives: catalogCase?.learningObjectives || clientCaseData?.learningObjectives,
      sensitiveTopics: catalogCase?.sensitiveTopics || clientCaseData?.sensitiveTopics
    }),
    patientFacts: pickDefined({
      name: facts.name,
      age: facts.age,
      family: facts.family,
      works: facts.works,
      academic: facts.academic,
      social: facts.social,
      concern: facts.concern,
      concreteConcern: facts.concreteConcern,
      currentEmotion: facts.currentEmotion,
      expectation: facts.expectation
    }),
    clinicalProfile: pickDefined({
      identity: simulationProfile?.identity,
      clinicalFrame: simulationProfile?.clinicalFrame,
      disclosureRules: simulationProfile?.disclosureRules,
      pedagogicalObjectives: simulationProfile?.pedagogicalObjectives
    }),
    masterRecord: pickDefined({
      identity: masterRecord?.identity,
      family: masterRecord?.family,
      consultation: masterRecord?.consultation,
      emotionalState: masterRecord?.emotionalState,
      symptoms: masterRecord?.symptoms || masterRecord?.symptomHistory,
      risk: masterRecord?.risk || masterRecord?.riskMap,
      personality: masterRecord?.personality,
      communicationStyle: masterRecord?.communicationStyle || masterRecord?.speakingStyle,
      disclosureRules: masterRecord?.disclosureRules || masterRecord?.disclosureMatrix,
      sensitiveInfo: masterRecord?.sensitiveInfo
    })
  });
}

function buildMinimumClinicalProfile({
  caseId,
  catalogCase,
  facts,
  masterRecord,
  simulationProfile,
  clientCaseData
}) {
  const identity = masterRecord?.identity || {};
  const consultation = masterRecord?.consultation || {};
  const personality = masterRecord?.personality || {};
  const emotionalState = masterRecord?.emotionalState || {};
  const sensitiveInfo = masterRecord?.sensitiveInfo || {};

  return pickDefined({
    id: caseId,
    name: identity.name || facts.name || catalogCase?.name || clientCaseData?.name,
    age: identity.age || facts.age || catalogCase?.age || clientCaseData?.age,
    briefReason: consultation.manifestMotive || facts.motive || catalogCase?.motive || clientCaseData?.motive,
    presentingProblem: consultation.whyNow || facts.concern || catalogCase?.motive || clientCaseData?.motive,
    background: catalogCase?.background || clientCaseData?.background,
    emotionalTone: emotionalState.currentlyFeels || facts.currentEmotion || facts.concern,
    communicationStyle:
      personality.responseStyle ||
      catalogCase?.communicationStyle ||
      clientCaseData?.communicationStyle ||
      simulationProfile?.clinicalFrame?.style,
    relationalStyle:
      personality.temperament ||
      simulationProfile?.clinicalFrame?.relationalStyle ||
      "apertura gradual segun confianza y pertinencia de la entrevista",
    openingLineBySession: pickDefined({
      session1: catalogCase?.openingLine || facts.motive || consultation.whyNow,
      session2: "Puede retomar algo trabajado antes si el estudiante lo menciona o si existe resumen previo."
    }),
    therapeuticBoundaries:
      catalogCase?.sensitiveTopics ||
      clientCaseData?.sensitiveTopics ||
      simulationProfile?.disclosureRules?.boundaries,
    riskNotes: sensitiveInfo.riskResponse || masterRecord?.risk?.summary || "Explorar riesgo si corresponde, sin dramatizar ni inventar.",
    whatThePatientKnows: consultation.beliefAboutProblem || facts.concreteConcern || facts.concern,
    whatThePatientAvoids: personality.avoids || simulationProfile?.disclosureRules?.avoidAtStart,
    progressionHints:
      simulationProfile?.disclosureRules ||
      masterRecord?.disclosureRules ||
      "Revelar informacion de forma progresiva segun alianza, respeto y pertinencia."
  });
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((entry) => entry && !entry.isSessionPrelude)
    .slice(-MAX_HISTORY_TURNS)
    .map((entry) => ({
      student: cleanText(entry.question || entry.student, 900),
      patient: cleanText(entry.answer || entry.patient, 900)
    }))
    .filter((entry) => entry.student || entry.patient);
}

function normalizeLocalHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((entry) => entry && !entry.isSessionPrelude)
    .slice(-MAX_HISTORY_TURNS)
    .map((entry) => ({
      question: cleanText(entry.question || entry.student, 900),
      answer: cleanText(entry.answer || entry.patient, 900),
      responseCategory: cleanText(entry.responseCategory, 120)
    }))
    .filter((entry) => entry.question || entry.answer);
}

function formatHistory(history) {
  if (!history.length) return "Sin turnos previos visibles.";
  return history
    .map((turn, index) => [
      `Turno ${index + 1}`,
      `Estudiante: ${turn.student || "(sin texto)"}`,
      `Paciente: ${turn.patient || "(sin respuesta)"}`
    ].join("\n"))
    .join("\n\n");
}

function extractGeminiText(body) {
  const candidates = Array.isArray(body?.candidates) ? body.candidates : [];
  const primaryParts = candidates[0]?.content?.parts;
  if (Array.isArray(primaryParts)) {
    return joinTextParts(primaryParts);
  }

  return candidates
    .map((candidate) => joinTextParts(candidate?.content?.parts))
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

function joinTextParts(parts) {
  if (!Array.isArray(parts)) return "";
  return parts
    .map((part) => typeof part?.text === "string" ? part.text : "")
    .filter(Boolean)
    .join("")
    .trim();
}

function extractGeminiFinishReason(body) {
  return cleanText(body?.candidates?.[0]?.finishReason || "", 80);
}

function isIncompleteGeminiResponse(text, finishReason) {
  const normalizedReason = String(finishReason || "").toUpperCase();
  if (normalizedReason === "MAX_TOKENS") return true;

  const trimmed = normalizeTerminalText(text);
  if (!trimmed || trimmed.length < 16) return true;

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < 5) return true;

  const hasCompletePunctuation = /(?:[.!?]|\.{3}|…)$/.test(trimmed);
  const finalWord = getFinalWord(trimmed);
  const endsWithInvalidWord = INVALID_FINAL_WORDS.has(finalWord);

  if (!hasCompletePunctuation && endsWithInvalidWord) return true;
  if (!hasCompletePunctuation && words.length < 12) return true;
  if (!hasCompletePunctuation && trimmed.length < 80) return true;

  return false;
}

function normalizeTerminalText(text) {
  return String(text || "")
    .trim()
    .replace(/[)"'”’»\]]+$/g, "")
    .trim();
}

function getFinalWord(text) {
  const match = normalizeTerminalText(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .match(/[a-zñáéíóúü]+$/i);
  return match ? match[0] : "";
}

function sanitizePatientResponse(text) {
  return cleanText(text, 3200)
    .replace(/^\s*(Paciente|Respuesta|Claudio|Tomas|Tomás|Marcos)\s*:\s*/i, "")
    .replace(/\bcomo (modelo de lenguaje|ia|inteligencia artificial)\b/gi, "")
    .trim();
}

function trimContext(value) {
  return JSON.parse(JSON.stringify(value, (_key, item) => {
    if (typeof item === "string") return cleanText(item, 900);
    if (Array.isArray(item)) return item.slice(0, 12);
    return item;
  }));
}

function parseRequestBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    if (req.body.length > MAX_REQUEST_BODY_CHARS) {
      const error = new Error("Request body too large");
      error.code = "REQUEST_BODY_TOO_LARGE";
      throw error;
    }
    return JSON.parse(req.body || "{}");
  }
  const serialized = JSON.stringify(req.body);
  if (serialized.length > MAX_REQUEST_BODY_CHARS) {
    const error = new Error("Request body too large");
    error.code = "REQUEST_BODY_TOO_LARGE";
    throw error;
  }
  return req.body;
}

function pickDefined(source) {
  return Object.fromEntries(
    Object.entries(source || {}).filter(([, value]) => value != null && value !== "")
  );
}

function cleanText(value, maxLength = 1000) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\s+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
    .slice(0, maxLength);
}

function sanitizeId(value) {
  const text = String(value || "").trim().toLowerCase();
  return /^[a-z0-9_-]{2,60}$/.test(text) ? text : "";
}

function sanitizeModel(value) {
  const text = String(value || "").trim();
  return /^[A-Za-z0-9_.:-]{3,80}$/.test(text) ? text : "";
}

function safeErrorMessage(error) {
  return cleanText(error?.message || String(error || "Unknown error"), 220);
}

function toSafeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function safeJson(value) {
  return JSON.stringify(value, null, 2);
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function corsHeaders(extra = {}) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    ...extra
  };
}

function applyHeaders(res, headers) {
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }
}

function sendJson(res, statusCode, body) {
  res.status(statusCode).json(body);
}
