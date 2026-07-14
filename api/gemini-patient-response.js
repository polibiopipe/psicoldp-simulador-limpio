import { cases } from "../src/data/cases.js";
import { patientFacts } from "../src/data/patientFacts.js";
import { patientMasterRecords } from "../src/data/patients/index.js";
import { clinicalSimulationProfiles } from "../src/data/clinicalAvatars/clinicalSimulationProfiles.js";
import { buildCanonicalBiographyPromptContext } from "../src/data/avatarCanonicalBiographies.js";
import { generateLocalPatientResponse } from "../src/engine/localMiniAI.js";

const DEFAULT_MODEL = "gemini-2.5-flash";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const MAX_HISTORY_TURNS = 8;
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
  } catch {
    sendJson(res, 400, { error: "Invalid JSON payload" });
    return;
  }

  const caseId = sanitizeId(payload.caseId);
  const studentMessage = cleanText(payload.studentMessage, 1600);
  if (!caseId || !studentMessage) {
    sendJson(res, 400, { error: "caseId and studentMessage are required" });
    return;
  }

  const localFallback = (fallbackReason) => localFallbackResponse({
    payload,
    caseId,
    studentMessage,
    fallbackReason
  });

  if (!apiKey) {
    sendJson(res, 200, localFallback("GEMINI_API_KEY missing in Vercel environment"));
    return;
  }

  const caseContext = buildCaseContext({
    caseId,
    clientCaseData: payload.caseData
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

  console.info("[gemini] case id", caseId);
  console.info("[gemini] case name", caseContext.visibleCase?.name || caseContext.patientFacts?.name || caseId);
  console.info("[gemini] profile loaded", Boolean(caseContext.canonicalBiography));
  console.info("[gemini] session number", sessionContext.sessionNumber || "unknown");

  let providerResponse;
  try {
    providerResponse = await fetchGeminiCompletion({ apiKey, model, requestBody });
  } catch (error) {
    console.error("GEMINI_PATIENT_RESPONSE_NETWORK_ERROR", {
      provider: "vercel",
      caseId,
      message: safeErrorMessage(error)
    });
    sendJson(res, 200, localFallback("Gemini network error"));
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
    sendJson(res, 200, localFallback(cleanText(`Gemini provider error: ${providerReason}`, 220)));
    return;
  }

  const finishReason = extractGeminiFinishReason(providerBody);
  const responseText = sanitizePatientResponse(extractGeminiText(providerBody));
  if (!responseText) {
    sendJson(res, 200, localFallback("Gemini returned empty text"));
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
      sendJson(res, 200, localFallback("incomplete gemini response"));
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
      sendJson(res, 200, localFallback("incomplete gemini response"));
      return;
    }

    const retryFinishReason = extractGeminiFinishReason(retryProviderBody);
    const retryResponseText = sanitizePatientResponse(extractGeminiText(retryProviderBody));
    if (retryResponseText && !isIncompleteGeminiResponse(retryResponseText, retryFinishReason)) {
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
      return;
    }

    console.warn("GEMINI_PATIENT_RESPONSE_RETRY_INCOMPLETE", {
      provider: "vercel",
      caseId,
      finishReason: retryFinishReason || "unknown",
      textLength: retryResponseText.length
    });
    sendJson(res, 200, localFallback("incomplete gemini response"));
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
    "Los datos biograficos canonicos basicos se responden directamente cuando el estudiante los pregunta. No los trates como revelaciones profundas.",
    "Si el expediente canonico define carrera, institucion, trabajo, edad, ciudad, familia, rutina o salud cotidiana, usa exactamente esos datos y no los reemplaces por evasivas.",
    "No menciones marcas internas como institutionIsFictional o employerIsFictional.",
    "No inventes una universidad, carrera, beca, campus, empresa, cargo, familiar, edad, perdida ni acontecimiento diferente al expediente.",
    "Responde solamente lo preguntado; no recites todo el perfil canonico.",
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
    "DATOS BIOGRAFICOS CANONICOS:",
    safeJson(caseContext.canonicalBiography || null),
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
  const canonicalBiography = buildCanonicalBiographyPromptContext(caseId);

  return trimContext({
    caseId,
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
    canonicalBiography,
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
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
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
