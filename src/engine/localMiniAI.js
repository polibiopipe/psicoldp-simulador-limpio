import { patientFacts } from "../data/patientFacts.js";
import { patientProfiles } from "../data/patientProfiles.js";
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
import { CLINICAL_ENGINE_CASE_IDS, generateClinicalSimulationResponse } from "./clinicalSimulationEngine.js";
import { buildLocalNarrativeResponse } from "./localNarrativeResponder.js";
import { selectCanonicalDirectResponse } from "../data/avatarCanonicalBiographies.js";

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
  const canonicalResponse = selectCanonicalDirectResponse({
    patientId: caseId,
    studentMessage
  });

  if (canonicalResponse) {
    return buildCanonicalLocalResult({
      caseId,
      studentMessage,
      canonicalResponse,
      workingMemory
    });
  }

  const clinicalSimulationResult = CLINICAL_ENGINE_CASE_IDS.includes(caseId)
    ? generateClinicalSimulationResponse({
        caseId,
        studentMessage,
        history,
        sessionNumber,
        memory: workingMemory
      })
    : null;

  if (clinicalSimulationResult) {
    const localNarrativeResponse = shouldUseLocalNarrativeAfterClinical(clinicalSimulationResult)
      ? buildLocalNarrativeResponse({
          patientId: caseId,
          sessionNumber,
          conversationHistory: history,
          currentUserMessage: studentMessage,
          canonicalFacts: patientFacts[caseId],
          patientProfile: patientProfiles[caseId]
        })
      : null;

    if (localNarrativeResponse) {
      return buildLocalNarrativeLocalResult({
        caseId,
        studentMessage,
        result: localNarrativeResponse,
        workingMemory
      });
    }

    return buildClinicalSimulationLocalResult({
      caseId,
      studentMessage,
      result: clinicalSimulationResult,
      workingMemory
    });
  }

  const localNarrativeResponse = buildLocalNarrativeResponse({
    patientId: caseId,
    sessionNumber,
    conversationHistory: history,
    currentUserMessage: studentMessage,
    canonicalFacts: patientFacts[caseId],
    patientProfile: patientProfiles[caseId]
  });

  if (localNarrativeResponse) {
    return buildLocalNarrativeLocalResult({
      caseId,
      studentMessage,
      result: localNarrativeResponse,
      workingMemory
    });
  }

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
    intentResult.clinicalTaskDetails = clinicalResponse.clinical?.taskDetails || null;
    intentResult.practicalAct = clinicalResponse.clinical?.practicalAct || null;
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

  if (isCompositeIntent && isDevRuntime()) {
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

  if (intentResult.intent === "seguimiento_emocional_contextual" && isDevRuntime()) {
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

function shouldUseLocalNarrativeAfterClinical(result) {
  if (!result) return true;
  return result.detectedAct === "pregunta_confusa";
}

function buildLocalNarrativeLocalResult({ caseId, studentMessage, result, workingMemory }) {
  const categories = categoriesForLocalNarrative(result.resolvedIntent, result.intent);
  const intentResult = {
    intent: result.resolvedIntent,
    confidence: 0.93,
    normalizedText: String(studentMessage || "").trim(),
    contextualTopic: result.intent,
    profileTopic: result.intent,
    explicitReferenceDetected: ["meaning", "history", "impact", "fear", "ambivalence"].includes(result.intent),
    ambiguityDetected: false,
    detectedEmotionInLastPatientMessage: null,
    reformulationDetected: false,
    supportiveStatementDetected: false,
    hardConcreteIntent: result.resolvedIntent,
    matches: {
      [result.resolvedIntent]: true,
      [result.intent]: true
    },
    categories,
    revealedTopics: [`local_narrative:${result.intent}:${result.disclosureLevel}`],
    clinicalTaskKind: null,
    clinicalTaskDetails: null,
    practicalAct: null
  };

  const memoryUpdate = updatePatientMemory({
    memory: workingMemory,
    intent: result.resolvedIntent,
    intentResult,
    responseId: result.responseId,
    responseText: result.responseText,
    studentMessage
  });

  const debug = {
    studentMessage,
    normalizedMessage: intentResult.normalizedText,
    selectedCaseId: caseId,
    detectedIntent: result.resolvedIntent,
    detectedQuestionType: result.intent,
    resolvedIntent: result.resolvedIntent,
    detectedTopic: result.intent,
    caseId,
    responseType: result.responseType,
    selectedResponseType: result.responseType,
    opennessLevel: memoryUpdate.opennessLevel,
    evasiveCount: workingMemory.evasiveCount || 0,
    lastPatientMessage: workingMemory.lastPatientMessage,
    recentTurns: workingMemory.recentTurns,
    lastSubstantiveTopic: workingMemory.lastSubstantiveTopic,
    reformulationDetected: false,
    detectedEmotionInLastPatientMessage: null,
    lastTopic: result.intent,
    selectedResponseId: result.responseId,
    selectedResponse: result.responseText,
    finalResponse: result.responseText,
    ambiguityDetected: false,
    closureDetected: false,
    explicitReferenceDetected: intentResult.explicitReferenceDetected,
    profileTopic: result.intent,
    clinicalAvatarUsed: false,
    clinicalAvatar: null,
    clinicalSimulation: null,
    localNarrative: {
      used: true,
      intent: result.intent,
      disclosureLevel: result.disclosureLevel,
      availableFactCount: result.narrative?.availableFactCount || 0,
      lockedLevels: result.narrative?.lockedLevels || []
    },
    profileResponseUsed: false,
    usedCaseFacts: true,
    usedResponseIds: memoryUpdate.usedResponseIds,
    usedIdeaSignatures: memoryUpdate.usedIdeaSignatures || workingMemory.usedIdeaSignatures,
    memory: memoryUpdate,
    fallbackUsed: false,
    wasCompositeForced: false,
    activeInteraction: null,
    guided: null
  };

  if (isDevRuntime()) {
    console.log("[LocalNarrativeResponder]", debug);
  }

  return {
    responseText: result.responseText,
    intent: result.resolvedIntent,
    caseId,
    confidence: 0.93,
    memoryUpdate,
    debug,
    responseId: result.responseId,
    fallbackUsed: false,
    intentResult,
    trustStage: getTrustStage(memoryUpdate.trustLevel),
    guidedResult: null
  };
}

function buildCanonicalLocalResult({ caseId, studentMessage, canonicalResponse, workingMemory }) {
  const intent = `dato_canonico_${canonicalResponse.factKey}`;
  const responseText = canonicalResponse.responseText;
  const intentResult = {
    intent,
    confidence: 0.99,
    normalizedText: normalizeForDebug(studentMessage),
    contextualTopic: canonicalResponse.factKey,
    profileTopic: canonicalResponse.factKey,
    explicitReferenceDetected: false,
    ambiguityDetected: false,
    detectedEmotionInLastPatientMessage: null,
    reformulationDetected: false,
    supportiveStatementDetected: false,
    hardConcreteIntent: intent,
    matches: { [intent]: true, datos_biograficos_canonicos: true },
    categories: {
      framing: false,
      openQuestion: false,
      closedQuestion: true,
      validation: false,
      judgment: false,
      rushedAdvice: false,
      emotionalExploration: false,
      familyExploration: ["household", "family", "siblings", "children", "relationship"].includes(canonicalResponse.factKey),
      contextExploration: true,
      closure: false,
      goodClosure: false,
      continuityAgreement: false,
      paceRespect: false,
      empathicSummary: false,
      followUp: false,
      preferencesExploration: canonicalResponse.factKey === "expectation",
      concernExploration: canonicalResponse.factKey === "reason",
      supportExploration: canonicalResponse.factKey === "friends"
    }
  };

  const memoryUpdate = updatePatientMemory({
    memory: workingMemory,
    intent,
    intentResult,
    responseId: `canonical:${caseId}:${canonicalResponse.factKey}`,
    responseText,
    studentMessage
  });

  const debug = {
    studentMessage,
    normalizedMessage: intentResult.normalizedText,
    selectedCaseId: caseId,
    detectedIntent: intent,
    detectedQuestionType: canonicalResponse.factKey,
    resolvedIntent: "datos_biograficos_canonicos",
    detectedTopic: canonicalResponse.factKey,
    caseId,
    responseType: "canonical_biography",
    selectedResponseType: "canonical_biography",
    opennessLevel: workingMemory.opennessLevel,
    selectedResponseId: `canonical:${caseId}:${canonicalResponse.factKey}`,
    selectedResponse: responseText,
    finalResponse: responseText,
    profileResponseUsed: false,
    usedCaseFacts: true,
    memory: memoryUpdate,
    fallbackUsed: false,
    canonicalBiographyUsed: true,
    canonicalFactKey: canonicalResponse.factKey
  };

  if (isDevRuntime()) {
    console.log("[LocalMiniAI:canonical]", debug);
  }

  return {
    responseText,
    intent,
    caseId,
    confidence: 0.99,
    memoryUpdate,
    debug,
    responseId: `canonical:${caseId}:${canonicalResponse.factKey}`,
    fallbackUsed: false,
    intentResult,
    trustStage: getTrustStage(memoryUpdate.trustLevel),
    guidedResult: null
  };
}

function normalizeForDebug(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function buildClinicalSimulationLocalResult({ caseId, studentMessage, result, workingMemory }) {
  const categories = categoriesForClinicalSimulation(result.detectedAct, result.clinicalTopic);
  const intentResult = {
    intent: result.detectedAct,
    confidence: result.confidence || 0.95,
    normalizedText: result.normalizedMessage,
    contextualTopic: result.clinicalTopic,
    profileTopic: result.clinicalTopic,
    explicitReferenceDetected: result.detectedAct === "experiencia_vivida",
    ambiguityDetected: result.detectedAct === "pregunta_confusa",
    detectedEmotionInLastPatientMessage: null,
    reformulationDetected: false,
    supportiveStatementDetected: result.detectedAct === "intervencion_empatica",
    hardConcreteIntent: result.detectedAct,
    matches: {
      [result.detectedAct]: true,
      [result.clinicalTopic]: true
    },
    categories,
    revealedTopics: result.memoryPatch.revealedTopics || [],
    clinicalTaskKind: result.memoryPatch.taskAccepted ? "concrete" : null,
    clinicalTaskDetails: result.memoryPatch.taskDetails || result.taskDetails || null,
    practicalAct: result.detectedAct === "confirmar_tarea"
      ? "task_confirmation"
      : result.detectedAct === "tarea_terapeutica"
      ? "task_proposal"
      : null
  };
  const memoryUpdate = {
    ...workingMemory,
    ...result.memoryPatch,
    opennessLevel: clinicalOpennessLocal(result.memoryPatch.trustLevel),
    emotionalOpenness: clinicalOpennessLocal(result.memoryPatch.trustLevel)
  };
  const clinicalAvatarCompatibility = {
    avatarId: caseId,
    engine: "ClinicalSimulationEngine",
    source: "clinical-simulation-engine",
    detectedAct: result.detectedAct,
    resolvedIntent: result.detectedAct,
    profileTopic: result.clinicalTopic,
    detectedTopic: result.clinicalTopic,
    emotionalState: result.emotionalState,
    disclosureLevel: result.disclosureLevel,
    selectedResponseId: result.selectedResponseId,
    responseId: result.responseId,
    responseType: "clinical_simulation",
    taskKind: result.memoryPatch.taskAccepted ? "concrete" : null,
    practicalAct: intentResult.practicalAct,
    taskDetails: result.memoryPatch.taskDetails || result.taskDetails || null,
    reveals: result.memoryPatch.revealedTopics || [],
    feedbackSignals: result.feedbackSignals
  };
  const debug = {
    studentMessage,
    normalizedMessage: result.normalizedMessage,
    selectedCaseId: caseId,
    detectedIntent: result.detectedAct,
    detectedQuestionType: result.clinicalTopic,
    resolvedIntent: result.detectedAct,
    detectedTopic: result.clinicalTopic,
    caseId,
    responseType: "clinical_simulation",
    selectedResponseType: "clinical_simulation",
    opennessLevel: memoryUpdate.opennessLevel,
    evasiveCount: workingMemory.evasiveCount || 0,
    lastPatientMessage: workingMemory.lastPatientMessage,
    recentTurns: workingMemory.recentTurns,
    lastSubstantiveTopic: result.memoryPatch.currentTopic || workingMemory.lastSubstantiveTopic,
    reformulationDetected: false,
    detectedEmotionInLastPatientMessage: null,
    lastTopic: result.clinicalTopic,
    selectedResponseId: result.responseId,
    selectedResponse: result.responseText,
    finalResponse: result.responseText,
    ambiguityDetected: result.detectedAct === "pregunta_confusa",
    closureDetected: result.detectedAct === "cierre",
    explicitReferenceDetected: result.detectedAct === "experiencia_vivida",
    profileTopic: result.clinicalTopic,
    clinicalAvatarUsed: true,
    clinicalAvatar: clinicalAvatarCompatibility,
    clinicalSimulation: {
      ...result,
      stateAfter: result.memoryPatch
    },
    profileResponseUsed: false,
    usedCaseFacts: true,
    usedResponseIds: memoryUpdate.usedResponseIds,
    usedIdeaSignatures: memoryUpdate.usedIdeaSignatures || workingMemory.usedIdeaSignatures,
    memory: memoryUpdate,
    fallbackUsed: false,
    wasCompositeForced: false,
    activeInteraction: null,
    guided: null
  };

  if (isDevRuntime()) {
    console.log("[ClinicalSimulationEngine]", debug);
  }

  return {
    responseText: result.responseText,
    intent: result.detectedAct,
    caseId,
    confidence: result.confidence || 0.95,
    memoryUpdate,
    debug,
    responseId: result.responseId,
    fallbackUsed: false,
    intentResult,
    trustStage: getTrustStage(memoryUpdate.trustLevel),
    guidedResult: null
  };
}

function categoriesForLocalNarrative(resolvedIntent, narrativeIntent) {
  const openQuestion = [
    "motivo_de_consulta",
    "seguimiento_contextual",
    "exploracion_emocional",
    "rutina",
    "ocupacion_actividad"
  ].includes(resolvedIntent);

  return {
    framing: false,
    openQuestion,
    closedQuestion: ["edad", "familia"].includes(resolvedIntent),
    validation: false,
    judgment: false,
    rushedAdvice: false,
    emotionalExploration: ["exploracion_emocional"].includes(resolvedIntent)
      || ["feelings", "fear", "meaning", "ambivalence"].includes(narrativeIntent),
    familyExploration: narrativeIntent === "family",
    contextExploration: ["family", "relationships", "routine", "education", "work", "impact", "history", "future"].includes(narrativeIntent),
    closure: false,
    goodClosure: false,
    continuityAgreement: false,
    paceRespect: false,
    empathicSummary: false,
    followUp: ["impact", "meaning", "history", "future", "ambivalence", "relationships"].includes(narrativeIntent),
    preferencesExploration: narrativeIntent === "future",
    concernExploration: ["reason", "recent_trigger", "fear"].includes(narrativeIntent),
    supportExploration: narrativeIntent === "relationships",
    taskProposal: false
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

function categoriesForClinicalSimulation(detectedAct, clinicalTopic) {
  const closure = detectedAct === "cierre" || detectedAct === "cierre_sesion";
  const taskProposal = detectedAct === "tarea_terapeutica" || detectedAct === "confirmar_tarea";
  const emotionalExploration = ["emocion", "sintomas_malestar", "riesgo_autolesion"].includes(detectedAct)
    || ["emocion", "sintomas_malestar", "miedo", "verguenza", "riesgo_autolesion"].includes(clinicalTopic);

  return {
    framing: detectedAct === "saludo" || detectedAct === "encuadre_confidencialidad",
    openQuestion: ["motivo_consulta", "emocion", "sintomas_malestar", "experiencia_vivida", "rutina", "apoyo_redes", "red_apoyo"].includes(detectedAct),
    closedQuestion: ["identidad_nombre", "edad", "vivienda", "ocupacion_estudios", "datos_basicos", "convivencia_familia", "familia_composicion", "estado_civil_pareja", "agenda_proxima_sesion", "riesgo_autolesion", "consumo_sustancias"].includes(detectedAct),
    validation: detectedAct === "intervencion_empatica",
    judgment: detectedAct === "intervencion_confrontativa",
    rushedAdvice: detectedAct === "intervencion_confrontativa",
    emotionalExploration,
    familyExploration: ["convivencia_familia", "familia_composicion", "estado_civil_pareja", "vivienda"].includes(detectedAct) || clinicalTopic === "familia",
    contextExploration: ["convivencia_familia", "familia_composicion", "vivienda", "ocupacion_estudios", "rutina", "apoyo_redes", "red_apoyo"].includes(detectedAct),
    closure,
    goodClosure: closure,
    continuityAgreement: detectedAct === "agenda_proxima_sesion" || closure,
    paceRespect: detectedAct === "intervencion_empatica" || detectedAct === "saludo",
    empathicSummary: detectedAct === "intervencion_empatica" || detectedAct === "experiencia_vivida",
    followUp: detectedAct === "experiencia_vivida" || detectedAct === "seguimiento_tarea",
    preferencesExploration: clinicalTopic === "experiencia_vivida",
    concernExploration: detectedAct === "motivo_consulta",
    supportExploration: detectedAct === "apoyo_redes" || detectedAct === "red_apoyo",
    taskProposal
  };
}

function clinicalOpennessLocal(trustLevel = 0) {
  if (trustLevel <= 35) return "apertura_baja";
  if (trustLevel <= 70) return "apertura_media";
  return "apertura_alta";
}
