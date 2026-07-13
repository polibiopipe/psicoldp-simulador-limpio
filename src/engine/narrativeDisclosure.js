import { getAvatarNarrative } from "../data/avatarNarratives.js";

const LEVEL_ORDER = ["initial", "developing", "deep"];
const TRIVIAL_MESSAGES = new Set([
  "hola",
  "buenas",
  "ok",
  "okay",
  "bien",
  "dale",
  "ya",
  "si",
  "no",
  "mmm",
  "mm",
  "continua",
  "continue",
  "gracias"
]);

const CONTEXTUAL_PATTERNS = [
  /\bque paso\b/,
  /\bcuando comenzo\b/,
  /\bdesde cuando\b/,
  /\bcon quien\b/,
  /\bquienes\b/,
  /\bcasa\b/,
  /\bfamilia\b/,
  /\bejemplo\b/,
  /\bfrecuencia\b/,
  /\bque tan seguido\b/,
  /\bcada cuanto\b/,
  /\brutina\b/,
  /\bcomo afecta\b/,
  /\bconsecuencias?\b/,
  /\bque haces cuando\b/,
  /\bque ocurre cuando\b/,
  /\bcomo es un dia\b/,
  /\bque pasa despues\b/,
  /\bque paso antes\b/
];

const DEEP_PATTERNS = [
  /\bque significa\b/,
  /\bque temes\b/,
  /\bque te preocupa\b/,
  /\bque seria lo peor\b/,
  /\bque necesitas\b/,
  /\bque sientes\b/,
  /\bque pasa por dentro\b/,
  /\bque perderias\b/,
  /\bque te impide\b/,
  /\buna parte de ti\b/,
  /\bambivalencia\b/,
  /\bcontradiccion\b/,
  /\bmiedo mas profundo\b/,
  /\bpor dentro\b/,
  /\bque hay detras\b/,
  /\bque te cuesta reconocer\b/
];

const CONTINUITY_PATTERNS = [
  /\bla vez pasada\b/,
  /\bsesion anterior\b/,
  /\blo que hablamos\b/,
  /\blo que conversamos\b/,
  /\bretomar\b/,
  /\bseguimos\b/,
  /\bquedamos\b/
];

const TECHNICAL_PATTERNS = [
  /^\[object object\]$/,
  /^(undefined|null|nan)$/i,
  /^(debug|test|error|stack|console)\b/i,
  /^sesion \d+$/i
];

export function getNarrativeDisclosureContext({
  patientId,
  sessionNumber,
  conversationHistory,
  currentUserMessage
} = {}) {
  const normalizedPatientId = normalizeId(patientId);
  if (!normalizedPatientId) return null;

  const narrative = getAvatarNarrative(normalizedPatientId);
  if (!isUsableNarrative(narrative)) return null;

  const messages = [
    ...extractStudentMessages(conversationHistory),
    extractMessageText(currentUserMessage)
  ].filter(Boolean);

  const analysis = analyzeMessages(messages);
  const safeSessionNumber = toSafeSessionNumber(sessionNumber);
  const disclosureLevel = selectDisclosureLevel({
    sessionNumber: safeSessionNumber,
    substantiveCount: analysis.substantiveCount,
    contextualSignalCount: analysis.contextualSignalCount,
    deepSignalCount: analysis.deepSignalCount,
    continuitySignalCount: analysis.continuitySignalCount,
    historyCount: messages.length
  });

  return buildDisclosureContext({
    patientId: normalizedPatientId,
    narrative,
    disclosureLevel
  });
}

export function normalizeNarrativeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[¿?¡!.,;:()[\]{}"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function analyzeMessages(messages = []) {
  const normalizedMessages = Array.isArray(messages)
    ? messages.map((message) => normalizeNarrativeText(message)).filter(Boolean)
    : [];

  return normalizedMessages.reduce(
    (summary, text) => {
      const contextual = hasPattern(text, CONTEXTUAL_PATTERNS);
      const deep = hasPattern(text, DEEP_PATTERNS);
      const continuity = hasPattern(text, CONTINUITY_PATTERNS);

      if (isSubstantiveMessage(text, { contextual, deep, continuity })) {
        summary.substantiveCount += 1;
      }
      if (contextual) summary.contextualSignalCount += 1;
      if (deep) summary.deepSignalCount += 1;
      if (continuity) summary.continuitySignalCount += 1;
      return summary;
    },
    {
      substantiveCount: 0,
      contextualSignalCount: 0,
      deepSignalCount: 0,
      continuitySignalCount: 0
    }
  );
}

function selectDisclosureLevel({
  sessionNumber,
  substantiveCount,
  contextualSignalCount,
  deepSignalCount,
  continuitySignalCount,
  historyCount
}) {
  // Heuristica conservadora: el nivel depende de continuidad, numero de sesion
  // y exploracion sustantiva. Una pregunta intensa aislada nunca abre el nucleo.
  if (sessionNumber >= 4) return "deep";
  if (sessionNumber >= 3 && (historyCount > 0 || continuitySignalCount > 0 || substantiveCount > 0)) {
    return "deep";
  }
  if (
    sessionNumber >= 2 &&
    substantiveCount >= 5 &&
    contextualSignalCount >= 2 &&
    deepSignalCount >= 2
  ) {
    return "deep";
  }
  if (
    sessionNumber <= 1 &&
    substantiveCount >= 8 &&
    contextualSignalCount >= 2 &&
    deepSignalCount >= 2
  ) {
    return "deep";
  }
  if (sessionNumber >= 2) return "developing";
  if (substantiveCount >= 4 && contextualSignalCount >= 2) return "developing";
  if (substantiveCount >= 5 && (contextualSignalCount >= 1 || continuitySignalCount >= 1)) {
    return "developing";
  }
  return "initial";
}

function buildDisclosureContext({ patientId, narrative, disclosureLevel }) {
  const levelIndex = LEVEL_ORDER.indexOf(disclosureLevel);
  const safeLevelIndex = levelIndex >= 0 ? levelIndex : 0;
  const currentAge = Number(narrative.currentAge);

  const availableFacts = [
    `Edad actual: ${currentAge}`,
    `Tema central: ${cleanString(narrative.centralTheme)}`,
    `Motivo/desencadenante reciente: ${cleanString(narrative.recentTrigger)}`,
    ...cloneStringArray(narrative.disclosure.initial)
  ];

  if (safeLevelIndex >= 1) {
    availableFacts.push(
      `Forma habitual de protegerse o vincularse: ${cleanString(narrative.relationalPattern)}`,
      ...cloneStringArray(narrative.disclosure.developing)
    );
  }

  if (safeLevelIndex >= 2) {
    availableFacts.push(
      `Tension interna disponible: ${cleanString(narrative.internalConflict)}`,
      `Lo que podria empeorar si esto continua: ${cleanString(narrative.stakes)}`,
      ...cloneStringArray(narrative.disclosure.deep)
    );
  }

  return {
    patientId,
    currentAge,
    disclosureLevel,
    internalGuidance: {
      centralTheme: cleanString(narrative.centralTheme),
      responseStyle: [
        "Hablar siempre en primera persona y con lenguaje cotidiano.",
        "No recitar la ficha ni ordenar la respuesta como informe.",
        "Revelar como maximo uno o dos antecedentes nuevos por respuesta.",
        "Responder solo a lo que el estudiante explora o contiene.",
        "Reservarse o dudar si la pregunta llega demasiado pronto."
      ],
      boundaries: cloneStringArray(narrative.narrativeBoundaries)
    },
    availableFacts,
    availableTimeline: cloneTimeline(selectTimeline(narrative.timeline, disclosureLevel)),
    lockedLevels: LEVEL_ORDER.slice(safeLevelIndex + 1)
  };
}

function selectTimeline(timeline = [], disclosureLevel) {
  if (!Array.isArray(timeline)) return [];
  if (disclosureLevel === "deep") return timeline;
  if (disclosureLevel === "developing") return timeline.slice(0, Math.min(3, timeline.length));
  return timeline.slice(0, Math.min(1, timeline.length));
}

function extractStudentMessages(conversationHistory) {
  if (!Array.isArray(conversationHistory)) return [];
  return conversationHistory
    .filter((entry) => entry && !entry.isSessionPrelude)
    .map((entry) => {
      if (typeof entry === "string") return extractMessageText(entry);
      return extractMessageText(
        entry.question ||
          entry.student ||
          entry.studentMessage ||
          entry.message ||
          entry.text ||
          entry.content
      );
    })
    .filter(Boolean);
}

function isSubstantiveMessage(text, signals) {
  if (!text || TRIVIAL_MESSAGES.has(text)) return false;
  if (TECHNICAL_PATTERNS.some((pattern) => pattern.test(text))) return false;
  if (signals.contextual || signals.deep || signals.continuity) return true;

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 4) return false;

  return /\b(que|como|cuando|donde|quien|cual|por que|cuentame|explicame|podrias|puedes|me gustaria|quisiera|entiendo)\b/.test(text);
}

function hasPattern(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function isUsableNarrative(narrative) {
  return Boolean(
    narrative &&
      Number.isFinite(Number(narrative.currentAge)) &&
      narrative.disclosure &&
      Array.isArray(narrative.disclosure.initial) &&
      Array.isArray(narrative.disclosure.developing) &&
      Array.isArray(narrative.disclosure.deep)
  );
}

function extractMessageText(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeId(value) {
  return String(value || "").trim().toLowerCase();
}

function toSafeSessionNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 1) return 1;
  return Math.min(Math.floor(number), 4);
}

function cleanString(value) {
  return String(value || "").trim();
}

function cloneStringArray(value) {
  return Array.isArray(value)
    ? value.map((item) => cleanString(item)).filter(Boolean)
    : [];
}

function cloneTimeline(value) {
  return Array.isArray(value)
    ? value.map((item) => ({
        period: cleanString(item?.period),
        event: cleanString(item?.event),
        meaning: cleanString(item?.meaning)
      })).filter((item) => item.period || item.event || item.meaning)
    : [];
}
