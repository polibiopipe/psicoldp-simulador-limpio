import { claudioClinicalSimulationProfile } from "../data/clinicalAvatars/claudioProfile.js";
import { normalizeText } from "../utils/textUtils.js";
import { resolveStudentAct } from "./studentActResolver.js";
import {
  buildClinicalState,
  buildMemoryPatch,
  selectDisclosureLevel,
  updateClinicalState
} from "./clinicalStateManager.js";
import { composePatientResponse } from "./clinicalResponseComposer.js";

export const CLINICAL_ENGINE_CASE_IDS = ["claudio"];

const CLINICAL_PROFILES = {
  claudio: claudioClinicalSimulationProfile
};

export function isClinicalEngineCase(caseId) {
  return CLINICAL_ENGINE_CASE_IDS.includes(caseId);
}

export function generateClinicalSimulationResponse({
  caseId,
  studentMessage,
  history = [],
  sessionNumber = 1,
  memory = {}
} = {}) {
  if (!isClinicalEngineCase(caseId)) return null;

  const profile = CLINICAL_PROFILES[caseId];
  const stateBefore = buildClinicalState({
    caseId,
    history,
    memory,
    sessionNumber,
    profile
  });
  const actResult = resolveStudentAct({
    studentMessage,
    memory: stateBefore
  });
  const clinicalTopic = detectClinicalTopic({
    detectedAct: actResult.detectedAct,
    normalizedMessage: actResult.normalizedMessage,
    state: stateBefore,
    sessionNumber
  });
  const stateAfterAct = updateClinicalState({
    state: stateBefore,
    detectedAct: actResult.detectedAct,
    clinicalTopic,
    taskDetails: actResult.taskDetails,
    studentMessage
  });
  const disclosureLevel = selectDisclosureLevel({
    state: stateAfterAct,
    clinicalTopic,
    sessionNumber
  });
  const composed = composePatientResponse({
    profile,
    detectedAct: actResult.detectedAct,
    clinicalTopic,
    state: stateAfterAct,
    disclosureLevel,
    studentMessage
  });
  const memoryPatch = buildMemoryPatch({
    state: stateAfterAct,
    selectedResponse: composed.selectedResponse,
    responseText: composed.responseText,
    detectedAct: actResult.detectedAct,
    clinicalTopic,
    disclosureLevel,
    taskDetails: actResult.taskDetails
  });

  return {
    responseText: composed.responseText,
    responseId: `clinical-sim:${caseId}:${composed.responseId}`,
    detectedAct: actResult.detectedAct,
    clinicalTopic,
    emotionalState: memoryPatch.emotionalState,
    disclosureLevel,
    memoryPatch,
    feedbackSignals: composed.feedbackSignals,
    normalizedMessage: actResult.normalizedMessage,
    confidence: actResult.confidence,
    taskDetails: actResult.taskDetails,
    selectedResponseId: composed.responseId,
    stateBefore,
    stateAfter: memoryPatch
  };
}

export function detectClinicalTopic({
  detectedAct,
  normalizedMessage = "",
  state,
  sessionNumber = 1
} = {}) {
  const text = normalizeText(normalizedMessage);

  if (detectedAct === "identidad_nombre") return "identidad";
  if (detectedAct === "saludo") return "saludo";
  if (detectedAct === "datos_basicos") {
    if (/\b(trabajas|trabajo|dedicas|ocupacion|pega)\b/.test(text)) return "trabajo";
    return "edad";
  }
  if (detectedAct === "convivencia_familia") {
    if (/\b(familia|hijos|pareja|padres|madre|padre)\b/.test(text)) return "familia";
    return "convivencia";
  }
  if (detectedAct === "motivo_consulta") return "motivo_consulta";
  if (detectedAct === "rutina") return "rutina";
  if (detectedAct === "apoyo_redes") return "apoyo_redes";
  if (detectedAct === "tarea_terapeutica" || detectedAct === "confirmar_tarea" || detectedAct === "seguimiento_tarea") return "tarea";
  if (detectedAct === "agenda_proxima_sesion") return "agenda";
  if (detectedAct === "cierre") return "cierre";
  if (detectedAct === "intervencion_confrontativa") return "defensa";
  if (detectedAct === "intervencion_empatica") return "vinculo";
  if (detectedAct === "pregunta_confusa") return state.currentTopic || "aclaracion";

  if (detectedAct === "emocion") {
    if (/\b(miedo|temor|asusta|preocupa|equivocarme|fracasar)\b/.test(text)) return "miedo";
    if (/\b(verguenza|pudor|atreves|atrever|profundizar)\b/.test(text)) return "verguenza";
    return "emocion";
  }

  if (detectedAct === "experiencia_vivida") {
    if (/\b(desde cuando|hace cuanto|cuando empezo|fecha|tiempo)\b/.test(text)) return "temporal";
    if (/\b(separacion|separaste|ex pareja|historia familiar|familia de origen|infancia)\b/.test(text)) {
      const canGoDeep = sessionNumber >= 2 && state.trustLevel >= 35 && state.studentHasShownEmpathy;
      return canGoDeep ? "experiencia_vivida" : "limite_profundidad";
    }
    if (state.currentTopic && state.currentTopic !== "aclaracion") return state.currentTopic;
    return "experiencia_vivida";
  }

  return detectedAct || "aclaracion";
}
