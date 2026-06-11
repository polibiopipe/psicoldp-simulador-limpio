import { caseProfiles } from "../data/caseProfiles.js";
import { normalizeText } from "../utils/textUtils.js";

const concreteIntentBlocklist = new Set([
  "nombre",
  "identidad_nombre",
  "edad",
  "convivencia",
  "convivencia_familia",
  "vivienda_residencia",
  "hermanos",
  "colegio_estudios",
  "ocupacion_actividad",
  "rutina_diaria"
]);

export function applyActivePatientInteraction({
  caseId,
  responseText,
  studentMessage,
  intentResult,
  memory,
  selectedResponse
}) {
  const profile = caseProfiles[caseId];
  const patterns = profile?.activeInteractionPatterns;
  if (!patterns || !responseText) {
    return { responseText, activeInteraction: null };
  }

  const normalizedMessage = normalizeText(studentMessage);
  const intent = intentResult?.intent || "";
  const responseType = selectedResponse?.responseType || "";

  if (shouldSkipActiveInteraction({ intent, responseType, responseText })) {
    return { responseText, activeInteraction: null };
  }

  const candidate = selectActiveInteraction({
    patterns,
    normalizedMessage,
    intent,
    memory,
    responseText
  });

  if (!candidate) {
    return { responseText, activeInteraction: null };
  }

  const combined = combineResponse(responseText, candidate.text);
  if (normalizeForCompare(combined) === normalizeForCompare(responseText)) {
    return { responseText, activeInteraction: null };
  }

  return {
    responseText: combined,
    activeInteraction: {
      type: candidate.type,
      text: candidate.text,
      applied: true
    }
  };
}

function shouldSkipActiveInteraction({ intent, responseType, responseText }) {
  if (concreteIntentBlocklist.has(intent)) return true;
  if (responseType.includes("case_profile:convivencia")) return true;
  if (responseType.includes("case_profile:hermanos")) return true;
  if (responseType.includes("case_profile:colegio_estudios")) return true;
  if (responseType.includes("case_profile:derivacion")) return true;
  if (responseType.includes("case_profile:rutina_diaria")) return true;
  if (/[¿?]\s*$/.test(responseText.trim())) return true;
  return false;
}

function selectActiveInteraction({ patterns, normalizedMessage, intent, memory, responseText }) {
  const lowOpenness = memory?.opennessLevel === "apertura_baja";
  const mediumOrHigh = memory?.opennessLevel === "apertura_media" || memory?.opennessLevel === "apertura_alta";

  if (mentionsConfidentiality(normalizedMessage)) {
    return pickPattern("asksAboutConfidentiality", patterns, memory);
  }

  if (intent === "juicio_o_critica" || intent === "consejo_apresurado" || soundsPressuring(normalizedMessage)) {
    return pickPattern("resistsPressure", patterns, memory);
  }

  if (intent === "ambiguo_real" || intent === "desconocida") {
    return pickPattern("asksForClarification", patterns, memory);
  }

  if (intent === "validacion_emocional" && !alreadyAcknowledgesValidation(responseText)) {
    return pickPattern("reactsToValidation", patterns, memory);
  }

  if (intent === "encuadre_o_consentimiento" || intent === "encuadre") {
    return lowOpenness
      ? pickPattern("interviewDiscomfort", patterns, memory)
      : pickPattern("reactsToValidation", patterns, memory);
  }

  if (shouldOccasionallyInteract(memory) && mediumOrHigh) {
    const preferredType = responseText.length > 135 ? "asksInterviewer" : "givesOpinion";
    return pickPattern(preferredType, patterns, memory) || pickPattern("asksInterviewer", patterns, memory);
  }

  return null;
}

function mentionsConfidentiality(text) {
  return /\b(confidencial|confidencialidad|queda entre|quedara entre|quedar entre|peligro|riesgo|salvo que estes en peligro|no se va a contar|no se lo voy a decir)\b/.test(text);
}

function soundsPressuring(text) {
  return /\b(por que haces eso|por que juegas tanto|deberias|tienes que|lo que tienes que hacer|eso esta mal|estas mal|flojo|exageras)\b/.test(text);
}

function alreadyAcknowledgesValidation(responseText) {
  return /\b(gracias|me ayuda|me sirve|me alivia|me deja|me hace sentido)\b/i.test(responseText);
}

function shouldOccasionallyInteract(memory) {
  const turn = (memory?.turnCount || 0) + 1;
  return turn >= 4 && turn % 5 === 0;
}

function pickPattern(type, patterns, memory) {
  const options = patterns[type] || [];
  if (!options.length) return null;
  const index = Math.max(0, memory?.turnCount || 0) % options.length;
  return { type, text: options[index] };
}

function combineResponse(responseText, addition) {
  if (!addition) return responseText;
  if (normalizeForCompare(responseText).includes(normalizeForCompare(addition))) return responseText;

  const trimmedBase = responseText.trim();
  const trimmedAddition = addition.trim();
  return `${trimmedBase} ${trimmedAddition}`;
}

function normalizeForCompare(text) {
  return normalizeText(text)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
