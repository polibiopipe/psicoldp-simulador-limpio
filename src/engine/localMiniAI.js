import { patientFacts } from "../data/patientFacts.js";
import { forceCompositeOpenQuestionResponse, isCompositeOpenQuestionMessage, isIncompleteCompositeResponse } from "./compositeResponses.js";
import { detectIntent } from "./intentDetector.js";
import { generateGuidedPatientResponse } from "./guidedConversationEngine.js";
import { buildPatientMemory, getTrustStage, updatePatientMemory } from "./patientMemory.js";
import { selectCaseProfileResponse } from "./caseProfileResponse.js";
import { selectResponse } from "./responseSelector.js";
import { composeFinalResponse } from "./responseComposer.js";
import { applyActivePatientInteraction } from "./activePatientInteraction.js";
import { getClinicalAvatar } from "../data/clinicalAvatars/index.js";
import { generateClinicalAvatarResponse } from "./clinicalAvatarEngine.js";

export function generateLocalPatientResponse({
  caseId,
  studentMessage,
  history = [],
  difficulty = "intermedio",
  sessionNumber = 1,
  selectedInterventionType = "",
  conversationStage,
  previousSessionSummary = null,
  memory
}) {
  const workingMemory = buildPatientMemory({ caseId, history, difficulty, sessionNumber, memory });
  const intentResult = detectIntent(studentMessage, history);
  const textDetectedIntent = intentResult.intent;
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

  const textConcreteIntentOverrides = new Set([
    "identidad_nombre",
    "edad",
    "convivencia_familia",
    "vivienda_residencia",
    "hermanos",
    "colegio_estudios",
    "derivacion_llegada",
    "motivo_de_consulta",
    "amistades_red_social",
    "pregunta_familiar",
    "pregunta_videojuegos",
    "exploracion_emocional",
    "validacion_emocional",
    "cierre"
  ]);

  if (textConcreteIntentOverrides.has(textDetectedIntent)) {
    const concreteClosedIntents = new Set([
      "identidad_nombre",
      "edad",
      "convivencia_familia",
      "vivienda_residencia",
      "hermanos",
      "colegio_estudios",
      "derivacion_llegada"
    ]);
    intentResult.intent = textDetectedIntent;
    intentResult.confidence = Math.max(intentResult.confidence || 0, 0.98);
    intentResult.contextualTopic = null;
    intentResult.matches = {
      ...intentResult.matches,
      [textDetectedIntent]: true
    };
    intentResult.categories = {
      ...intentResult.categories,
      ...categoriesForGuidedIntent(textDetectedIntent),
      closedQuestion: concreteClosedIntents.has(textDetectedIntent),
      followUp: false,
      empathicSummary: false
    };
  }

  const clinicalAvatar = getClinicalAvatar(caseId);
  const clinicalResponse = clinicalAvatar
    ? generateClinicalAvatarResponse({
        avatarProfile: clinicalAvatar,
        studentMessage,
        intentResult,
        selectedInterventionType,
        sessionNumber,
        conversationHistory: history,
        memory: workingMemory,
        conversationStage: guidedResult?.stage || conversationStage,
        previousSessionSummary
      })
    : null;

  if (clinicalResponse) {
    intentResult.intent = clinicalResponse.resolvedIntent || intentResult.intent;
    intentResult.profileTopic = clinicalResponse.profileTopic;
    intentResult.contextualTopic = clinicalResponse.profileTopic || intentResult.contextualTopic;
    intentResult.revealedTopics = clinicalResponse.clinical?.reveals || [];
    intentResult.clinicalTaskKind = clinicalResponse.clinical?.taskKind || null;
    intentResult.matches = {
      ...intentResult.matches,
      [intentResult.intent]: true
    };
    intentResult.categories = {
      ...intentResult.categories,
      ...categoriesForClinicalResponse(intentResult.intent)
    };
  }

  const profileResponse = clinicalResponse ? null : selectCaseProfileResponse({
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

  const selectedResponse = clinicalResponse
    ? {
        response: clinicalResponse.response,
        responseId: clinicalResponse.responseId,
        responseType: clinicalResponse.responseType,
        fallbackUsed: clinicalResponse.fallbackUsed
      }
    : profileResponse
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
  if (intentResult.intent === "validacion_emocional" && !clinicalResponse) {
    responseText = ensureValidationAcknowledgement(responseText, caseId);
  }
  let wasCompositeForced = false;
  const isCompositeIntent = intentResult.intent === "encuadre_mas_pregunta_abierta" || compositeMessageDetected;

  if (
    isCompositeIntent &&
    (isIncompleteCompositeResponse(selectedResponse.response) || isIncompleteCompositeResponse(responseText))
  ) {
    responseText = forceCompositeOpenQuestionResponse(caseId, patientFacts[caseId]);
    wasCompositeForced = true;
  }

  const activeInteractionResult = clinicalResponse
    ? { responseText, activeInteraction: null }
    : applyActivePatientInteraction({
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
    resolvedIntent: debugResolvedIntent(
      intentResult.intent,
      clinicalResponse?.profileTopic || profileResponse?.profileTopic
    ),
    detectedTopic: clinicalResponse?.profileTopic || profileResponse?.profileTopic || intentResult.contextualTopic || null,
    caseId,
    responseType: selectedResponse.responseType,
    selectedResponseType: selectedResponse.responseType,
    opennessLevel: workingMemory.opennessLevel,
    evasiveCount: workingMemory.evasiveCount || 0,
    lastPatientMessage: workingMemory.lastPatientMessage,
    recentTurns: workingMemory.recentTurns,
    lastSubstantiveTopic: workingMemory.lastSubstantiveTopic,
    reformulationDetected: Boolean(intentResult.reformulationDetected),
    detectedEmotionInLastPatientMessage: intentResult.detectedEmotionInLastPatientMessage || null,
    lastTopic: intentResult.contextualTopic || workingMemory.lastTopic,
    selectedResponseId: selectedResponse.responseId,
    selectedResponse: selectedResponse.response,
    finalResponse: responseText,
    ambiguityDetected: intentResult.ambiguityDetected,
    closureDetected: intentResult.intent === "cierre",
    explicitReferenceDetected: intentResult.explicitReferenceDetected,
    profileTopic: clinicalResponse?.profileTopic || profileResponse?.profileTopic || null,
    clinicalAvatarUsed: Boolean(clinicalResponse),
    clinicalAvatar: clinicalResponse?.clinical || null,
    profileResponseUsed: Boolean(profileResponse),
    usedCaseFacts: Boolean(profileResponse),
    usedResponseIds: workingMemory.usedResponseIds,
    usedIdeaSignatures: workingMemory.usedIdeaSignatures,
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
    responseText,
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

function debugResolvedIntent(intent, profileTopic) {
  if (intent === "motivo_de_consulta" || profileTopic === "motivo_consulta") return "motivo_consulta";
  return intent;
}

function ensureValidationAcknowledgement(responseText, caseId) {
  if (/\b(gracias|me ayuda|me alivia|me sirve|me hace sentido|eso ayuda)\b/i.test(responseText)) {
    return responseText;
  }

  const acknowledgements = {
    tomas: "Eso me ayuda un poco.",
    valentina: "Gracias. Me ayuda que lo digas así.",
    marcos: "Sí, tiene sentido que lo plantees así.",
    camila: "Gracias. Me ayuda que lo mires así.",
    daniela: "Gracias. Me alivia poder decirlo así.",
    claudio: "Gracias. Me ayuda que lo plantees así."
  };
  return `${acknowledgements[caseId] || "Gracias. Me ayuda que lo digas así."} ${responseText}`;
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
      "preferencias_valoracion",
      "amistades_red_social"
    ].includes(intent),
    closedQuestion: ["identidad_nombre", "nombre", "edad", "vivienda_residencia", "ocupacion_actividad", "derivacion_llegada", "derivacion_llegada_consulta"].includes(intent),
    validation: intent === "validacion_emocional",
    judgment: false,
    rushedAdvice: false,
    emotionalExploration: ["exploracion_emocional", "seguimiento_contextual", "seguimiento_contextual_explicito", "validacion_emocional"].includes(intent),
    familyExploration: intent === "exploracion_contextual" || intent === "vivienda_residencia",
    contextExploration: ["contexto_familiar_social", "exploracion_contextual", "vivienda_residencia", "ocupacion_actividad", "derivacion_llegada", "derivacion_llegada_consulta", "amistades_red_social"].includes(intent),
    closure: intent === "cierre",
    goodClosure: intent === "cierre",
    continuityAgreement: intent === "cierre",
    paceRespect: ["saludo_simple", "encuadre", "encuadre_o_consentimiento", "encuadre_mas_pregunta", "encuadre_mas_pregunta_abierta"].includes(intent),
    empathicSummary: intent === "seguimiento_contextual" || intent === "seguimiento_contextual_explicito" || intent === "validacion_emocional",
    followUp: intent === "seguimiento_contextual" || intent === "seguimiento_contextual_explicito",
    preferencesExploration: intent === "preferencias_valoracion",
    concernExploration: intent === "preocupacion_principal" || intent === "motivo_de_consulta" || intent === "derivacion_llegada" || intent === "derivacion_llegada_consulta",
    supportExploration: intent === "amistades_red_social"
  };
}

function categoriesForClinicalResponse(intent) {
  const base = categoriesForGuidedIntent(intent);
  const taskIntent = ["tarea_concreta", "tarea_amplia", "tarea_prematura", "seguimiento_tarea"].includes(intent);

  return {
    ...base,
    validation: intent === "validacion_emocional" || base.validation,
    judgment: intent === "juicio_o_critica",
    rushedAdvice: ["consejo_apresurado", "presion_directiva"].includes(intent),
    emotionalExploration: ["exploracion_emocional", "seguimiento_emocional_contextual"].includes(intent) || base.emotionalExploration,
    closure: intent === "cierre" || base.closure,
    goodClosure: intent === "cierre" || base.goodClosure,
    continuityAgreement: intent === "cierre" || base.continuityAgreement,
    followUp: ["seguimiento_contextual", "seguimiento_contextual_explicito", "seguimiento_tarea"].includes(intent) || base.followUp,
    taskProposal: taskIntent
  };
}
