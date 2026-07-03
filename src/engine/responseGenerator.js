const technicalFragments = [
  "tensión familiar y dificultad",
  "tension familiar y dificultad",
  "sobrecarga académica",
  "sobrecarga academica",
  "estrés laboral",
  "estres laboral",
  "conflictos familiares y dificultad",
  "sentirse etiquetado",
  "dificultad para relacionarse",
  "aislamiento social",
  "redes de apoyo",
  "regulación emocional",
  "regulacion emocional",
  "problemática",
  "problematica",
  "síntomas",
  "sintomas",
  "apertura",
  "mainconcern",
  "motivo oculto",
  "preocupación oculta",
  "clinicaldescription",
  "summary",
  "tags"
];

export function composeResponse({ plan, opennessLevel }) {
  const parts = [];

  if (isSafePatientPhrase(plan.directAnswer)) {
    parts.push(plan.directAnswer);
  }

  if (opennessLevel !== "apertura_baja" && isSafePatientPhrase(plan.contextualDetail)) {
    parts.push(plan.contextualDetail);
  }

  if (opennessLevel === "apertura_alta" && isSafePatientPhrase(plan.emotionalTone)) {
    parts.push(plan.emotionalTone);
  }

  if (opennessLevel === "apertura_baja" && isSafePatientPhrase(plan.contextualDetail) && shouldStillAnswerConcrete(plan.directAnswer)) {
    parts.push(plan.contextualDetail);
  }

  return cleanPatientResponse(normalizeResponse(parts.length ? parts : ["No sé bien qué decir con eso."]));
}

export function cleanPatientResponse(response) {
  const replacements = [
    [
      /No es solo una cosa: est[aá] el computador, mi casa y que en persona me cuesta saber qu[eé] hacer\./gi,
      "En mi casa todo parte por el computador, pero también me pasa que en persona no sé muy bien cómo actuar."
    ],
    [
      /est[aá] el computador, mi casa y que en persona me cuesta saber qu[eé] hacer/gi,
      "en mi casa todo parte por el computador, y en persona no sé muy bien cómo actuar"
    ],
    [
      /tensi[oó]n familiar y dificultad para relacionarse presencialmente/gi,
      "en mi casa discutimos y me cuesta estar con gente"
    ]
  ];

  return replacements
    .reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), response)
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .trim();
}

function isSafePatientPhrase(value) {
  if (!value || typeof value !== "string") return false;
  const text = value.trim();
  if (!text) return false;
  const lower = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (
    technicalFragments.some((fragment) =>
      lower.includes(
        fragment
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
      )
    )
  ) {
    return false;
  }
  if (/^[a-z_]+$/.test(text) && text.length > 12) return false;
  return true;
}

function normalizeResponse(parts) {
  return parts
    .map((part) => punctuate(capitalize(part.trim())))
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function capitalize(text) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function punctuate(text) {
  if (!text) return "";
  if (/[.!?…]$/.test(text)) return text;
  return `${text}.`;
}

function shouldStillAnswerConcrete(directAnswer) {
  return /^(si|sí|no|mas o menos|más o menos|algunos|pocos|vivo|tengo|trabajo|descanso|me llamo)/i.test(directAnswer || "");
}
