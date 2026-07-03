export const marcosSessionPlan = {
  maxSessions: 4,
  expectedRange: {
    minimum: 2,
    recommended: 3,
    maximum: 4
  },
  expectedSessions: {
    minimum: 2,
    maximum: 4,
    recommended: 3
  },
  continueIf: [
    "Aun no se delimita con claridad el motivo de consulta entre cansancio, irritabilidad y tension en la convivencia.",
    "No se ha explorado como la sobrecarga laboral impacta la relacion con Paula.",
    "Quedan pendientes red de apoyo, recursos cotidianos o formas actuales de descanso.",
    "Aparecen culpa, verguenza o miedo a fallar sin una comprension suficiente.",
    "No se ha evaluado riesgo ni consumo de manera proporcionada al malestar relatado.",
    "El estudiante no acordo objetivos concretos o pasos observables para una siguiente sesion."
  ],
  closeIf: [
    "El motivo de consulta queda suficientemente claro para un proceso breve.",
    "No aparecen indicadores de riesgo actual que exijan intervencion urgente.",
    "Se exploran recursos, red de apoyo y efectos del trabajo en la vida cotidiana.",
    "Marcos puede nombrar un objetivo acotado para seguir observando su cansancio e irritabilidad.",
    "La entrevista termina con sintesis, acuerdo y limites claros del espacio simulado."
  ],
  referIf: [
    "Ideacion suicida activa, plan o perdida de control sobre impulsos.",
    "Violencia actual hacia la pareja, familia u otras personas.",
    "Consumo problematico severo o aumento marcado de consumo para regular el malestar.",
    "Sintomas psicoticos, desorganizacion severa o deterioro funcional agudo.",
    "Crisis de angustia reiteradas con compromiso importante del funcionamiento.",
    "Necesidad de evaluacion medica, laboral o psiquiatrica que excede una simulacion formativa breve."
  ],
  riskProtocolIf: [
    "Ideacion suicida activa, plan o intencion actual.",
    "Riesgo de agresion hacia Paula u otra persona.",
    "Perdida importante de control de impulsos.",
    "Crisis aguda con incapacidad de resguardar seguridad."
  ],
  sessionGoals: {
    session1: [
      "Establecer encuadre y alianza inicial.",
      "Explorar motivo de consulta, cansancio, irritabilidad y convivencia.",
      "Identificar estado emocional actual, red de apoyo y senales de riesgo.",
      "Cerrar con sintesis breve y una decision razonada sobre continuidad."
    ],
    session2: [
      "Profundizar historia del problema y escenas recientes con Paula.",
      "Explorar mandatos familiares sobre responsabilidad y pedir ayuda.",
      "Diferenciar cansancio laboral, culpa y temor a fallar.",
      "Acordar un foco de trabajo acotado para la siguiente sesion."
    ],
    session3: [
      "Revisar recursos personales y formas concretas de autocuidado.",
      "Explorar limites laborales y patrones de sobre-responsabilidad.",
      "Construir una comprension preliminar compartida del malestar.",
      "Definir si corresponde cierre, derivacion o continuidad."
    ],
    session4: [
      "Sintetizar aprendizajes del proceso simulado.",
      "Evaluar riesgo, recursos y red antes del cierre.",
      "Acordar plan de continuidad o derivacion si excede el simulador.",
      "Practicar cierre formativo sin prometer resoluciones completas."
    ]
  },
  betweenSessions: {
    afterSession1:
      "Marcos puede llegar con algo mas de confianza si hubo encuadre y escucha, pero aun evita hablar del miedo a parecerse a su padre.",
    afterSession2:
      "Si se sintio respetado, puede conectar la sobrecarga actual con escenas familiares y con su dificultad para pedir ayuda.",
    afterSession3:
      "Puede reconocer mejor el ciclo entre trabajo, cansancio, irritabilidad y culpa, aunque no necesariamente sabe como cambiarlo.",
    afterSession4:
      "Puede aceptar cierre, derivacion o continuidad, siempre que la decision se fundamente y no suene a abandono ni a solucion rapida."
  }
};
