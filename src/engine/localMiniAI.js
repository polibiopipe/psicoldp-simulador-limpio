import { patientFacts } from "../data/patientFacts.js";
import { forceCompositeOpenQuestionResponse, isCompositeOpenQuestionMessage, isIncompleteCompositeResponse } from "./compositeResponses.js";
import { detectIntent } from "./intentDetector.js";
import { generateGuidedPatientResponse } from "./guidedConversationEngine.js";
import { buildPatientMemory, getTrustStage, updatePatientMemory } from "./patientMemory.js";
import { selectCaseProfileResponse } from "./caseProfileResponse.js";
import { selectResponse } from "./responseSelector.js";
import { composeFinalResponse } from "./responseComposer.js";
import { applyActivePatientInteraction } from "./activePatientInteraction.js";

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

  const profileResponse = selectCaseProfileResponse({
    caseId,
    studentMessage,
    intentResult,
    memory: workingMemory
  });

  if (profileResponse) {
    intentResult.intent = profileResponse.resolvedIntent || intentResult.intent;
    intentResult.profileTopic = profileResponse.profileTopic;
    intentResult.contextualTopic = profileResponse.profileTopic || intentResult.contextualTopic;
    intentResult.matches = {
      ...intentResult.matches,
      [intentResult.intent]: true
    };
  }

  const selectedResponse = profileResponse
    ? {
        response: profileResponse.response,
        responseId: profileResponse.responseId,
        responseType: profileResponse.responseType,
        fallbackUsed: profileResponse.fallbackUsed
      }
    : guidedResult
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

  const activeInteractionResult = applyActivePatientInteraction({
    caseId,
    responseText,
    studentMessage,
    intentResult,
    memory: workingMemory,
    selectedResponse
  });
  responseText = activeInteractionResult.responseText;

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
    normalizedMessage: intentResult.normalizedText,
    selectedCaseId: caseId,
    detectedIntent: intentResult.intent,
    detectedQuestionType: intentResult.profileTopic || intentResult.contextualTopic || intentResult.intent,
    resolvedIntent: intentResult.intent,
    detectedTopic: profileResponse?.profileTopic || intentResult.contextualTopic || null,
    caseId,
    responseType: selectedResponse.responseType,
    selectedResponseType: selectedResponse.responseType,
    opennessLevel: workingMemory.opennessLevel,
    evasiveCount: workingMemory.evasiveCount || 0,
    lastPatientMessage: workingMemory.lastPatientMessage,
    detectedEmotionInLastPatientMessage: intentResult.detectedEmotionInLastPatientMessage || null,
    lastTopic: intentResult.contextualTopic || workingMemory.lastTopic,
    selectedResponseId: selectedResponse.responseId,
    selectedResponse: selectedResponse.response,
    finalResponse: responseText,
    ambiguityDetected: intentResult.ambiguityDetected,
    explicitReferenceDetected: intentResult.explicitReferenceDetected,
    profileTopic: profileResponse?.profileTopic || null,
    profileResponseUsed: Boolean(profileResponse),
    usedCaseFacts: Boolean(profileResponse),
    usedResponseIds: workingMemory.usedResponseIds,
    memory: memoryUpdate,
    fallbackUsed: selectedResponse.fallbackUsed,
    wasCompositeForced,
    activeInteraction: activeInteractionResult.activeInteraction,
    guided: guidedResult
      ? {
          selectedInterventionType: guidedResult.selectedInterventionType,
          interventionLabel: guidedResult.interventionLabel,
          stageName: guidedResult.stage.stageName,
          stageLabel: guidedResult.stage.stageLabel,
          resolvedGuidedIntent: guidedResult.resolvedGuidedIntent,
          coveredTopic: guidedResult.coveredTopic,
          opennessDelta: guidedResult.opennessDelta,
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

  if (intentResult.intent === "seguimiento_emocional_contextual") {
    console.log("DEBUG EMOTIONAL CONTEXTUAL FOLLOWUP", {
      studentMessage,
      normalizedMessage: intentResult.normalizedText,
      lastPatientMessage: workingMemory.lastPatientMessage,
      detectedEmotionInLastPatientMessage: intentResult.detectedEmotionInLastPatientMessage || null,
      resolvedIntent: intentResult.intent,
      ambiguityDetected: intentResult.ambiguityDetected,
      responseText
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
  intentResult.contextualTopic = guidedResult.coveredTopic || guidedResult.stage.stageName;
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
      "derivacion_llegada",
      "derivacion_llegada_consulta",
      "respuesta_general",
      "seguimiento_contextual",
      "seguimiento_contextual_explicito",
      "exploracion_emocional",
      "preocupacion_principal",
      "preferencias_valoracion"
    ].includes(intent),
    closedQuestion: ["nombre", "edad", "vivienda_residencia", "ocupacion_actividad", "derivacion_llegada", "derivacion_llegada_consulta"].includes(intent),
    validation: intent === "validacion_emocional",
    judgment: false,
    rushedAdvice: false,
    emotionalExploration: ["exploracion_emocional", "seguimiento_contextual", "seguimiento_contextual_explicito", "validacion_emocional"].includes(intent),
    familyExploration: intent === "exploracion_contextual" || intent === "vivienda_residencia",
    contextExploration: ["contexto_familiar_social", "exploracion_contextual", "vivienda_residencia", "ocupacion_actividad", "derivacion_llegada", "derivacion_llegada_consulta"].includes(intent),
    closure: intent === "cierre",
    goodClosure: intent === "cierre",
    continuityAgreement: intent === "cierre",
    paceRespect: ["saludo_simple", "encuadre", "encuadre_o_consentimiento", "encuadre_mas_pregunta", "encuadre_mas_pregunta_abierta"].includes(intent),
    empathicSummary: intent === "seguimiento_contextual" || intent === "seguimiento_contextual_explicito" || intent === "validacion_emocional",
    followUp: intent === "seguimiento_contextual" || intent === "seguimiento_contextual_explicito",
    preferencesExploration: intent === "preferencias_valoracion",
    concernExploration: intent === "preocupacion_principal" || intent === "motivo_de_consulta" || intent === "derivacion_llegada" || intent === "derivacion_llegada_consulta"
  };
}
