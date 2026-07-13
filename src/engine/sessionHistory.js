import { buildSessionSummary } from "./sessionMemory.js";
import { buildSessionFeedback } from "./sessionFeedback.js";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";

const HISTORY_STORAGE_KEY = "simuladorClinicoLdp.sessionHistory.v1";
const LOCAL_STUDENT_ID = "local-browser-student";

export function buildSessionHistoryRecord({
  id = "",
  caseItem,
  history,
  report,
  sessionNumber = 1,
  agreement = "",
  preSessionPlan = null,
  clinicalArtifacts = null,
  clinicalDecision = null,
  clinicalPlanEvaluation = null,
  appointmentId = "",
  startedAt = "",
  endsAt = "",
  status = "completed"
}) {
  const sessionSummary = buildSessionSummary({
    caseItem,
    history,
    report,
    sessionNumber,
    agreement,
    preSessionPlan,
    clinicalArtifacts,
    clinicalDecision,
    clinicalPlanEvaluation
  });
  const sessionFeedback = buildSessionFeedback({
    sessionNumber,
    selectedCase: caseItem,
    conversation: history,
    clinicalDecision,
    studentPlan: preSessionPlan,
    selectedApproach: report?.therapeuticApproach,
    report
  });
  const visibleHistory = history
    .filter((entry) =>
      !entry.isSessionPrelude &&
      !entry.isPendingResponse &&
      String(entry.question || "").trim() &&
      String(entry.answer || "").trim()
    )
    .map((entry) => ({
      id: entry.id,
      question: entry.question,
      answer: entry.answer,
      responseCategory: entry.responseCategory,
      interventionType: entry.interventionType,
      guidedIntervention: entry.guidedIntervention,
      patientState: entry.patientState,
      createdAt: entry.createdAt
    }));

  return {
    id: id || createHistoryId(caseItem.id, sessionNumber),
    storageVersion: 1,
    storageScope: isSupabaseConfigured ? "supabase" : "localStorage",
    studentScope: LOCAL_STUDENT_ID,
    status,
    appointmentId,
    caseId: caseItem.id,
    caseName: caseItem.name,
    caseTitle: caseItem.title,
    sessionNumber,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startedAt,
    endsAt,
    conversationHistory: visibleHistory,
    summary: {
      brief: sessionFeedback.briefSummary,
      closure: sessionSummary.resumenConversacion,
      exploredTopics: sessionSummary.temasExplorados,
      pendingTopics: sessionSummary.temasPendientes,
      preSessionPlan: sessionSummary.preSessionPlan,
      preSessionEvaluation: sessionSummary.preSessionEvaluation,
      clinicalArtifacts: sessionSummary.clinicalArtifacts,
      clinicalArtifactsEvaluation: sessionSummary.clinicalArtifactsEvaluation,
      clinicalDecision: sessionSummary.clinicalDecision,
      clinicalPlanEvaluation: sessionSummary.clinicalPlanEvaluation,
      agreement: sessionSummary.acuerdoContinuidad || agreement,
      ethicalNotice: sessionSummary.ethicalNotice
    },
    feedback: {
      generalScore: report.generalScore,
      sessionFeedback,
      strengths: report.strengths,
      improvements: report.improvements,
      criteria: report.criteria,
      objectiveEvaluation: report.objectiveEvaluation,
      reformulationSuggestions: report.reformulationSuggestions,
      skillClassification: report.skillClassification,
      nextSuggestions: report.nextSuggestions,
      bondMoments: report.bondMoments,
      closingMoments: report.closingMoments,
      therapeuticApproach: report.therapeuticApproach,
      preSessionPlan: sessionSummary.preSessionPlan,
      preSessionEvaluation: sessionSummary.preSessionEvaluation,
      clinicalArtifacts: sessionSummary.clinicalArtifacts,
      clinicalArtifactsEvaluation: sessionSummary.clinicalArtifactsEvaluation,
      clinicalDecision: sessionSummary.clinicalDecision,
      clinicalPlanEvaluation: sessionSummary.clinicalPlanEvaluation
    },
    patientOpenness: {
      final: report.trust?.final ?? sessionSummary.trustFinal,
      label: report.trust?.label ?? sessionSummary.nivelApertura,
      delta: report.trust?.delta ?? 0,
      level: sessionSummary.nivelApertura
    },
    continuityAgreement: sessionSummary.acuerdoContinuidad || agreement || "",
    sessionSummary
  };
}

export async function saveSessionHistory(record) {
  if (!record) {
    return {
      localSaved: false,
      cloudSaved: false,
      error: "No hay registro de sesion para guardar."
    };
  }

  const nextRecord = {
    ...record,
    status: record.status || "completed",
    updatedAt: new Date().toISOString()
  };
  if (canUseStorage()) saveLocalSessionHistory(nextRecord);

  if (!isSupabaseConfigured || !supabase) {
    return { localSaved: true, cloudSaved: false, mode: "local" };
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  logSessionDebug("[sessions] current user id", user?.id || null);

  if (userError || !user) {
    const errorMessage = "No se pudo guardar la sesion porque no hay usuario autenticado.";
    console.error("[sessions] save error message", userError?.message || errorMessage);
    console.error("[sessions] save error code", userError?.code || null);
    return {
      localSaved: canUseStorage(),
      cloudSaved: false,
      error: errorMessage
    };
  }

  const payload = mapRecordToSupabasePayload(nextRecord, user);
  logSessionDebug("[sessions] save started", {
    recordId: nextRecord.id,
    caseId: nextRecord.caseId,
    sessionNumber: nextRecord.sessionNumber,
    status: nextRecord.status
  });
  logSessionDebug("[sessions] case id", nextRecord.caseId);

  const { data, error } = await supabase
    .from("simulation_sessions")
    .upsert(payload, { onConflict: "id" })
    .select();

  if (error) {
    console.error("[sessions] save error message", error.message);
    console.error("[sessions] save error code", error.code || null);
    return { localSaved: true, cloudSaved: false, error };
  }

  logSessionDebug("[sessions] save success", {
    count: data?.length || 0,
    recordId: data?.[0]?.id || nextRecord.id
  });
  return { localSaved: true, cloudSaved: true, data };
}

function logSessionDebug(label, payload) {
  console.log(label, payload);
}

export function getSessionHistory() {
  if (!canUseStorage()) return [];
  try {
    const parsed = JSON.parse(globalThis.localStorage.getItem(HISTORY_STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

export function getSessionHistoryById(sessionId) {
  return getSessionHistory().find((session) => session.id === sessionId) || null;
}

export async function getSessionHistoryForUser(authSession = null) {
  if (!isSupabaseConfigured || !supabase || !authSession?.user) return getSessionHistory();

  console.log("[sessions] load started");
  console.log("[sessions] current user id", authSession.user.id);
  const { data, error } = await supabase
    .from("simulation_sessions")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[sessions] load error message", error.message);
    console.error("[sessions] load error code", error.code || null);
    return getSessionHistory();
  }

  console.log("[sessions] load result count", data?.length || 0);
  return (data || []).map(mapSupabaseRowToRecord);
}

export async function getLatestInProgressSessionForCase(authSession = null, caseId = "", sessionNumber = null) {
  console.log("[sessions] resume query started", {
    caseId,
    sessionNumber: sessionNumber || null
  });

  if (!caseId) {
    console.log("[sessions] resume found", false);
    return null;
  }

  if (!isSupabaseConfigured || !supabase || !authSession?.user) {
    const localRecord = getSessionHistory()
      .filter((record) =>
        ["in_progress", "closure_pending"].includes(record?.status) &&
        record.caseId === caseId &&
        (!sessionNumber || Number(record.sessionNumber) === Number(sessionNumber))
      )
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())[0] || null;
    console.log("[sessions] resume found", Boolean(localRecord));
    if (localRecord) {
      console.log("[sessions] resume session id", localRecord.id);
      console.log("[sessions] resume conversation length", localRecord.conversationHistory?.length || 0);
    }
    return localRecord;
  }

  let query = supabase
    .from("simulation_sessions")
    .select("*")
    .eq("user_id", authSession.user.id)
    .eq("case_id", caseId)
    .in("status", ["in_progress", "closure_pending"])
    .order("updated_at", { ascending: false })
    .limit(1);

  if (sessionNumber) {
    query = query.eq("session_number", Number(sessionNumber));
  }

  const { data, error } = await query;

  if (error) {
    console.error("[sessions] resume error message", error.message);
    console.error("[sessions] resume error code", error.code || null);
    console.log("[sessions] resume found", false);
    return null;
  }

  const record = data?.[0] ? mapSupabaseRowToRecord(data[0]) : null;
  console.log("[sessions] resume found", Boolean(record));
  if (record) {
    console.log("[sessions] resume session id", record.id);
    console.log("[sessions] resume conversation length", record.conversationHistory?.length || 0);
  }
  return record;
}

export async function deleteSessionHistory(sessionId, authSession = null) {
  if (isSupabaseConfigured && supabase && authSession?.user) {
    const { error } = await supabase
      .from("simulation_sessions")
      .delete()
      .eq("id", sessionId)
      .eq("user_id", authSession.user.id);
    if (error) {
      console.warn("No se pudo eliminar la sesion en Supabase.", error);
    }
  }

  if (!canUseStorage()) return false;
  const sessions = getSessionHistory().filter((session) => session.id !== sessionId);
  globalThis.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(sessions));
  return true;
}

export async function clearAllSessionHistory(authSession = null) {
  if (isSupabaseConfigured && supabase && authSession?.user) {
    const { error } = await supabase
      .from("simulation_sessions")
      .delete()
      .eq("user_id", authSession.user.id);
    if (error) {
      console.warn("No se pudo eliminar todo el historial en Supabase.", error);
    }
  }

  if (!canUseStorage()) return false;
  globalThis.localStorage.removeItem(HISTORY_STORAGE_KEY);
  return true;
}

function saveLocalSessionHistory(record) {
  const sessions = getSessionHistory();
  const filtered = sessions.filter((session) => session.id !== record.id);
  globalThis.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([record, ...filtered]));
}

function createHistoryId(caseId, sessionNumber) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${caseId}-s${sessionNumber}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function canUseStorage() {
  return typeof globalThis !== "undefined" && Boolean(globalThis.localStorage);
}

function mapRecordToSupabasePayload(record, user) {
  const feedbackPayload = {
    ...record.feedback,
    summary: record.summary,
    patientOpenness: record.patientOpenness,
    continuityAgreement: record.continuityAgreement,
    sessionSummary: record.sessionSummary
  };

  return {
    id: record.id,
    user_id: user.id,
    user_email: user.email,
    case_id: record.caseId,
    case_name: record.caseName,
    session_number: record.sessionNumber,
    appointment_id: record.appointmentId || null,
    conversation: record.conversationHistory,
    feedback: feedbackPayload,
    score: Math.round(record.feedback?.generalScore ?? record.patientOpenness?.final ?? 0),
    status: record.status || "completed",
    started_at: record.startedAt || null,
    ends_at: record.endsAt || null,
    completed_at: record.status === "completed" ? new Date().toISOString() : null,
    created_at: record.createdAt,
    updated_at: record.updatedAt || new Date().toISOString()
  };
}

function mapSupabaseRowToRecord(row) {
  return {
    id: row.id,
    storageVersion: 1,
    storageScope: "supabase",
    studentScope: row.user_id,
    status: row.status || "completed",
    appointmentId: row.appointment_id || "",
    userEmail: row.user_email,
    caseId: row.case_id,
    caseName: row.case_name,
    sessionNumber: row.session_number,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
    startedAt: row.started_at || "",
    endsAt: row.ends_at || "",
    conversationHistory: row.conversation || [],
    summary: row.feedback?.summary || {
      brief: "Sesion guardada en Supabase.",
      closure: "Detalle disponible en el historial guardado."
    },
    feedback: row.feedback || {},
    patientOpenness: row.feedback?.patientOpenness || {
      final: row.score,
      label: "Registrada",
      delta: 0,
      level: "registrada"
    },
    continuityAgreement: row.feedback?.continuityAgreement || "",
    sessionSummary: row.feedback?.sessionSummary || null
  };
}
