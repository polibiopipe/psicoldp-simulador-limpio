export const tomasTaskResponses = {
  byType: {
    anxiety_register: {
      accepted: "Ya... si es anotar algo corto, podria intentarlo.",
      partial: "Anote dos veces. Una fue en inspectoria y otra cuando un companero me hablo y no supe que decir.",
      notDoneLowTrust: "No lo hice. Se me olvido.",
      judged: "No vi para que, si al final igual era para decir que juego mucho."
    },
    family_discussion_observation: {
      accepted: "Podria fijarme. Pero no prometo escribir mucho.",
      helpful: "Me di cuenta de que peleamos siempre a la misma hora, cuando mi mama pregunta por las tareas o el computador."
    },
    trusted_person: {
      accepted: "No se si hablaria con alguien del colegio. Quizas con Nico.",
      partial: "No hable con nadie del colegio. Pero le conte algo a Nico."
    },
    gradual_game_limit: {
      imposed: "No lo hice. Era obvio que no iba a funcionar si era como castigo.",
      gradual: "Un dia apague antes. No fue tanto, pero no pelee esa noche."
    }
  },
  concrete: [
    { id: "tomas-task-concrete-1", text: "Ya... si es algo concreto y corto, podria intentarlo.", topic: "tarea", tags: ["taskAccepted"] }
  ],
  tooBroad: [
    { id: "tomas-task-broad-1", text: "Eso suena mucho. Si lo pienso asi, me dan ganas de no hacer nada.", topic: "tarea" }
  ],
  emotionallyPremature: [
    { id: "tomas-task-premature-1", text: "No se si estoy listo para hablar de eso asi de directo.", topic: "tarea" }
  ],
  noPreviousTask: [
    { id: "tomas-task-none-1", text: "No me acuerdo que hubiera una tarea clara. Podemos dejar algo mas concreto si quieres.", topic: "tarea" }
  ],
  partial: [
    { id: "tomas-task-partial-1", text: "La hice a medias. Me cuesta acordarme, pero algo anote.", topic: "tarea" }
  ],
  notDone: [
    { id: "tomas-task-notdone-1", text: "No la hice. No fue por molestar, simplemente la fui dejando.", topic: "tarea" }
  ],
  helpful: [
    { id: "tomas-task-helpful-1", text: "Me sirvio un poco ver que no siempre me encierro por lo mismo.", topic: "tarea" }
  ]
};
