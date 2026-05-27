export const sessionStages = [
  {
    number: 1,
    label: "Sesión 1",
    title: "Entrevista inicial",
    description: "Primer acercamiento al motivo de consulta ficticio, encuadre y exploración general."
  },
  {
    number: 2,
    label: "Sesión 2",
    title: "Profundización",
    description: "Retoma lo explorado en la primera entrevista para profundizar el motivo central."
  },
  {
    number: 3,
    label: "Sesión 3",
    title: "Contexto y recursos",
    description: "Estructura preparada para explorar contexto, apoyos y recursos en futuras versiones."
  },
  {
    number: 4,
    label: "Sesión 4",
    title: "Cierre formativo",
    description: "Estructura preparada para revisar el proceso simulado y practicar cierre."
  }
];

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

export function getNextSessionAgreement(caseId) {
  return nextSessionAgreementResponses[caseId] || "Sí, creo que podríamos continuar en otra sesión simulada.";
}

export function getSessionOpening(caseId, sessionNumber, summary) {
  if (sessionNumber === 1) return "";
  if (sessionNumber === 2) {
    return sessionTwoOpenings[caseId] || `La vez pasada hablamos de ${summary?.temasExplorados?.[0] || "lo que me está pasando"}. Me quedé pensando en eso.`;
  }
  return "Podemos retomar lo que veníamos conversando y revisar qué temas siguen abiertos.";
}
