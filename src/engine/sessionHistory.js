import { buildSessionSummary } from "./sessionMemory.js";

const HISTORY_STORAGE_KEY = "simuladorClinicoLdp.sessionHistory.v1";
const LOCAL_STUDENT_ID = "local-browser-student";

export function buildSessionHistoryRecord({
  caseItem,
  history,
  report,
  sessionNumber = 1,
  agreement = ""
}) {
  const sessionSummary = buildSessionSummary({
    caseItem,
    history,
    report,
    sessionNumber,
    agreement
  });
  const visibleHistory = history
    .filter((entry) => !entry.isSessionPrelude)
    .map((entry) => ({
      id: entry.id,
      question: entry.question,
      answer: entry.answer,
      responseCategory: entry.responseCategory,
      patientState: entry.patientState,
      createdAt: entry.createdAt
    }));

  return {
    id: createHistoryId(caseItem.id, sessionNumber),
    storageVersion: 1,
    storageScope: "localStorage",
    studentScope: LOCAL_STUDENT_ID,
    caseId: caseItem.id,
    caseName: caseItem.name,
    caseTitle: caseItem.title,
    sessionNumber,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    conversationHistory: visibleHistory,
    summary: {
      brief: report.summary,
      closure: sessionSummary.resumenConversacion,
      exploredTopics: sessionSummary.temasExplorados,
      pendingTopics: sessionSummary.temasPendientes,
      agreement: sessionSummary.acuerdoContinuidad || agreement,
      ethicalNotice: sessionSummary.ethicalNotice
    },
    feedback: {
      strengths: report.strengths,
      improvements: report.improvements,
      criteria: report.criteria,
      nextSuggestions: report.nextSuggestions,
      bondMoments: report.bondMoments,
      closingMoments: report.closingMoments,
      therapeuticApproach: report.therapeuticApproach
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

export function saveSessionHistory(record) {
  if (!canUseStorage() || !record) return false;
  const sessions = getSessionHistory();
  const nextRecord = {
    ...record,
    updatedAt: new Date().toISOString()
  };
  const filtered = sessions.filter((session) => session.id !== nextRecord.id);
  globalThis.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([nextRecord, ...filtered]));
  return true;
}

export function getSessionHistory() {
  if (!canUseStorage()) return [];
  try {
    const parsed = JSON.parse(globalThis.localStorage.getItem(HISTORY_STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

export function getSessionHistoryById(sessionId) {
  return getSessionHistory().find((session) => session.id === sessionId) || null;
}

export function deleteSessionHistory(sessionId) {
  if (!canUseStorage()) return false;
  const sessions = getSessionHistory().filter((session) => session.id !== sessionId);
  globalThis.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(sessions));
  return true;
}

export function clearAllSessionHistory() {
  if (!canUseStorage()) return false;
  globalThis.localStorage.removeItem(HISTORY_STORAGE_KEY);
  return true;
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
