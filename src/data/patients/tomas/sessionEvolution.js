export const tomasSessionEvolution = {
  maxAvailableSessions: 12,
  expectedSessions: {
    minimum: 2,
    recommended: 5,
    maximum: 8
  },
  session1: "Defensivo, minimiza y sostiene que sus padres exageran. Puede hablar de juego y discusiones.",
  session2: "Si hubo buen vinculo, habla de colegio, miedo al ridiculo y sensacion de no saber que decir.",
  session3: "Puede entrar en familia: madre preocupada, padre practico, culpa con Emilia.",
  session4: "Puede reconocer funcion emocional del juego y relacion con autoestima.",
  session5Plus: "Trabajo gradual de habilidades sociales, regulacion emocional, comunicacion familiar, valores y exposicion cuidadosa.",
  betweenSessions: {
    afterSession1: "Puede llegar algo menos defensivo si el estudiante no patologizo el juego.",
    afterSession2: "Puede recordar una escena escolar si hubo validacion y seguimiento.",
    afterSession3: "Puede hablar de culpa familiar y funcion del computador con mas matices.",
    afterSession4: "Puede aceptar objetivos graduales, no castigos ni cambios abruptos.",
    afterSession5: "Puede revisar tareas pequenas y hablar de avances ambivalentes."
  },
  continueIf: [
    "No se ha explorado funcion emocional del juego.",
    "No se ha preguntado por colegio y verguenza social.",
    "No se ha evaluado red de apoyo online y presencial.",
    "No se ha explorado riesgo pasivo si aparecen frases de apagarse o desaparecer.",
    "La familia sigue apareciendo solo como conflicto por computador."
  ],
  closeIf: [
    "Se clarifico el motivo visible y la funcion emocional del juego.",
    "Se evaluo riesgo de forma cuidadosa si correspondia.",
    "Se identificaron apoyos y un objetivo gradual.",
    "El cierre no invalida el mundo online."
  ],
  referIf: [
    "Ideacion suicida activa o plan.",
    "Aislamiento extremo con deterioro escolar grave.",
    "Violencia familiar actual o vulneracion.",
    "Sintomas psicoticos o crisis aguda.",
    "Riesgo que excede entrevista formativa."
  ]
};
