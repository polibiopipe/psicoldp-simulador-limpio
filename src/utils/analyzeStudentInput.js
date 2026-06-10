const lexicon = {
  greeting: [
    "hola", "buenos dias", "buenos días", "buen dia", "buen día", "buenas tardes",
    "buenas noches", "como estas", "cómo estás", "como te encuentras", "cómo te encuentras"
  ],
  name: [
    "cual es tu nombre", "cuál es tu nombre", "como te llamas", "cómo te llamas",
    "me dices tu nombre", "me puedes decir tu nombre", "quien eres", "quién eres",
    "como prefieres que te diga", "cómo prefieres que te diga", "tu nombre"
  ],
  age: [
    "cuantos anos tienes", "cuántos años tienes", "cuantos años tienes", "que edad tienes",
    "qué edad tienes", "edad", "anos tienes", "años tienes"
  ],
  initialPresentation: [
    "me presento", "soy estudiante", "mi nombre es", "voy a presentarme", "quiero presentarme"
  ],
  consultationReason: [
    "por que estas aca", "por qué estás acá", "por que estas aqui", "por qué estás aquí",
    "sabes por que viniste", "sabes por qué viniste", "que te trae", "qué te trae",
    "motivo de consulta", "que te gustaria contarme hoy", "qué te gustaría contarme hoy",
    "que te preocupa", "qué te preocupa", "quien te derivo", "quién te derivó",
    "que esperas de esta entrevista", "qué esperas de esta entrevista",
    "que crees que esta pasando", "qué crees que está pasando",
    "que te gustaria que entendieramos", "qué te gustaría que entendiéramos",
    "que te gustaria que entienda", "qué te gustaría que entienda",
    "por que te derivaron", "por qué te derivaron", "por que te mandaron", "por qué te mandaron",
    "que paso para que llegaras", "qué pasó para que llegaras",
    "por que viniste", "por qué viniste"
  ],
  framing: [
    "confidencial", "objetivo", "propósito", "proposito", "encuadre", "sesión", "sesion",
    "puedes no responder", "a tu ritmo", "límites", "limites", "espacio educativo", "simulación", "simulacion"
  ],
  validation: [
    "entiendo", "tiene sentido", "suena", "imagino", "debe ser", "gracias por contar",
    "me parece importante", "comprendo", "no debe ser fácil", "no debe ser facil",
    "puede ser difícil", "puede ser dificil", "es comprensible", "no quiero juzgar",
    "no son solo", "no es solo", "lugar seguro", "más seguro", "mas seguro", "pueden cumplir una función", "pueden cumplir una funcion"
  ],
  emotion: [
    "sientes", "sentir", "emoción", "emocion", "ansiedad", "miedo", "pena", "rabia",
    "culpa", "angustia", "solo", "soledad", "vergüenza", "verguenza", "cansado", "cansada", "sobrepasado", "sobrepasada"
  ],
  family: ["familia", "mamá", "mama", "papá", "papa", "padres", "casa", "hermana", "hijos", "pareja"],
  academic: [
    "colegio", "universidad", "clases", "notas", "profesor", "compañeros", "companeros",
    "estudio", "académic", "academic", "ramos", "rendimiento", "curso"
  ],
  work: ["trabajo", "laboral", "jefatura", "empresa", "turno", "pega", "oficina", "correo", "proveedor"],
  digital: ["videojuego", "jugar", "online", "redes", "celular", "pantalla", "internet", "computador", "chat", "audífonos", "audifonos"],
  support: ["apoyo", "red", "amigos", "acompaña", "acompan", "ayuda", "confianza", "pedir ayuda", "quién te escucha", "quien te escucha"],
  judgment: [
    "flojo", "adict", "exageras", "eso es tu culpa", "es culpa tuya", "eso te hace mal",
    "estás mal", "estas mal", "tienes que cambiar", "simplemente", "no crees que deberías",
    "no crees que deberias", "está mal", "esta mal"
  ],
  rushedAdvice: [
    "te recomiendo", "lo que tienes que hacer", "deja de", "haz ejercicio", "organízate",
    "organizate", "solamente debes", "mi consejo es", "tienes que", "deberías hacer",
    "deberias hacer", "deberías", "deberias", "lo mejor sería", "lo mejor seria"
  ],
  prematureInterpretation: [
    "lo que te pasa es", "claramente", "eso significa", "en realidad tú", "en realidad tu",
    "seguro que", "el problema es que", "parece que tienes", "diagnóstico", "diagnostico"
  ],
  pressure: [
    "respóndeme", "respondeme", "responde ahora", "dime ahora", "tienes que hablar", "sé claro", "se claro", "no evadas",
    "pero contesta", "necesito que", "de una vez", "rápido", "rapido"
  ],
  empathicSummary: [
    "si entiendo bien", "lo que escucho", "parece que", "mencionaste", "dijiste",
    "retomando", "resumo", "por un lado", "por otro lado"
  ],
  closure: ["cerrar", "terminar", "finalizar", "resumen", "antes de terminar", "cómo quedas", "como quedas", "agradezco"],
  risk: [
    "hacerte dano", "hacerte daño", "danarte", "dañarte", "no querer vivir", "morir",
    "suicid", "riesgo", "urgencia", "derivar", "apoyo inmediato", "seguridad"
  ],
  followUp: [
    "me dijiste que", "dijiste que", "mencionaste", "cuando dices", "cuando dijiste",
    "a que te refieres", "a qué te refieres", "que quieres decir", "qué quieres decir",
    "cuentame mas", "cuéntame más", "en que sentido", "en qué sentido", "retomando"
  ]
};

const abruptTopicShifts = ["cambiando de tema", "dejando eso", "pasemos a otra cosa", "otra pregunta"];

const continuityTerms = [
  "proxima sesion",
  "próxima sesión",
  "siguiente sesion",
  "siguiente sesión",
  "retomar esto",
  "podemos retomar",
  "continuar profundizando",
  "continuar con calma",
  "otra sesion",
  "otra sesión",
  "volver a conversar",
  "seguir hablando"
];

const concreteLexicon = {
  school: [
    "vas al colegio", "vas a colegio", "vas a clases", "estas en el colegio", "sigues en el colegio",
    "colegio", "en que curso", "que curso"
  ],
  academic: [
    "estudias", "vas a la universidad", "estas en la universidad", "te gusta la universidad",
    "que estudias", "universidad", "carrera"
  ],
  work: [
    "trabajas", "tienes trabajo", "vas al trabajo", "te gusta tu trabajo", "te gusta la pega",
    "en que trabajas", "pega", "trabajo"
  ],
  family: [
    "tienes hijos", "tienes hermanos", "te llevas bien con tu familia", "te llevas bien con tus papas",
    "te llevas bien con tus padres", "como es tu familia"
  ],
  housing: [
    "vives con", "con quien vives", "vives solo", "vives sola", "vives con tus papas",
    "vives con tus padres", "vives con tu pareja"
  ],
  social: [
    "tienes amigos", "tienes amigas", "sales con amigos", "sales de tu casa",
    "te juntas con alguien", "hablas con tus compañeros", "hablas con tus companeros"
  ],
  habits: [
    "duermes bien", "comes bien", "descansas", "logras descansar", "estas durmiendo",
    "como duermes", "como comes", "que haces cuando"
  ],
  videogames: [
    "juegas videojuegos", "juegas mucho", "juegas harto", "usas el computador",
    "pasas jugando", "videojuegos", "computador"
  ],
  relational: [
    "tienes pareja", "estas pololeando", "estas saliendo con alguien", "tienes polola", "tienes pololo"
  ]
};

function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function includesAny(text, terms) {
  return terms.some((term) => text.includes(normalize(term)));
}

function detectsNameRequest(text) {
  return includesAny(text, lexicon.name);
}

function detectsAgeRequest(text) {
  return (
    /\b(cuantos|cuantos|que)\s+(anos|años|edad)\b/.test(text) ||
    /\b(cuantos|cuantos)\s+(anos|años)\s+tienes\b/.test(text) ||
    /\b(que|cual)\s+edad\s+tienes\b/.test(text) ||
    /\bedad\b/.test(text)
  );
}

function detectsGreeting(text) {
  const trimmed = text.trim();
  return (
    includesAny(text, lexicon.greeting) ||
    /^(hola|buenos dias|buen dia|buenas tardes|buenas noches)\b/.test(trimmed)
  );
}

function detectsConcreteQuestion(text, domain) {
  return includesAny(text, concreteLexicon[domain] || []);
}

function isOpenQuestion(text) {
  return (
    includesAny(text, [
      "cuentame", "como ha sido", "como es", "que lugar", "que pasa", "que ocurre",
      "desde cuando", "de que manera", "que te gustaria", "ayudame a entender"
    ]) || /\b(que|como|cuando|donde|cual|cuanto|por que)\b/.test(text)
  );
}

function isClosedQuestion(text) {
  return /^(te|se|has|hay|es|son|estas|sientes|tienes|puedes|quieres|crees|eres|vas)\b/.test(text.trim()) || text.includes("?");
}

export function analyzeStudentInput(input, history = []) {
  const text = normalize(input);
  const categories = {
    greeting: detectsGreeting(text),
    name: detectsNameRequest(text),
    age: detectsAgeRequest(text),
    initialPresentation: includesAny(text, lexicon.initialPresentation),
    consultationReason: includesAny(text, lexicon.consultationReason),
    schoolConcrete: detectsConcreteQuestion(text, "school"),
    academicConcrete: detectsConcreteQuestion(text, "academic"),
    workConcrete: detectsConcreteQuestion(text, "work"),
    familyConcrete: detectsConcreteQuestion(text, "family"),
    housingConcrete: detectsConcreteQuestion(text, "housing"),
    socialConcrete: detectsConcreteQuestion(text, "social"),
    habitsConcrete: detectsConcreteQuestion(text, "habits"),
    videogamesConcrete: detectsConcreteQuestion(text, "videogames"),
    relationalConcrete: detectsConcreteQuestion(text, "relational"),
    framing: includesAny(text, lexicon.framing),
    openQuestion: isOpenQuestion(text),
    closedQuestion: isClosedQuestion(text) && !isOpenQuestion(text),
    validation: includesAny(text, lexicon.validation),
    emotionalExploration: includesAny(text, lexicon.emotion),
    copingExploration: includesAny(text, ["qué haces cuando", "que haces cuando", "cómo enfrentas", "como enfrentas", "qué sueles hacer", "que sueles hacer", "cuando te sientes sobrepasado", "cuando te sientes sobrepasada"]),
    familyExploration: includesAny(text, lexicon.family),
    academicExploration: includesAny(text, lexicon.academic),
    workExploration: includesAny(text, lexicon.work),
    digitalExploration: includesAny(text, lexicon.digital),
    supportExploration: includesAny(text, lexicon.support),
    judgment: includesAny(text, lexicon.judgment),
    rushedAdvice: includesAny(text, lexicon.rushedAdvice),
    prematureInterpretation: includesAny(text, lexicon.prematureInterpretation),
    pressure: includesAny(text, lexicon.pressure),
    empathicSummary: includesAny(text, lexicon.empathicSummary),
    followUp: includesAny(text, lexicon.followUp),
    riskExploration: includesAny(text, lexicon.risk),
    closure: includesAny(text, lexicon.closure),
    continuityAgreement: includesAny(text, continuityTerms),
    abruptShift: includesAny(text, abruptTopicShifts)
  };

  categories.contextExploration =
    categories.familyExploration ||
    categories.academicExploration ||
    categories.workExploration ||
    categories.digitalExploration ||
    categories.supportExploration;
  categories.concreteQuestion =
    categories.schoolConcrete ||
    categories.academicConcrete ||
    categories.workConcrete ||
    categories.familyConcrete ||
    categories.housingConcrete ||
    categories.socialConcrete ||
    categories.habitsConcrete ||
    categories.videogamesConcrete ||
    categories.relationalConcrete;
  categories.paceRespect = categories.framing || includesAny(text, ["si quieres", "a tu ritmo", "puedes no", "no tienes que", "sin apurarte"]);
  categories.goodClosure =
    categories.closure && (categories.empathicSummary || categories.validation || includesAny(text, ["gracias", "agradezco", "cómo quedas", "como quedas"]));
  categories.prematureClosure = categories.closure && history.length < 4;

  return {
    original: input,
    text,
    categories,
    categoryList: Object.entries(categories)
      .filter(([, value]) => value)
      .map(([key]) => key)
  };
}

export function summarizeConversationMemory(history) {
  return history.reduce(
    (memory, turn) => {
      const inferredCategories = analyzeStudentInput(turn.question).categories;
      const engineCategories = turn.analysis?.categories || {};
      const categories = mergeCategories(inferredCategories, engineCategories);
      if (categories.greeting) memory.greeting += 1;
      if (categories.name) memory.name += 1;
      if (categories.age) memory.age += 1;
      if (categories.initialPresentation) memory.initialPresentation += 1;
      if (categories.consultationReason) memory.consultationReason += 1;
      if (categories.concreteQuestion) memory.concreteQuestions += 1;
      if (categories.framing) memory.framing += 1;
      if (categories.openQuestion) memory.openQuestions += 1;
      if (categories.closedQuestion) memory.closedQuestions += 1;
      if (categories.validation) memory.validation += 1;
      if (categories.emotionalExploration) memory.emotion += 1;
      if (categories.copingExploration) memory.coping += 1;
      if (categories.contextExploration) memory.contextExploration += 1;
      if (categories.familyExploration) memory.family += 1;
      if (categories.academicExploration) memory.academic += 1;
      if (categories.workExploration) memory.work += 1;
      if (categories.digitalExploration) memory.digital += 1;
      if (categories.supportExploration) memory.support += 1;
      if (categories.judgment) memory.judgment += 1;
      if (categories.rushedAdvice) memory.rushedAdvice += 1;
      if (categories.prematureInterpretation) memory.prematureInterpretation += 1;
      if (categories.pressure) memory.pressure += 1;
      if (categories.empathicSummary) memory.empathicSummary += 1;
      if (categories.followUp) memory.followUp += 1;
      if (categories.riskExploration) memory.riskExploration += 1;
      if (categories.preferencesExploration) memory.preferences += 1;
      if (categories.paceRespect) memory.paceRespect += 1;
      if (categories.closure) memory.closure += 1;
      if (categories.continuityAgreement) memory.continuityAgreement += 1;
      if (categories.goodClosure) memory.goodClosure += 1;
      if (turn.patientState?.trustLevel != null) memory.trustLevels.push(turn.patientState.trustLevel);
      return memory;
    },
    {
      framing: 0,
      greeting: 0,
      name: 0,
      age: 0,
      initialPresentation: 0,
      consultationReason: 0,
      concreteQuestions: 0,
      openQuestions: 0,
      closedQuestions: 0,
      validation: 0,
      emotion: 0,
      coping: 0,
      contextExploration: 0,
      family: 0,
      academic: 0,
      work: 0,
      digital: 0,
      support: 0,
      judgment: 0,
      rushedAdvice: 0,
      prematureInterpretation: 0,
      pressure: 0,
      empathicSummary: 0,
      followUp: 0,
      riskExploration: 0,
      preferences: 0,
      paceRespect: 0,
      closure: 0,
      continuityAgreement: 0,
      goodClosure: 0,
      trustLevels: []
    }
  );
}

function mergeCategories(...categorySets) {
  const merged = {};
  for (const set of categorySets) {
    for (const [key, value] of Object.entries(set || {})) {
      merged[key] = Boolean(merged[key] || value);
    }
  }
  return merged;
}

export function getTrustStage(trustLevel) {
  if (trustLevel <= 25) return "closed";
  if (trustLevel <= 50) return "cautious";
  if (trustLevel <= 75) return "open";
  return "reflective";
}
