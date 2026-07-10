const LEVELS = {
  initial: {
    label: "Inicial",
    description: "Hay una aproximacion inicial; falta ordenar foco, encuadre o profundidad."
  },
  developing: {
    label: "En desarrollo",
    description: "Se observan habilidades basicas, con aspectos clinicos aun por consolidar."
  },
  achieved: {
    label: "Logrado",
    description: "La entrevista muestra coherencia formativa y manejo clinico suficiente."
  },
  outstanding: {
    label: "Destacado",
    description: "Integra escucha, foco clinico y decision con claridad formativa."
  }
};

const SESSION_CRITERIA = {
  1: {
    focus: "Ingreso, alianza y exploracion inicial",
    references: [
      "Fundamentos de la intervencion clinica",
      "Fundamentos de evaluacion psicologica en adultos"
    ],
    criteria: [
      "Encuadre inicial",
      "Alianza terapeutica",
      "Motivo de consulta",
      "Escucha y validacion",
      "Riesgo si emerge"
    ],
    nextStep:
      "En la proxima sesion conviene profundizar cronologia del malestar, antecedentes relevantes y red de apoyo."
  },
  2: {
    focus: "Formulacion clinica y planificacion",
    references: [
      "Diseno y planificacion de intervenciones",
      "Fundamentos de evaluacion psicologica en adultos"
    ],
    criteria: [
      "Organizacion del motivo",
      "Hipotesis inicial",
      "Sintomatologia",
      "Factores contextuales",
      "Objetivos preliminares"
    ],
    nextStep:
      "Conviene co-construir un foco de trabajo y precisar si se requiere evaluacion complementaria."
  },
  3: {
    focus: "Intervencion y tecnica",
    references: ["Estrategias y tecnicas de intervencion clinica"],
    criteria: [
      "Coherencia enfoque-tecnica",
      "Pertinencia de intervenciones",
      "Adaptacion al caso",
      "Cuidado etico",
      "No mecanizar tecnicas"
    ],
    nextStep:
      "El siguiente paso formativo es sostener una tecnica coherente con el caso y revisar su efecto."
  },
  4: {
    focus: "Evaluacion, seguimiento, cierre o derivacion",
    references: [
      "Evaluacion y seguimiento de las intervenciones",
      "Informe psicologico"
    ],
    criteria: [
      "Monitoreo del proceso",
      "Revision de objetivos",
      "Indicadores de cambio",
      "Decision clinica",
      "Lenguaje claro y etico"
    ],
    nextStep:
      "Corresponde justificar cierre, continuidad, derivacion o seguimiento con criterios observables."
  }
};

const ACTION_NEXT_STEPS = {
  continue_session:
    "La continuidad debe orientarse a profundizar motivo, antecedentes y objetivos de la sesion siguiente.",
  close_process:
    "Si cierras el proceso, explicita criterios de cierre y resguarda indicaciones de seguimiento.",
  refer:
    "La derivacion requiere justificar el motivo, dispositivo sugerido y red de apoyo disponible.",
  risk_protocol:
    "Prioriza seguridad, supervision y evaluacion de red antes de cualquier continuidad simulada.",
  request_supervision:
    "Lleva a supervision la hipotesis, los riesgos pendientes y la decision clinica tomada.",
  apply_instruments:
    "Define que informacion falta y por que un instrumento seria pertinente y etico.",
  initial_feedback:
    "La devolucion debe ser clara, comprensible y limitada a lo que permite la entrevista.",
  follow_up:
    "El seguimiento debe incluir indicadores observables y condiciones para reconsultar.",
  beyond_simulator:
    "La continuidad extendida requiere objetivos, limites del simulador y eventual trabajo en red."
};

export function buildSessionFeedback({
  sessionNumber = 1,
  selectedCase = null,
  conversation = [],
  clinicalDecision = null,
  studentPlan = null,
  selectedApproach = null,
  report = null
} = {}) {
  const safeSessionNumber = Math.min(Math.max(Number(sessionNumber) || 1, 1), 4);
  const sessionCriteria = SESSION_CRITERIA[safeSessionNumber] || SESSION_CRITERIA[1];
  const visibleTurns = (conversation || []).filter((entry) => !entry?.isSessionPrelude);
  const strengths = compactList(buildStrengths({ report, visibleTurns }), 3);
  const improvements = compactList(buildImprovements({ report, visibleTurns, studentPlan, sessionNumber: safeSessionNumber }), 2);
  const action = clinicalDecision?.action || "";
  const level = resolveLevel(report?.generalScore, strengths.length, improvements.length, visibleTurns.length);
  const nextStep = ACTION_NEXT_STEPS[action] || sessionCriteria.nextStep;

  return {
    level,
    levelLabel: LEVELS[level].label,
    levelDescription: LEVELS[level].description,
    briefSummary: buildBriefSummary({
      caseName: selectedCase?.name || report?.caseName || "el paciente",
      turnCount: visibleTurns.length,
      sessionCriteria,
      report
    }),
    strengths,
    improvements,
    nextStep,
    formativeCriteria: sessionCriteria.criteria,
    referencesUsed: sessionCriteria.references,
    selectedApproach: selectedApproach?.primaryApproach?.label || selectedApproach?.label || ""
  };
}

function buildBriefSummary({ caseName, turnCount, sessionCriteria, report }) {
  if (!turnCount) {
    return "La sesion se cerro sin intervenciones suficientes para una devolucion extensa.";
  }

  if (report?.summary) {
    return sentenceLimit(report.summary, 2);
  }

  return `Se observa una entrevista de ${turnCount} turno(s) con ${caseName}, centrada en ${sessionCriteria.focus.toLowerCase()}.`;
}

function buildStrengths({ report, visibleTurns }) {
  const source = report?.strengths || [];
  const mapped = source.map(shortenBullet);
  const fallback = [];

  if ((report?.criteria || []).some((criterion) => criterion.id === "vinculo" && criterion.score > 0)) {
    fallback.push("Favoreciste la alianza inicial con un tono respetuoso.");
  }
  if ((report?.criteria || []).some((criterion) => criterion.id === "preguntasAbiertas" && criterion.score > 0)) {
    fallback.push("Usaste preguntas abiertas para promover exploracion.");
  }
  if ((report?.criteria || []).some((criterion) => criterion.id === "exploracionMotivo" && criterion.score > 0)) {
    fallback.push("Exploraste el motivo de consulta sin apresurar conclusiones.");
  }
  if (visibleTurns.length >= 2) {
    fallback.push("Sostuviste continuidad conversacional durante la entrevista.");
  }

  return [...mapped, ...fallback];
}

function buildImprovements({ report, visibleTurns, studentPlan, sessionNumber }) {
  const source = report?.improvements || [];
  const mapped = source.map(shortenBullet);
  const fallback = [];

  if (sessionNumber === 1) {
    fallback.push("Profundizar antecedentes iniciales antes de formular hipotesis.");
  }
  if (sessionNumber === 2) {
    fallback.push("Ordenar hipotesis y objetivos antes de definir intervenciones.");
  }
  if (sessionNumber === 3) {
    fallback.push("Vincular tecnica, enfoque y respuesta del paciente.");
  }
  if (sessionNumber === 4) {
    fallback.push("Justificar cierre, derivacion o seguimiento con indicadores observables.");
  }
  if (!studentPlan?.evaluationObjective) {
    fallback.push("Explicitar mejor el foco de trabajo de la sesion.");
  }
  if (visibleTurns.length < 3) {
    fallback.push("Ampliar exploracion antes de cerrar la entrevista.");
  }

  return [...mapped, ...fallback];
}

function resolveLevel(score, strengthsCount, improvementsCount, turnCount) {
  if (turnCount < 2) return "initial";
  if (score >= 85 && improvementsCount <= 1) return "outstanding";
  if (score >= 65 || strengthsCount >= 2) return "achieved";
  if (score >= 40 || strengthsCount >= 1) return "developing";
  return "initial";
}

function compactList(items, limit) {
  const seen = new Set();
  return items
    .map(shortenBullet)
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

function shortenBullet(value) {
  const text = sentenceLimit(String(value || "").replace(/\s+/g, " ").trim(), 1);
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= 18) return text;
  return `${words.slice(0, 18).join(" ")}.`;
}

function sentenceLimit(value, maxSentences = 2) {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const sentences = clean.match(/[^.!?]+[.!?]?/g) || [clean];
  return sentences
    .slice(0, maxSentences)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
