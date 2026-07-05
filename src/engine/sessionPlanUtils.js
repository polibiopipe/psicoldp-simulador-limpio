import {
  SESSION_COUNT_LIMITS,
  getPlannedSessionCount
} from "./clinicalPreparation.js";

export function getCompletedSessionCount(sessionSummaries = []) {
  return Math.max(0, ...sessionSummaries.map((summary) => Number(summary?.sessionNumber) || 0));
}

export function getAvailableSessionNumbers(sessionSummaries = [], totalSessions = SESSION_COUNT_LIMITS.defaultValue) {
  const completedSessions = new Set(sessionSummaries.map((summary) => Number(summary?.sessionNumber) || 0));
  const maxCompleted = Math.max(0, ...completedSessions);
  const operationalTotal = Math.max(totalSessions, maxCompleted);
  const maxAvailable = Math.min(operationalTotal, Math.max(1, maxCompleted + 1));
  return Array.from({ length: maxAvailable }, (_, index) => index + 1);
}

export function getProcessSessionTotal(preSessionPlan = null, sessionSummaries = []) {
  const maxCompleted = getCompletedSessionCount(sessionSummaries);
  const directPlan = Number(preSessionPlan?.proposedSessionCount);
  if (Number.isFinite(directPlan) && directPlan > 0) {
    return Math.max(getPlannedSessionCount(preSessionPlan), maxCompleted);
  }

  const planFromSummary = [...sessionSummaries]
    .reverse()
    .find((summary) => Number(summary?.preSessionPlan?.proposedSessionCount) > 0)?.preSessionPlan;
  if (planFromSummary) return Math.max(getPlannedSessionCount(planFromSummary), maxCompleted);

  const decisionTotal = [...sessionSummaries]
    .reverse()
    .find((summary) => Number(summary?.clinicalDecision?.proposedSessions) > 0)?.clinicalDecision?.proposedSessions;

  return Math.max(
    getPlannedSessionCount({ proposedSessionCount: decisionTotal }, SESSION_COUNT_LIMITS.defaultValue),
    maxCompleted
  );
}
