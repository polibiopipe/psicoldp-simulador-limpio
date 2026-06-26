import { generateLocalPatientResponse } from "../engine/localMiniAI.js";

export function createPatientResponse({
  caseItem,
  difficulty,
  question,
  history,
  sessionNumber = 1,
  selectedInterventionType = "",
  previousSessionSummary = null
}) {
  const result = generateLocalPatientResponse({
    caseId: caseItem.id,
    studentMessage: question,
    history,
    difficulty,
    sessionNumber,
    selectedInterventionType,
    previousSessionSummary
  });

  return {
    text: result.responseText,
    directAnswer: result.responseText,
    emotionalTone: null,
    usedFallback: result.fallbackUsed,
    repeatedResponse: false,
    responseId: result.responseId,
    analysis: {
      original: question,
      text: result.intentResult.normalizedText,
      detectedIntent: result.intent,
      contextualTopic: result.intentResult.contextualTopic,
      confidence: result.confidence,
      categories: result.intentResult.categories,
      categoryList: Object.entries(result.intentResult.categories)
        .filter(([, value]) => value)
        .map(([key]) => key),
      guidedIntervention: result.debug.guided,
      clinicalAvatar: result.debug.clinicalAvatar,
      clinicalSimulation: result.debug.clinicalSimulation
    },
    patientState: {
      trustLevel: result.memoryUpdate.trustLevel,
      trustStage: result.trustStage,
      opennessLevel: result.memoryUpdate.opennessLevel,
      clinicalEmotionalState: result.memoryUpdate.emotionalState || null,
      repeatedQuestion: false
    },
    responseCategory: result.intent,
    guidedIntervention: result.debug.guided,
    clinicalAvatar: result.debug.clinicalAvatar,
    clinicalSimulation: result.debug.clinicalSimulation
  };
}
