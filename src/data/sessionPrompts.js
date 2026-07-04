export const SESSION_FLOW = [
  {
    number: 1,
    title: "Primera entrevista simulada",
    shortTitle: "Entrevista inicial",
    focus: "Entrevista inicial, encuadre y motivo de consulta."
  },
  {
    number: 2,
    title: "Segunda sesion simulada",
    shortTitle: "Profundizacion",
    focus: "Profundizacion del motivo de consulta y temas abiertos."
  },
  {
    number: 3,
    title: "Tercera sesion simulada",
    shortTitle: "Contexto y recursos",
    focus: "Exploracion de contexto, recursos, patrones y redes de apoyo."
  },
  {
    number: 4,
    title: "Cuarta sesion simulada",
    shortTitle: "Sintesis y plan",
    focus: "Sintesis, hipotesis inicial y plan de continuidad o cierre."
  }
];

export const SESSION_PROTOTYPE_MAX = 12;

const FLEXIBLE_SESSION_FOCUS = [
  {
    shortTitle: "Profundizacion focal",
    focus: "Intervencion o profundizacion segun la evolucion del paciente."
  },
  {
    shortTitle: "Avances y obstaculos",
    focus: "Evaluacion de avances, obstaculos y ajustes del plan clinico."
  },
  {
    shortTitle: "Preparacion de cierre",
    focus: "Preparacion de cierre, derivacion o continuidad segun lo observado."
  },
  {
    shortTitle: "Cierre y continuidad",
    focus: "Cierre, seguimiento o recomendacion final del proceso propuesto."
  }
];

export function createSessionStages(totalSessions = SESSION_FLOW.length) {
  const safeTotal = Math.min(SESSION_PROTOTYPE_MAX, Math.max(1, Number(totalSessions) || SESSION_FLOW.length));
  return Array.from({ length: safeTotal }, (_, index) => {
    const number = index + 1;
    const stage = buildSessionStage(number, safeTotal);
    return {
      number,
      label: `Sesion ${number} de ${safeTotal}`,
      title: stage.shortTitle,
      description: stage.focus
    };
  });
}

export const sessionStages = createSessionStages(SESSION_FLOW.length);

export const closureExamples = [
  "Antes de terminar, me gustaria resumir brevemente lo que conversamos.",
  "Hay algo importante que sientas que no alcanzamos a abordar hoy?",
  "Podriamos retomar esto en una proxima sesion simulada.",
  "Como te vas despues de esta conversacion?",
  "Gracias por compartir esto. Podemos continuar profundizando con calma."
];

export const nextSessionAgreementResponses = {
  tomas: "Si... creo que podria seguir hablando de esto otro dia. Igual me cuesta, pero no fue tan incomodo como pense.",
  valentina: "Si, creo que me serviria seguir ordenando esto. Siento que quedaron varias cosas dando vueltas.",
  marcos: "Podria ser. Me cuesta hacerme el tiempo, pero creo que necesito seguir hablando de esto.",
  elena: "Si, me gustaria. Me cuesta pedir ayuda, pero creo que me hizo bien conversar.",
  nicolas: "No se... pero podria venir otra vez. Al menos no senti que me estuvieran retando.",
  camila: "Si, creo que me serviria seguir. Me cuesta poner limites y siento que esto no se ordena en una sola conversacion.",
  rodrigo: "Podria ser. No soy muy bueno para hablar de esto, pero quede pensando en varias cosas.",
  fernanda: "Si, me gustaria seguir. Volver al trabajo me sigue dando vueltas y creo que necesito ir de a poco.",
  hector: "Si, puede ser. Me cuesta hablar de estas cosas, pero conversar me ayudo a mirar el dia de otra forma.",
  daniela: "Si, creo que me haria bien. Me cuesta decir que estoy cansada, pero aca pude decirlo un poco mas.",
  andres: "Si, me serviria. Siento que esto de la universidad y no encajar quedo dando vueltas.",
  patricia: "Si, me gustaria. Quisiera seguir pensando como hablar con mi hija sin que todo termine en pelea.",
  miguel: "Si, creo que podria seguir. Hay cosas de estar aca y extranar lo de antes que no alcance a explicar bien.",
  sofia: "Si... creo que podria seguir. Me dio un poco de verguenza, pero tambien me alivio decirlo.",
  claudio: "Si, podria seguir. Siento que esto de estar estancado no se entiende completo en una sola conversacion."
};

export const sessionTwoOpenings = {
  tomas: "La otra vez hablamos un poco del computador y de que en persona me cuesta saber que hacer. Me quede pensando en eso.",
  valentina: "La vez pasada hablamos de la universidad y de la culpa cuando descanso. Creo que eso me siguio dando vueltas.",
  marcos: "La vez pasada hablamos de la pega y de como llego a la casa. Me di cuenta de que si me esta afectando mas de lo que digo.",
  elena: "La otra vez hablamos de que me cuesta pedir ayuda. Me quede pensando en eso, porque creo que es verdad.",
  nicolas: "La vez pasada hablamos del colegio y de que no me gusta sentir que me retan. No se, me quede pensando un poco.",
  camila: "La vez pasada hablamos de que me cuesta decir que no. Me di cuenta de que sigo respondiendo mensajes aunque este cansada.",
  rodrigo: "La vez pasada hablamos de la separacion y de mis hijos. Me quedo dando vueltas eso de hacerme el fuerte.",
  fernanda: "La vez pasada hablamos de volver al trabajo y de sentirme observada. Eso me siguio apareciendo durante la semana.",
  hector: "La vez pasada hablamos de la jubilacion y de la rutina. Me quede pensando en cuanto extrano sentirme util.",
  daniela: "La vez pasada hablamos de estudiar, cuidar y sentir culpa por querer un rato para mi. Eso me quedo dando vueltas.",
  andres: "La vez pasada hablamos de la universidad y de sentir que no encajo. Me fije en que me comparo mas de lo que digo.",
  patricia: "La vez pasada hablamos de mi hija y de como terminamos peleando. Me quede pensando en que detras de mi enojo hay miedo.",
  miguel: "La vez pasada hablamos de migrar y de empezar de cero. Me quede pensando en lo mucho que extrano algunas partes de mi vida anterior.",
  sofia: "La vez pasada hablamos de las redes y de como me comparo. Me dio verguenza, pero tambien me hizo sentido.",
  claudio: "La vez pasada hablamos de la rutina y de sentirme estancado. Me quede pensando en cuanto de mi vida he organizado desde lo que corresponde."
};

export const sessionThreeOpenings = {
  tomas: "Me quede pensando en lo que hablamos del computador y del colegio. Creo que en mi casa tambien se repite siempre la misma discusion.",
  valentina: "Me quede pensando en como se mezcla la universidad con lo que esperan de mi. Creo que mi forma de descansar tambien tiene que ver con eso.",
  marcos: "Me quede pensando en como la pega se mete en mi casa. Creo que no es solo cansancio.",
  elena: "Me quede pensando en lo dificil que me resulta pedir ayuda. Creo que me acostumbre demasiado a sostener a otros.",
  nicolas: "Me quede pensando en el colegio y en que casi siempre prefiero quedarme callado. No se si es solo por las notas.",
  camila: "Me quede pensando en como termino disponible para todos. Creo que no es solo falta de tiempo, tambien me da culpa decir que no.",
  rodrigo: "Me quede pensando en como cambio mi lugar en la familia despues de separarme. Creo que intento verme fuerte todo el tiempo.",
  fernanda: "Me quede pensando en volver al trabajo y en esa sensacion de que todos van a mirar si fallo.",
  hector: "Me quede pensando en la rutina. Creo que desde que jubile me cuesta saber que lugar ocupo durante el dia.",
  daniela: "Me quede pensando en como intento estudiar, cuidar y no perderme a mi misma en el intento.",
  andres: "Me quede pensando en la universidad y en sentir que estoy de visita en un lugar donde todos parecen saber moverse.",
  patricia: "Me quede pensando en la relacion con mi hija. Creo que a veces parto desde el miedo y termino controlando mas.",
  miguel: "Me quede pensando en lo de empezar de cero. Creo que mi contexto aca y lo que deje alla se mezclan mas de lo que digo.",
  sofia: "Me quede pensando en lo de las redes. Creo que no es solo mirar el celular, es como quedo despues.",
  claudio: "Me quede pensando en mi rutina. Creo que hay patrones que me ordenan, pero tambien me dejan quieto. Quisiera pensar en algo pequeno que si pueda mover."
};

export const sessionFourOpenings = {
  tomas: "Creo que estas conversaciones me han servido para ordenar un poco lo del computador, mi casa y el colegio.",
  valentina: "Creo que estas conversaciones me han servido para mirar la culpa y la exigencia con un poco mas de distancia.",
  marcos: "Creo que estas conversaciones me han servido para reconocer que la pega me estaba llegando mas a la casa de lo que queria aceptar.",
  elena: "Creo que estas conversaciones me han servido para hablar un poco mas de mi, no solo de los demas.",
  nicolas: "No se si cambio todo, pero al menos pude decir algunas cosas sin sentir que me estaban retando.",
  camila: "Creo que estas conversaciones me han servido para notar cuanto me cuesta dejar de estar disponible para todos.",
  rodrigo: "Creo que estas conversaciones me han servido para pensar mi lugar despues de la separacion, aunque todavia me cuesta.",
  fernanda: "Creo que estas conversaciones me han servido para ordenar un poco el miedo a volver y sentirme observada.",
  hector: "Creo que estas conversaciones me han servido para mirar la jubilacion no solo como dejar de trabajar, sino como buscar otra rutina.",
  daniela: "Creo que estas conversaciones me han servido para decir que estoy cansada sin sentir que eso me hace menos mama.",
  andres: "Creo que estas conversaciones me han servido para entender un poco mejor por que me cuesta sentir que pertenezco.",
  patricia: "Creo que estas conversaciones me han servido para mirar el miedo que aparece detras de las peleas con mi hija.",
  miguel: "Creo que estas conversaciones me han servido para poner en palabras lo de migrar y empezar de nuevo.",
  sofia: "Creo que estas conversaciones me han servido para mirar las redes sin hacer como que no me importan.",
  claudio: "Creo que estas conversaciones me han servido para ordenar esta sensacion de estar detenido. No lo tengo resuelto, pero entiendo mejor por que me he quedado tan quieto."
};

export function getNextSessionAgreement(caseId) {
  return nextSessionAgreementResponses[caseId] || "Si, creo que podriamos continuar en otra sesion simulada.";
}

export function getSessionOpening(caseId, sessionNumber, summary) {
  if (sessionNumber === 1) return "";
  if (sessionNumber === 2) {
    return sessionTwoOpenings[caseId] || `La vez pasada hablamos de ${summary?.temasExplorados?.[0] || "lo que me esta pasando"}. Me quede pensando en eso.`;
  }
  if (sessionNumber === 3) {
    return sessionThreeOpenings[caseId] || "Me quede pensando en lo que conversamos antes. Creo que hay cosas de mi contexto que igual influyen.";
  }
  if (sessionNumber === 4) {
    return sessionFourOpenings[caseId] || "Creo que estas conversaciones me han servido para ordenar un poco lo que me pasa.";
  }
  return buildFlexibleOpening(sessionNumber, summary);
}

export function getSessionStage(sessionNumber, totalSessions = SESSION_FLOW.length) {
  return buildSessionStage(sessionNumber, totalSessions);
}

export function getNextSessionNumber(sessionNumber, totalSessions = SESSION_FLOW.length) {
  const safeTotal = Math.min(SESSION_PROTOTYPE_MAX, Math.max(1, Number(totalSessions) || SESSION_FLOW.length));
  return sessionNumber < safeTotal ? sessionNumber + 1 : null;
}

export function getSessionClosureTitle(sessionNumber, totalSessions = SESSION_FLOW.length) {
  const titles = {
    1: "Cierre de la primera entrevista",
    2: "Cierre de la segunda sesion",
    3: "Cierre de la tercera sesion",
    4: "Cierre y reevaluacion del proceso"
  };
  if (sessionNumber === totalSessions) return `Cierre de la sesion ${sessionNumber} de ${totalSessions}`;
  return titles[sessionNumber] || `Cierre de la sesion ${sessionNumber} de ${totalSessions}`;
}

function buildSessionStage(sessionNumber, totalSessions = SESSION_FLOW.length) {
  const safeTotal = Math.min(SESSION_PROTOTYPE_MAX, Math.max(1, Number(totalSessions) || SESSION_FLOW.length));
  if (sessionNumber === safeTotal) {
    return {
      number: sessionNumber,
      title: `Sesion ${sessionNumber} de ${safeTotal}`,
      shortTitle: "Cierre y continuidad",
      focus: "Cierre, seguimiento, derivacion o recomendacion final segun el proceso trabajado."
    };
  }

  const fixedStage = SESSION_FLOW.find((stage) => stage.number === sessionNumber);
  if (fixedStage) return fixedStage;

  const midpoint = Math.ceil(safeTotal / 2);
  if (sessionNumber === midpoint) {
    return {
      number: sessionNumber,
      title: `Sesion ${sessionNumber} de ${safeTotal}`,
      shortTitle: "Reevaluacion del plan",
      focus: "Reevaluacion de objetivos, riesgo, avances y pertinencia de mantener o ajustar el plan inicial."
    };
  }

  const flexible = FLEXIBLE_SESSION_FOCUS[(Math.max(5, sessionNumber) - 5) % FLEXIBLE_SESSION_FOCUS.length];
  return {
    number: sessionNumber,
    title: `Sesion ${sessionNumber} de ${safeTotal}`,
    shortTitle: flexible.shortTitle,
    focus: flexible.focus
  };
}

function buildFlexibleOpening(sessionNumber, summary) {
  const explored = summary?.temasExplorados?.[0] || "lo que venimos conversando";
  const pending = summary?.temasPendientes?.[0] || "lo que todavia queda abierto";
  if (sessionNumber >= 5) {
    return `La vez pasada quedo dando vueltas ${explored}. Tambien siento que todavia falta mirar ${pending}.`;
  }
  return "Podemos retomar lo que veniamos conversando y revisar que temas siguen abiertos.";
}
