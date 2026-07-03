import { includesAny, normalizeText } from "../utils/textUtils.js";

const lexicon = {
  saludo: ["hola", "buenos dias", "buen dia", "buenas tardes", "buenas noches", "como estas", "como te encuentras"],
  cortesia_vinculo: [
    "un gusto conocerte",
    "un gusto estar contigo",
    "un gusto estar conectado contigo",
    "gracias por estar aqui",
    "me alegra poder conversar contigo",
    "espero que podamos conversar tranquilos",
    "quiero que este sea un espacio seguro",
    "gracias por conectarte",
    "que bueno verte",
    "me presento soy",
    "me presento",
    "vamos a conversar con calma",
    "conversemos con calma",
    "quiero que conversemos con calma",
    "conversar tranquilos"
  ],
  nombre: ["cual es tu nombre", "como te llamas", "me dices tu nombre", "quien eres", "como prefieres que te diga"],
  edad: ["cuantos anos tienes", "que edad tienes", "edad"],
  rol_entrevistador: [
    "sabes quien soy yo",
    "sabes quien soy",
    "sabes que hago aqui",
    "sabes quien te va a entrevistar",
    "sabes por que estoy hablando contigo",
    "sabes que rol tengo",
    "sabes que vamos a hacer"
  ],
  encuadre_o_consentimiento: ["confidencial", "encuadre", "a tu ritmo", "puedes no responder", "limites", "consentimiento"],
  presentacion_personal_abierta: ["cuentame de ti", "hablame de ti", "me gustaria conocerte", "quiero conocerte", "cuentame quien eres"],
  seguimiento: [
    "que te cuesta ordenar",
    "que te cuesta explicar",
    "que cosa",
    "a que te refieres",
    "como asi",
    "por que dices eso",
    "por que dices",
    "que quieres decir",
    "puedes explicarme mas",
    "cuentame mas de eso",
    "cuentame mas",
    "que es lo que no sabes decir",
    "que te pasa con eso",
    "que parte te cuesta",
    "por que te cuesta",
    "en que sentido",
    "observado en que sentido"
  ],
  seguimiento_contextual: [
    "te encierras",
    "te bloqueas",
    "que te cuesta",
    "por que el computador",
    "que pasa con tus papas",
    "que pasa con tus padres",
    "que pasa en el colegio",
    "como es eso",
    "por que dices eso",
    "cuando te pasa",
    "que haces cuando te encierras",
    "y que haces cuando te encierras"
  ],
  motivo_de_consulta: [
    "por que estas aca",
    "por que estas aqui",
    "sabes por que viniste",
    "que te trae",
    "motivo de consulta",
    "que te preocupa",
    "quien te derivo",
    "por que te derivaron",
    "por que te mandaron",
    "que paso para que llegaras",
    "por que viniste"
  ],
  pregunta_escolar_concreta: ["vas al colegio", "estas en el colegio", "sigues en el colegio", "vas a clases"],
  pregunta_academica_concreta: ["estudias", "universidad", "carrera", "que estudias", "te gusta la universidad"],
  pregunta_laboral_concreta: ["trabajas", "trabajo", "pega", "te gusta tu trabajo", "te gusta la pega", "en que trabajas"],
  pregunta_familiar_concreta: ["tienes hijos", "tienes hermanos", "te llevas bien con tu familia", "te llevas bien con tus papas"],
  pregunta_vivienda_concreta: ["vives con", "con quien vives", "vives solo", "vives sola", "vives con tus papas", "vives con tus padres"],
  pregunta_social_concreta: ["tienes amigos", "tienes amigas", "sales de tu casa", "te juntas con alguien", "hablas con tus companeros"],
  pregunta_habitos_concreta: ["duermes bien", "comes bien", "descansas", "como duermes", "como comes"],
  pregunta_videojuegos: [
    "juegas videojuegos",
    "juegas mucho",
    "juegas harto",
    "pasas jugando",
    "usas el computador",
    "que juegos usas",
    "que juegos juegas",
    "que juegas",
    "juegos usas"
  ],
  validacion_emocional: ["entiendo", "tiene sentido", "no debe ser facil", "comprendo", "suena dificil", "no quiero juzgar"],
  juicio_o_critica: ["flojo", "adict", "exageras", "eso es tu culpa", "eso te hace mal", "tienes que cambiar", "estas mal"],
  consejo_apresurado: ["deberias", "tienes que", "te recomiendo", "deja de", "lo mejor seria", "mi consejo es"],
  exploracion_emocional: ["que sientes", "como te sientes", "miedo", "pena", "rabia", "culpa", "angustia", "solo", "soledad"],
  exploracion_familiar: ["familia", "mama", "papa", "padres", "hijos", "pareja", "casa"],
  cierre_adecuado: ["antes de terminar", "para cerrar", "gracias por contar", "como quedas", "cerrar la sesion"]
};

const priority = [
  "saludo",
  "cortesia_vinculo",
  "nombre",
  "edad",
  "rol_entrevistador",
  "encuadre_o_consentimiento",
  "presentacion_personal_abierta",
  "motivo_de_consulta",
  "pregunta_escolar_concreta",
  "pregunta_familiar_concreta",
  "pregunta_vivienda_concreta",
  "pregunta_social_concreta",
  "pregunta_videojuegos",
  "pregunta_laboral_concreta",
  "pregunta_academica_concreta",
  "pregunta_habitos_concreta",
  "seguimiento_contextual",
  "validacion_emocional",
  "juicio_o_critica",
  "consejo_apresurado",
  "seguimiento",
  "exploracion_emocional",
  "exploracion_familiar",
  "cierre_adecuado"
];

function isOpenQuestion(text) {
  return /\b(que|como|cuando|donde|cual|cuanto|por que|cuentame|ayudame a entender)\b/.test(text);
}

function isClosedQuestion(text) {
  return /^(te|se|has|hay|es|son|estas|sientes|tienes|puedes|quieres|crees|eres|vas|vives|trabajas|estudias)\b/.test(text);
}

const contextualFollowUpTopics = {
  encierro: {
    last: ["encierro", "encerrarme", "encerrandome", "me encierro", "encerr"],
    ask: ["te encierras", "encierras", "que haces cuando te encierras", "cuando te encierras"]
  },
  bloqueo: {
    last: ["me bloqueo", "bloqueo", "bloquearme"],
    ask: ["te bloqueas", "bloqueas", "que te bloquea", "cuando te bloqueas"]
  },
  cuesta: {
    last: ["me cuesta", "no se que decir", "no se bien que decir"],
    ask: ["que te cuesta", "que parte te cuesta", "por que te cuesta", "que cosa"]
  },
  computador: {
    last: ["computador", "jugar", "juego", "videojuego"],
    ask: ["por que el computador", "que pasa con el computador", "computador", "jugar", "juegas"]
  },
  papas: {
    last: ["mis papas", "tus papas", "padres", "mama", "papa"],
    ask: ["que pasa con tus papas", "tus papas", "tus padres", "con tus papas", "con tus padres"]
  },
  colegio: {
    last: ["colegio", "companeros", "trabajos en grupo", "grupo"],
    ask: ["que pasa en el colegio", "colegio", "companeros", "trabajos en grupo", "grupo"]
  },
  gente: {
    last: ["estar con gente", "con gente", "en persona", "otros"],
    ask: ["estar con gente", "con gente", "en persona", "otros", "como es eso", "en que sentido"]
  },
  descanso: {
    last: ["descanso", "descansar", "parar"],
    ask: ["descanso", "descansar", "cuando descansas", "que pasa cuando descansas"]
  },
  culpa: {
    last: ["culpa", "culpable"],
    ask: ["culpa", "culpable", "por que culpa", "que culpa"]
  },
  universidad: {
    last: ["universidad", "ramos", "estudiar", "pruebas"],
    ask: ["universidad", "ramos", "estudiar", "pruebas"]
  },
  familia: {
    last: ["familia", "mi familia"],
    ask: ["familia", "tu familia", "con tu familia"]
  },
  exigencia: {
    last: ["exijo", "exigencia", "presion", "demostrar"],
    ask: ["exigencia", "presion", "por que te exiges", "demostrar"]
  },
  trabajo: {
    last: ["trabajo", "pega", "laboral"],
    ask: ["trabajo", "pega", "que pasa en el trabajo"]
  },
  cansancio: {
    last: ["cansado", "cansancio", "agotado", "energia"],
    ask: ["cansancio", "cansado", "cansas", "te cansas", "agotado", "sin energia"]
  },
  irritabilidad: {
    last: ["irritable", "irritabilidad", "molesta", "paciencia"],
    ask: ["irritable", "irritabilidad", "te irritas", "paciencia"]
  },
  casa: {
    last: ["casa", "llego a la casa"],
    ask: ["casa", "en tu casa", "llegas a la casa"]
  },
  pareja: {
    last: ["pareja"],
    ask: ["pareja", "tu pareja"]
  },
  soledad: {
    last: ["sola", "solo", "soledad"],
    ask: ["soledad", "sola", "te sientes sola"]
  },
  hijos: {
    last: ["hijos", "mis hijos"],
    ask: ["hijos", "tus hijos"]
  },
  ayuda: {
    last: ["pedir ayuda", "ayuda"],
    ask: ["ayuda", "pedir ayuda"]
  },
  carga: {
    last: ["carga", "molestar"],
    ask: ["carga", "molestar", "por que carga"]
  },
  cuidado: {
    last: ["cuidar", "sostener", "pendiente de los demas"],
    ask: ["cuidar", "sostener", "los demas"]
  },
  notas: {
    last: ["notas", "rendimiento"],
    ask: ["notas", "rendimiento"]
  },
  silencio: {
    last: ["callado", "silencio", "quedarme callado"],
    ask: ["callado", "silencio", "por que te callas"]
  },
  adultos: {
    last: ["adultos", "profesores"],
    ask: ["adultos", "profesores"]
  },
  companeros: {
    last: ["companeros", "compañeros"],
    ask: ["companeros", "compañeros"]
  }
};

function findContextualFollowUpTopic(text, conversationHistory) {
  const lastPatientMessage = normalizeText(conversationHistory.at(-1)?.answer || "");
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const briefFollowUp = wordCount <= 8 || includesAny(text, lexicon.seguimiento_contextual);

  if (!briefFollowUp) return null;

  for (const [topic, terms] of Object.entries(contextualFollowUpTopics)) {
    const asksAboutTopic = includesAny(text, terms.ask);
    const lastMentionedTopic = includesAny(lastPatientMessage, terms.last);
    if (asksAboutTopic && (lastMentionedTopic || wordCount <= 6)) return topic;
  }

  return null;
}

function buildCategories(text, conversationHistory = []) {
  const categories = Object.fromEntries(Object.keys(lexicon).map((key) => [key, includesAny(text, lexicon[key])]));
  const contextualFollowUpTopic = findContextualFollowUpTopic(text, conversationHistory);
  categories.seguimiento_contextual = Boolean(contextualFollowUpTopic);
  categories.openQuestion = isOpenQuestion(text);
  categories.closedQuestion = isClosedQuestion(text) && !categories.openQuestion;
  categories.framing = categories.encuadre_o_consentimiento;
  categories.validation = categories.validacion_emocional;
  categories.judgment = categories.juicio_o_critica;
  categories.rushedAdvice = categories.consejo_apresurado;
  categories.emotionalExploration = categories.exploracion_emocional;
  categories.familyExploration = categories.exploracion_familiar || categories.pregunta_familiar_concreta || categories.pregunta_vivienda_concreta;
  categories.academicExploration = categories.pregunta_escolar_concreta || categories.pregunta_academica_concreta;
  categories.workExploration = categories.pregunta_laboral_concreta;
  categories.digitalExploration = categories.pregunta_videojuegos;
  categories.supportExploration = categories.pregunta_social_concreta;
  categories.contextExploration =
    categories.familyExploration ||
    categories.academicExploration ||
    categories.workExploration ||
    categories.digitalExploration ||
    categories.supportExploration;
  categories.paceRespect = categories.framing || includesAny(text, ["si quieres", "sin apurarte", "a tu ritmo"]);
  categories.empathicSummary = includesAny(text, ["si entiendo bien", "lo que escucho", "parece que", "por un lado"]);
  categories.closure = categories.cierre_adecuado || includesAny(text, ["terminar", "finalizar", "cerrar"]);
  categories.goodClosure = categories.cierre_adecuado && (categories.validation || categories.empathicSummary || includesAny(text, ["gracias"]));
  categories.prematureInterpretation = includesAny(text, ["lo que te pasa es", "claramente", "eso significa", "diagnostico"]);
  categories.pressure = includesAny(text, ["respondeme", "responde ahora", "no evadas", "rapido"]);
  return { categories, contextualFollowUpTopic };
}

export function analyzeIntent(studentMessage, conversationHistory = []) {
  const normalizedText = normalizeText(studentMessage);
  const { categories, contextualFollowUpTopic } = buildCategories(normalizedText, conversationHistory);
  const detectedIntent = priority.find((intent) => categories[intent]) || (categories.openQuestion ? "respuesta_general" : "respuesta_general");

  categories.prematureClosure = categories.closure && conversationHistory.length < 4;

  return {
    originalMessage: studentMessage,
    normalizedText,
    detectedIntent,
    contextualFollowUpTopic,
    categories,
    categoryList: Object.entries(categories)
      .filter(([, value]) => value)
      .map(([key]) => key)
  };
}
