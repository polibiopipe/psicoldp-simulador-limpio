import { normalizeText } from "../utils/textUtils.js";

const intentLexicon = {
  saludo: ["hola", "buenos dias", "buen dia", "buenas tardes", "buenas noches", "como estas", "como te encuentras"],
  presentacion_estudiante: [
    "antes quisiera presentarme",
    "antes de comenzar quisiera presentarme",
    "quiero presentarme primero",
    "me presento",
    "mi nombre es",
    "soy el estudiante",
    "soy quien va a conversar contigo",
    "soy quien va a entrevistarte",
    "voy a acompanarte",
    "voy a acompañarte",
    "quisiera presentarme"
  ],
  cortesia_vinculo: [
    "un gusto conocerte",
    "un gusto estar contigo",
    "un gusto estar conectado contigo",
    "gracias por estar aqui",
    "gracias por conectarte",
    "me alegra poder conversar contigo",
    "espero que podamos conversar tranquilos",
    "quiero que este sea un espacio seguro",
    "vamos a conversar con calma"
  ],
  nombre: ["cual es tu nombre", "como te llamas", "me dices tu nombre", "quien eres", "como prefieres que te diga"],
  edad: ["cuantos anos tienes", "que edad tienes", "edad"],
  presentacion_personal_abierta: [
    "cuentame de ti",
    "hablame de ti",
    "quiero conocerte",
    "quiero conocerte un poco",
    "partamos por ti",
    "me gustaria saber de ti",
    "cuentame quien eres",
    "que me puedes contar de ti",
    "comencemos conociendonos"
  ],
  rol_entrevistador: [
    "sabes quien soy",
    "sabes quien soy yo",
    "sabes que hago aqui",
    "sabes quien te va a entrevistar",
    "sabes por que estoy hablando contigo",
    "sabes que rol tengo",
    "sabes que vamos a hacer"
  ],
  encuadre_o_consentimiento: [
    "quiero explicarte",
    "antes de comenzar quisiera explicarte",
    "este es un espacio",
    "espacio de entrevista simulada",
    "entrevista simulada",
    "podemos conversar con calma",
    "vamos a conversar con calma",
    "puedes tomarte tu tiempo",
    "si algo te incomoda",
    "objetivo de esta entrevista",
    "lo que conversemos",
    "fines educativos"
  ],
  motivo_de_consulta: [
    "sabes por que estas aqui",
    "sabes por que estas aca",
    "por que estas aqui",
    "por que estas aca",
    "por que viniste",
    "sabes por que viniste",
    "motivo",
    "motivo de consulta",
    "que te trae",
    "por que te derivaron",
    "por que te mandaron",
    "que sucede",
    "que te sucede",
    "que esta pasando",
    "que te esta pasando",
    "quien te derivo",
    "que paso para que llegaras"
  ],
  vivienda_residencia: [
    "donde vives",
    "con quien vives",
    "vives solo",
    "vives sola",
    "vives con alguien",
    "vives con tus padres",
    "vives con tus papas",
    "vives con tu familia",
    "vives con mi familia",
    "vives con tu pareja",
    "en que lugar vives",
    "con quien compartes casa"
  ],
  ocupacion_actividad: [
    "a que te dedicas",
    "a que te dedicas actualmente",
    "en que trabajas",
    "que haces actualmente",
    "cual es tu trabajo",
    "cual es tu ocupacion",
    "trabajas",
    "estudias o trabajas",
    "que haces durante el dia"
  ],
  preocupacion_principal: [
    "que te preocupa",
    "que te preocupa de esto",
    "que te preocupa mas",
    "que es lo que mas te preocupa",
    "cual es tu preocupacion",
    "cual es tu principal preocupacion",
    "que es lo que mas te inquieta",
    "que te inquieta",
    "que te da miedo de esto",
    "que es lo que mas te pesa"
  ],
  preferencias_valoracion: [
    "que esperas de esta conversacion",
    "que esperas de la entrevista",
    "que te gustaria lograr",
    "que te gustaria que pasara",
    "que te gusta",
    "que haces en tu tiempo libre",
    "que valoras",
    "que seria util",
    "que te ayudaria",
    "quieres que te ayude"
  ],
  pregunta_escolar: ["vas al colegio", "vas a clases", "estas en el colegio", "sigues en el colegio", "colegio", "curso"],
  pregunta_academica: ["estudias", "universidad", "carrera", "ramos", "que estudias", "clases", "rendimiento"],
  pregunta_laboral: ["trabajas", "trabajo", "pega", "laboral", "en que trabajas", "oficina", "jefatura"],
  pregunta_familiar: ["vives con", "con quien vives", "tus papas", "tus padres", "familia", "hijos", "hija", "pareja", "separacion", "mama", "papa"],
  pregunta_social: ["tienes amigos", "tienes amigas", "amigos", "companeros", "sales", "te juntas", "hablas con alguien"],
  pregunta_videojuegos: ["juegas videojuegos", "videojuegos", "juegas mucho", "juegas harto", "computador", "que juegos", "redes sociales", "redes", "celular", "instagram", "tiktok"],
  pregunta_habitos: ["duermes", "comes", "descansas", "audifonos", "rutina", "que haces cuando", "como duermes"],
  validacion_emocional: [
    "entiendo",
    "tiene sentido",
    "comprendo",
    "no debe ser facil",
    "debe ser dificil",
    "no quiero juzgar",
    "no estoy para juzgarte",
    "te escucho",
    "puedes tomarte tu tiempo",
    "lo que sientes es importante",
    "si para ti es importante",
    "podemos comprenderlo juntos",
    "no suena tonto",
    "no es tonto",
    "este es un lugar seguro",
    "gracias por contar",
    "gracias por contarlo",
    "suena importante",
    "podemos trabajarlo juntos",
    "quiero acompanarte",
    "puedes contarme lo que quieras",
    "puedes contarme con calma",
    "sin juzgarte",
    "no voy a juzgarte"
  ],
  juicio_o_critica: ["flojo", "adict", "exageras", "eso te hace mal", "tienes que cambiar", "estas mal", "eres el problema", "deberias dejar"],
  consejo_apresurado: ["deberias", "tienes que", "te recomiendo", "deja de", "lo mejor seria", "haz ejercicio", "organizate", "pon limites y listo"],
  exploracion_emocional: ["que sientes", "como te sientes", "que te pasa", "que te sucede", "que es lo que sientes", "como lo vives", "que te cuesta mas", "que te cuesta contar", "que parte te duele", "te da miedo", "te da culpa", "te da rabia", "te da pena"],
  exploracion_contextual: ["como es en tu casa", "como es en tu trabajo", "como es en la universidad", "como es con tu familia", "como es con tus amigos", "que pasa ahi", "desde cuando pasa"],
  cierre: ["cerrar", "terminar", "finalizar", "antes de terminar", "gracias por conversar", "como quedas", "como te vas", "proxima sesion", "siguiente sesion", "seguir conversando", "retomar en otra sesion", "que podriamos seguir conversando"]
};

const priority = [
  "saludo",
  "presentacion_estudiante",
  "encuadre_mas_pregunta_abierta",
  "encuadre_o_consentimiento",
  "cortesia_vinculo",
  "nombre",
  "edad",
  "rol_entrevistador",
  "presentacion_personal_abierta",
  "motivo_de_consulta",
  "vivienda_residencia",
  "ocupacion_actividad",
  "preocupacion_principal",
  "preferencias_valoracion",
  "pregunta_escolar",
  "pregunta_academica",
  "pregunta_laboral",
  "pregunta_familiar",
  "pregunta_social",
  "pregunta_videojuegos",
  "pregunta_habitos",
  "validacion_emocional",
  "seguimiento_contextual",
  "juicio_o_critica",
  "consejo_apresurado",
  "exploracion_emocional",
  "exploracion_contextual",
  "cierre",
  "respuesta_general"
];

const contextualTopics = {
  computador: ["computador", "videojuego", "jugar", "juego"],
  digital: ["redes", "celular", "instagram", "tiktok", "pantalla", "online"],
  encierro: ["encierro", "encierras", "encerrarme", "pieza", "audifonos"],
  papas: ["papas", "padres", "mama", "papa"],
  familia: ["familia", "hijos", "hija", "pareja", "casa", "separacion"],
  colegio: ["colegio", "clases", "grupo", "companeros", "notas"],
  universidad: ["universidad", "ramos", "estudiar", "carrera", "compañeros"],
  trabajo: ["trabajo", "pega", "laboral", "jefatura", "oficina", "licencia"],
  cansancio: ["cansancio", "cansado", "cansada", "agotado", "agotada"],
  culpa: ["culpa", "culpable"],
  descanso: ["descanso", "descansar"],
  limites: ["limites", "decir que no", "disponible", "ayudar"],
  separacion: ["separacion", "separado", "expareja", "hijos"],
  retorno: ["volver", "retorno", "licencia", "rendir", "observada"],
  jubilacion: ["jubilacion", "jubile", "rutina", "util"],
  maternidad: ["maternidad", "hijo", "mama", "crianza"],
  pertenencia: ["pertenecer", "encajar", "comparar", "primera generacion"],
  migracion: ["migrar", "migracion", "pais", "cero", "lejos"],
  decisiones: ["decidir", "decision", "cambio", "estancado", "rutina"],
  comparacion: ["comparacion", "compararme", "comparar", "comparas", "con que te comparas"],
  control: ["control", "controladora", "autoridad"],
  miedo: ["miedo", "asusta", "temor"],
  hija: ["hija", "adolescente"],
  utilidad: ["util", "aportar", "lugar"],
  cambio: ["cambio", "cambiar", "moverme"],
  soledad: ["soledad", "sola", "solo"],
  ayuda: ["ayuda", "pedir ayuda"],
  silencio: ["callado", "silencio", "callas"],
  default: []
};

const followUpCues = [
  "por que",
  "como asi",
  "a que te refieres",
  "que quieres decir",
  "puedes explicarme mas",
  "cuentame mas",
  "que parte",
  "que cosa",
  "que tema",
  "que te cuesta",
  "que te cuesta contar",
  "que pasa con eso",
  "explicame",
  "y despues que haces",
  "como lo vives",
  "cuando te pasa",
  "en que sentido"
];

const continuityTerms = [
  "proxima sesion",
  "siguiente sesion",
  "retomar esto",
  "podemos retomar",
  "continuar profundizando",
  "continuar con calma",
  "otra sesion",
  "volver a conversar",
  "seguir hablando"
];

export function detectIntent(studentMessage, history = []) {
  const text = normalizeText(studentMessage);
  const matches = {};

  for (const [intent, terms] of Object.entries(intentLexicon)) {
    matches[intent] = terms.some((term) => text.includes(normalizeText(term)));
  }

  matches.presentacion_estudiante = matches.presentacion_estudiante || detectsStudentPresentation(text);
  matches.encuadre_o_consentimiento = matches.encuadre_o_consentimiento || detectsFraming(text);
  matches.encuadre_mas_pregunta_abierta = detectsCompoundFramingQuestion(text, matches);
  matches.ocupacion_actividad = matches.ocupacion_actividad || detectsOccupationActivity(text);
  matches.vivienda_residencia = matches.vivienda_residencia || detectsResidenceQuestion(text);
  matches.preocupacion_principal = matches.preocupacion_principal || detectsMainConcernQuestion(text);
  matches.respuesta_general = isGeneralOpenPrompt(text);

  if (matches.validacion_emocional && matches.motivo_de_consulta && !hasExplicitMotiveCue(text)) {
    matches.motivo_de_consulta = false;
  }
  if (matches.preocupacion_principal && !hasExplicitMotiveCue(text)) {
    matches.motivo_de_consulta = false;
  }

  const contextualTopic = detectContextualTopic(text, history);
  matches.seguimiento_contextual = Boolean(contextualTopic);

  const intent = priority.find((candidate) => matches[candidate]) || "desconocida";
  const confidence = intent === "desconocida" ? 0.25 : contextualTopic ? 0.86 : 0.92;

  return {
    intent,
    confidence,
    normalizedText: text,
    contextualTopic,
    studentName: extractStudentName(text),
    matches,
    categories: toLegacyCategories(intent, matches, text)
  };
}

function detectContextualTopic(text, history) {
  if (intentLexicon.motivo_de_consulta.some((term) => text.includes(normalizeText(term)))) return null;
  if (intentLexicon.presentacion_personal_abierta.some((term) => text.includes(normalizeText(term)))) return null;
  if (detectsStudentPresentation(text) || detectsFraming(text)) return null;
  if (detectsResidenceQuestion(text)) return null;
  if (detectsOccupationActivity(text)) return null;
  if (text.includes("que te cuesta mas")) return null;

  const lastPatientMessage = normalizeText(history.at(-1)?.answer || "");
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const isBrief = wordCount <= 9;
  const hasFollowUpCue = followUpCues.some((cue) => text.includes(cue));
  if (!lastPatientMessage || (!isBrief && !hasFollowUpCue)) return null;

  for (const [topic, terms] of Object.entries(contextualTopics)) {
    if (topic === "default") continue;
    const asksTopic = terms.some((term) => text.includes(normalizeText(term)));
    const lastHadTopic = terms.some((term) => lastPatientMessage.includes(normalizeText(term)));
    if (asksTopic && isBrief) return topic;
    if ((asksTopic && lastHadTopic) || (hasFollowUpCue && lastHadTopic)) return topic;
  }

  if (hasFollowUpCue) return "default";
  return null;
}

function isGeneralOpenPrompt(text) {
  return [
    "cuentame",
    "hablame mas",
    "quiero entender",
    "ayudame a entender",
    "como ha sido",
    "que ha pasado"
  ].some((term) => text.includes(term));
}

function detectsStudentPresentation(text) {
  return (
    /\bantes( de comenzar)? quisiera presentarme\b/.test(text) ||
    /\bquiero presentarme( primero)?\b/.test(text) ||
    /\bme presento\b/.test(text) ||
    /\bmi nombre es\b/.test(text) ||
    /\bsoy (el|la)? ?estudiante\b/.test(text) ||
    /\bsoy quien va a (conversar|hablar|entrevistarse|entrevistarte) contigo\b/.test(text) ||
    /\bsoy [a-z]+ y voy a (acompanarte|acompañarte|conversar contigo)\b/.test(text) ||
    /\bpresentarme[, ]+[a-z]+\b/.test(text)
  );
}

function detectsFraming(text) {
  return (
    /\bquiero explicarte\b/.test(text) ||
    /\bantes de comenzar.*(objetivo|entrevista|espacio)\b/.test(text) ||
    /\b(este|esto) es un espacio\b/.test(text) ||
    /\bentrevista simulada\b/.test(text) ||
    /\bfines educativos\b/.test(text) ||
    /\bpodemos conversar con calma\b/.test(text) ||
    /\bpuedes tomarte tu tiempo\b/.test(text) ||
    /\bsi algo te incomoda\b/.test(text)
  );
}

function detectsCompoundFramingQuestion(text, matches = {}) {
  const hasFramingOrSupport =
    detectsFraming(text) ||
    matches.validacion_emocional ||
    [
      "antes de comenzar",
      "podemos conversar con calma",
      "no estoy para juzgarte",
      "quiero comprender",
      "este es un lugar seguro",
      "este es un espacio seguro"
    ].some((term) => text.includes(normalizeText(term)));

  const hasOpenQuestion = [
    "que te gustaria que entienda",
    "que te gustaria que entendiera",
    "que te gustaria que comprendiera",
    "que quieres que comprenda",
    "que quieres que entienda",
    "que deberia entender",
    "que deberia comprender",
    "que te trae hoy",
    "que te preocupa",
    "que estas viviendo",
    "que estas pasando",
    "que te esta pasando",
    "que te gustaria contar",
    "que seria importante que entienda"
  ].some((term) => text.includes(normalizeText(term)));

  return hasFramingOrSupport && hasOpenQuestion;
}

function hasExplicitMotiveCue(text) {
  return (
    /\bsabes por que estas (aqui|aca)\b/.test(text) ||
    /\bpor que estas (aqui|aca)\b/.test(text) ||
    /\bpor que viniste\b/.test(text) ||
    /\bsabes por que viniste\b/.test(text) ||
    /\bmotivo( de consulta)?\b/.test(text) ||
    /\bque te trae\b/.test(text) ||
    /\bpor que te (derivaron|mandaron)\b/.test(text) ||
    /\bquien te derivo\b/.test(text) ||
    /\bque paso para que llegaras\b/.test(text)
  );
}

function extractStudentName(text) {
  const patterns = [
    /\bmi nombre es ([a-z]+)\b/,
    /\bme llamo ([a-z]+)\b/,
    /\bpresentarme[, ]+([a-z]+)\b/,
    /\bsoy ([a-z]+) y voy\b/,
    /\bsoy ([a-z]+),? (el|la)? ?estudiante\b/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1] && !["quien", "estudiante"].includes(match[1])) {
      return capitalizeName(match[1]);
    }
  }
  return "";
}

function capitalizeName(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function detectsOccupationActivity(text) {
  if (text.includes("que haces cuando")) return false;
  return (
    /\ba que te dedicas\b/.test(text) ||
    /\ben que trabajas\b/.test(text) ||
    /\bcual es tu trabajo\b/.test(text) ||
    /\bcual es tu ocupacion\b/.test(text) ||
    /\bestudias o trabajas\b/.test(text) ||
    /\bque haces actualmente\b/.test(text) ||
    /\bque haces durante el dia\b/.test(text) ||
    /^(comprendo|entiendo|ok|ya|bien)?[, ]*que haces[? ]*$/.test(text.trim()) ||
    /^(comprendo|entiendo|ok|ya|bien)?[, ]*trabajas[? ]*$/.test(text.trim())
  );
}

function detectsResidenceQuestion(text) {
  return (
    /\bdonde vives\b/.test(text) ||
    /\bcon quien vives\b/.test(text) ||
    /\bvives solo\b/.test(text) ||
    /\bvives sola\b/.test(text) ||
    /\bvives con alguien\b/.test(text) ||
    /\bvives con (tus|tu) (padres|papas|familia|pareja)\b/.test(text) ||
    /\ben que lugar vives\b/.test(text) ||
    /\bcon quien compartes casa\b/.test(text)
  );
}

function detectsMainConcernQuestion(text) {
  return (
    /\bque te preocupa( de (esto|todo esto))?\b/.test(text) ||
    /\bque te preocupa mas\b/.test(text) ||
    /\bque es lo que mas te preocupa\b/.test(text) ||
    /\bcual es tu( principal)? preocupacion\b/.test(text) ||
    /\bque te inquieta\b/.test(text) ||
    /\bque es lo que mas te inquieta\b/.test(text) ||
    /\bque te da miedo de esto\b/.test(text) ||
    /\bque es lo que mas te pesa\b/.test(text)
  );
}

function toLegacyCategories(intent, matches, text = "") {
  const continuityAgreement = continuityTerms.some((term) => text.includes(term));
  return {
    greeting: intent === "saludo",
    framing: intent === "rol_entrevistador" || intent === "cortesia_vinculo" || intent === "presentacion_estudiante" || intent === "encuadre_o_consentimiento" || intent === "encuadre_mas_pregunta_abierta",
    openQuestion: /^(encuadre_mas_pregunta_abierta|presentacion_personal_abierta|motivo_de_consulta|preocupacion_principal|seguimiento_contextual|exploracion_emocional|exploracion_contextual|respuesta_general|desconocida)$/.test(intent),
    closedQuestion: intent.startsWith("pregunta_") || intent === "ocupacion_actividad" || intent === "vivienda_residencia" || intent === "nombre" || intent === "edad",
    validation: intent === "validacion_emocional",
    judgment: intent === "juicio_o_critica",
    rushedAdvice: intent === "consejo_apresurado",
    emotionalExploration: intent === "exploracion_emocional" || intent === "seguimiento_contextual",
    familyExploration: intent === "pregunta_familiar" || intent === "vivienda_residencia",
    academicExploration: intent === "pregunta_escolar" || intent === "pregunta_academica" || intent === "ocupacion_actividad",
    workExploration: intent === "pregunta_laboral" || intent === "ocupacion_actividad",
    digitalExploration: intent === "pregunta_videojuegos",
    supportExploration: intent === "pregunta_social",
    contextExploration: intent.startsWith("pregunta_") || intent === "ocupacion_actividad" || intent === "vivienda_residencia" || intent === "seguimiento_contextual" || intent === "exploracion_contextual",
    closure: intent === "cierre",
    goodClosure: intent === "cierre" && matches.validacion_emocional,
    continuityAgreement,
    pressure: false,
    prematureInterpretation: false,
    paceRespect: intent === "cortesia_vinculo" || intent === "rol_entrevistador" || intent === "presentacion_estudiante" || intent === "encuadre_o_consentimiento" || intent === "encuadre_mas_pregunta_abierta",
    empathicSummary: intent === "seguimiento_contextual",
    followUp: intent === "seguimiento_contextual",
    preferencesExploration: intent === "preferencias_valoracion",
    concernExploration: intent === "preocupacion_principal",
    repeatedQuestion: false
  };
}
