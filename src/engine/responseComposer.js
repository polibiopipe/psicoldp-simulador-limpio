const forbiddenClinicalTerms = [
  "ansiedad social",
  "síntomas",
  "sintomas",
  "diagnóstico",
  "diagnostico",
  "redes de apoyo",
  "regulación emocional",
  "regulacion emocional",
  "tema central",
  "motivo oculto",
  "apertura",
  "problemática",
  "problematica",
  "tensión familiar",
  "tension familiar",
  "dificultad para relacionarse presencialmente",
  "duelo migratorio",
  "autoestima afectada",
  "autoimagen afectada",
  "validación externa",
  "validacion externa",
  "red de apoyo deficiente",
  "redes de apoyo deficientes",
  "presento",
  "experimento"
];

export function composeFinalResponse({ selectedResponse, memory }) {
  let response = selectedResponse.response || memory.voice?.fallback || "No sé bien cómo responder eso.";

  response = cleanTechnicalLanguage(response);
  response = limitSentences(response, memory.opennessLevel, selectedResponse.responseType);
  response = avoidExactRepetition(response, memory.lastPatientMessage, memory.caseId);
  response = ensurePunctuation(response);

  return response;
}

function cleanTechnicalLanguage(response) {
  let cleaned = response;
  for (const term of forbiddenClinicalTerms) {
    cleaned = cleaned.replace(new RegExp(term, "gi"), "");
  }
  return cleaned
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/,\s*,/g, ",")
    .replace(/:\s*$/g, "")
    .trim();
}

function limitSentences(response, opennessLevel, responseType) {
  const isConcreteEngineResponse =
    responseType?.includes(":concreto") ||
    responseType === "apertura_progresiva:forzada" ||
    responseType?.startsWith("seguimiento_contextual:");
  const maxSentences =
    isConcreteEngineResponse || responseType === "presentacion_personal_abierta" || responseType === "motivo_de_consulta" || responseType === "ocupacion_actividad"
      ? 4
      : opennessLevel === "apertura_alta"
        ? 4
        : opennessLevel === "apertura_media"
          ? 3
          : 2;
  const sentences = response.split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.slice(0, maxSentences).join(" ");
}

function avoidExactRepetition(response, lastPatientMessage, caseId) {
  if (!lastPatientMessage || normalizeForCompare(response) !== normalizeForCompare(lastPatientMessage)) return response;

  const alternatives = {
    tomas: "Lo digo de otra forma: cuando me siento pasado a llevar, me cierro y me voy al computador.",
    valentina: "Lo diría de otra forma: incluso cuando paro, mi cabeza sigue funcionando como si debiera estar haciendo algo.",
    marcos: "Lo diría distinto: sigo cumpliendo, pero cada vez llego con menos energía.",
    elena: "Quizás lo puedo decir de otra forma: me cuesta pedir compañía sin sentir que molesto.",
    nicolas: "No sé, lo digo distinto: prefiero callarme porque siento que igual ya decidieron qué pasa.",
    camila: "Lo diría de otra forma: me cuesta decir que no, aunque por dentro ya esté agotada.",
    rodrigo: "Lo pongo distinto: intento seguir firme, pero la separación me mueve más de lo que muestro.",
    fernanda: "Quizás lo puedo decir mejor: volver al trabajo me importa, pero me asusta sentirme observada.",
    hector: "Lo diría así: dejé de trabajar, pero todavía no encuentro bien dónde poner mi energía.",
    daniela: "Lo digo de otra forma: amo a mi hijo, pero estoy cansada y me cuesta admitirlo sin culpa.",
    andres: "Lo diría distinto: entré a la universidad, pero todavía siento que estoy mirando desde afuera.",
    patricia: "Quizás suena a control, pero detrás hay miedo de perder el vínculo con mi hija.",
    miguel: "Lo diría mejor: estoy intentando avanzar acá, pero a veces extraño quién era antes de migrar.",
    sofia: "Lo digo distinto: sé que las redes me hacen compararme, pero igual vuelvo a mirar.",
    claudio: "Lo diría de otra forma: tengo estabilidad, pero siento que algo se quedó detenido."
  };

  return alternatives[caseId] || `Lo diría de otra forma: ${response.charAt(0).toLowerCase()}${response.slice(1)}`;
}

function ensurePunctuation(response) {
  if (!response) return "No sé bien cómo responder eso.";
  const clean = response.trim();
  const withInitialCapital = clean.charAt(0).toUpperCase() + clean.slice(1);
  return /[.!?…]$/.test(withInitialCapital) ? withInitialCapital : `${withInitialCapital}.`;
}

function normalizeForCompare(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
