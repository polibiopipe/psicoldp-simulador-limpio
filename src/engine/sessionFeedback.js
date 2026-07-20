const EVIDENCE_LEVELS = {
  not_evaluable: {
    label: "No evaluable",
    description: "No hay intervenciones suficientes para una devolución formativa."
  },
  very_preliminary: {
    label: "Evidencia muy preliminar",
    description: "Hay material inicial, pero todavía no permite inferencias estables."
  },
  limited: {
    label: "Evidencia limitada",
    description: "Se pueden analizar intervenciones concretas, sin generalizar rasgos del estudiante."
  },
  sufficient: {
    label: "Evidencia suficiente",
    description: "La conversación ofrece material suficiente para una lectura formativa más completa."
  }
};

const SESSION_CRITERIA = {
  1: {
    focus: "Ingreso, alianza y exploración inicial",
    references: [
      "Fundamentos de la intervención clínica",
      "Fundamentos de evaluación psicológica en adultos"
    ],
    criteria: [
      "Encuadre inicial",
      "Alianza terapéutica",
      "Escucha y validación",
      "Motivo de consulta explícito e implícito",
      "Antecedentes iniciales",
      "Riesgo si emerge",
      "No apresurar diagnóstico"
    ],
    nextStep:
      "En la próxima sesión conviene profundizar cronología del malestar, antecedentes relevantes y red de apoyo."
  },
  2: {
    focus: "Formulación clínica y planificación",
    references: [
      "Diseño y planificación de intervenciones",
      "Fundamentos de evaluación psicológica en adultos"
    ],
    criteria: [
      "Organización del motivo de consulta",
      "Hipótesis clínica inicial",
      "Sintomatología y antecedentes relevantes",
      "Factores contextuales, socioculturales y redes",
      "Objetivos preliminares",
      "Decisión sobre evaluación complementaria si corresponde"
    ],
    nextStep:
      "Conviene co-construir un foco de trabajo y precisar si se requiere evaluación complementaria."
  },
  3: {
    focus: "Intervención y técnica",
    references: ["Estrategias y técnicas de intervención clínica"],
    criteria: [
      "Coherencia entre enfoque y técnica",
      "Pertinencia de preguntas o intervenciones",
      "Adaptación al caso",
      "Cuidado ético",
      "No aplicar técnicas de manera mecánica"
    ],
    nextStep:
      "El siguiente paso formativo es sostener una técnica coherente con el caso y revisar su efecto."
  },
  4: {
    focus: "Evaluación, seguimiento, cierre o derivación",
    references: [
      "Evaluación y seguimiento de las intervenciones",
      "Informe psicológico"
    ],
    criteria: [
      "Monitoreo del proceso y resultados",
      "Revisión de objetivos",
      "Indicadores de cambio",
      "Decisión clínica justificada",
      "Co-construcción de criterios con el consultante",
      "Lenguaje claro y ético"
    ],
    nextStep:
      "Corresponde justificar cierre, continuidad, derivación o seguimiento con criterios observables."
  }
};

const TRANSVERSAL_REFERENCES = [
  "Alianza terapéutica",
  "Formulación clínica",
  "Planificación de intervenciones",
  "Adaptación contextual",
  "Ética y seguimiento del proceso"
];

const ACTION_NEXT_STEPS = {
  continue_session:
    "La continuidad debe orientarse a profundizar motivo, antecedentes y objetivos de la sesión siguiente.",
  close_process:
    "Si cierras el proceso, explicita criterios de cierre y resguarda indicaciones de seguimiento.",
  refer:
    "La derivación requiere justificar el motivo, dispositivo sugerido y red de apoyo disponible.",
  risk_protocol:
    "Prioriza seguridad, supervisión y evaluación de red antes de cualquier continuidad simulada.",
  request_supervision:
    "Lleva a supervisión la hipótesis, los riesgos pendientes y la decisión clínica tomada.",
  apply_instruments:
    "Define qué información falta y por qué un instrumento sería pertinente y ético.",
  initial_feedback:
    "La devolución debe ser clara, comprensible y limitada a lo que permite la entrevista.",
  follow_up:
    "El seguimiento debe incluir indicadores observables y condiciones para reconsultar.",
  beyond_simulator:
    "La continuidad extendida requiere objetivos, límites del simulador y eventual trabajo en red."
};

const boundarySignals = [
  "prefiero no",
  "no quiero hablar",
  "no quiero decir",
  "prefiero no decir",
  "no me siento comodo",
  "no me siento cómoda",
  "dejemos ese tema",
  "no se si quiero contarlo",
  "no sé si quiero contarlo",
  "prefiero reservar",
  "no quiero entrar en eso",
  "me cuesta hablar de eso",
  "no quiero mencionar",
  "no quiero dar el nombre",
  "prefiero no decir el nombre",
  "no quiero decir el nombre exacto"
];

const pressureAfterBoundary = [
  "por que no",
  "por qué no",
  "dime",
  "dimelo",
  "dímelo",
  "necesito saber",
  "necesito que me digas",
  "necesito que lo digas",
  "tienes que decir",
  "no evadas",
  "responde",
  "pero por que",
  "pero por qué",
  "no puedes ocultarlo"
];

const autonomyRespectTerms = [
  "esta bien",
  "está bien",
  "no necesitas",
  "no hace falta",
  "podemos dejar",
  "si te parece",
  "sin mencionar",
  "sin decir",
  "podemos hablar de como te afecta",
  "podemos hablar de cómo te afecta",
  "a tu ritmo",
  "puedes no responder",
  "no tienes que contar"
];

const validationTerms = [
  "entiendo",
  "comprendo",
  "tiene sentido",
  "debe ser",
  "suena",
  "gracias por contar",
  "no quiero juzgar",
  "es comprensible",
  "me imagino"
];

const framingTerms = [
  "confidencial",
  "encuadre",
  "proposito",
  "propósito",
  "limites",
  "límites",
  "puedes no responder",
  "a tu ritmo"
];

const followUpTerms = [
  "cuando dices",
  "cuando mencionas",
  "a que te refieres",
  "a qué te refieres",
  "cuentame mas",
  "cuéntame más",
  "me dijiste",
  "retomando",
  "en que sentido",
  "en qué sentido"
];

const judgmentTerms = [
  "flojo",
  "exageras",
  "es tu culpa",
  "deberias simplemente",
  "deberías simplemente",
  "eso esta mal",
  "eso está mal"
];

const rushedAdviceTerms = [
  "tienes que",
  "deberias",
  "deberías",
  "lo que tienes que hacer",
  "te recomiendo",
  "mi consejo",
  "haz ejercicio",
  "deja de"
];

const prematureInterpretationTerms = [
  "lo que te pasa es",
  "claramente",
  "eso significa",
  "el problema es que",
  "parece que tienes",
  "tu diagnóstico",
  "tu diagnostico"
];

export function buildSessionFeedback({
  sessionNumber = 1,
  selectedCase = null,
  caseItem = null,
  conversation = [],
  clinicalDecision = null,
  studentPlan = null,
  preSessionPlan = null,
  selectedApproach = null,
  report = null
} = {}) {
  const safeSessionNumber = Math.min(Math.max(Number(sessionNumber) || 1, 1), 4);
  const sessionCriteria = SESSION_CRITERIA[safeSessionNumber] || SESSION_CRITERIA[1];
  const currentCase = selectedCase || caseItem || {};
  const visibleTurns = getVisibleTurns(conversation);
  const observedActions = analyzeConversationEvidence(visibleTurns);
  const evidenceLevel = resolveEvidenceLevel(visibleTurns.length);
  const strengths = compactList(buildEvidenceStrengths(observedActions, report), 3);
  const priorityImprovements = compactList(buildEvidenceImprovements(observedActions, report, visibleTurns.length), 3);
  const pendingAreas = compactList(buildPendingAreas({ observedActions, sessionCriteria, studentPlan: studentPlan || preSessionPlan }), 4);
  const nextSessionPriorities = compactList(
    buildNextSessionPriorities({
      observedActions,
      pendingAreas,
      clinicalDecision,
      sessionCriteria
    }),
    3
  );
  const action = clinicalDecision?.action || "";
  const nextStep = ACTION_NEXT_STEPS[action] || nextSessionPriorities[0] || sessionCriteria.nextStep;

  return {
    evidenceLevel,
    level: evidenceLevel.key,
    levelLabel: evidenceLevel.label,
    levelDescription: evidenceLevel.description,
    sessionSummary: buildBriefSummary({
      caseName: currentCase?.name || report?.caseName || "el paciente",
      turnCount: visibleTurns.length,
      sessionCriteria,
      evidenceLevel
    }),
    briefSummary: buildBriefSummary({
      caseName: currentCase?.name || report?.caseName || "el paciente",
      turnCount: visibleTurns.length,
      sessionCriteria,
      evidenceLevel
    }),
    observedActions,
    strengths,
    priorityImprovements,
    improvements: priorityImprovements,
    pendingAreas,
    nextSessionPriorities,
    nextStep,
    formativeCriteria: sessionCriteria.criteria,
    referencesUsed: unique([...sessionCriteria.references, ...TRANSVERSAL_REFERENCES]),
    selectedApproach: selectedApproach?.primaryApproach?.label || selectedApproach?.label || "",
    evidenceNote: buildEvidenceNote(visibleTurns.length)
  };
}

export function analyzeConversationEvidence(conversation = []) {
  const visibleTurns = getVisibleTurns(conversation);
  return visibleTurns.map((turn, index) => {
    const question = String(turn.question || "").trim();
    const previousPatientResponse = String(visibleTurns[index - 1]?.answer || "").trim();
    const patientAnswer = String(turn.answer || "").trim();
    const normalizedQuestion = normalizeText(question);
    const previousBoundarySignal = hasPatientBoundarySignal(previousPatientResponse);
    const boundaryPressure = isBoundaryPressure(question, previousPatientResponse);
    const autonomyRespect = previousBoundarySignal && hasAutonomyRespect(question);
    const formalOpenQuestion = isFormalOpenQuestion(question);
    const validation = includesAny(normalizedQuestion, validationTerms);
    const followUp = includesAny(normalizedQuestion, followUpTerms);
    const framing = includesAny(normalizedQuestion, framingTerms);
    const judgment = includesAny(normalizedQuestion, judgmentTerms);
    const rushedAdvice = includesAny(normalizedQuestion, rushedAdviceTerms);
    const prematureInterpretation = includesAny(normalizedQuestion, prematureInterpretationTerms);
    const closure = /\b(cerrar|terminar|resum|proxima sesion|próxima sesión|continuar|seguimiento)\b/.test(normalizedQuestion);
    const risk = /\b(riesgo|suicid|hacerte dano|hacerte daño|morir|seguridad)\b/.test(normalizedQuestion);
    const facilitativeOpenQuestion =
      formalOpenQuestion && !boundaryPressure && !judgment && !rushedAdvice && !prematureInterpretation;
    const recognizedSkill = resolveRecognizedSkill({
      boundaryPressure,
      autonomyRespect,
      validation,
      followUp,
      framing,
      facilitativeOpenQuestion,
      risk,
      closure,
      rushedAdvice,
      prematureInterpretation,
      judgment
    });

    return {
      index: index + 1,
      quote: question,
      previousPatientResponse,
      patientAnswer,
      formalOpenQuestion,
      facilitativeOpenQuestion,
      boundarySignalBefore: previousBoundarySignal,
      boundaryPressure,
      pressure: boundaryPressure || includesAny(normalizedQuestion, pressureAfterBoundary),
      autonomyRespect: autonomyRespect || (!previousBoundarySignal && includesAny(normalizedQuestion, autonomyRespectTerms)),
      validation,
      followUp,
      framing,
      rushedAdvice,
      prematureInterpretation,
      judgment,
      closure,
      risk,
      recognizedSkill,
      formativeReading: buildFormativeReading({
        boundaryPressure,
        autonomyRespect,
        validation,
        followUp,
        facilitativeOpenQuestion,
        rushedAdvice,
        prematureInterpretation,
        judgment,
        closure
      }),
      possibleEffect: buildPossibleEffect({
        boundaryPressure,
        autonomyRespect,
        validation,
        followUp,
        facilitativeOpenQuestion,
        patientAnswer
      }),
      suggestion: buildSuggestion({
        boundaryPressure,
        autonomyRespect,
        validation,
        followUp,
        facilitativeOpenQuestion,
        rushedAdvice,
        prematureInterpretation,
        judgment,
        closure
      }),
      reformulation: buildReformulation({
        boundaryPressure,
        autonomyRespect,
        validation,
        followUp,
        facilitativeOpenQuestion,
        rushedAdvice,
        prematureInterpretation,
        judgment,
        question
      }),
      criterion: resolveCriterion({
        boundaryPressure,
        autonomyRespect,
        validation,
        followUp,
        framing,
        facilitativeOpenQuestion,
        risk,
        closure
      })
    };
  });
}

export function hasPatientBoundarySignal(text = "") {
  const normalized = normalizeText(text);
  return includesAny(normalized, boundarySignals);
}

export function hasAutonomyRespect(text = "") {
  const normalized = normalizeText(text);
  return includesAny(normalized, autonomyRespectTerms);
}

export function isBoundaryPressure(question = "", previousPatientResponse = "") {
  if (!hasPatientBoundarySignal(previousPatientResponse)) return false;
  const normalized = normalizeText(question);
  if (hasAutonomyRespect(question)) return false;
  return includesAny(normalized, pressureAfterBoundary) || /por que no .*decir/.test(normalized);
}

export function isFormalOpenQuestion(question = "") {
  const normalized = normalizeText(question).trim();
  return (
    /\b(que|como|cuando|donde|cual|cuanto|por que|por qué)\b/.test(normalized) ||
    /\b(cuentame|ayudame a entender|me gustaria entender)\b/.test(normalized)
  );
}

function resolveEvidenceLevel(turnCount) {
  if (turnCount <= 0) return { key: "not_evaluable", ...EVIDENCE_LEVELS.not_evaluable };
  if (turnCount <= 3) return { key: "very_preliminary", ...EVIDENCE_LEVELS.very_preliminary };
  if (turnCount <= 7) return { key: "limited", ...EVIDENCE_LEVELS.limited };
  return { key: "sufficient", ...EVIDENCE_LEVELS.sufficient };
}

function buildBriefSummary({ caseName, turnCount, sessionCriteria, evidenceLevel }) {
  if (!turnCount) {
    return "La sesión se cerró sin intervenciones suficientes para una devolución extensa.";
  }

  if (turnCount <= 3) {
    return `Se registraron ${turnCount} intervención(es) con ${caseName}. La devolución se limita a conductas observables y no infiere rasgos del estudiante.`;
  }

  return `Se observa una entrevista de ${turnCount} turno(s) con ${caseName}, centrada en ${sessionCriteria.focus.toLowerCase()}. El nivel de evidencia es ${evidenceLevel.label.toLowerCase()}.`;
}

function buildEvidenceStrengths(observedActions, report) {
  const strengths = [];

  const autonomy = observedActions.find((item) => item.autonomyRespect);
  if (autonomy) {
    strengths.push(`En esta intervención respetaste autonomía: "${truncateQuote(autonomy.quote)}".`);
  }

  const validation = observedActions.find((item) => item.validation);
  if (validation) {
    strengths.push(`Validaste o legitimaste la experiencia antes de avanzar: "${truncateQuote(validation.quote)}".`);
  }

  const followUp = observedActions.find((item) => item.followUp);
  if (followUp) {
    strengths.push(`Retomaste material del paciente y favoreciste continuidad conversacional.`);
  }

  const facilitative = observedActions.find((item) => item.facilitativeOpenQuestion);
  if (facilitative) {
    strengths.push(`Usaste una pregunta abierta facilitadora, no solo formalmente abierta.`);
  }

  const framing = observedActions.find((item) => item.framing);
  if (framing) strengths.push("Ofreciste encuadre o cuidado del ritmo de la entrevista.");

  if (!strengths.length && observedActions.length > 0) {
    strengths.push("Se observa material inicial para analizar foco, tono y pertinencia de las preguntas.");
  }

  return [...strengths, ...(report?.strengths || []).map(shortenBullet)];
}

function buildEvidenceImprovements(observedActions, report, turnCount) {
  const improvements = [];
  const boundaryPressure = observedActions.find((item) => item.boundaryPressure);
  if (boundaryPressure) {
    improvements.push(
      `La intervención "${truncateQuote(boundaryPressure.quote)}" presionó un límite explicitado por el paciente; conviene validar autonomía antes de seguir.`
    );
  }

  const rushedAdvice = observedActions.find((item) => item.rushedAdvice);
  if (rushedAdvice) {
    improvements.push(`Evita pasar a consejo o indicación antes de comprender mejor el problema.`);
  }

  const premature = observedActions.find((item) => item.prematureInterpretation);
  if (premature) {
    improvements.push(`Formula hipótesis como preguntas tentativas, no como conclusiones cerradas.`);
  }

  const judgment = observedActions.find((item) => item.judgment);
  if (judgment) {
    improvements.push("Cuida palabras que puedan sonar moralizantes o evaluativas para el paciente.");
  }

  if (!observedActions.some((item) => item.validation) && turnCount >= 2) {
    improvements.push("Sería útil reflejar una emoción o dificultad antes de abrir nuevas áreas.");
  }

  if (!observedActions.some((item) => item.followUp) && turnCount >= 4) {
    improvements.push("Incluye seguimiento sobre palabras del paciente para sostener una conversación más humana.");
  }

  return [...improvements, ...(report?.improvements || []).map(shortenBullet)];
}

function buildPendingAreas({ observedActions, sessionCriteria, studentPlan }) {
  const pending = [];
  if (!observedActions.some((item) => item.framing)) pending.push("Encuadre inicial explícito.");
  if (!observedActions.some((item) => item.validation || item.autonomyRespect)) pending.push("Validación y respeto del ritmo del paciente.");
  if (!observedActions.some((item) => item.facilitativeOpenQuestion || item.followUp)) pending.push("Preguntas facilitadoras con seguimiento.");
  if (!observedActions.some((item) => item.risk) && sessionCriteria.criteria.some((item) => /riesgo/i.test(item))) {
    pending.push("Exploración de riesgo si aparece material clínico que lo justifique.");
  }
  if (!studentPlan?.evaluationObjective && !studentPlan?.objective) {
    pending.push("Foco de trabajo para la sesión siguiente.");
  }
  return pending;
}

function buildNextSessionPriorities({ observedActions, pendingAreas, clinicalDecision, sessionCriteria }) {
  const priorities = [];
  if (observedActions.some((item) => item.boundaryPressure)) {
    priorities.push("Reparar el vínculo respetando el límite explicitado y retomando el tema sin exigir detalles.");
  }
  if (clinicalDecision?.action === "refer" || clinicalDecision?.action === "risk_protocol") {
    priorities.push("Justificar la decisión clínica con red de apoyo, seguridad y límites del simulador.");
  }
  priorities.push(...pendingAreas.map((item) => item.replace(/\.$/, "")));
  priorities.push(sessionCriteria.nextStep);
  return priorities;
}

function resolveRecognizedSkill(flags) {
  if (flags.boundaryPressure) return "Presión sobre un límite del paciente";
  if (flags.autonomyRespect) return "Respeto de autonomía y consentimiento";
  if (flags.validation) return "Validación emocional";
  if (flags.followUp) return "Seguimiento clínico";
  if (flags.framing) return "Encuadre";
  if (flags.facilitativeOpenQuestion) return "Pregunta abierta facilitadora";
  if (flags.risk) return "Exploración de riesgo";
  if (flags.closure) return "Cierre o continuidad";
  if (flags.rushedAdvice) return "Consejo prematuro";
  if (flags.prematureInterpretation) return "Hipótesis cerrada prematura";
  if (flags.judgment) return "Lenguaje potencialmente juzgador";
  return "Intervención exploratoria";
}

function buildFormativeReading(flags) {
  if (flags.boundaryPressure) {
    return "Aunque la frase tiene forma de pregunta abierta, en contexto presiona un límite y puede reducir seguridad clínica.";
  }
  if (flags.autonomyRespect) {
    return "Reconoce el derecho del paciente a reservar información y conserva la posibilidad de seguir explorando efectos clínicos.";
  }
  if (flags.validation && flags.followUp) return "Combina reconocimiento emocional con exploración pertinente.";
  if (flags.validation) return "La validación puede sostener alianza antes de profundizar.";
  if (flags.facilitativeOpenQuestion) return "La pregunta abre relato sin imponer dirección cerrada.";
  if (flags.rushedAdvice) return "El consejo prematuro puede desplazar comprensión por solución rápida.";
  if (flags.prematureInterpretation) return "La hipótesis aparece como conclusión antes de suficiente evidencia.";
  if (flags.judgment) return "El lenguaje puede sentirse evaluativo y afectar la alianza.";
  if (flags.closure) return "Aporta a ordenar continuidad o cierre si se vincula con síntesis clínica.";
  return "Intervención observable; conviene precisar intención clínica y efecto esperado.";
}

function buildPossibleEffect(flags) {
  if (flags.boundaryPressure) return "Pudo aumentar cautela, defensa o sensación de exigencia.";
  if (flags.autonomyRespect) return "Pudo preservar seguridad, autonomía y disposición a continuar.";
  if (flags.validation && flags.followUp) return "Pudo favorecer elaboración y continuidad narrativa.";
  if (flags.validation) return "Pudo disminuir sensación de juicio y sostener vínculo.";
  if (flags.facilitativeOpenQuestion) return "Pudo ampliar el relato sin cerrar prematuramente.";
  return "El efecto depende de cómo el paciente recibió la intervención y de la continuidad posterior.";
}

function buildSuggestion(flags) {
  if (flags.boundaryPressure) return "Valida el límite, ofrece permiso para no responder y explora el significado sin exigir datos.";
  if (flags.autonomyRespect) return "Puedes continuar desde el impacto emocional o contextual sin pedir el dato reservado.";
  if (flags.rushedAdvice) return "Vuelve a exploración y pregunta qué ha intentado o qué le hace sentido.";
  if (flags.prematureInterpretation) return "Transforma la hipótesis en una pregunta tentativa y verificable.";
  if (flags.judgment) return "Reformula con lenguaje descriptivo y no moralizante.";
  if (!flags.validation) return "Agrega una frase breve de validación antes de pasar a otro foco.";
  return "Mantén seguimiento y verifica si la pregunta ayudó al paciente a elaborar.";
}

function buildReformulation(flags) {
  if (flags.boundaryPressure) {
    return "Está bien, no necesitas decir el nombre. ¿Qué aspectos de esa carrera hacen que sientas que absorbe tanto de ti?";
  }
  if (flags.autonomyRespect) {
    return "Podemos dejar ese dato fuera y hablar de cómo te afecta, si te parece.";
  }
  if (flags.rushedAdvice) {
    return "Antes de pensar en soluciones, ¿qué has intentado y qué efecto ha tenido para ti?";
  }
  if (flags.prematureInterpretation) {
    return "Me pregunto si esto podría relacionarse con lo que vienes sintiendo; ¿te hace sentido o lo ves distinto?";
  }
  if (flags.judgment) {
    return "Quiero entender qué función cumple eso para ti, sin juzgarlo de entrada.";
  }
  if (!flags.validation) {
    return "Tiene sentido que sea difícil hablar de esto. ¿Qué parte te pesa más ahora?";
  }
  return "Si te parece, podemos seguir por esa línea y mirar qué se repite en tu experiencia.";
}

function resolveCriterion(flags) {
  if (flags.boundaryPressure || flags.autonomyRespect) return "Ética, autonomía y alianza terapéutica";
  if (flags.validation) return "Alianza terapéutica y escucha activa";
  if (flags.followUp || flags.facilitativeOpenQuestion) return "Pertinencia de preguntas y exploración clínica";
  if (flags.framing) return "Encuadre inicial";
  if (flags.risk) return "Evaluación de riesgo";
  if (flags.closure) return "Cierre, continuidad y planificación";
  return "Formulación clínica en desarrollo";
}

function buildEvidenceNote(turnCount) {
  if (turnCount === 0) return "Sin evidencia conversacional.";
  if (turnCount <= 3) return "La lectura es preliminar: describe intervenciones, no rasgos estables del estudiante.";
  if (turnCount <= 7) return "La lectura permite orientar mejoras concretas, sin cerrar una evaluación global.";
  return "La lectura integra patrones observables y momentos específicos de la entrevista.";
}

function getVisibleTurns(conversation = []) {
  return (conversation || []).filter(
    (entry) =>
      !entry?.isSessionPrelude &&
      !entry?.isPendingResponse &&
      String(entry?.question || "").trim()
  );
}

function normalizeText(text = "") {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(normalizedText, terms = []) {
  return terms.some((term) => normalizedText.includes(normalizeText(term)));
}

function compactList(items, limit) {
  const seen = new Set();
  return items
    .map(shortenBullet)
    .filter(Boolean)
    .filter((item) => {
      const key = normalizeText(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

function shortenBullet(value) {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length <= 22) return clean;
  return `${words.slice(0, 22).join(" ")}.`;
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

function truncateQuote(value, max = 90) {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}…`;
}

function unique(items = []) {
  return Array.from(new Set(items.filter(Boolean)));
}
