import { patientProfiles } from "../data/patientProfiles.js";
import { clamp, getTrustStage, opennessLevel } from "../utils/textUtils.js";

const difficultyShift = {
  introductorio: 8,
  intermedio: 0,
  avanzado: -10
};

export function createInitialConversationState(caseId, difficulty = "intermedio") {
  const profile = patientProfiles[caseId] || patientProfiles.tomas;
  const trustLevel = clamp(profile.initialOpenness + (difficultyShift[difficulty] ?? 0));

  return {
    turnCount: 0,
    hasGreeting: false,
    hasFraming: false,
    hasValidation: false,
    hasJudgment: false,
    hasRushedAdvice: false,
    exploredTopics: [],
    trustLevel,
    opennessLevel: opennessLevel(trustLevel),
    trustStage: getTrustStage(trustLevel),
    usedResponses: [],
    usedResponseIds: [],
    lastTopic: null,
    lastPatientMessage: "",
    lastDetectedIntent: null,
    lastStudentQuestion: "",
    lastResponseId: null
  };
}

export function deriveConversationState({ caseId, difficulty, conversationHistory = [], conversationState }) {
  const base = conversationState || createInitialConversationState(caseId, difficulty);
  const lastTurn = conversationHistory.at(-1);

  if (!lastTurn) return base;

  return {
    ...base,
    turnCount: conversationHistory.length,
    trustLevel: lastTurn.patientState?.trustLevel ?? base.trustLevel,
    opennessLevel: opennessLevel(lastTurn.patientState?.trustLevel ?? base.trustLevel),
    trustStage: getTrustStage(lastTurn.patientState?.trustLevel ?? base.trustLevel),
    usedResponses: conversationHistory.map((turn) => turn.responseId).filter(Boolean),
    usedResponseIds: conversationHistory.map((turn) => turn.responseId).filter(Boolean),
    lastTopic: lastTurn.responseCategory || base.lastTopic,
    lastPatientMessage: lastTurn.answer || base.lastPatientMessage || "",
    lastDetectedIntent: lastTurn.responseCategory || base.lastDetectedIntent || null,
    lastStudentQuestion: lastTurn.question || base.lastStudentQuestion || "",
    lastResponseId: lastTurn.responseId || base.lastResponseId || null
  };
}

export function updateConversationState({ caseId, difficulty, previousState, intentAnalysis, responseId, studentMessage, responseText }) {
  const state = previousState || createInitialConversationState(caseId, difficulty);
  const categories = intentAnalysis.categories;
  let trustLevel = state.trustLevel;

  if (categories.framing) trustLevel += 8;
  if (categories.validation) trustLevel += 12;
  if (categories.openQuestion) trustLevel += 5;
  if (categories.emotionalExploration) trustLevel += 6;
  if (categories.contextExploration) trustLevel += 4;
  if (categories.paceRespect) trustLevel += 6;
  if (categories.empathicSummary) trustLevel += 7;
  if (categories.judgment) trustLevel -= 18;
  if (categories.rushedAdvice) trustLevel -= 13;
  if (categories.prematureInterpretation) trustLevel -= 10;
  if (categories.pressure) trustLevel -= 14;
  if (categories.prematureClosure) trustLevel -= 8;

  const nextTrust = clamp(trustLevel);
  const topic = intentAnalysis.detectedIntent;
  const exploredTopics = new Set(state.exploredTopics);
  if (categories.contextExploration || categories.emotionalExploration) exploredTopics.add(topic);

  return {
    ...state,
    turnCount: state.turnCount + 1,
    hasGreeting: state.hasGreeting || categories.saludo,
    hasFraming: state.hasFraming || categories.framing,
    hasValidation: state.hasValidation || categories.validation,
    hasJudgment: state.hasJudgment || categories.judgment,
    hasRushedAdvice: state.hasRushedAdvice || categories.rushedAdvice,
    exploredTopics: [...exploredTopics],
    trustLevel: nextTrust,
    opennessLevel: opennessLevel(nextTrust),
    trustStage: getTrustStage(nextTrust),
    usedResponses: responseId ? [...state.usedResponses, responseId] : state.usedResponses,
    usedResponseIds: responseId ? [...(state.usedResponseIds || state.usedResponses || []), responseId] : state.usedResponseIds || state.usedResponses || [],
    lastTopic: topic,
    lastPatientMessage: responseText ?? state.lastPatientMessage ?? "",
    lastDetectedIntent: topic,
    lastStudentQuestion: studentMessage ?? state.lastStudentQuestion ?? "",
    lastResponseId: responseId ?? state.lastResponseId ?? null
  };
}
