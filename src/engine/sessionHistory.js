import { getClinicalStorageOwner, readClinicalCache, writeClinicalCache } from "./clinicalStorage.js";
import { buildSessionSummary } from "./sessionMemory.js";
import { buildSessionFeedback } from "./sessionFeedback.js";
import { buildSessionUsageMetrics } from "./simulationUsagePolicy.js";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";

const HISTORY_STORAGE_KEY = "simuladorClinicoLdp.sessionHistory.v1";
const LOCAL_STUDENT_ID = "local-browser-student";

export function restoreSessionConversation(record) {
  const conversation = record?.conversationHistory || [];
  return conversation.some(entry => entry?.isSessionPrelude)
    ? conversation : [...(record?.feedback?.sessionPrelude || []), ...conversation];
}

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
  feedbackPractice = null,
  appointmentId = "",
  startedAt = "",
  endsAt = "",
  endedAt = "",
  endReason = "",
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
  const sessionMetrics = buildSessionUsageMetrics({
    startedAt,
    endedAt,
    durationMinutes: startedAt && endsAt
      ? Math.max(1, (new Date(endsAt).getTime() - new Date(startedAt).getTime()) / (60 * 1000))
      : undefined,
    history: visibleHistory,
    endReason
  });
  const enrichedSessionSummary = {
    ...sessionSummary,
    sessionMetrics
  };

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
    endedAt: sessionMetrics.endedAt,
    sessionMetrics,
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
      ethicalNotice: sessionSummary.ethicalNotice,
      sessionMetrics
    },
    feedback: {
      feedbackPractice,
      sessionPrelude: history.filter(entry => entry?.isSessionPrelude).map(entry => ({ isSessionPrelude: true, answer: entry.answer || "" })),
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
    sessionSummary: enrichedSessionSummary
  };
}

const pendingSaves = new Map();

// Preserve invocation order: a slow autosave cannot overwrite a later closure.
export function saveSessionHistory(record, { userId = getClinicalStorageOwner() } = {}) {
  if (!record) return Promise.resolve({ localSaved: false, cloudSaved: false, error: "No hay registro de sesión para guardar." });
  const key = `${userId}:${record.id}`;
  const prior = pendingSaves.get(key) || Promise.resolve();
  const next = prior.catch(() => {}).then(() => persistSessionHistory(record, userId));
  pendingSaves.set(key, next);
  void next.finally(() => { if (pendingSaves.get(key) === next) pendingSaves.delete(key); });
  return next;
}

async function persistSessionHistory(record, userId) {
  const nextRecord = { ...record, studentScope: userId, status: record.status || "completed", updatedAt: new Date().toISOString() };
  let localSaved = false;
  try {
    if (!isSupabaseConfigured || !supabase) {
      localSaved = saveLocalSessionHistory(nextRecord, userId);
      return { localSaved, cloudSaved: false, mode: "local", ...(!localSaved ? { error: "El navegador no pudo guardar la sesión." } : {}) };
    }
    const { data, error: userError } = await supabase.auth.getUser();
    const user = data?.user;
    if (userError || !user || user.id !== userId) {
      return { localSaved: false, cloudSaved: false, error: "No pudimos verificar tu cuenta para guardar la sesión. Revisa la conexión y vuelve a intentarlo." };
    }
    localSaved = saveLocalSessionHistory(nextRecord, user.id);
    const payload = mapRecordToSupabasePayload(nextRecord, user);
    const closing = ["completed", "closure_pending"].includes(nextRecord.status);
    const { data: rows, error } = closing
      ? await supabase.rpc("save_simulation_session_closure", { p_record: payload })
      : await supabase.from("simulation_sessions").upsert(payload, { onConflict: "id" }).select();
    if (error) return { localSaved, cloudSaved: false, error };
    if (!Array.isArray(rows) || rows.length !== 1 || rows[0].id !== record.id || rows[0].status !== nextRecord.status || rows[0].user_id !== user.id) {
      return { localSaved, cloudSaved: false, error: "No pudimos confirmar el guardado de la sesión. Conserva esta pantalla y vuelve a intentarlo." };
    }
    return { localSaved, cloudSaved: true, data: rows };
  } catch {
    return { localSaved, cloudSaved: false, error: "Se interrumpió la conexión al guardar. Conserva esta pantalla y vuelve a intentarlo." };
  }
}

export function isSessionSaveConfirmed(result) {
  return Boolean(result?.cloudSaved || (result?.mode === "local" && result?.localSaved && !result?.error));
}

export function getSessionHistory(userId = getClinicalStorageOwner()) {
  const parsed = readClinicalCache(HISTORY_STORAGE_KEY, [], userId);
  return Array.isArray(parsed) ? [...parsed].sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)) : [];
}

export function getSessionHistoryById(sessionId) {
  return getSessionHistory().find((session) => session.id === sessionId) || null;
}

export async function getSessionHistoryForUser(authSession = null) {
  if (!isSupabaseConfigured || !supabase) return getSessionHistory();
  if (!authSession?.user?.id) throw new Error("Inicia sesión para consultar tu historial.");
  const { data, error } = await supabase.from("simulation_sessions").select("*")
    .eq("user_id", authSession.user.id).order("updated_at", { ascending: false });
  if (error || !Array.isArray(data)) throw new Error("No pudimos verificar tu historial. Revisa la conexión y reintenta.");
  return data.map(mapSupabaseRowToRecord);
}

export async function getLatestInProgressSessionForCase(authSession = null, caseId = "", sessionNumber = null) {
  if (!caseId) return null;
  if (!isSupabaseConfigured || !supabase) {
    return getSessionHistory().find((record) => ["in_progress", "closure_pending"].includes(record.status) && record.caseId === caseId &&
      (!sessionNumber || Number(record.sessionNumber) === Number(sessionNumber))) || null;
  }
  if (!authSession?.user?.id) throw new Error("Inicia sesión para retomar tu práctica.");
  let query = supabase.from("simulation_sessions").select("*").eq("user_id", authSession.user.id)
    .eq("case_id", caseId).in("status", ["in_progress", "closure_pending"]).order("updated_at", { ascending: false }).limit(1);
  if (sessionNumber) query = query.eq("session_number", Number(sessionNumber));
  const { data, error } = await query;
  if (error || !Array.isArray(data)) throw new Error("No pudimos comprobar si hay una sesión por retomar. Revisa la conexión e inténtalo nuevamente.");
  return data[0] ? mapSupabaseRowToRecord(data[0]) : null;
}

export async function deleteSessionHistory(sessionId, authSession = null) {
  const userId = authSession?.user?.id || getClinicalStorageOwner();
  if (isSupabaseConfigured && supabase) {
    if (!authSession?.user?.id) throw new Error("Inicia sesión para eliminar este registro.");
    const { data, error } = await supabase.from("simulation_sessions").delete()
      .eq("id", sessionId).eq("user_id", userId).select("id");
    if (error || !Array.isArray(data) || data.length !== 1 || data[0].id !== sessionId) throw new Error("No pudimos confirmar la eliminación. Actualiza el historial y reintenta.");
  }
  const saved = writeClinicalCache(HISTORY_STORAGE_KEY, getSessionHistory(userId).filter((session) => session.id !== sessionId), userId);
  if (!isSupabaseConfigured && !saved) throw new Error("No se pudo actualizar el historial local.");
  return true;
}

export async function clearAllSessionHistory(authSession = null) {
  const userId = authSession?.user?.id || getClinicalStorageOwner();
  if (isSupabaseConfigured && supabase) {
    if (!authSession?.user?.id) throw new Error("Inicia sesión para eliminar tu historial.");
    const { data, error } = await supabase.from("simulation_sessions").delete().eq("user_id", userId).select("id");
    if (error || !Array.isArray(data)) throw new Error("No pudimos confirmar la eliminación del historial. Reintenta.");
  }
  const saved = writeClinicalCache(HISTORY_STORAGE_KEY, [], userId);
  if (!isSupabaseConfigured && !saved) throw new Error("No se pudo actualizar el historial local.");
  return true;
}

function saveLocalSessionHistory(record, userId) {
  return writeClinicalCache(HISTORY_STORAGE_KEY, [record, ...getSessionHistory(userId).filter((session) => session.id !== record.id)], userId);
}

function createHistoryId(caseId, sessionNumber) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${caseId}-s${sessionNumber}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function mapRecordToSupabasePayload(record, user) {
  const feedbackPayload = {
    ...record.feedback,
    summary: record.summary,
    patientOpenness: record.patientOpenness,
    continuityAgreement: record.continuityAgreement,
    sessionSummary: record.sessionSummary,
    sessionMetrics: record.sessionMetrics
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
    score: Number.isFinite(record.feedback?.generalScore) ? Math.round(record.feedback.generalScore) : null,
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
    endedAt: row.feedback?.sessionMetrics?.endedAt || "",
    sessionMetrics: row.feedback?.sessionMetrics || row.feedback?.summary?.sessionMetrics || null,
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
