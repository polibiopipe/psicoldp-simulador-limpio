import {
  clinicalEngineCaseIds,
  clinicalSimulationProfiles
} from "../data/clinicalAvatars/clinicalSimulationProfiles.js";
import { normalizeText } from "../utils/textUtils.js";
import { resolveStudentAct } from "./studentActResolver.js";
import {
  buildClinicalState,
  buildMemoryPatch,
  selectDisclosureLevel,
  updateClinicalState
} from "./clinicalStateManager.js";
import { composePatientResponse } from "./clinicalResponseComposer.js";

export const CLINICAL_ENGINE_CASE_IDS = clinicalEngineCaseIds;

const CLINICAL_PROFILES = clinicalSimulationProfiles;

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
    sessionNumber,
    profile
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

  logClinicalTurnDebug({
    studentMessage,
    normalizedMessage: actResult.normalizedMessage,
    detectedAct: actResult.detectedAct,
    confidence: actResult.confidence,
    patientId: caseId,
    responseHandler: composed.responseHandler,
    patientDataUsed: composed.patientDataUsed,
    response: composed.responseText
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
    responseHandler: composed.responseHandler,
    patientDataUsed: composed.patientDataUsed,
    stateBefore,
    stateAfter: memoryPatch
  };
}

export function detectClinicalTopic({
  detectedAct,
  normalizedMessage = "",
  state,
  sessionNumber = 1,
  profile
} = {}) {
  const text = normalizeText(normalizedMessage);

  if (detectedAct === "identidad_nombre") return "identidad";
  if (detectedAct === "saludo") return "saludo";
  if (detectedAct === "encuadre_confidencialidad") return "encuadre_confidencialidad";
  if (detectedAct === "edad") return "edad";
  if (detectedAct === "vivienda") return "vivienda";
  if (detectedAct === "ocupacion_estudios") return "ocupacion_estudios";
  if (detectedAct === "familia_composicion") {
    if (/\b(hijos|hijo|hija|hijas|eres papa|eres mama)\b/.test(text)) return "hijos";
    return "familia_composicion";
  }
  if (detectedAct === "estado_civil_pareja") return "estado_civil_pareja";
  if (detectedAct === "red_apoyo") return "red_apoyo";
  if (detectedAct === "riesgo_autolesion") return "riesgo_autolesion";
  if (detectedAct === "consumo_sustancias") return "consumo_sustancias";
  if (detectedAct === "cierre_sesion") return "cierre_sesion";
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
  if (detectedAct === "apertura_vinculo") return "vinculo";
  if (detectedAct === "intervencion_empatica") return "vinculo";
  if (detectedAct === "pregunta_confusa") return state.currentTopic || "aclaracion";

  if (detectedAct === "emocion" || detectedAct === "sintomas_malestar") {
    if (/\b(miedo|temor|asusta|preocupa|equivocarme|fracasar)\b/.test(text)) return "miedo";
    if (/\b(verguenza|pudor|atreves|atrever|profundizar)\b/.test(text)) return "verguenza";
    return "sintomas_malestar";
  }

  if (detectedAct === "experiencia_vivida") {
    if (/\b(desde cuando|hace cuanto|cuando empezo|fecha|tiempo)\b/.test(text)) return "temporal";
    if (/\b(computador|videojuego|videojuegos|jugar|juego|online)\b/.test(text)) return "videojuegos";
    if (isSensitiveProbe(text, profile)) {
      const requiredTrust = requiredSensitiveTrust(text, profile);
      const requiredSession = requiredSensitiveSession(text, profile);
      const canGoDeep = sessionNumber >= requiredSession && state.trustLevel >= requiredTrust && state.studentHasShownEmpathy;
      return canGoDeep ? "experiencia_vivida" : "limite_profundidad";
    }
    if (state.currentTopic && state.currentTopic !== "aclaracion") return state.currentTopic;
    return "experiencia_vivida";
  }

  return detectedAct || "aclaracion";
}

function isSensitiveProbe(text, profile) {
  if (/\b(trauma|abuso|violencia|suicid|autolesion|infancia|historia familiar|familia de origen|separacion|separaste|ex pareja|infidelidad|duelo)\b/.test(text)) {
    return true;
  }

  const sensitiveItems = profile?.patientRecord?.sensitiveInfo?.items || [];
  return sensitiveItems.some((item) =>
    (item.keywords || []).some((keyword) => text.includes(normalizeText(keyword)))
  );
}

function requiredSensitiveTrust(text, profile) {
  const item = matchingSensitiveItem(text, profile);
  return item?.revealConditions?.minTrust ?? 35;
}

function requiredSensitiveSession(text, profile) {
  const item = matchingSensitiveItem(text, profile);
  return item?.revealConditions?.minSession ?? 2;
}

function matchingSensitiveItem(text, profile) {
  const sensitiveItems = profile?.patientRecord?.sensitiveInfo?.items || [];
  return sensitiveItems.find((item) =>
    (item.keywords || []).some((keyword) => text.includes(normalizeText(keyword)))
  ) || null;
}

function logClinicalTurnDebug(payload) {
  if (import.meta.env?.DEV || globalThis.__EV_DEBUG_CONVERSATION__) {
    console.log(payload);
  }
}
