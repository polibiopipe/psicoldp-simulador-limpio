import { patientFacts } from "../data/patientFacts.js";
import { patientResponses } from "../data/patientResponses.js";

const intentToFact = {
  nombre: "name",
  edad: "age",
  motivo_de_consulta: "motive",
  pregunta_escolar: "school",
  pregunta_academica: "academic",
  pregunta_laboral: "works",
  pregunta_familiar: "family",
  pregunta_social: "social",
  pregunta_videojuegos: "videogames",
  pregunta_habitos: "habits",
  preferencias_valoracion: "expectation",
  exploracion_emocional: "concern"
};

const occupationResponses = {
  tomas: [
    "Voy al colegio. Tengo 16, así que la mayor parte de mi día es eso... aunque después paso harto tiempo en el computador.",
    "Estoy en el colegio. Después de clases suelo estar en la casa o conectado.",
    "No trabajo, voy al colegio. Igual últimamente siento que lo escolar y lo del computador se mezclan harto en mi casa."
  ],
  valentina: [
    "Estudio en la universidad. Últimamente siento que todo gira en torno a cumplir, estudiar y no atrasarme.",
    "Me dedico a estudiar. La universidad me ocupa casi todo el día, incluso cuando no estoy en clases.",
    "Estoy en la universidad. Me gusta mi carrera, pero ahora la vivo con mucha presión."
  ],
  marcos: [
    "Trabajo en una empresa, en un área más bien administrativa/comercial. Paso gran parte del día resolviendo cosas y últimamente eso me está dejando sin energía.",
    "Trabajo. Estoy en una pega bien demandante, de esas donde siempre hay algo pendiente.",
    "Me dedico a trabajar, básicamente. Cumplo con mis responsabilidades, pero últimamente termino el día muy agotado.",
    "Trabajo en una empresa. No es que odie lo que hago, pero últimamente me cuesta encontrarle sentido.",
    "Tengo un trabajo estable, pero demandante. Creo que por eso también me cuesta reconocer que estoy cansado."
  ],
  elena: [
    "Ahora paso más tiempo en la casa y pendiente de mi familia. Siempre he estado muy dedicada a los demás, aunque últimamente eso me pesa un poco.",
    "Trabajo algunas horas, pero gran parte de mi día gira en torno a la casa y a estar pendiente de la familia.",
    "Me mantengo ocupada con cosas de la casa, familia y algunas horas de trabajo. A veces estar tan pendiente de otros me deja poco espacio para mí."
  ],
  nicolas: [
    "Voy al colegio. No trabajo. Me mandaron porque dicen que estoy más callado y bajé las notas.",
    "Estoy en el colegio. No hago mucho más, la verdad.",
    "Voy a clases. Últimamente participo poco y por eso empezaron a preocuparse."
  ],
  camila: [
    "Trabajo. Además ayudo mucho a mi familia, y a veces siento que mi día sigue aunque ya haya salido de la pega.",
    "Me dedico a trabajar, pero también estoy muy metida en resolver cosas familiares.",
    "Trabajo y trato de estar disponible para los demás. El problema es que casi no me queda espacio para mí."
  ],
  rodrigo: [
    "Trabajo y soy papá. Después de la separación, gran parte de mi día también se va en reorganizar tiempos familiares.",
    "Me dedico a trabajar. Además estoy tratando de ordenar la vida familiar después de separarme.",
    "Trabajo en una pega estable. Fuera de eso, estoy muy pendiente de mis hijos y de que la separación no los golpee tanto."
  ],
  fernanda: [
    "Trabajo, o más bien estoy volviendo al trabajo después de una licencia larga. Me importa hacerlo bien, pero me da miedo no rendir como antes.",
    "Estoy retomando mi trabajo. Esa vuelta me tiene insegura porque siento que todos van a estar mirando.",
    "Me dedico a trabajar. Ahora estoy en una etapa de retorno y eso me tiene más sensible de lo que esperaba."
  ],
  hector: [
    "Jubilé hace poco. Antes mi vida giraba mucho en torno al trabajo, y ahora estoy tratando de encontrar una rutina nueva.",
    "Ahora estoy jubilado. Todavía me cuesta decirlo sin sentir que quedé un poco fuera de algo.",
    "Ya no trabajo como antes. Me levanto temprano igual, pero a veces no sé bien para qué."
  ],
  daniela: [
    "Estudio y cuido a mi hijo. Entre las dos cosas, el día se me va completo.",
    "Ahora mi vida está entre estudiar y ser mamá. Amo a mi hijo, pero termino muy cansada.",
    "Estoy estudiando y criando. No trabajo formalmente, pero siento que no paro nunca."
  ],
  andres: [
    "Estudio en la universidad. Entré hace poco y todavía me cuesta sentir que pertenezco ahí.",
    "Soy estudiante universitario. Es nuevo para mí y a veces siento que todos se manejan mejor.",
    "Estoy estudiando. Mi familia está orgullosa, pero eso también me pesa un poco."
  ],
  patricia: [
    "Trabajo y soy mamá. Últimamente mi día termina muy cruzado por los conflictos con mi hija.",
    "Trabajo, y además estoy muy pendiente de mi hija adolescente. A veces siento que todo se vuelve discusión.",
    "Me dedico a trabajar y a sostener la casa. Con mi hija últimamente eso se ha puesto más difícil."
  ],
  miguel: [
    "Trabajo. No es exactamente lo que hacía antes de migrar, pero por ahora me permite sostenerme.",
    "Me dedico a trabajar y a armar mi vida acá de a poco. A veces se siente como empezar desde cero.",
    "Trabajo en algo distinto a mi formación previa. Lo valoro, pero igual me mueve por dentro."
  ],
  sofia: [
    "Estudio y trabajo algunas horas. Igual el celular y las redes se me meten en casi todo el día.",
    "Estoy entre estudio y trabajo. Y, para ser honesta, también paso demasiado tiempo mirando redes.",
    "Estudio y trabajo parcialmente. Me cuesta desconectarme, incluso cuando debería estar concentrada."
  ],
  claudio: [
    "Trabajo. Tengo una pega estable y una rutina bastante ordenada, pero siento que estoy en piloto automático.",
    "Me dedico a trabajar. Por fuera está todo bastante estable, pero por dentro siento estancamiento.",
    "Trabajo hace años en algo estable. No es que esté mal, pero últimamente me cuesta encontrarle sentido."
  ]
};

export function selectResponse({ caseId, intentResult, memory }) {
  const intent = intentResult.intent;
  const facts = patientFacts[caseId] || patientFacts.tomas;
  const responses = patientResponses[caseId] || patientResponses.tomas;
  let responseType = intent;
  let candidates = [];

  if (intent === "seguimiento_contextual") {
    const topic = intentResult.contextualTopic || memory.lastTopic || "default";
    candidates = responses.seguimiento_contextual?.[topic] || responses.seguimiento_contextual?.default || [];
    responseType = `seguimiento_contextual:${topic}`;
  } else if (intent === "ocupacion_actividad") {
    candidates = occupationResponses[caseId] || [facts.works || facts.academic || facts.school].filter(Boolean);
    responseType = "ocupacion_actividad";
  } else {
    candidates = responses[intent] || [];
  }

  if (!candidates.length && intentToFact[intent]) {
    candidates = [factToResponse(intent, facts)];
    responseType = `fact:${intentToFact[intent]}`;
  }

  const fallbackUsed = !candidates.length;
  if (fallbackUsed) {
    candidates = responses.respuesta_general || [memory.voice?.fallback || "No sé bien cómo responder eso."];
    responseType = candidates === responses.respuesta_general ? "respuesta_general" : "fallback_desconocido";
  }

  const selected = pickUnused(candidates, memory.usedResponseIds, caseId, responseType, memory.turnCount);
  return {
    response: selected.text,
    responseId: selected.id,
    responseType,
    fallbackUsed
  };
}

function factToResponse(intent, facts) {
  if (intent === "nombre") return facts.name === "Tomás" || facts.name === "Elena" ? `Me llamo ${facts.name}.` : `${facts.name}.`;
  if (intent === "edad") return `Tengo ${facts.age}.`;
  return facts[intentToFact[intent]] || "No sé bien cómo responder eso.";
}

function pickUnused(candidates, usedResponseIds, caseId, responseType, turnCount) {
  const normalized = candidates.map((text, index) => ({
    text,
    id: makeResponseId(caseId, responseType, text, index)
  }));
  const unused = normalized.filter((candidate) => !usedResponseIds.includes(candidate.id));
  if (unused.length) return unused[0];

  return {
    text: makeVariation(normalized[Math.abs(turnCount) % normalized.length].text),
    id: makeResponseId(caseId, `${responseType}:variation`, normalized[0].text, turnCount)
  };
}

function makeVariation(text) {
  if (!text) return "No sé bien cómo responder eso.";
  if (/^no sé/i.test(text)) return text.replace(/^no sé/i, "Quizás no sé");
  if (/^sí/i.test(text)) return text.replace(/^sí/i, "Sí, más o menos");
  return `Lo diría de otra forma: ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
}

function makeResponseId(caseId, responseType, text, index) {
  return `${caseId}_${responseType}_${index}_${text}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 140);
}
