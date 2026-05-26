import { detectIntent } from "./intentDetector.js";
import { buildPatientMemory, getTrustStage, updatePatientMemory } from "./patientMemory.js";
import { selectResponse } from "./responseSelector.js";
import { composeFinalResponse } from "./responseComposer.js";

export function generateLocalPatientResponse({
  caseId,
  studentMessage,
  history = [],
  difficulty = "intermedio",
  memory
}) {
  const workingMemory = buildPatientMemory({ caseId, history, difficulty, memory });
  const intentResult = detectIntent(studentMessage, history);
  const selectedResponse = selectResponse({ caseId, intentResult, memory: workingMemory });
  const responseText = composeFinalResponse({ selectedResponse, memory: workingMemory });
  const memoryUpdate = updatePatientMemory({
    memory: workingMemory,
    intent: intentResult.intent,
    intentResult,
    responseId: selectedResponse.responseId,
    responseText,
    studentMessage
  });

  const debug = {
    studentMessage,
    detectedIntent: intentResult.intent,
    caseId,
    selectedResponseType: selectedResponse.responseType,
    opennessLevel: workingMemory.opennessLevel,
    evasiveCount: workingMemory.evasiveCount || 0,
    lastTopic: intentResult.contextualTopic || workingMemory.lastTopic,
    selectedResponseId: selectedResponse.responseId,
    finalResponse: responseText,
    memory: memoryUpdate,
    fallbackUsed: selectedResponse.fallbackUsed
  };

  if (isDevRuntime()) {
    console.log("[LocalMiniAI]", debug);
  }

  return {
    responseText,
    intent: intentResult.intent,
    caseId,
    confidence: intentResult.confidence,
    memoryUpdate,
    debug,
    responseId: selectedResponse.responseId,
    fallbackUsed: selectedResponse.fallbackUsed,
    intentResult,
    trustStage: getTrustStage(memoryUpdate.trustLevel)
  };
}

function isDevRuntime() {
  return typeof import.meta !== "undefined" && import.meta.env?.DEV === true;
}
