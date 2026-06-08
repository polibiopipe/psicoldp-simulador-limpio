import { patientFacts } from "../data/patientFacts.js";
import { forceCompositeOpenQuestionResponse, isCompositeOpenQuestionMessage, isIncompleteCompositeResponse } from "./compositeResponses.js";
import { detectIntent } from "./intentDetector.js";
import { generateGuidedPatientResponse } from "./guidedConversationEngine.js";
import { buildPatientMemory, getTrustStage, updatePatientMemory } from "./patientMemory.js";
import { selectResponse } from "./responseSelector.js";
import { composeFinalResponse } from "./responseComposer.js";

export function generateLocalPatientResponse({
  caseId,
  studentMessage,
  history = [],
  difficulty = "intermedio",
  sessionNumber = 1,
  selectedInterventionType = "",
  conversationStage,
  memory
}) {
  const workingMemory = buildPatientMemory({ caseId, history, difficulty, memory });
  const intentResult = detectIntent(studentMessage, history);
  const compositeMessageDetected = isCompositeOpenQuestionMessage(studentMessage);
  if (compositeMessageDetected && intentResult.intent !== "encuadre_mas_pregunta_abierta") {
    intentResult.intent = "encuadre_mas_pregunta_abierta";
    intentResult.contextualTopic = null;
    intentResult.matches = {
      ...intentResult.matches,
      encuadre_mas_pregunta_abierta: true
    };
    intentResult.categories = {
      ...intentResult.categories,
      framing: true,
      openQuestion: true,
      paceRespect: true
    };
  }

  const guidedResult = selectedInterventionType
    ? generateGuidedPatientResponse({
        caseId,
        sessionNumber,
        conversationStage,
        selectedInterventionType,
        studentMessage,
        conversationHistory: history,
        opennessLevel: workingMemory.opennessLevel,
        detectedIntent: intentResult.intent
      })
    : null;

  if (guidedResult) {
    applyGuidedIntentResult(intentResult, guidedResult);
  }

  const selectedResponse = guidedResult
    ? {
        response: guidedResult.responseText,
        responseId: guidedResult.responseId,
        responseType: guidedResult.responseType,
        fallbackUsed: guidedResult.fallbackUsed
      }
    : selectResponse({ caseId, intentResult, memory: workingMemory });

  let responseText = composeFinalResponse({ selectedResponse, memory: workingMemory });
  let wasCompositeForced = false;
  const isCompositeIntent = intentResult.intent === "encuadre_mas_pregunta_abierta" || compositeMessageDetected;

  if (
    isCompositeIntent &&
    (isIncompleteCompositeResponse(selectedResponse.response) || isIncompleteCompositeResponse(responseText))
  ) {
    responseText = forceCompositeOpenQuestionResponse(caseId, patientFacts[caseId]);
    wasCompositeForced = true;
  }

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
    responseType: selectedResponse.responseType,
    selectedResponseType: selectedResponse.responseType,
    opennessLevel: workingMemory.opennessLevel,
    evasiveCount: workingMemory.evasiveCount || 0,
    lastTopic: intentResult.contextualTopic || workingMemory.lastTopic,
    selectedResponseId: selectedResponse.responseId,
    selectedResponse: selectedResponse.response,
    finalResponse: responseText,
    memory: memoryUpdate,
    fallbackUsed: selectedResponse.fallbackUsed,
    wasCompositeForced,
    guided: guidedResult
      ? {
          selectedInterventionType: guidedResult.selectedInterventionType,
          interventionLabel: guidedResult.interventionLabel,
          stageName: guidedResult.stage.stageName,
          stageLabel: guidedResult.stage.stageLabel,
          resolvedGuidedIntent: guidedResult.resolvedGuidedIntent,
          isCoherent: guidedResult.coherence.isCoherent,
          expectedIntents: guidedResult.coherence.expectedIntents,
          detectedIntentBeforeGuide: guidedResult.coherence.detectedIntent
        }
      : null
  };

  if (isCompositeIntent) {
    console.log("DEBUG COMPOSITE INTENT", {
      studentMessage,
      detectedIntent: intentResult.intent,
      caseId,
      selectedResponse: selectedResponse.response,
      finalResponse: responseText,
      wasCompositeForced
    });
  }

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
    trustStage: getTrustStage(memoryUpdate.trustLevel),
    guidedResult
  };
}

function isDevRuntime() {
  return typeof import.meta !== "undefined" && import.meta.env?.DEV === true;
}

function applyGuidedIntentResult(intentResult, guidedResult) {
  intentResult.intent = guidedResult.intent;
  intentResult.confidence = 0.98;
  intentResult.contextualTopic = guidedResult.stage.stageName;
  intentResult.matches = {
    ...intentResult.matches,
    [guidedResult.intent]: true
  };
  intentResult.categories = {
    ...intentResult.categories,
    ...categoriesForGuidedIntent(guidedResult.intent)
  };
}

function categoriesForGuidedIntent(intent) {
  return {
    framing: ["saludo_simple", "encuadre", "encuadre_o_consentimiento", "encuadre_mas_pregunta", "encuadre_mas_pregunta_abierta"].includes(intent),
    openQuestion: [
      "encuadre_mas_pregunta",
      "encuadre_mas_pregunta_abierta",
      "motivo_de_consulta",
      "respuesta_general",
      "seguimiento_contextual",
      "exploracion_emocional",
      "preocupacion_principal",
      "preferencias_valoracion"
    ].includes(intent),
    closedQuestion: ["nombre", "edad", "vivienda_residencia", "ocupacion_actividad"].includes(intent),
    validation: intent === "validacion_emocional",
    judgment: false,
    rushedAdvice: false,
    emotionalExploration: ["exploracion_emocional", "seguimiento_contextual"].includes(intent),
    familyExploration: intent === "exploracion_contextual" || intent === "vivienda_residencia",
    contextExploration: ["exploracion_contextual", "vivienda_residencia", "ocupacion_actividad"].includes(intent),
    closure: intent === "cierre",
    goodClosure: intent === "cierre",
    continuityAgreement: intent === "cierre",
    paceRespect: ["saludo_simple", "encuadre", "encuadre_o_consentimiento", "encuadre_mas_pregunta", "encuadre_mas_pregunta_abierta"].includes(intent),
    empathicSummary: intent === "seguimiento_contextual",
    followUp: intent === "seguimiento_contextual",
    preferencesExploration: intent === "preferencias_valoracion",
    concernExploration: intent === "preocupacion_principal" || intent === "motivo_de_consulta"
  };
}
