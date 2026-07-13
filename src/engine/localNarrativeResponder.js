import { patientFacts as allPatientFacts } from "../data/patientFacts.js";
import { getNarrativeDisclosureContext, normalizeNarrativeText } from "./narrativeDisclosure.js";

const NARRATIVE_INTENTS = new Set([
  "age",
  "reason",
  "recent_trigger",
  "family",
  "relationships",
  "routine",
  "education",
  "work",
  "impact",
  "feelings",
  "fear",
  "meaning",
  "ambivalence",
  "future",
  "history"
]);

const DEEP_INTENTS = new Set(["fear", "meaning", "ambivalence"]);

const TECHNICAL_TERMS = [
  "tema central",
  "patron relacional",
  "conflicto interno",
  "disclosure",
  "nivel developing",
  "nivel deep",
  "desencadenante reciente",
  "cronologia indica",
  "lo que esta en juego"
];

export function buildLocalNarrativeResponse({
  patientId,
  sessionNumber,
  conversationHistory,
  currentUserMessage,
  canonicalFacts,
  patientProfile,
  responsePlan
} = {}) {
  try {
    const safePatientId = normalizeId(patientId);
    if (!safePatientId) return null;

    const intent = classifyNarrativeIntent(currentUserMessage);
    if (!NARRATIVE_INTENTS.has(intent)) return null;

    const narrativeContext = getNarrativeDisclosureContext({
      patientId: safePatientId,
      sessionNumber,
      conversationHistory,
      currentUserMessage
    });
    if (!narrativeContext) return null;

    const facts = clonePlain(canonicalFacts || allPatientFacts[safePatientId] || {});
    const profile = clonePlain(patientProfile || {});
    const history = cloneHistory(conversationHistory);
    const responseText = composeNarrativeResponse({
      patientId: safePatientId,
      intent,
      message: currentUserMessage,
      sessionNumber,
      history,
      facts,
      profile,
      narrativeContext,
      responsePlan
    });

    const cleaned = cleanPatientText(responseText);
    if (!cleaned || containsTechnicalTerm(cleaned)) return null;

    return {
      responseText: cleaned,
      responseId: makeResponseId(safePatientId, intent, cleaned, history.length),
      responseType: `local_narrative:${intent}`,
      intent,
      resolvedIntent: resolveLocalIntent(intent),
      disclosureLevel: narrativeContext.disclosureLevel,
      narrative: {
        patientId: safePatientId,
        disclosureLevel: narrativeContext.disclosureLevel,
        availableFactCount: narrativeContext.availableFacts?.length || 0,
        lockedLevels: [...(narrativeContext.lockedLevels || [])]
      },
      fallbackUsed: false
    };
  } catch {
    return null;
  }
}

export function classifyNarrativeIntent(message = "") {
  const text = normalizeNarrativeText(message);
  if (!text) return "unknown";

  if (/\b(edad|cuantos anos|que edad|anos tienes|tienes 18|tienes 40|tu edad)\b/.test(text)) return "age";
  if (/\b(que te trae|que te trajo|por que estas aqui|por que estas aca|por que viniste|pediste venir|pediste la entrevista|fue idea tuya|no fue idea|motivo de consulta|que te pasa|que haces aqui|que haces aca|cuentame de ti|cuentame un poco)\b/.test(text)) return "reason";
  if (/\b(que paso|que ocurrio|que fue lo que paso|que lo gatillo|que lo provoco|que hizo que|desde cuando|cuando empezo|detono|detonante)\b/.test(text)) return "recent_trigger";
  if (/\b(con quien vives|quienes viven contigo|tienes hermanos|tienes hermana|tienes hermano|hermanos|hermana|hermano|familia|mama|papa|padres|madre|padre|hijos|hija|hijo)\b/.test(text)) return "family";
  if (/\b(pareja|relacion|vinculo|amistad|amigos|amigas|companeros|compañeros|con quien cuentas|red de apoyo|apoyo)\b/.test(text)) return "relationships";
  if (/\b(rutina|dia normal|dia a dia|como es un dia|como son tus dias|duermes|descansas|que haces durante el dia)\b/.test(text)) return "routine";
  if (/\b(colegio|universidad|estudias|estudios|cuarto medio|carrera|evaluacion|nota|notas|postulacion|clases)\b/.test(text)) return "education";
  if (/\b(trabajo|trabajas|pega|laboral|licencia|jubil|jubilacion|oportunidad|plazo|profesion|a que te dedicas)\b/.test(text)) return "work";
  if (/\b(como afecta|te afecta|consecuencia|consecuencias|que pasa cuando|que haces cuando|como impacta|que cambia)\b/.test(text)) return "impact";
  if (/\b(que sientes|como te sientes|como te has sentido|emocion|culpa|rabia|pena|verguenza|tristeza|cansado|cansada|agotado|agotada)\b/.test(text)) return "feelings";
  if (/\b(que temes|que mas temes|que es lo que mas temes|miedo|que te preocupa|que seria lo peor|que perderias|que podrias perder|temor|te asusta|miedo mas profundo)\b/.test(text)) return "fear";
  if (/\b(que significa|que sentido|por dentro|que hay detras|que necesitas|que te cuesta reconocer|por que respondes que no sabes|respondes que no sabes|conflicto interno|fondo)\b/.test(text)) return "meaning";
  if (/\b(ambivalencia|contradiccion|por un lado|una parte de ti|parte tuya|dos cosas al mismo tiempo)\b/.test(text)) return "ambivalence";
  if (/\b(futuro|despues del colegio|que haras despues|decidir|decision|elegir|eleccion|adulto|adultez|cambio|cambiar)\b/.test(text)) return "future";
  if (/\b(historia|infancia|antes|vida|familia de origen|cuando eras|desde chico|desde chica|pasado)\b/.test(text)) return "history";

  return "unknown";
}

export function resolveLocalIntent(intent) {
  const map = {
    age: "edad",
    reason: "motivo_de_consulta",
    recent_trigger: "motivo_de_consulta",
    family: "familia",
    relationships: "seguimiento_contextual",
    routine: "rutina",
    education: "ocupacion_actividad",
    work: "ocupacion_actividad",
    impact: "seguimiento_contextual",
    feelings: "exploracion_emocional",
    fear: "exploracion_emocional",
    meaning: "seguimiento_contextual",
    ambivalence: "seguimiento_contextual",
    future: "seguimiento_contextual",
    history: "seguimiento_contextual"
  };
  return map[intent] || "desconocida";
}

function composeNarrativeResponse({
  patientId,
  intent,
  message,
  sessionNumber,
  history,
  facts,
  profile,
  narrativeContext,
  responsePlan
}) {
  const disclosureLevel = narrativeContext.disclosureLevel;
  const turnSeed = history.length + String(message || "").length + String(patientId).length + (Number(sessionNumber) || 1);
  const available = narrativeContext.availableFacts || [];

  if (intent === "age") {
    const age = Number(facts.age) || narrativeContext.currentAge;
    if (!Number.isFinite(age) || age < 18) return null;
    return `Tengo ${age} anos.`;
  }

  if (intent === "family") {
    return familyResponse({ patientId, message, facts, narrativeContext, turnSeed });
  }

  if (intent === "education") {
    return pickCanonical([facts.academic, facts.school, facts.works], turnSeed);
  }

  if (intent === "work") {
    return pickCanonical([facts.works, facts.academic, facts.school], turnSeed);
  }

  if (intent === "routine") {
    return pickCanonical([facts.habits, selectAvailableFact(available, history, ["rutina", "dia", "computador"])], turnSeed);
  }

  if (intent === "reason") {
    return joinNatural(
      pickCanonical([facts.motive, selectInitialDisclosure(available, history)], turnSeed),
      pickShortFact(getFactByPrefix(available, "Motivo/desencadenante reciente"))
    );
  }

  if (intent === "recent_trigger") {
    return joinNatural(
      pickShortFact(getFactByPrefix(available, "Motivo/desencadenante reciente")),
      selectInitialDisclosure(available, history)
    );
  }

  if (DEEP_INTENTS.has(intent) && disclosureLevel !== "deep") {
    return reservedResponse({
      patientId,
      intent,
      disclosureLevel,
      available,
      history,
      turnSeed
    });
  }

  if (intent === "feelings") {
    return selectNarrativeByDepth({
      available,
      history,
      disclosureLevel,
      fallback: facts.concern,
      turnSeed
    });
  }

  if (intent === "impact" || intent === "relationships") {
    return selectNarrativeByDepth({
      available,
      history,
      disclosureLevel,
      fallback: facts.social || facts.family,
      turnSeed
    });
  }

  if (intent === "future") {
    return selectNarrativeByDepth({
      available,
      history,
      disclosureLevel,
      fallback: facts.expectation || facts.motive,
      turnSeed
    });
  }

  if (intent === "history") {
    return timelineResponse({
      timeline: narrativeContext.availableTimeline,
      fallback: facts.motive || profile.explicitReason,
      turnSeed
    });
  }

  if (intent === "fear" || intent === "meaning" || intent === "ambivalence") {
    return selectNarrativeByDepth({
      available,
      history,
      disclosureLevel,
      fallback: facts.concern || responsePlan?.directAnswer,
      turnSeed
    });
  }

  return null;
}

function familyResponse({ patientId, message, facts, narrativeContext, turnSeed }) {
  const text = normalizeNarrativeText(message);
  if (patientId === "tomas" && /\b(herman|hermana|hermano)\b/.test(text)) {
    return pickVariant([
      "Si, tengo una hermana menor, Emilia. Vivo tambien con mi mama Carolina y mi papa Rodrigo.",
      "Tengo una hermana menor, se llama Emilia. En la casa tambien vivo con mi mama Carolina y mi papa Rodrigo."
    ], turnSeed);
  }
  if (patientId === "tomas" && /\b(con quien vives|familia|mama|papa|padres)\b/.test(text)) {
    return pickVariant([
      "Vivo con mi mama Carolina, mi papa Rodrigo y mi hermana menor Emilia.",
      "En mi casa estamos mi mama Carolina, mi papa Rodrigo, mi hermana Emilia y yo."
    ], turnSeed);
  }

  const canonical = pickCanonical([facts.family, facts.social], turnSeed);
  if (canonical) return canonical;

  return selectAvailableFact(narrativeContext.availableFacts, [], ["familia", "casa", "vivo"]);
}

function reservedResponse({ patientId, intent, disclosureLevel, available, history, turnSeed }) {
  const initialLine = selectInitialDisclosure(available, history);
  const developingLine = disclosureLevel === "developing"
    ? selectAvailableFact(available, history, ["siento", "cuando", "me cuesta", "afuera", "preguntan"])
    : "";
  const anchors = [developingLine, initialLine].filter(Boolean);
  const anchor = pickVariant(anchors, turnSeed) || "Me cuesta ordenarlo todavia.";

  return pickVariant([
    `No se si tengo una respuesta tan clara todavia. ${anchor}`,
    `Me cuesta hablar de eso tan directamente. ${anchor}`,
    `Nunca lo habia pensado de esa manera. ${anchor}`,
    `Podria ser, pero no estoy seguro. ${anchor}`,
    `Hay algo de eso, aunque no sabria decirte exactamente que. ${anchor}`
  ], turnSeed + intent.length + patientId.length);
}

function selectNarrativeByDepth({ available, history, disclosureLevel, fallback, turnSeed }) {
  const preferredPrefixes = disclosureLevel === "deep"
    ? ["Tension interna disponible", "Lo que podria empeorar"]
    : disclosureLevel === "developing"
    ? ["Forma habitual de protegerse"]
    : [];

  const preferred = preferredPrefixes
    .map((prefix) => getFactByPrefix(available, prefix))
    .filter(Boolean);
  const disclosureLines = available.filter((line) =>
    line &&
    !line.startsWith("Edad actual:") &&
    !line.startsWith("Tema central:") &&
    !line.startsWith("Motivo/desencadenante reciente:")
  );
  const sourceLines = preferred.length ? preferred : [...disclosureLines, fallback];
  const fresh = sourceLines.filter(Boolean)
    .map(naturalizeFact)
    .filter((line) => line && !wasAlreadyMentioned(line, history));

  return pickVariant(fresh.length ? fresh : sourceLines.map(naturalizeFact).filter(Boolean), turnSeed);
}

function timelineResponse({ timeline, fallback, turnSeed }) {
  if (!Array.isArray(timeline) || !timeline.length) return fallback || null;
  const item = timeline[Math.min(timeline.length - 1, Math.abs(turnSeed) % timeline.length)];
  const event = cleanString(item?.event);
  const meaning = cleanString(item?.meaning);
  if (!event) return fallback || null;
  return meaning ? `${event} ${meaning}` : event;
}

function selectInitialDisclosure(available, history) {
  return selectAvailableFact(available, history, ["mis ", "estoy ", "me ", "vine ", "dicen "]);
}

function selectAvailableFact(available = [], history = [], cues = []) {
  const candidates = available
    .map(naturalizeFact)
    .filter((line) => line && !TECHNICAL_TERMS.some((term) => normalizeNarrativeText(line).includes(term)))
    .filter((line) => !cues.length || cues.some((cue) => normalizeNarrativeText(line).includes(normalizeNarrativeText(cue))));
  return candidates.find((line) => !wasAlreadyMentioned(line, history)) || candidates[0] || "";
}

function getFactByPrefix(available = [], prefix = "") {
  const line = available.find((item) => String(item || "").startsWith(`${prefix}:`));
  return line ? line.slice(prefix.length + 1).trim() : "";
}

function naturalizeFact(fact = "") {
  return String(fact || "")
    .replace(/^Edad actual:\s*/i, "")
    .replace(/^Tema central:\s*/i, "")
    .replace(/^Motivo\/desencadenante reciente:\s*/i, "")
    .replace(/^Forma habitual de protegerse o vincularse:\s*/i, "")
    .replace(/^Tension interna disponible:\s*/i, "")
    .replace(/^Lo que podria empeorar si esto continua:\s*/i, "")
    .trim();
}

function pickShortFact(text = "") {
  const clean = cleanString(text);
  if (!clean) return "";
  const sentences = clean.split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.slice(0, 2).join(" ").trim() || clean;
}

function pickCanonical(values = [], seed = 0) {
  const candidates = values.map(cleanString).filter(Boolean);
  return pickVariant(candidates, seed);
}

function pickVariant(values = [], seed = 0) {
  const candidates = values.filter(Boolean);
  if (!candidates.length) return "";
  const index = Math.abs(Number(seed) || 0) % candidates.length;
  return candidates[index];
}

function joinNatural(first, second) {
  const left = cleanString(first);
  const right = cleanString(second);
  if (!left) return right;
  if (!right) return left;
  const normalizedLeft = normalizeNarrativeText(left);
  const normalizedRight = normalizeNarrativeText(right);
  if (normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft)) return left;
  return `${left} ${right}`;
}

function wasAlreadyMentioned(fact, history = []) {
  const normalizedFact = normalizeNarrativeText(fact);
  if (!normalizedFact) return false;
  const keywords = normalizedFact
    .split(/\s+/)
    .filter((word) => word.length > 4)
    .slice(0, 7);
  if (keywords.length < 3) return false;
  const patientText = normalizeNarrativeText(
    history.map((turn) => turn?.answer || turn?.patient || turn?.responseText || "").join(" ")
  );
  const matches = keywords.filter((word) => patientText.includes(word)).length;
  return matches >= Math.min(4, keywords.length);
}

function containsTechnicalTerm(text) {
  const normalized = normalizeNarrativeText(text);
  return TECHNICAL_TERMS.some((term) => normalized.includes(term));
}

function cleanPatientText(text) {
  const clean = cleanString(text);
  if (!clean) return "";
  return clean
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .trim();
}

function makeResponseId(patientId, intent, text, turnCount) {
  return `local-narrative:${patientId}:${intent}:${turnCount}:${text}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9:]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 150);
}

function cloneHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.map((turn) => ({ ...(turn || {}) }));
}

function clonePlain(value) {
  if (!value || typeof value !== "object") return {};
  return JSON.parse(JSON.stringify(value));
}

function normalizeId(value) {
  return String(value || "").trim().toLowerCase();
}

function cleanString(value) {
  return String(value || "").trim();
}
