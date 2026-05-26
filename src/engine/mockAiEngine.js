import { analyzeIntent } from "./analyzeIntent.js";
import { deriveConversationState, updateConversationState } from "./conversationState.js";
import { planResponse } from "./responsePlanner.js";
import { cleanPatientResponse, composeResponse } from "./responseGenerator.js";

export function generatePatientResponse({
  caseId,
  studentMessage,
  conversationHistory = [],
  conversationState,
  difficulty = "intermedio",
  debug = false
}) {
  const intentAnalysis = analyzeIntent(studentMessage, conversationHistory);
  const currentState = deriveConversationState({ caseId, difficulty, conversationHistory, conversationState });
  const provisionalState = updateConversationState({
    caseId,
    difficulty,
    previousState: currentState,
    intentAnalysis,
    responseId: null
  });
  const plan = planResponse({ caseId, intentAnalysis, state: currentState });
  const baseResponseText = composeResponse({ plan, opennessLevel: provisionalState.opennessLevel });
  const responseId = makeResponseId(caseId, intentAnalysis.detectedIntent, plan);
  const repeatedResponse =
    (currentState.usedResponseIds || currentState.usedResponses || []).includes(responseId) ||
    conversationHistory.some((turn) => turn.answer === baseResponseText);
  const responseText = cleanPatientResponse(
    repeatedResponse
      ? buildRepeatedResponse({ caseId, intent: intentAnalysis.detectedIntent, baseResponseText, plan })
      : baseResponseText
  );
  const updatedState = updateConversationState({
    caseId,
    difficulty,
    previousState: currentState,
    intentAnalysis,
    responseId,
    studentMessage,
    responseText
  });

  if (debug || globalThis.__LDP_DEBUG__) {
    console.debug("[MockAiEngine]", {
      studentMessage,
      caseId,
      detectedIntent: intentAnalysis.detectedIntent,
      lastTopicUsed: currentState.lastTopic,
      opennessLevel: updatedState.opennessLevel,
      directAnswer: plan.directAnswer,
      responseText,
      usedFallback: Boolean(plan.usedFallback),
      repeatedResponse
    });
  }

  return {
    responseText,
    detectedIntent: intentAnalysis.detectedIntent,
    directAnswer: plan.directAnswer || null,
    emotionalTone: plan.emotionalTone || null,
    opennessLevel: updatedState.opennessLevel,
    updatedState,
    intentAnalysis,
    responseId,
    usedFallback: Boolean(plan.usedFallback),
    repeatedResponse,
    lastTopicUsed: currentState.lastTopic
  };
}

function makeResponseId(caseId, intent, plan) {
  if (plan.id) return plan.id;
  const raw = `${caseId}_${intent}_${plan.directAnswer || ""}_${plan.contextualDetail || ""}`;
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120);
}

function buildRepeatedResponse({ caseId, intent, baseResponseText, plan }) {
  if (intent === "seguimiento" || intent === "seguimiento_contextual") {
    return `Lo digo de otra forma. ${baseResponseText}`;
  }

  const details = {
    tomas: "Creo que lo dije mal. En mi casa todo parte por el computador, pero también me pasa que en persona no sé muy bien cómo actuar. Entonces termino encerrándome más.",
    valentina: "Creo que lo dije mal. No es solo cansancio; también es esa sensación de que debería estar haciendo más.",
    marcos: "Creo que lo dije mal. Sigo funcionando, pero cada vez llego con menos paciencia y menos energía.",
    elena: "Creo que lo dije mal. Me cuesta hablar de mí, pero sí hay una sensación de soledad que se repite.",
    nicolas: "No sé, lo dije mal. Me cuesta explicar porque siento que igual ya tienen una idea hecha."
  };

  return details[caseId] || `Creo que lo dije mal. ${plan.contextualDetail || baseResponseText}`;
}

export const generatePatientResponseLocal = generatePatientResponse;

export async function generatePatientResponseWithApi() {
  throw new Error("API externa no implementada. El simulador usa generatePatientResponseLocal por ahora.");
}
