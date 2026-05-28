export const SESSION_FLOW = [
  {
    number: 1,
    title: "Primera entrevista simulada",
    shortTitle: "Entrevista inicial",
    focus: "Entrevista inicial, encuadre y motivo de consulta."
  },
  {
    number: 2,
    title: "Segunda sesión simulada",
    shortTitle: "Profundización",
    focus: "Profundización del motivo de consulta y temas abiertos."
  },
  {
    number: 3,
    title: "Tercera sesión simulada",
    shortTitle: "Contexto y recursos",
    focus: "Exploración de contexto, recursos, patrones y redes de apoyo."
  },
  {
    number: 4,
    title: "Cuarta sesión simulada",
    shortTitle: "Cierre formativo",
    focus: "Cierre formativo, síntesis del proceso y reflexión final."
  }
];

export const sessionStages = SESSION_FLOW.map((stage) => ({
  number: stage.number,
  label: `Sesión ${stage.number}`,
  title: stage.shortTitle,
  description: stage.focus
}));

export const closureExamples = [
  "Antes de terminar, me gustaría resumir brevemente lo que conversamos.",
  "¿Hay algo importante que sientas que no alcanzamos a abordar hoy?",
  "Podríamos retomar esto en una próxima sesión simulada.",
  "¿Cómo te vas después de esta conversación?",
  "Gracias por compartir esto. Podemos continuar profundizando con calma."
];

export const nextSessionAgreementResponses = {
  tomas: "Sí... creo que podría seguir hablando de esto otro día. Igual me cuesta, pero no fue tan incómodo como pensé.",
  valentina: "Sí, creo que me serviría seguir ordenando esto. Siento que quedaron varias cosas dando vueltas.",
  marcos: "Podría ser. Me cuesta hacerme el tiempo, pero creo que necesito seguir hablando de esto.",
  elena: "Sí, me gustaría. Me cuesta pedir ayuda, pero creo que me hizo bien conversar.",
  nicolas: "No sé... pero podría venir otra vez. Al menos no sentí que me estuvieran retando.",
  camila: "Sí, creo que me serviría seguir. Me cuesta poner límites y siento que esto no se ordena en una sola conversación.",
  rodrigo: "Podría ser. No soy muy bueno para hablar de esto, pero quedé pensando en varias cosas.",
  fernanda: "Sí, me gustaría seguir. Volver al trabajo me sigue dando vueltas y creo que necesito ir de a poco.",
  hector: "Sí, puede ser. Me cuesta hablar de estas cosas, pero conversar me ayudó a mirar el día de otra forma.",
  daniela: "Sí, creo que me haría bien. Me cuesta decir que estoy cansada, pero acá pude decirlo un poco más.",
  andres: "Sí, me serviría. Siento que esto de la universidad y no encajar quedó dando vueltas.",
  patricia: "Sí, me gustaría. Quisiera seguir pensando cómo hablar con mi hija sin que todo termine en pelea.",
  miguel: "Sí, creo que podría seguir. Hay cosas de estar acá y extrañar lo de antes que no alcancé a explicar bien.",
  sofia: "Sí... creo que podría seguir. Me dio un poco de vergüenza, pero también me alivió decirlo.",
  claudio: "Sí, podría seguir. Siento que esto de estar estancado no se entiende completo en una sola conversación."
};

export const sessionTwoOpenings = {
  tomas: "La otra vez hablamos un poco del computador y de que en persona me cuesta saber qué hacer. Me quedé pensando en eso.",
  valentina: "La vez pasada hablamos de la universidad y de la culpa cuando descanso. Creo que eso me siguió dando vueltas.",
  marcos: "La vez pasada hablamos de la pega y de cómo llego a la casa. Me di cuenta de que sí me está afectando más de lo que digo.",
  elena: "La otra vez hablamos de que me cuesta pedir ayuda. Me quedé pensando en eso, porque creo que es verdad.",
  nicolas: "La vez pasada hablamos del colegio y de que no me gusta sentir que me retan. No sé, me quedé pensando un poco.",
  camila: "La vez pasada hablamos de que me cuesta decir que no. Me di cuenta de que sigo respondiendo mensajes aunque esté cansada.",
  rodrigo: "La vez pasada hablamos de la separación y de mis hijos. Me quedó dando vueltas eso de hacerme el fuerte.",
  fernanda: "La vez pasada hablamos de volver al trabajo y de sentirme observada. Eso me siguió apareciendo durante la semana.",
  hector: "La vez pasada hablamos de la jubilación y de la rutina. Me quedé pensando en cuánto extraño sentirme útil.",
  daniela: "La vez pasada hablamos de estudiar, cuidar y sentir culpa por querer un rato para mí. Eso me quedó dando vueltas.",
  andres: "La vez pasada hablamos de la universidad y de sentir que no encajo. Me fijé en que me comparo más de lo que digo.",
  patricia: "La vez pasada hablamos de mi hija y de cómo terminamos peleando. Me quedé pensando en que detrás de mi enojo hay miedo.",
  miguel: "La vez pasada hablamos de migrar y de empezar de cero. Me quedé pensando en lo mucho que extraño algunas partes de mi vida anterior.",
  sofia: "La vez pasada hablamos de las redes y de cómo me comparo. Me dio vergüenza, pero también me hizo sentido.",
  claudio: "La vez pasada hablamos de la rutina y de sentirme estancado. Me quedé pensando en eso de estar en piloto automático."
};

export const sessionThreeOpenings = {
  tomas: "Me quedé pensando en lo que hablamos del computador y del colegio. Creo que en mi casa también se repite siempre la misma discusión.",
  valentina: "Me quedé pensando en cómo se mezcla la universidad con lo que esperan de mí. Creo que mi forma de descansar también tiene que ver con eso.",
  marcos: "Me quedé pensando en cómo la pega se mete en mi casa. Creo que no es solo cansancio.",
  elena: "Me quedé pensando en lo difícil que me resulta pedir ayuda. Creo que me acostumbré demasiado a sostener a otros.",
  nicolas: "Me quedé pensando en el colegio y en que casi siempre prefiero quedarme callado. No sé si es solo por las notas.",
  camila: "Me quedé pensando en cómo termino disponible para todos. Creo que no es solo falta de tiempo, también me da culpa decir que no.",
  rodrigo: "Me quedé pensando en cómo cambió mi lugar en la familia después de separarme. Creo que intento verme fuerte todo el tiempo.",
  fernanda: "Me quedé pensando en volver al trabajo y en esa sensación de que todos van a mirar si fallo.",
  hector: "Me quedé pensando en la rutina. Creo que desde que jubilé me cuesta saber qué lugar ocupo durante el día.",
  daniela: "Me quedé pensando en cómo intento estudiar, cuidar y no perderme a mí misma en el intento.",
  andres: "Me quedé pensando en la universidad y en sentir que estoy de visita en un lugar donde todos parecen saber moverse.",
  patricia: "Me quedé pensando en la relación con mi hija. Creo que a veces parto desde el miedo y termino controlando más.",
  miguel: "Me quedé pensando en lo de empezar de cero. Creo que mi contexto acá y lo que dejé allá se mezclan más de lo que digo.",
  sofia: "Me quedé pensando en lo de las redes. Creo que no es solo mirar el celular, es cómo quedo después.",
  claudio: "Me quedé pensando en mi rutina. Creo que hay patrones que me ordenan, pero también me dejan quieto."
};

export const sessionFourOpenings = {
  tomas: "Creo que estas conversaciones me han servido para ordenar un poco lo del computador, mi casa y el colegio.",
  valentina: "Creo que estas conversaciones me han servido para mirar la culpa y la exigencia con un poco más de distancia.",
  marcos: "Creo que estas conversaciones me han servido para reconocer que la pega me estaba llegando más a la casa de lo que quería aceptar.",
  elena: "Creo que estas conversaciones me han servido para hablar un poco más de mí, no solo de los demás.",
  nicolas: "No sé si cambió todo, pero al menos pude decir algunas cosas sin sentir que me estaban retando.",
  camila: "Creo que estas conversaciones me han servido para notar cuánto me cuesta dejar de estar disponible para todos.",
  rodrigo: "Creo que estas conversaciones me han servido para pensar mi lugar después de la separación, aunque todavía me cuesta.",
  fernanda: "Creo que estas conversaciones me han servido para ordenar un poco el miedo a volver y sentirme observada.",
  hector: "Creo que estas conversaciones me han servido para mirar la jubilación no solo como dejar de trabajar, sino como buscar otra rutina.",
  daniela: "Creo que estas conversaciones me han servido para decir que estoy cansada sin sentir que eso me hace menos mamá.",
  andres: "Creo que estas conversaciones me han servido para entender un poco mejor por qué me cuesta sentir que pertenezco.",
  patricia: "Creo que estas conversaciones me han servido para mirar el miedo que aparece detrás de las peleas con mi hija.",
  miguel: "Creo que estas conversaciones me han servido para poner en palabras lo de migrar y empezar de nuevo.",
  sofia: "Creo que estas conversaciones me han servido para mirar las redes sin hacer como que no me importan.",
  claudio: "Creo que estas conversaciones me han servido para ordenar esta sensación de estar detenido, aunque por fuera todo funcione."
};

export function getNextSessionAgreement(caseId) {
  return nextSessionAgreementResponses[caseId] || "Sí, creo que podríamos continuar en otra sesión simulada.";
}

export function getSessionOpening(caseId, sessionNumber, summary) {
  if (sessionNumber === 1) return "";
  if (sessionNumber === 2) {
    return sessionTwoOpenings[caseId] || `La vez pasada hablamos de ${summary?.temasExplorados?.[0] || "lo que me está pasando"}. Me quedé pensando en eso.`;
  }
  if (sessionNumber === 3) {
    return sessionThreeOpenings[caseId] || "Me quedé pensando en lo que conversamos antes. Creo que hay cosas de mi contexto que igual influyen.";
  }
  if (sessionNumber === 4) {
    return sessionFourOpenings[caseId] || "Creo que estas conversaciones me han servido para ordenar un poco lo que me pasa.";
  }
  return "Podemos retomar lo que veníamos conversando y revisar qué temas siguen abiertos.";
}

export function getSessionStage(sessionNumber) {
  return SESSION_FLOW.find((stage) => stage.number === sessionNumber) || SESSION_FLOW[0];
}

export function getNextSessionNumber(sessionNumber) {
  return sessionNumber < SESSION_FLOW.length ? sessionNumber + 1 : null;
}

export function getSessionClosureTitle(sessionNumber) {
  const titles = {
    1: "Cierre de la primera entrevista",
    2: "Cierre de la segunda sesión",
    3: "Cierre de la tercera sesión",
    4: "Cierre del proceso formativo"
  };
  return titles[sessionNumber] || `Cierre de la sesión ${sessionNumber}`;
}
