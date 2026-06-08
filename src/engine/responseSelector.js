import { patientFacts } from "../data/patientFacts.js";
import { patientResponses } from "../data/patientResponses.js";
import { forceCompositeOpenQuestionResponse } from "./compositeResponses.js";
import { isEvasivePatientResponse } from "./patientMemory.js";

const intentToFact = {
  nombre: "name",
  edad: "age",
  vivienda_residencia: "residence",
  motivo_de_consulta: "motive",
  preocupacion_principal: "concern",
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

const residenceResponses = {
  tomas: [
    "Vivo con mis papás. Últimamente discutimos harto por el tema del computador.",
    "Vivo con mis papás. En la casa casi siempre el tema termina siendo cuánto juego o si salgo poco.",
    "Vivo con mis papás. Paso harto tiempo en mi pieza, sobre todo cuando empiezan las discusiones."
  ],
  valentina: [
    "Vivo con mi familia. A veces eso también me pesa, porque siento que esperan mucho de mí.",
    "Vivo con mi familia. No es que me presionen todo el día, pero igual siento que tengo que estar cumpliendo.",
    "Vivo con mi familia. Trato de que no se note tanto cuando estoy sobrepasada."
  ],
  marcos: [
    "Vivo con mi pareja. Últimamente me preocupa llegar tan cansado a la casa.",
    "Vivo con mi pareja. Me da lata que a veces llegue sin energía para conversar.",
    "Vivo con mi pareja. La casa debería ser un lugar tranquilo, pero a veces llego demasiado irritable.",
    "Vivo con mi pareja, y eso también me preocupa, porque siento que la pega se me está metiendo en la casa.",
    "Vivo con mi pareja. A veces respondo más corto de lo que quisiera, no porque no me importe, sino porque llego agotado."
  ],
  elena: [
    "Vivo sola. Mis hijos están pendientes, pero yo trato de no preocuparlos mucho.",
    "Vivo sola. A veces la casa se siente demasiado silenciosa, aunque no quiera admitirlo.",
    "Vivo sola. Tengo contacto con mis hijos, pero me cuesta pedirles compañía."
  ],
  nicolas: [
    "Vivo con mi familia. No hablo mucho de estas cosas en la casa.",
    "Vivo con mi familia. En la casa casi siempre terminan preguntando por el colegio.",
    "Vivo con mi familia. Prefiero no contar mucho para que no se vuelva otro reto."
  ],
  camila: [
    "Vivo sola, pero estoy muy pendiente de mi familia. A veces siento que igual estoy disponible todo el día.",
    "Vivo sola. Igual me cuesta desconectarme de lo que necesita mi familia.",
    "Vivo sola, aunque muchas veces mi cabeza sigue en los problemas de mi familia."
  ],
  rodrigo: [
    "Vivo solo desde la separación. Mis hijos están conmigo algunos días, y trato de que ese tiempo funcione bien.",
    "Vivo solo ahora. Después de la separación todavía estoy acostumbrándome a esa rutina.",
    "Vivo solo, aunque parte de mi semana gira en torno a mis hijos y a coordinar la casa con ellos."
  ],
  fernanda: [
    "Vivo con mi pareja. En la casa intento estar tranquila, pero a veces llevo encima la preocupación del trabajo.",
    "Vivo con mi pareja. Me apoya, pero igual me cuesta contarle cuánto me asusta volver al trabajo.",
    "Vivo con mi pareja. A veces siento que hasta en la casa estoy anticipando cómo me va a ir al día siguiente."
  ],
  hector: [
    "Vivo con mi esposa. Desde que jubilé paso más tiempo en la casa, y todavía estoy buscando una rutina.",
    "Vivo con mi esposa. Estoy más en la casa que antes, y eso me hace notar más los cambios del día.",
    "Vivo con mi esposa. No quiero que esté pendiente de mí como si yo no pudiera solo."
  ],
  daniela: [
    "Vivo con mi hijo. Mi familia me ayuda a ratos, pero la responsabilidad principal la siento en mí.",
    "Vivo con mi hijo. A veces hay apoyo familiar, pero igual termino sintiendo que tengo que poder con todo.",
    "Vivo con mi hijo. La casa gira mucho en torno a sus tiempos y a mis estudios."
  ],
  andres: [
    "Vivo con mi familia. Ellos están orgullosos de que esté en la universidad, y eso también pesa.",
    "Vivo con mi familia. A veces trato de que no noten que me siento fuera de lugar en la universidad.",
    "Vivo con mi familia. Me apoyan, pero igual siento presión por no decepcionarlos."
  ],
  patricia: [
    "Vivo con mi hija. Últimamente en la casa discutimos más de lo que quisiera.",
    "Vivo con mi hija. A veces siento que compartimos casa, pero nos cuesta encontrarnos sin pelear.",
    "Vivo con mi hija. Me preocupa que cada conversación termine como una lucha de autoridad."
  ],
  miguel: [
    "Vivo solo, en un lugar que arriendo. A veces eso se siente tranquilo, pero también bastante solitario.",
    "Vivo solo por ahora. Estoy armando mi vida acá de a poco.",
    "Vivo solo. Hablo con mi familia por teléfono, pero no es lo mismo que tenerlos cerca."
  ],
  sofia: [
    "Vivo con mi familia. Igual paso harto tiempo en mi pieza o conectada al celular.",
    "Vivo con mi familia. A veces estoy en la casa, pero metida en el celular como si estuviera en otra parte.",
    "Vivo con mi familia. No siempre entienden cuánto me afecta lo que veo en redes."
  ],
  claudio: [
    "Vivo solo. Tengo una rutina bastante ordenada, aunque a veces eso mismo me hace sentir estancado.",
    "Vivo solo. Mi casa está ordenada, mi rutina también, pero por dentro no siempre se siente tan claro.",
    "Vivo solo. Me acomoda la rutina, pero a veces también me encierra un poco."
  ]
};

const studentPresentationResponses = {
  tomas: (name) => [`Hola${name ? `, ${name}` : ""}... está bien.`],
  valentina: (name) => [`Hola${name ? `, ${name}` : ""}, gracias. Me parece bien.`],
  marcos: (name) => [`Hola. Está bien${name ? `, ${name}` : ""}.`],
  elena: (name) => [`Hola${name ? `, ${name}` : ""}. Muchas gracias.`],
  nicolas: () => ["Ya... hola."],
  camila: (name) => [`Hola${name ? `, ${name}` : ""}. Gracias, me ayuda partir así.`],
  rodrigo: (name) => [`Hola${name ? `, ${name}` : ""}. Está bien, conversemos.`],
  fernanda: (name) => [`Hola${name ? `, ${name}` : ""}. Gracias... me tranquiliza saber quién va a conversar conmigo.`],
  hector: (name) => [`Hola${name ? `, ${name}` : ""}. Bueno, está bien.`],
  daniela: (name) => [`Hola${name ? `, ${name}` : ""}. Gracias, podemos partir.`],
  andres: (name) => [`Hola${name ? `, ${name}` : ""}. Ya, gracias.`],
  patricia: (name) => [`Hola${name ? `, ${name}` : ""}. Gracias, me parece bien.`],
  miguel: (name) => [`Hola${name ? `, ${name}` : ""}. Muchas gracias.`],
  sofia: (name) => [`Hola${name ? `, ${name}` : ""}. Gracias.`],
  claudio: (name) => [`Hola${name ? `, ${name}` : ""}. Está bien... no soy muy bueno para hablar de estas cosas, pero puedo intentarlo.`]
};

const defaultStudentPresentation = (facts, name) => [
  `Hola${name ? `, ${name}` : ""}. Está bien, podemos conversar.`
];

const framingResponses = {
  tomas: ["Ya... entiendo. Igual me cuesta un poco hablar, pero puedo intentarlo."],
  valentina: ["Gracias. Me ayuda saber que podemos ir con calma."],
  marcos: ["Bien. No tengo tan claro por dónde partir, pero puedo intentarlo."],
  elena: ["Muchas gracias. Me tranquiliza que podamos conversar con calma."],
  nicolas: ["Ya. Mientras no sea como un reto, está bien."],
  camila: ["Gracias. Me ayuda que sea un espacio donde pueda ir de a poco."],
  rodrigo: ["Entiendo. Me sirve saber cómo va a funcionar antes de partir."],
  fernanda: ["Gracias. Me tranquiliza que podamos hacerlo con calma."],
  hector: ["Bueno, entiendo. Me parece correcto partir aclarando eso."],
  daniela: ["Gracias. Me ayuda saber que no tengo que resolver todo hoy."],
  andres: ["Ya, gracias. Me sirve que lo expliques así."],
  patricia: ["Entiendo. Me parece bien que partamos ordenadamente."],
  miguel: ["Gracias. Me ayuda saber que es un espacio para conversar con calma."],
  sofia: ["Gracias. Me ayuda que no suene como un reto."],
  claudio: ["Entiendo. Me acomoda partir ordenadamente, así que está bien."]
};

const compoundUnderstandingResponses = {
  tomas: "Creo que me gustaría que entendieras que no es solo que juego mucho. También me cuesta estar con gente en persona.",
  valentina: "Me gustaría que entendieras que estoy cansada, pero me cuesta parar sin sentir culpa.",
  marcos: "Me gustaría que entendieras que sigo funcionando, pero cada vez con menos paciencia.",
  elena: "Me gustaría que entendieras que me cuesta pedir ayuda y no quiero preocupar a mis hijos.",
  nicolas: "Me gustaría que entendieras que no vine porque yo quisiera. Me mandaron, y me cuesta hablar si siento que ya decidieron por mí.",
  camila: "Me gustaría que entendieras que estoy cansada de estar disponible para todos, pero me da culpa decir que no.",
  rodrigo: "Me gustaría que entendieras que trato de mantenerme firme por mis hijos, pero la separación me mueve más de lo que muestro.",
  fernanda: "Me gustaría que entendieras que quiero volver al trabajo, pero me asusta que todos noten que no rindo como antes.",
  hector: "Me gustaría que entendieras que jubilar no ha sido solo tener tiempo libre. A veces siento que perdí un lugar.",
  daniela: "Me gustaría que entendieras que estoy cansada y que me da culpa decirlo.",
  andres: "Me gustaría que entendieras que entré a la universidad, pero todavía siento que estoy mirando desde afuera.",
  patricia: "Me gustaría que entendieras que no quiero controlar todo, pero me da miedo perder el vínculo con mi hija.",
  miguel: "Me gustaría que entendieras que estoy intentando armar vida acá, pero a veces siento que empecé de cero.",
  sofia: "Creo que me gustaría que entendieras que me comparo más de lo que digo.",
  claudio: "Me gustaría que entendieras que no estoy mal en apariencia, pero siento que estoy viviendo en automático."
};

const compoundAcknowledgements = {
  tomas: "Ya, gracias.",
  valentina: "Gracias. Me ayuda saber que podemos ir con calma.",
  marcos: "Gracias. Me sirve que lo plantees así.",
  elena: "Muchas gracias. Me tranquiliza que podamos conversar con calma.",
  nicolas: "Ya. Mientras no sea como un reto, está bien.",
  camila: "Gracias. Me ayuda que sea un espacio donde pueda ir de a poco.",
  rodrigo: "Gracias. Me sirve saber cómo va a funcionar antes de partir.",
  fernanda: "Gracias. Me tranquiliza que podamos hacerlo con calma.",
  hector: "Bueno, entiendo.",
  daniela: "Gracias. Me ayuda saber que no tengo que resolver todo hoy.",
  andres: "Ya, gracias. Me sirve que lo expliques así.",
  patricia: "Gracias.",
  miguel: "Gracias. Me ayuda saber que es un espacio para conversar con calma.",
  sofia: "Gracias. Me ayuda que no suene como reto.",
  claudio: "Está bien."
};

export function selectResponse({ caseId, intentResult, memory }) {
  const intent = intentResult.intent;
  const facts = patientFacts[caseId] || patientFacts.tomas;
  const responses = patientResponses[caseId] || patientResponses.tomas;
  let responseType = intent;
  let candidates = [];

  if (intent === "presentacion_estudiante") {
    const buildPresentation = studentPresentationResponses[caseId] || ((name) => defaultStudentPresentation(facts, name));
    candidates = buildPresentation(intentResult.studentName || "");
    responseType = "presentacion_estudiante";
  } else if (intent === "encuadre_mas_pregunta_abierta") {
    candidates = [forceCompositeOpenQuestionResponse(caseId, facts)];
    responseType = "encuadre_mas_pregunta_abierta";
  } else if (intent === "encuadre_o_consentimiento") {
    candidates = framingResponses[caseId] || ["Entiendo. Está bien, podemos conversar con calma."];
    responseType = "encuadre_o_consentimiento";
  } else if (intent === "desconocida") {
    candidates = buildClarificationCandidates(facts, memory);
    responseType = "clarificacion_desconocida";
  } else if (intent === "seguimiento_contextual") {
    const topic = intentResult.contextualTopic || memory.lastTopic || "default";
    candidates = responses.seguimiento_contextual?.[topic] || responses.seguimiento_contextual?.default || [];
    responseType = `seguimiento_contextual:${topic}`;
  } else if (intent === "vivienda_residencia") {
    candidates = residenceResponses[caseId] || [facts.residence || facts.family].filter(Boolean);
    responseType = "vivienda_residencia";
  } else if (intent === "ocupacion_actividad") {
    candidates = occupationResponses[caseId] || [facts.works || facts.academic || facts.school].filter(Boolean);
    responseType = "ocupacion_actividad";
  } else if (intent === "preocupacion_principal") {
    candidates = buildConcernCandidates(facts);
    responseType = "preocupacion_principal";
  } else if (intent === "cierre" && intentResult.categories?.continuityAgreement) {
    candidates = buildContinuityCandidates(facts);
    responseType = "cierre:continuidad";
  } else {
    candidates = responses[intent] || [];
  }

  const sofiaProgression = caseId === "sofia"
    ? selectSofiaProgressiveCandidates({ intent, intentResult, memory, responses, currentCandidates: candidates })
    : null;
  if (sofiaProgression) {
    candidates = sofiaProgression.candidates;
    responseType = sofiaProgression.responseType;
  }

  const concreteDisclosure = forceConcreteDisclosure({
    caseId,
    intent,
    intentResult,
    memory,
    facts,
    responses,
    currentCandidates: candidates
  });
  if (concreteDisclosure) {
    candidates = concreteDisclosure.candidates;
    responseType = concreteDisclosure.responseType;
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
  if (intent === "nombre") return `Me llamo ${facts.name}.`;
  if (intent === "edad") return `Tengo ${facts.age}.`;
  return facts[intentToFact[intent]] || "No sé bien cómo responder eso.";
}

function buildConcernCandidates(facts) {
  return [
    facts.concern,
    facts.concreteConcern,
    ...(facts.concreteDisclosures || []).slice(0, 2)
  ].filter(Boolean);
}

function buildContinuityCandidates(facts) {
  const concern = facts.concreteConcern || facts.concern;
  const expectation = facts.expectation;
  return [
    joinNatural("Creo que podríamos seguir hablando de eso.", concern),
    joinNatural("Me gustaría retomar esto con calma en otra sesión.", expectation),
    joinNatural("Quedaría pendiente ordenar mejor lo que me pasa.", concern)
  ].filter(Boolean);
}

function buildCompoundFramingQuestionCandidates({ caseId, facts }) {
  const acknowledgement = compoundAcknowledgements[caseId] || "Gracias. Me ayuda que podamos conversar con calma.";
  const openAnswer =
    compoundUnderstandingResponses[caseId] ||
    facts.concreteConcern ||
    facts.concern ||
    facts.motive;

  return [joinNatural(acknowledgement, openAnswer)].filter(Boolean);
}

function forceConcreteDisclosure({ intent, intentResult, memory, facts, responses, currentCandidates }) {
  const forceableIntents = [
    "motivo_de_consulta",
    "seguimiento_contextual",
    "exploracion_emocional",
    "validacion_emocional",
    "respuesta_general",
    "desconocida"
  ];
  if (!forceableIntents.includes(intent)) return null;

  const hasSupport = intent === "validacion_emocional" || memory.hadValidation || memory.trustLevel >= 42;
  const hasRepeatedEvasion = (memory.evasiveCount || 0) >= 2;
  const isMidOrHigh = memory.opennessLevel !== "apertura_baja";
  const hasContext = Boolean(memory.lastTopic || intentResult.contextualTopic || memory.lastPatientMessage);
  const currentLooksEvasive = (currentCandidates || []).some((candidate) => isEvasivePatientResponse(candidate));

  if (intent === "motivo_de_consulta") {
    return {
      candidates: buildMotiveCandidates(facts),
      responseType: "motivo_de_consulta:concreto"
    };
  }

  if (intent === "validacion_emocional") {
    return {
      candidates: buildValidationCandidates(facts, responses, memory),
      responseType: "validacion_emocional:concreto"
    };
  }

  if (intent === "seguimiento_contextual") {
    return {
      candidates: buildFollowUpCandidates({ facts, responses, intentResult, memory }),
      responseType: `seguimiento_contextual:${intentResult.contextualTopic || memory.lastTopic || "concreto"}`
    };
  }

  if (intent === "exploracion_emocional" && (hasSupport || isMidOrHigh || hasRepeatedEvasion || currentLooksEvasive)) {
    return {
      candidates: buildExplorationCandidates(facts, responses),
      responseType: "exploracion_emocional:concreto"
    };
  }

  if ((intent === "respuesta_general" || intent === "desconocida") && (hasRepeatedEvasion || (hasSupport && hasContext) || (isMidOrHigh && currentLooksEvasive))) {
    return {
      candidates: buildConcreteCandidates(facts, responses),
      responseType: "apertura_progresiva:forzada"
    };
  }

  return null;
}

function buildMotiveCandidates(facts) {
  return [
    facts.motive,
    withLead("Lo que me pasa es que", facts.concreteDisclosures?.[0]),
    facts.concreteConcern || facts.concreteDisclosures?.[1],
    joinNatural("Me cuesta explicarlo de una sola vez.", facts.concreteDisclosures?.[2] || facts.motive)
  ].filter(Boolean);
}

function buildValidationCandidates(facts, responses, memory) {
  const disclosure = selectConcreteLine(facts, memory, 0);
  const nextDisclosure = selectConcreteLine(facts, memory, 1);
  return [
    joinNatural(facts.validationBridge || "Gracias. Me ayuda que lo digas así.", disclosure),
    joinNatural("Sí, gracias. Me sirve que no suene como un reto.", nextDisclosure),
    joinNatural(responses.validacion_emocional?.[0], disclosure),
    joinNatural("Eso me ayuda a decirlo un poco más claro.", facts.concreteConcern || disclosure)
  ].filter(Boolean);
}

function buildFollowUpCandidates({ facts, responses, intentResult, memory }) {
  const topic = intentResult.contextualTopic || memory.lastTopic || "default";
  const topicResponses = responses.seguimiento_contextual?.[topic] || [];
  const concrete = selectConcreteLine(facts, memory, 0);
  const nextConcrete = selectConcreteLine(facts, memory, 1);

  return [
    joinNatural(facts.followUpBridge || "Creo que lo que trato de decir es esto.", concrete),
    nextConcrete,
    facts.concreteConcern,
    ...topicResponses.filter((response) => !isEvasivePatientResponse(response)).slice(0, 3)
  ].filter(Boolean);
}

function buildExplorationCandidates(facts, responses) {
  const concrete = facts.concreteDisclosures || [];
  return [
    ...concrete,
    facts.concreteConcern,
    ...(responses.apertura_progresiva || []).filter((response) => !isEvasivePatientResponse(response)).slice(0, 3),
    ...(responses.exploracion_emocional || []).filter((response) => !isEvasivePatientResponse(response)).slice(0, 3)
  ].filter(Boolean);
}

function buildConcreteCandidates(facts, responses) {
  return [
    facts.followUpBridge,
    ...(facts.concreteDisclosures || []),
    facts.concreteConcern,
    ...(responses.apertura_progresiva || []).filter((response) => !isEvasivePatientResponse(response)).slice(0, 4)
  ].filter(Boolean);
}

function buildClarificationCandidates(facts, memory) {
  const topicLine = memory.lastTopic && memory.lastTopic !== "desconocida"
    ? `No estoy seguro de haber entendido bien. ¿Te refieres a lo que veníamos hablando sobre ${readableTopic(memory.lastTopic)}?`
    : "";
  return [
    topicLine,
    "No estoy seguro de haber entendido bien. ¿Te refieres a lo que me preocupa o a cómo llegué hasta acá?",
    facts.concreteConcern
      ? `No sé si entendí la pregunta. Si tiene que ver con lo que me preocupa, diría que ${lowerFirst(facts.concreteConcern)}`
      : "",
    "Me perdí un poco con eso. Si puedes preguntármelo de otra forma, creo que podría responder mejor."
  ].filter(Boolean);
}

function selectConcreteLine(facts, memory, offset = 0) {
  const lines = facts.concreteDisclosures || [facts.concreteConcern, facts.motive].filter(Boolean);
  if (!lines.length) return facts.concreteConcern || facts.motive;
  const index = Math.abs((memory.turnCount || 0) + offset) % lines.length;
  return lines[index];
}

function readableTopic(topic) {
  const labels = {
    motivo_de_consulta: "por qué vine",
    vivienda: "dónde vivo",
    ocupacion: "lo que hago",
    familia: "mi familia",
    trabajo: "el trabajo",
    colegio: "el colegio",
    universidad: "la universidad",
    digital: "lo digital",
    emocion: "lo que siento",
    preferencias: "lo que espero",
    encuadre: "cómo será la entrevista",
    presentacion: "la presentación"
  };
  return labels[topic] || topic.replace(/_/g, " ");
}

function lowerFirst(text) {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function joinNatural(first, second) {
  if (!first) return second;
  if (!second) return first;
  const normalizedFirst = normalizeForCompare(first);
  const normalizedSecond = normalizeForCompare(second);
  if (normalizedFirst.includes(normalizedSecond) || normalizedSecond.includes(normalizedFirst)) return first;
  return `${first} ${second}`;
}

function withLead(lead, text) {
  if (!text) return lead;
  const clean = text.trim();
  return `${lead} ${clean.charAt(0).toLowerCase()}${clean.slice(1)}`;
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

function normalizeForCompare(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function selectSofiaProgressiveCandidates({ intent, intentResult, memory, responses, currentCandidates }) {
  const text = intentResult.normalizedText || "";
  const recentEvasions = countRecentSofiaEvasions(memory.usedResponseIds || []);
  const hasSupport = memory.hadValidation || memory.trustLevel >= 47 || memory.opennessLevel === "apertura_alta";
  const asksForCentralFollowUp = detectsSofiaCentralFollowUp(text);
  const specificFollowUp = getSofiaSpecificFollowUp(text);

  if (specificFollowUp && (hasSupport || recentEvasions >= 1 || asksForCentralFollowUp || intent !== "desconocida")) {
    return { candidates: specificFollowUp, responseType: "sofia_seguimiento_especifico" };
  }

  if (intent === "validacion_emocional") {
    const validationCandidates = memory.hadValidation || memory.trustLevel >= 49
      ? [
          "Sí... eso me alivia un poco. Me da vergüenza, pero me afecta más de lo que digo.",
          ...responses.validacion_emocional
        ]
      : responses.validacion_emocional;
    return { candidates: validationCandidates, responseType: "validacion_emocional" };
  }

  if (intent === "motivo_de_consulta") {
    return { candidates: responses.motivo_de_consulta, responseType: "motivo_de_consulta" };
  }

  if (intent === "preferencias_valoracion" && text.includes("ayude")) {
    return { candidates: responses.apertura_progresiva, responseType: "apertura_progresiva" };
  }

  if (intent === "seguimiento_contextual") {
    const topic = intentResult.contextualTopic || "default";
    const concrete = responses.seguimiento_contextual?.[topic] || responses.seguimiento_contextual?.default;
    if (hasSupport || recentEvasions >= 1 || asksForCentralFollowUp) {
      return { candidates: concrete, responseType: `seguimiento_contextual:${topic}` };
    }
    return currentCandidates?.length ? null : { candidates: concrete, responseType: `seguimiento_contextual:${topic}` };
  }

  if (intent === "exploracion_emocional" && (hasSupport || recentEvasions >= 1 || asksForCentralFollowUp)) {
    return { candidates: responses.exploracion_emocional, responseType: "exploracion_emocional" };
  }

  if ((intent === "desconocida" || intent === "respuesta_general") && (hasSupport || recentEvasions >= 2 || asksForCentralFollowUp)) {
    return { candidates: responses.apertura_progresiva, responseType: "apertura_progresiva" };
  }

  return null;
}

function countRecentSofiaEvasions(usedResponseIds) {
  let count = 0;
  for (const id of [...usedResponseIds].reverse()) {
    const isSofiaEvasion =
      id.includes("sofia_desconocida") ||
      id.includes("sofia_resistencia_evasion") ||
      id.includes("sofia_respuesta_general_0_no_se") ||
      id.includes("sofia_respuesta_general_1_quizas");
    if (!isSofiaEvasion) break;
    count += 1;
  }
  return count;
}

function detectsSofiaCentralFollowUp(text) {
  return [
    "que cosa",
    "que te sucede",
    "que tema",
    "a que te refieres",
    "que te cuesta contar",
    "que es lo que sientes",
    "que pasa con eso",
    "con que te comparas"
  ].some((cue) => text.includes(cue));
}

function getSofiaSpecificFollowUp(text) {
  if (text.includes("que cosa") || text.includes("que tema") || text.includes("a que te refieres")) {
    return ["Creo que tiene que ver con las redes. Me da vergüenza decirlo porque suena superficial, pero me comparo mucho."];
  }
  if (text.includes("que te sucede")) {
    return ["Me pasa que puedo estar bien, pero entro a redes y empiezo a compararme. Con cómo se ven otros, con lo que hacen, con la vida que muestran."];
  }
  if (text.includes("que te cuesta contar")) {
    return ["Que me importa más de lo que digo. Hago como que me da lo mismo, pero a veces quedo pendiente de si alguien reaccionó o no."];
  }
  if (text.includes("quieres que te ayude")) {
    return ["Sí... creo que sí. Me gustaría entender por qué algo que sé que no debería importarme igual me afecta tanto."];
  }
  if (text.includes("con que te comparas")) {
    return ["Con todo. Con cómo se ven otras personas, con lo que hacen, con la vida que muestran. Sé que no siempre es real, pero igual me pega."];
  }
  return null;
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
