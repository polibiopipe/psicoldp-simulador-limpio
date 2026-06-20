const commonResponseGuidelines = [
  "Responder primero a la pregunta concreta.",
  "Usar lenguaje cotidiano, no clínico ni académico.",
  "No mencionar categorías internas del sistema.",
  "No explicar toda la historia de inmediato.",
  "Abrirse un poco más si el estudiante valida o pregunta con respeto.",
  "Cerrarse o responder más breve si el estudiante juzga o presiona.",
  "No repetir exactamente la misma frase dentro de la misma entrevista."
];

const commonProgressiveDisclosure = {
  low: "Responde breve, con cautela y sin entregar toda la historia.",
  medium: "Entrega contexto concreto y algún matiz emocional.",
  high: "Puede reconocer contradicciones, necesidades y ejemplos más personales."
};

const learningObjectivesByProfile = {
  tomas: [
    "Realizar un encuadre inicial claro y respetuoso.",
    "Explorar el motivo de consulta sin juzgar el uso de videojuegos.",
    "Diferenciar conducta observable de posible malestar emocional.",
    "Indagar contexto familiar y social de forma gradual.",
    "Usar preguntas abiertas, validacion y seguimiento contextual.",
    "Cerrar la entrevista dejando continuidad formativa."
  ],
  camila: [
    "Explorar sobrecarga relacional y dificultad para poner limites.",
    "Identificar emociones asociadas al cansancio y disponibilidad hacia otros.",
    "Validar sin reforzar culpa ni autoexigencia.",
    "Indagar red de apoyo y recursos personales.",
    "Cerrar con una sintesis cuidadosa del motivo inicial."
  ],
  daniela: [
    "Explorar maternidad reciente, estudio y autocuidado.",
    "Indagar culpa, cansancio y exigencias del rol.",
    "Validar la experiencia sin idealizar la maternidad.",
    "Explorar red de apoyo y distribucion de responsabilidades.",
    "Cerrar con sintesis y continuidad."
  ],
  marcos: [
    "Explorar estres laboral sin reducirlo solo a rendimiento.",
    "Indagar cansancio, irritabilidad y perdida de sentido.",
    "Diferenciar sintomas, contexto laboral y recursos disponibles.",
    "Evitar entregar soluciones prematuras.",
    "Favorecer reflexion sobre malestar y funcionamiento cotidiano."
  ],
  valentina: [
    "Explorar sobrecarga academica y autoexigencia.",
    "Indagar expectativas familiares y personales.",
    "Validar el cansancio sin patologizar de inmediato.",
    "Explorar habitos de descanso y apoyo.",
    "Cerrar identificando temas relevantes para continuar."
  ]
};

const referredByByProfile = {
  tomas: "Mis papás insistieron. Yo no sé si habría venido solo, pero tampoco quería seguir peleando por lo mismo.",
  camila: "Vine por mi cuenta, aunque me costó reconocer que necesitaba hablar de esto. Sentía que ya no estaba pudiendo con todo.",
  daniela: "Vine por mi cuenta. Me costó decidirlo, porque siento culpa cada vez que pienso en mí, pero necesitaba hablarlo.",
  marcos: "Mi pareja me sugirió hablar. Al principio lo tomé como exageración, pero creo que algo de razón tenía.",
  valentina: "Vine por mi cuenta, porque me sentí sobrepasada. Igual me costó admitir que necesitaba parar un poco."
};

const commonActiveInteractionPatterns = {
  asksForClarification: ["No se si entendi bien... ¿me preguntas por lo que dije recien?"],
  asksAboutConfidentiality: ["¿Eso significa que lo que diga no se va a contar tal cual a otras personas?"],
  reactsToValidation: ["Eso que dices me ayuda un poco."],
  resistsPressure: ["Dicho asi me cuesta un poco responder."],
  givesOpinion: ["No se si lo veo tan simple."],
  asksInterviewer: ["¿Tu como lo ves?"],
  interviewDiscomfort: ["Me cuesta un poco hablar asi, pero puedo intentar."]
};

const activeInteractionPatternsByProfile = {
  tomas: {
    asksForClarification: ["No se si entendi... ¿me preguntas por mi casa o por lo del computador?"],
    asksAboutConfidentiality: ["¿Y eso significa que mis papas no van a saber todo lo que diga?"],
    reactsToValidation: ["Eso que dices me ayuda un poco, porque normalmente siento que ya vienen con una idea hecha."],
    resistsPressure: ["No se... dicho asi suena como si estuviera haciendo algo malo."],
    givesOpinion: ["No se si es que no quiera salir; es mas como que afuera no se bien que hacer."],
    asksInterviewer: ["¿Usted cree que jugar mucho esta tan mal?"],
    interviewDiscomfort: ["Me cuesta un poco hablar asi, pero igual puedo intentar."]
  },
  camila: {
    asksForClarification: ["No se si entendi... ¿me preguntas por mi familia o por esto de decir que no?"],
    asksAboutConfidentiality: ["¿Y esto queda como un espacio para hablarlo sin que parezca que estoy culpando a alguien?"],
    reactsToValidation: ["Gracias. Me ayuda que no suene como que estoy siendo egoista."],
    resistsPressure: ["Me cuesta responder si suena como que deberia cortar todo de golpe."],
    givesOpinion: ["Creo que no es que no quiera ayudar; es que a veces me olvido de preguntarme si puedo."],
    asksInterviewer: ["¿Esta mal que me canse si igual quiero a mi familia?"],
    interviewDiscomfort: ["Me da un poco de culpa hablar tanto de mi."]
  },
  daniela: {
    asksForClarification: ["No se si entendi... ¿me preguntas por mi hijo, por estudiar o por como estoy yo?"],
    asksAboutConfidentiality: ["¿Y puedo hablar de esto sin que suene como que no quiero ser mama?"],
    reactsToValidation: ["Gracias. Me ayuda que no lo tomes como que soy mala mama."],
    resistsPressure: ["Me cuesta si suena como que deberia poder con todo no mas."],
    givesOpinion: ["Creo que una puede amar mucho a su hijo y aun asi estar agotada."],
    asksInterviewer: ["¿Es muy raro sentirse culpable por querer descansar?"],
    interviewDiscomfort: ["Me cuesta decir esto en voz alta, porque enseguida me siento culpable."]
  },
  marcos: {
    asksForClarification: ["No se si entendi... ¿me preguntas por la pega o por como llego a la casa?"],
    asksAboutConfidentiality: ["¿Y esto queda aca? No me acomoda sentir que estoy ventilando cosas de mi casa."],
    reactsToValidation: ["Eso me sirve, porque no quiero que parezca solo falta de actitud."],
    resistsPressure: ["Si lo ponemos asi, suena como que yo no quisiera hacerme cargo."],
    givesOpinion: ["No creo que sea solo cansancio de dormir poco; es mas como desgaste."],
    asksInterviewer: ["¿Hablar de esto realmente sirve, o es solo cansancio acumulado?"],
    interviewDiscomfort: ["No soy mucho de hablar de estas cosas, pero puedo seguir."]
  },
  valentina: {
    asksForClarification: ["No se si entendi... ¿me preguntas por la universidad o por como me lo estoy tomando?"],
    asksAboutConfidentiality: ["¿Y puedo decir esto sin que suene como que no soy capaz?"],
    reactsToValidation: ["Gracias. Me ayuda que no lo tomes como simple desorganizacion."],
    resistsPressure: ["Me cuesta si suena como que solo tengo que ordenarme mejor."],
    givesOpinion: ["Yo se que deberia descansar, pero cuando paro siento que estoy perdiendo tiempo."],
    asksInterviewer: ["¿Estoy exagerando, o tiene sentido sentirse tan sobrepasada?"],
    interviewDiscomfort: ["Me da un poco de verguenza decir que no puedo con todo."]
  }
};

const validationElaborationByProfile = {
  tomas: [
    "Creo que lo que más me cuesta es que en mi casa ya parten pensando que el computador explica todo.",
    "A veces me encierro a jugar porque ahí no tengo que pensar tanto qué decir.",
    "En persona me quedo pensando demasiado y al final prefiero callarme.",
    "Cuando siento que me van a retar, dejo de explicar lo que me pasa y me voy a mi pieza.",
    "Con la gente del colegio me cuesta entrar en la conversación, aunque sí quiera estar ahí."
  ],
  valentina: [
    "Cuando descanso, mi cabeza sigue haciendo listas de todo lo que debería estar avanzando.",
    "Me da miedo bajar el ritmo y sentir que estoy decepcionando a los demás.",
    "No es solo la cantidad de cosas; es que nunca siento que lo que hago sea suficiente.",
    "Termino una tarea y casi de inmediato empiezo a pensar en la siguiente.",
    "Me cuesta disfrutar un descanso porque estoy calculando cuánto tiempo podría estar aprovechando."
  ],
  marcos: [
    "Me doy cuenta de que llego sin paciencia y termino respondiendo mal por cosas chicas.",
    "No es solo sueño; es como si siguiera trabajando por dentro incluso cuando ya llegué a la casa.",
    "Antes sentía más sentido en lo que hacía. Ahora cumplo, pero me siento bastante apagado.",
    "Me preocupa que mi pareja reciba una versión mía que está siempre corta de paciencia.",
    "A veces el fin de semana tampoco logro desconectarme porque sigo pensando en pendientes."
  ],
  camila: [
    "Muchas veces digo que sí antes de preguntarme si realmente puedo ayudar.",
    "Me da miedo que poner un límite haga que los demás piensen que ya no me importan.",
    "A veces siento rabia por estar siempre disponible y después me culpo por sentirla.",
    "No siempre me piden ayuda directamente; muchas veces yo misma me adelanto a ofrecerla.",
    "Cuando intento descansar, sigo mirando mensajes por si alguien necesita algo."
  ],
  daniela: [
    "Incluso cuando alguien me ayuda, siento que debería estar aprovechando ese rato para hacer otra cosa.",
    "Me da culpa necesitar descanso, como si cansarme significara que estoy fallando.",
    "Extraño tener un rato para mí sin sentir que estoy dejando de lado a mi hijo o mis estudios.",
    "A veces postergo cosas de la universidad y después siento que no estoy cumpliendo en ninguna parte.",
    "Me cuesta pedir ayuda porque siento que debería poder organizarme sola."
  ]
};

const closureResponsesByProfile = {
  tomas: [
    "Gracias... igual me cuesta hablar de esto, pero me sirve que no lo tomes como un reto. Nos vemos.",
    "Ya, está bien. Me costó hablar, pero podemos seguir otro día.",
    "Gracias por escuchar. Nos vemos en la próxima sesión."
  ],
  valentina: [
    "Gracias. Me sirvió ordenar un poco lo que hablamos. Nos vemos en la próxima sesión.",
    "Está bien. Quedaron cosas dando vueltas, pero prefiero retomarlas otro día.",
    "Gracias por escucharme. Podemos continuar con calma la próxima vez."
  ],
  marcos: [
    "Gracias. No soy mucho de hablar de esto, pero me sirvió ordenarlo. Nos vemos.",
    "Está bien. Podemos dejarlo hasta acá y retomarlo en la próxima sesión.",
    "Gracias por la conversación. Me voy un poco más claro que cuando llegué."
  ],
  camila: [
    "Gracias. Me sirvió hablar sin sentir que estaba siendo egoísta. Nos vemos.",
    "Está bien. Podemos seguir conversándolo con calma la próxima vez.",
    "Gracias por escucharme. Por hoy prefiero dejarlo hasta acá."
  ],
  daniela: [
    "Gracias. Me ayudó poder decirlo sin sentirme juzgada. Nos vemos en la próxima sesión.",
    "Está bien. Prefiero dejarlo hasta acá por hoy y seguir otro día.",
    "Gracias por escucharme. Me voy un poco más tranquila."
  ]
};

const contextualFollowUpsByProfile = {
  valentina: {
    seguimiento_descanso_culpa: [
      "Cuando intento descansar, empiezo a pensar en todo lo que todavía no termino y me cuesta soltarlo.",
      "Puedo estar sentada sin hacer nada, pero mi cabeza sigue armando listas y diciéndome que estoy perdiendo tiempo."
    ]
  },
  marcos: {
    seguimiento_llegada_casa: [
      "Llego con la cabeza llena de pendientes y con muy poca paciencia para conversar.",
      "Apenas entro a la casa quiero que nadie me pida nada, y después me da culpa reaccionar así."
    ]
  },
  camila: {
    seguimiento_limites: [
      "Cuando intento decir que no, enseguida pienso que la otra persona se va a molestar conmigo.",
      "Muchas veces termino diciendo que sí para evitar la culpa, aunque ya sepa que no me da la energía."
    ]
  },
  daniela: {
    seguimiento_culpa_descanso: [
      "Que si descanso siento que estoy dejando de hacer algo por mi hijo o por mis estudios.",
      "Aunque esté agotada, una parte de mí insiste en que debería seguir y aprovechar cada minuto."
    ]
  }
};

export const caseProfiles = {
  tomas: createProfile({
    id: "tomas",
    name: "Tomás",
    age: 16,
    difficulty: "intermedio",
    mainTheme: "Aislamiento y videojuegos",
    shortDescription: "Adolescente reservado, con tensión familiar por uso del computador y dificultad para relacionarse en persona.",
    image: "/casos/tomas.png",
    presentationStyle: "Adolescente reservado, responde breve al inicio y se incomoda si siente juicio.",
    communicationStyle: "Frases cortas, dudas y pausas. No usa lenguaje clínico. Evita explicar demasiado al comienzo.",
    reasonForConsultation: "Sus padres están preocupados porque pasa mucho tiempo jugando, sale poco y discuten frecuentemente por ese tema.",
    initialAttitude: "Llega algo obligado por sus padres. No está completamente convencido de hablar.",
    emotionalCore: "Se siente juzgado, pasado a llevar, raro en situaciones sociales y más seguro en el mundo del juego.",
    familyContext: "Vive con sus padres. Las discusiones familiares giran en torno al computador. Siente que sus padres ven solo el juego.",
    socialContext: "Le cuesta relacionarse en persona. Prefiere espacios donde sabe qué hacer, como juegos online.",
    academicOrWorkContext: "Asiste al colegio. No necesariamente presenta un problema académico central, pero se siente incómodo en interacciones presenciales.",
    dailyRoutine: "Colegio, casa, computador y juegos online. Tiende a evitar conversaciones familiares.",
    protectiveFactors: "Tiene capacidad de reflexión cuando no se siente atacado. Puede reconocer que el juego cumple una función emocional.",
    riskSignals: "Aislamiento social, dificultad para comunicar malestar y discusiones familiares frecuentes. No asumir riesgo grave si no aparece en la conversación.",
    whatThePatientKnows: "Sabe que sus padres están preocupados por el computador.",
    whatThePatientAvoids: "Evita hablar directamente de emociones profundas al inicio.",
    phrasesTheyUse: [
      "No sé bien cómo explicarlo.",
      "Siento que ven solo esa parte.",
      "No es solo jugar por jugar.",
      "En persona me cuesta saber qué decir.",
      "En el juego por lo menos sé qué hacer."
    ],
    topics: {
      saludo: ["Hola...", "Hola. No sé muy bien qué decir, pero estoy aquí."],
      estado_actual: [
        "No sé... un poco incómodo. Todavía no sé muy bien qué decir.",
        "Más o menos. Vine porque mis papás insistieron.",
        "Estoy aquí, pero no sé si quiero hablar tanto todavía."
      ],
      presentacion_personal_abierta: [
        "No sé bien qué contar... tengo 16, voy al colegio y últimamente en mi casa están preocupados porque paso mucho tiempo jugando. A mí me cuesta explicarlo, porque no siento que sea solo el computador.",
        "Soy Tomás, tengo 16. Voy al colegio y paso harto tiempo en el computador. En mi casa dicen que eso es un problema, pero yo siento que hay más cosas."
      ],
      motivo_consulta: [
        "Creo que es por el tema del computador. Mis papás dicen que paso mucho tiempo jugando y que casi no salgo, pero yo siento que no es tan simple.",
        "Mis papás están preocupados porque juego mucho. Pero siento que para ellos todo se reduce a eso.",
        "Me trajeron por el computador y porque dicen que estoy muy encerrado. Yo no sé si habría venido solo."
      ],
      familia: [
        "En mi casa todo termina siendo por el computador. Mis papás se preocupan, pero a veces parten retándome.",
        "Siento que mis papás creen que todo se arregla si dejo de jugar.",
        "Cuando intento explicar algo, a veces ya siento que viene el reto y me cierro."
      ],
      hermanos: ["No tengo hermanos. Vivo con mis papás."],
      convivencia: [
        "Vivo con mis papás. Últimamente discutimos harto por el tema del computador.",
        "Vivo con mis papás. Paso harto tiempo en mi pieza, sobre todo cuando empiezan las discusiones."
      ],
      convivencia_familia: [
        "Vivo con mis papás.",
        "Vivo con mis papás. Paso harto tiempo en mi pieza, sobre todo cuando empiezan las discusiones."
      ],
      videojuegos: [
        "Juego más online, cosas de equipo. Me gusta porque ahí sé qué tengo que hacer.",
        "En el computador siento que tengo un lugar más claro. Afuera me cuesta más saber cómo actuar.",
        "No es solo que me guste jugar. A veces es la forma que tengo de no pensar tanto."
      ],
      estudios_trabajo: [
        "Voy al colegio. No es que odie ir, pero me cuesta sentirme cómodo con los demás.",
        "En el colegio hablo poco. A veces prefiero no decir nada.",
        "No trabajo. Mi rutina es colegio, casa y computador."
      ],
      colegio_estudios: [
        "Sí, voy al colegio. Hablo poco allá; a veces prefiero no decir nada.",
        "Sí, voy al colegio. No es que odie ir, pero me cuesta sentirme cómodo con los demás."
      ],
      amistades: [
        "Tengo más contacto con gente online que en persona.",
        "En persona me cuesta más. No sé bien qué decir.",
        "En el colegio no soy de acercarme mucho. Online se me hace más fácil."
      ],
      emociones: [
        "Me siento incómodo. Como que si digo algo mal, después queda dando vueltas.",
        "Me da lata que piensen que todo es culpa del computador.",
        "A veces me siento pasado a llevar."
      ],
      rutina_diaria: [
        "Voy al colegio, vuelvo a la casa y después casi siempre termino en el computador.",
        "Después de clases me voy a mi pieza. Juego, veo videos o hablo con gente online."
      ],
      preocupacion: [
        "Me preocupa que todos crean que el problema soy yo o el computador.",
        "Me preocupa que no entiendan que en persona también me cuesta saber qué decir."
      ],
      ayuda: [
        "No sé bien. Quizás me ayudaría que no partan retándome.",
        "Me gustaría que entendieran que no es solo apagar el computador y listo."
      ],
      validacion: [
        "Gracias por decirlo así. Casi siempre parten diciendo que el computador es el problema.",
        "Eso me ayuda un poco. Me cuesta hablar cuando siento que ya tienen una opinión hecha."
      ],
      seguimiento_no_es_tan_simple: [
        "Que mis papás creen que todo es por el computador, pero no es solo eso. A veces me voy a jugar porque me siento pasado a llevar o porque no sé cómo decir lo que me pasa.",
        "Que no es solamente que me guste jugar. A veces el computador es como la forma que tengo de salir de lo que pasa en la casa."
      ],
      seguimiento_emocional_contextual: [
        "Porque no sé bien qué decir. Me cuesta hablar cuando siento que me están mirando o esperando que explique algo.",
        "Porque todavía no sé si quiero hablar mucho. Me cuesta explicar lo que me pasa sin sentir que me van a juzgar."
      ],
      seguimiento_colegio_habla_poco: [
        "Porque siento que si digo algo, los demás pueden encontrarlo raro o tonto. Entonces prefiero quedarme callado.",
        "Porque me cuesta saber qué decir. A veces pienso mucho antes de hablar y al final no digo nada."
      ],
      seguimiento_discusiones_computador: [
        "A las discusiones por el computador. Mis papás dicen que juego mucho y que casi no salgo.",
        "Casi siempre terminan siendo por el computador. Ellos dicen que juego mucho y yo siento que no escuchan lo que intento explicar."
      ],
      seguimiento_sentirse_juzgado: [
        "Me siento juzgado cuando ya vienen con la idea de que todo lo hago mal por estar en el computador. Ahí siento que no escuchan lo que me pasa.",
        "Cuando hablan como si el computador explicara todo, me siento juzgado. Es como si antes de escucharme ya tuvieran la respuesta."
      ],
      seguimiento_dificultad_social: [
        "Si... pero dicho asi igual suena raro. No es que no quiera hablar con nadie, es que a veces no se como hacerlo.",
        "Afuera me cuesta mas. En el juego por lo menos se que hacer; con gente en persona me quedo pensando demasiado."
      ],
      seguimiento_contextual: [
        "Creo que lo que trato de decir es que no juego solo por jugar. A veces ahí me siento menos raro que cuando estoy con gente.",
        "Me cuesta explicarlo sin que suene como excusa. Pero no es solo el computador; también es que afuera me bloqueo."
      ],
      cierre: ["Ya... gracias. Igual me costó, pero pude decir algo más.", "Me voy un poco más tranquilo que al inicio."],
      riesgo: ["No he pensado en hacerme daño. Más bien me encierro o me voy al computador cuando no sé cómo hablar."]
    }
  }),

  valentina: createProfile({
    id: "valentina",
    name: "Valentina",
    age: 21,
    difficulty: "intermedio",
    mainTheme: "Sobrecarga académica",
    shortDescription: "Universitaria autoexigente, cansada y con culpa al descansar.",
    image: "/casos/valentina.png",
    presentationStyle: "Universitaria amable y ordenada, intenta explicar bien lo que le pasa.",
    communicationStyle: "Habla más que Tomás, racionaliza y justifica su cansancio.",
    reasonForConsultation: "Se siente sobrepasada por la universidad, la autoexigencia y la culpa al descansar.",
    initialAttitude: "Llega dispuesta a hablar, pero minimiza su malestar comparándose con otros estudiantes.",
    emotionalCore: "Miedo a decepcionar y sensación de que su valor depende de cumplir.",
    familyContext: "Vive con su familia. Siente que confían mucho en ella y no quiere preocuparlos.",
    socialContext: "Tiene amigas, pero posterga vida social por estudiar.",
    academicOrWorkContext: "Estudia en la universidad. Vive la carrera como una demanda permanente.",
    dailyRoutine: "Clases, estudio, pendientes, listas mentales y poco descanso real.",
    protectiveFactors: "Capacidad de reflexión, compromiso con sus estudios y disposición a ordenar lo que le pasa.",
    riskSignals: "Cansancio sostenido, culpa intensa, reducción del descanso y aislamiento progresivo.",
    whatThePatientKnows: "Sabe que está cansada, pero duda si tiene derecho a sentirse así.",
    whatThePatientAvoids: "Evita decir que no puede o que necesita bajar el ritmo.",
    phrasesTheyUse: [
      "Siento que debería poder.",
      "Me cuesta parar.",
      "Cuando descanso, igual siento culpa.",
      "Mi cabeza sigue haciendo listas.",
      "No quiero decepcionar."
    ],
    topics: {
      saludo: ["Hola... sí, gracias.", "Hola. Estoy un poco nerviosa, pero bien."],
      estado_actual: [
        "Estoy cansada, pero igual me cuesta decirlo así de simple.",
        "Me siento un poco sobrepasada. Como si siempre quedara algo pendiente.",
        "No estoy mal todo el tiempo, pero me cuesta apagar la cabeza."
      ],
      presentacion_personal_abierta: [
        "Soy Valentina, tengo 21 y estudio en la universidad. Últimamente siento que estoy funcionando con pura presión, como si no pudiera parar.",
        "Me llamo Valentina. Estudio y en teoría debería estar bien, pero siento que nunca alcanzo."
      ],
      motivo_consulta: [
        "Vine porque estoy muy sobrepasada con la universidad. Me cuesta parar y cuando descanso me siento culpable.",
        "No me está alcanzando el tiempo. Incluso cuando termino algo, siento que debería estar haciendo otra cosa.",
        "Creo que estoy cansada, pero me cuesta decirlo sin justificarme."
      ],
      familia: [
        "Mi familia confía mucho en mí. No me presionan todo el día, pero yo igual siento que esperan mucho.",
        "No quiero preocuparlos, entonces muchas veces digo que estoy bien.",
        "Me da miedo que piensen que no era tan capaz como creían."
      ],
      hermanos: ["Tengo un hermano menor. Trato de no preocuparlo con estas cosas.", "Sí, tengo un hermano. En la casa intento que no se note tanto cuando estoy sobrepasada."],
      convivencia: ["Vivo con mi familia. A veces eso también pesa, porque siento que esperan mucho de mí."],
      videojuegos: ["No juego videojuegos. Si uso el celular para distraerme, después siento culpa por perder tiempo."],
      estudios_trabajo: [
        "Estudio en la universidad. Últimamente siento que no me alcanza el tiempo para todo.",
        "La universidad me ocupa casi todo el día, incluso cuando no estoy en clases.",
        "Me gusta mi carrera, pero ahora la vivo con mucha presión."
      ],
      amistades: [
        "Tengo amigas, pero muchas veces postergo verlas por estudiar.",
        "A veces me da culpa salir, como si estuviera dejando algo pendiente."
      ],
      emociones: [
        "Me cuesta aceptar que estoy cansada. Una parte mía piensa que debería poder con todo.",
        "La culpa aparece apenas descanso. Como si parar fuera fallar.",
        "Me da miedo bajar el ritmo y que se note que no soy tan capaz."
      ],
      rutina_diaria: [
        "Voy a clases, estudio, hago trabajos y después sigo pensando en lo que falta.",
        "Mi día gira en torno a cumplir. Incluso cuando paro, mi cabeza sigue revisando pendientes."
      ],
      preocupacion: [
        "Me preocupa bajar el ritmo y decepcionar a mi familia o a mí misma.",
        "Me preocupa que si descanso, me atrase y después no pueda recuperar el control."
      ],
      ayuda: ["Me gustaría ordenar esto sin sentir que estoy exagerando.", "Quizás me ayudaría entender cómo descansar sin culpa."],
      validacion: ["Gracias. Me ayuda que no lo pongas como falta de organización solamente.", "Me alivia un poco que no suene como exageración."],
      seguimiento_contextual: [
        "Creo que lo que me cuesta decir es que no puedo apagar la cabeza. Aunque esté descansando, sigo pensando en pendientes.",
        "Me cuesta separar lo que quiero yo de lo que siento que debería estar haciendo."
      ],
      cierre: ["Gracias. Me sirve haberlo dicho en voz alta.", "Me voy con la sensación de que al menos ordené un poco."],
      riesgo: ["No he pensado en hacerme daño. Lo que sí pasa es que me agoto y me cuesta parar."]
    }
  }),

  marcos: createProfile({
    id: "marcos",
    name: "Marcos",
    age: 38,
    difficulty: "intermedio",
    mainTheme: "Estrés laboral",
    shortDescription: "Adulto trabajador, cansado, irritable y con pérdida de sentido en el trabajo.",
    image: "/casos/marcos.png",
    presentationStyle: "Adulto práctico, contenido y algo escéptico al inicio.",
    communicationStyle: "Responde directo, minimiza vulnerabilidad y evita sonar quejoso.",
    reasonForConsultation: "Anda cansado, más irritable y con la sensación de que la pega le está quitando energía.",
    initialAttitude: "Llega porque alguien le sugirió hablar. No está acostumbrado a hacerlo.",
    emotionalCore: "Temor a fallar como trabajador, pareja o proveedor.",
    familyContext: "Vive con su pareja. Le preocupa llevar el cansancio y la irritabilidad a la casa.",
    socialContext: "Tiene amigos, pero no suele hablar de temas personales.",
    academicOrWorkContext: "Trabaja en una empresa con exigencias constantes y pendientes que se meten en la casa.",
    dailyRoutine: "Trabajo demandante, correos, llegada a casa sin energía y poco descanso real.",
    protectiveFactors: "Sentido de responsabilidad, capacidad de reconocer impacto en su casa y disposición a cumplir.",
    riskSignals: "Cansancio persistente, irritabilidad, desconexión afectiva y pérdida de sentido.",
    whatThePatientKnows: "Sabe que está más irritable y cansado de lo habitual.",
    whatThePatientAvoids: "Evita nombrar tristeza o vulnerabilidad.",
    phrasesTheyUse: [
      "Sigo funcionando.",
      "No me gusta verme quejándome.",
      "Llego sin energía.",
      "Estoy más corto de paciencia.",
      "La pega se me mete en la casa."
    ],
    topics: {
      saludo: ["Hola.", "Buenas.", "Hola. Podemos conversar."],
      estado_actual: [
        "Ando cansado. Más irritable también, aunque me cuesta reconocerlo.",
        "Estoy funcionando, pero no diría que estoy bien del todo.",
        "Cansado. No solo de sueño, más bien con poca paciencia."
      ],
      presentacion_personal_abierta: [
        "Soy Marcos, tengo 38 y trabajo. En general soy de seguir no más, pero últimamente estoy cansado y más irritable de lo normal.",
        "Me llamo Marcos. Trabajo hace años y suelo funcionar, pero ahora llego con poca paciencia."
      ],
      motivo_consulta: [
        "Ando cansado y más irritable. Creo que tiene que ver con la pega, aunque me cuesta reconocerlo.",
        "Últimamente llego a la casa sin energía. Sigo cumpliendo, pero me noto más pesado.",
        "Vine porque mi pareja me dijo que sería bueno hablar. Algo de razón debe tener."
      ],
      familia: [
        "Vivo con mi pareja. Me preocupa que a veces llegue tan irritable a la casa.",
        "Mi pareja nota antes que yo cuando estoy más corto.",
        "Me da lata que la gente que quiero reciba mi peor parte después del trabajo."
      ],
      hermanos: ["Tengo una hermana, pero no suelo hablar de estas cosas con ella.", "Sí, tengo una hermana. Igual estos temas los guardo más para mí."],
      convivencia: ["Vivo con mi pareja. Últimamente me preocupa llegar tan cansado a la casa.", "Vivo con mi pareja. La casa debería ser un lugar tranquilo, pero a veces llego demasiado irritable."],
      videojuegos: ["No juego videojuegos. Lo que más me consume ahora es el trabajo y el teléfono con correos."],
      estudios_trabajo: [
        "Trabajo en una empresa, en un área más bien administrativa/comercial. Paso gran parte del día resolviendo cosas y últimamente eso me está dejando sin energía.",
        "Trabajo. Estoy en una pega bien demandante, de esas donde siempre hay algo pendiente.",
        "No estudio actualmente. A veces pienso en capacitarme, pero llego muy cansado."
      ],
      amistades: ["Tengo amigos, pero no hablo mucho de estas cosas con ellos.", "Con amigos se bromea y se cambia de tema. No suelo entrar en esto."],
      emociones: [
        "Me molesta irritarme por cosas chicas. Después me da culpa.",
        "No diría que estoy triste. Es más como estar apagado.",
        "Me cuesta reconocer que estoy cansado porque igual sigo funcionando."
      ],
      rutina_diaria: ["Trabajo casi todo el día, llego a la casa y me cuesta cambiar el chip.", "La pega se me queda encima incluso cuando salgo. Llego y sigo pensando en pendientes."],
      preocupacion: [
        "Me preocupa llegar a la casa sin paciencia. Siento que cumplo en el trabajo, pero después mi familia recibe lo peor de mí.",
        "Me preocupa estar fallando en la casa por llegar tan apagado."
      ],
      ayuda: ["No sé si espero una solución. Quizás entender por qué estoy tan corto de paciencia.", "Me ayudaría ordenar esto sin que suene a queja."],
      validacion: ["Gracias. Me sirve que no lo tomes como falta de ganas.", "Me hace sentido que lo mires como desgaste, no como falta de actitud."],
      seguimiento_contextual: [
        "Que no es solo cansancio físico. Es como si llegara sin paciencia para nada, incluso para la gente que quiero.",
        "Lo que me preocupa es que sigo funcionando, pero cada vez con menos energía para mi casa."
      ],
      cierre: ["Gracias. Igual me cuesta hablar, pero sirvió ordenarlo un poco.", "No fue tan incómodo como pensé."],
      riesgo: ["No he pensado en hacerme daño. Me preocupa más estar apagado y reaccionar mal con gente que quiero."]
    }
  }),

  elena: createProfileFromSeed("elena", {
    name: "Elena", age: 52, difficulty: "avanzado", mainTheme: "Cambios vitales y soledad", image: "/casos/elena.png",
    shortDescription: "Mujer adulta, cordial y contenida, con soledad y dificultad para pedir ayuda.",
    presentationStyle: "Cordial, cuidadosa y acostumbrada a hablar primero de otros.",
    communicationStyle: "Habla con delicadeza, evita molestar y se abre lentamente.",
    reasonForConsultation: "Se siente sola, preocupada por temas familiares y con dificultad para pedir ayuda.",
    initialAttitude: "Llega amable y agradecida, pero le cuesta poner sus propias necesidades al centro.",
    emotionalCore: "Miedo a ser una carga y a no tener un lugar propio.",
    familyContext: "Tiene hijos y trata de no preocuparlos. Ha sido cuidadora por mucho tiempo.",
    socialContext: "Tiene algunas amigas, pero no siempre quiere molestar.",
    academicOrWorkContext: "Trabaja algunas horas y usa la actividad para ordenar el día.",
    dailyRoutine: "Casa, familia, algunas horas de trabajo y momentos de silencio que pesan.",
    protectiveFactors: "Cordialidad, capacidad de cuidar vínculos y disposición a conversar si se siente respetada.",
    riskSignals: "Soledad, retraimiento y dificultad para pedir ayuda.",
    whatThePatientKnows: "Sabe que se ha sentido más sola.",
    whatThePatientAvoids: "Evita decir que necesita compañía.",
    phrasesTheyUse: ["No quiero preocupar a nadie.", "Me da vergüenza pedir ayuda.", "Siempre he sido yo la que sostiene."],
    siblings: "Tengo hermanos, pero cada uno está en su vida. No suelo pedirles mucho.",
    core: {
      estado: "Me he sentido un poco sola, aunque me cuesta decirlo así.",
      motivo: "Me he sentido un poco sola. Hay cosas familiares que me tienen preocupada y me cuesta pedir ayuda.",
      familia: "Tengo hijos. No quiero cargarlos con mis cosas, por eso a veces me guardo lo que siento.",
      vivienda: "Vivo sola. Mis hijos están pendientes, pero yo trato de no preocuparlos mucho.",
      trabajo: "Trabajo algunas horas. Me ayuda a ordenar el día y mantenerme ocupada.",
      amigos: "Tengo algunas amigas, pero cada una tiene su vida y no siempre quiero molestar.",
      emocion: "Me da pudor decir que me siento sola. Me cuesta pedir compañía.",
      rutina: "Me ocupo de la casa y de algunas cosas familiares. Cuando queda silencio, ahí me pesa más.",
      preocupacion: "Me preocupa ser una carga para los demás.",
      ayuda: "Me ayudaría poder hablar sin sentir que estoy molestando.",
      seguimiento: "Creo que me cuesta hablar de mí sin pensar primero en los demás."
    }
  }),

  nicolas: createProfileFromSeed("nicolas", {
    name: "Nicolás", age: 16, difficulty: "avanzado", mainTheme: "Derivación escolar", image: "/casos/nicolas.png",
    shortDescription: "Adolescente derivado desde el colegio, breve y desconfiado si se siente interrogado.",
    presentationStyle: "Breve, retraído y sensible a sentirse retado.",
    communicationStyle: "Responde corto. Se abre un poco si no lo presionan.",
    reasonForConsultation: "El colegio lo derivó por baja participación, notas más bajas y desconexión.",
    initialAttitude: "Llega porque lo mandaron y se muestra desconfiado si siente interrogatorio.",
    emotionalCore: "Sensación de que adultos ya tienen una idea hecha de él.",
    familyContext: "Vive con su familia; en casa el tema suele ser el colegio.",
    socialContext: "Se ha alejado de compañeros y prefiere quedarse piola.",
    academicOrWorkContext: "Va al colegio y participa poco.",
    dailyRoutine: "Colegio, casa, audífonos, videos y poca conversación.",
    protectiveFactors: "Puede hablar si no se siente interrogado.",
    riskSignals: "Retraimiento, baja participación y sensación de no ser escuchado.",
    whatThePatientKnows: "Sabe que lo mandaron por estar más callado y bajar notas.",
    whatThePatientAvoids: "Evita dar información que luego puedan usar para retarlo.",
    phrasesTheyUse: ["No sé.", "Me mandaron.", "Da lo mismo.", "Prefiero quedarme piola."],
    siblings: "Tengo una hermana menor. No hablo mucho de estas cosas con ella.",
    core: {
      estado: "No sé... estoy aquí porque me dijeron que tenía que venir.",
      motivo: "Me mandaron del colegio. Dicen que estoy más callado y que bajé las notas, pero no fue idea mía venir.",
      familia: "Vivo con mi familia. En la casa casi siempre el tema termina siendo el colegio.",
      vivienda: "Vivo con mi familia. No hablo mucho de estas cosas en la casa.",
      trabajo: "Voy al colegio. No trabajo.",
      amigos: "Pocos. Antes hablaba más con algunos compañeros, pero ahora estoy más apartado.",
      emocion: "Me molesta que pregunten como si ya supieran la respuesta.",
      rutina: "Voy al colegio, vuelvo a la casa y a veces me pongo audífonos o veo videos.",
      preocupacion: "Me preocupa que los adultos ya tengan una idea hecha de mí.",
      ayuda: "Quizás me ayudaría que esto no sea otro reto por las notas.",
      seguimiento: "Creo que me cuesta hablar cuando siento que ya decidieron por mí."
    }
  }),

  camila: createProfile({
    id: "camila",
    name: "Camila",
    age: 29,
    difficulty: "intermedio",
    mainTheme: "Límites y sobrecarga relacional",
    shortDescription: "Mujer amable y complaciente, cansada de estar disponible para todos.",
    image: "/casos/camila.png",
    presentationStyle: "Amable, cuidadosa y con tendencia a minimizar sus necesidades.",
    communicationStyle: "Habla con suavidad, justifica a otros y se culpa al poner límites.",
    reasonForConsultation: "Está cansada de estar siempre disponible para familia, trabajo y amistades.",
    initialAttitude: "Llega con disposición, pero le cuesta reconocer que también necesita espacio.",
    emotionalCore: "Culpa al decir que no y miedo a que la dejen de querer si pone límites.",
    familyContext: "Ayuda constantemente a su familia y se siente responsable de resolver problemas.",
    socialContext: "Tiene amigas, pero a veces también se siente obligada a sostenerlas.",
    academicOrWorkContext: "Trabaja y sigue disponible para otros fuera del horario laboral.",
    dailyRoutine: "Trabajo, mensajes, favores familiares y poco descanso real.",
    protectiveFactors: "Empatía, responsabilidad y capacidad de mirar sus propios patrones si se siente validada.",
    riskSignals: "Sobrecarga, cansancio emocional, culpa persistente y dificultad para decir que no.",
    whatThePatientKnows: "Sabe que está cansada, pero le cuesta ponerlo como prioridad.",
    whatThePatientAvoids: "Evita decir que está enojada o que quiere dejar de ayudar.",
    phrasesTheyUse: ["No quiero ser egoísta.", "Si puedo ayudar, siento que debería hacerlo.", "Me da culpa decir que no."],
    topics: {
      saludo: ["Hola, gracias.", "Hola. Me ayuda partir con calma."],
      estado_actual: ["Estoy cansada, pero me cuesta decirlo sin sentir que estoy exagerando.", "Me siento sobrepasada, aunque igual me da culpa quejarme."],
      presentacion_personal_abierta: ["Soy Camila, tengo 29. Trabajo y ayudo harto a mi familia; últimamente siento que estoy disponible para todos menos para mí."],
      motivo_consulta: ["Vine porque estoy cansada de estar siempre disponible. Me cuesta poner límites sin sentirme mala persona.", "Siento que no paro nunca. Trabajo, ayudo, respondo mensajes, y cuando quiero descansar aparece la culpa."],
      familia: ["Ayudo harto a mi familia. Me cuesta decir que no, aunque esté cansada.", "A veces siento que si no estoy disponible, estoy fallando."],
      hermanos: ["Tengo hermanos. Muchas veces termino pendiente de cosas familiares, aunque nadie me lo pida directamente."],
      convivencia: ["Vivo sola, pero estoy muy pendiente de mi familia. A veces siento que igual estoy disponible todo el día."],
      videojuegos: ["No juego videojuegos. Uso más el celular para responder mensajes y termino disponible hasta tarde."],
      estudios_trabajo: ["Trabajo. Además ayudo mucho a mi familia, y a veces siento que mi día sigue aunque ya haya salido de la pega."],
      amistades: ["Tengo amigas, pero a veces también siento que tengo que estar para ellas.", "Me cuesta decir que no incluso en planes o favores chicos."],
      emociones: ["Me da culpa querer descansar.", "Me da miedo que se molesten conmigo si pongo límites.", "A veces siento rabia, pero después me siento mala por sentirla."],
      rutina_diaria: ["Trabajo, respondo mensajes, ayudo en cosas de mi familia y recién al final pienso en mí.", "Mi día suele llenarse de pendientes de otros."],
      preocupacion: ["Me preocupa que si empiezo a decir que no, los demás se molesten o me dejen de querer.", "Me preocupa volverme egoísta si me priorizo."],
      ayuda: ["Me gustaría entender cómo cuidarme sin sentir que abandono a los demás.", "Quizás me ayudaría aprender a decir que no sin sentir tanta culpa."],
      validacion: ["Gracias. Me ayuda que no lo mires como si fuera solo falta de carácter.", "Eso me ayuda, porque a veces siento que no tengo derecho a cansarme."],
      seguimiento_contextual: ["Creo que me cuesta reconocer que ayudar también me está agotando.", "Lo que me pesa es que digo que sí antes de preguntarme si puedo."],
      cierre: ["Gracias. Me sirve poder decir esto sin sentirme tan egoísta.", "Me voy pensando que quizás también necesito cuidarme."],
      riesgo: ["No he pensado en hacerme daño. Lo que sí siento es mucho cansancio y culpa acumulada."]
    }
  }),

  daniela: createProfile({
    id: "daniela",
    name: "Daniela",
    age: 27,
    difficulty: "intermedio",
    mainTheme: "Maternidad, estudio y autocuidado",
    shortDescription: "Madre joven y estudiante, amorosa, cansada y con culpa al pensar en sí misma.",
    image: "/casos/daniela.png",
    presentationStyle: "Cálida, cansada y cuidadosa al hablar de su maternidad.",
    communicationStyle: "Habla desde el amor por su hijo, pero le cuesta reconocer agotamiento sin culpa.",
    reasonForConsultation: "Intenta compatibilizar maternidad, estudio y autocuidado; se siente cansada y culpable.",
    initialAttitude: "Quiere hablar, pero teme sonar ingrata o mala mamá.",
    emotionalCore: "Culpa por necesitar descanso y miedo a fallar como madre.",
    familyContext: "Recibe apoyo familiar a ratos, pero siente que la responsabilidad principal queda en ella.",
    socialContext: "Se siente a otro ritmo que sus amigas.",
    academicOrWorkContext: "Estudia y cuida a su hijo. No trabaja formalmente.",
    dailyRoutine: "Cuidado del hijo, estudio, tareas, sueño fragmentado y poco tiempo propio.",
    protectiveFactors: "Amor por su hijo, deseo de estudiar y capacidad de pedir apoyo si no se siente juzgada.",
    riskSignals: "Cansancio sostenido, culpa intensa, aislamiento y poco descanso.",
    whatThePatientKnows: "Sabe que está cansada, pero le duele admitirlo.",
    whatThePatientAvoids: "Evita decir que necesita tiempo para sí misma.",
    phrasesTheyUse: ["Amo a mi hijo, pero estoy cansada.", "Me da culpa decirlo.", "No sé dónde quedo yo.", "Siento que debería poder."],
    topics: {
      saludo: ["Hola. Gracias por recibirme.", "Hola, gracias. Podemos partir."],
      estado_actual: ["Estoy cansada. Me cuesta decirlo porque de inmediato siento culpa.", "Estoy tratando de funcionar, pero hay días en que no me alcanza el cuerpo."],
      presentacion_personal_abierta: ["Soy Daniela, tengo 27. Estoy criando a mi hijo y estudiando; lo amo, pero estoy agotada y me cuesta decirlo sin culpa."],
      motivo_consulta: ["Vine porque estoy tratando de compatibilizar maternidad, estudio y algo de cuidado para mí. Me siento cansada y culpable.", "Siento que no paro. Amo a mi hijo, pero también extraño tener un rato para mí sin sentirme mala."],
      familia: ["Mi familia ayuda a ratos, pero igual siento que la responsabilidad principal queda en mí.", "Agradezco la ayuda, pero me cuesta pedirla sin sentir que estoy fallando."],
      hermanos: ["Tengo una hermana. A veces me ayuda, pero igual me da culpa pedirle cosas."],
      convivencia: ["Vivo con mi hijo. Mi familia me ayuda a ratos, pero la responsabilidad principal la siento en mí."],
      videojuegos: ["No juego videojuegos. Uso el celular en ratos cortos, casi siempre cuando mi hijo duerme."],
      estudios_trabajo: ["Estudio y cuido a mi hijo. Entre las dos cosas, el día se me va completo.", "No trabajo formalmente ahora. Entre estudiar y cuidar, siento que no paro nunca."],
      amistades: ["Veo poco a mis amigas. A veces siento que mi vida va a otro ritmo.", "Me cuesta juntarme porque siempre hay algo de mi hijo o de la universidad."],
      emociones: ["Me siento cansada y culpable al mismo tiempo.", "A veces quiero descansar, pero pienso que debería estar haciendo algo por mi hijo o por mis estudios.", "Me da pena sentir que no tengo espacio para mí."],
      rutina_diaria: ["Mi día gira entre mi hijo, clases, tareas y tratar de dormir algo.", "Hago cosas de la casa, estudio cuando puedo y muchas veces termino de noche intentando avanzar."],
      preocupacion: ["Me preocupa ser egoísta cuando pienso en mis proyectos o en descansar.", "Me preocupa fallar como mamá si necesito tiempo para mí."],
      ayuda: ["Me gustaría poder decir que estoy cansada sin sentir que estoy fallando como mamá.", "Quizás me ayudaría entender cómo cuidarme sin sentir culpa."],
      validacion: ["Gracias. Me ayuda que no suene como que soy mala mamá por estar cansada.", "Eso me alivia un poco. A veces siento que no puedo decirlo sin justificarme."],
      seguimiento_contextual: ["Creo que lo que me cuesta decir es que también necesito un espacio para mí.", "Que amo a mi hijo, pero eso no quita que esté agotada."],
      cierre: ["Gracias. Me ayuda haberlo dicho sin sentirme tan juzgada.", "Me voy pensando que quizá puedo necesitar ayuda sin que eso me haga mala mamá."],
      riesgo: ["No he pensado en hacerme daño. Lo que sí pasa es que el cansancio me sobrepasa algunos días."]
    }
  }),

  rodrigo: createProfileFromSeed("rodrigo", seedAdvanced("Rodrigo", 45, "avanzado", "Separación y reorganización familiar", "/casos/rodrigo.png", {
    desc: "Padre trabajador, práctico y contenido, afectado por una separación reciente.",
    reason: "Vino por cambios de ánimo asociados a una separación reciente y reorganización familiar.",
    core: "Trata de mostrarse fuerte, pero teme fallar como padre.",
    family: "Soy papá. Después de la separación estoy tratando de reorganizar tiempos y no afectar a mis hijos.",
    work: "Trabajo y trato de mantener todo funcionando, aunque por dentro esté más revuelto.",
    home: "Vivo solo desde la separación. Mis hijos están conmigo algunos días.",
    siblings: "Tengo hermanos, pero no hablo mucho de la separación con ellos.",
    friends: "Tengo amigos, pero no me gusta hablar mucho de esto.",
    emotion: "Me cuesta hablar de tristeza. Prefiero resolver cosas.",
    routine: "Trabajo, coordino tiempos con mis hijos y trato de que todo funcione.",
    concern: "Me preocupa fallar como papá o que mis hijos me vean mal.",
    help: "Quisiera ordenar lo que me está pasando sin desarmarme frente a todos.",
    follow: "Creo que me cuesta admitir cuánto me movió la separación.",
    phrases: ["Hay que seguir no más.", "No quiero que mis hijos me vean mal.", "Me cuesta hablar de tristeza directamente."]
  })),
  fernanda: createProfileFromSeed("fernanda", seedAdvanced("Fernanda", 34, "avanzado", "Retorno laboral", "/casos/fernanda.png", {
    desc: "Mujer cuidadosa e insegura, retomando el trabajo tras una licencia prolongada.",
    reason: "Está volviendo al trabajo después de una licencia y teme no rendir como antes.",
    core: "Teme sentirse observada y confirmar que ya no es la misma.",
    family: "Mi familia intenta apoyarme, pero a veces siento que me observan para ver si ya estoy bien.",
    work: "Estoy retomando el trabajo después de una licencia larga. Me da miedo no rendir como antes.",
    home: "Vivo con mi pareja. Me apoya, pero igual me cuesta contarle cuánto me asusta volver.",
    siblings: "Tengo una hermana. Me escucha, pero no quiero preocuparla demasiado.",
    friends: "Tengo algunas personas cerca, aunque me cuesta contarles que todavía estoy insegura.",
    emotion: "Me da miedo que todos noten que estoy distinta.",
    routine: "Estoy intentando retomar horarios, trabajo y descanso, pero anticipo críticas antes de salir.",
    concern: "Me preocupa sentirme observada y confirmar que ya no soy la misma de antes.",
    help: "Espero poder hablar de esto sin que suene a que no quiero trabajar.",
    follow: "Creo que lo difícil es volver sintiendo que todos podrían estar evaluándome.",
    phrases: ["Siento que todos van a estar mirando.", "No quiero parecer incapaz.", "Me cuesta confiar en que puedo retomar de a poco."]
  })),
  hector: createProfileFromSeed("hector", seedAdvanced("Héctor", 61, "avanzado", "Jubilación y sentido", "/casos/hector.png", {
    desc: "Adulto mayor reservado y orgulloso, en búsqueda de rutina tras jubilar.",
    reason: "Jubiló hace poco y siente vacío, pérdida de rutina y menor sentido de utilidad.",
    core: "Le cuesta aceptar que ya no lo necesitan de la misma forma.",
    family: "Tengo familia, pero no quiero que estén pendientes de mí como si no pudiera solo.",
    work: "Ya jubilé. Todavía me cuesta decirlo sin sentir que quedé fuera de algo.",
    home: "Vivo con mi esposa. Desde que jubilé paso más tiempo en la casa.",
    siblings: "Tengo hermanos, pero no hablamos mucho de estas cosas.",
    friends: "Muchos vínculos eran del trabajo y eso cambió de golpe.",
    emotion: "Me cuesta decir que me siento vacío. Suena raro después de tantos años esperando descansar.",
    routine: "Me levanto temprano igual, pero a veces no sé muy bien para qué.",
    concern: "Me preocupa perder el lugar que tenía o que me miren como alguien que ya no aporta.",
    help: "Quizás necesito encontrar una rutina que tenga sentido.",
    follow: "Creo que lo que se me movió fue sentirme útil.",
    phrases: ["Uno se acostumbra a ser útil.", "Me levanto temprano igual, pero no sé para qué.", "No quiero que estén pendientes de mí."]
  })),
  andres: createProfileFromSeed("andres", seedAdvanced("Andrés", 19, "intermedio", "Pertenencia universitaria", "/casos/andres.png", {
    desc: "Estudiante universitario nuevo, inseguro y comparativo.",
    reason: "Entró hace poco a la universidad y siente que no pertenece.",
    core: "Teme decepcionar a su familia y no estar a la altura.",
    family: "Soy primera generación en la universidad. Mi familia está orgullosa, y eso pesa.",
    work: "Estudio en la universidad. No trabajo ahora.",
    home: "Vivo con mi familia. Me apoyan, pero igual siento presión por no decepcionarlos.",
    siblings: "Tengo hermanos menores. Me miran como ejemplo, y eso también pesa.",
    friends: "Conozco gente, pero siento que todos se manejan mejor que yo.",
    emotion: "Me siento fuera de lugar, aunque trato de parecer tranquilo.",
    routine: "Voy a clases, estudio y trato de entender cómo funciona todo.",
    concern: "Me preocupa no estar a la altura y decepcionar a mi familia.",
    help: "Quisiera entender si esto le pasa a más gente o si de verdad estoy fuera de lugar.",
    follow: "Creo que lo que me cuesta es sentir que pertenezco ahí.",
    phrases: ["Siento que todos saben moverse menos yo.", "Mi familia está orgullosa y eso pesa.", "No quiero que se note que estoy perdido."]
  })),
  patricia: createProfileFromSeed("patricia", seedAdvanced("Patricia", 48, "avanzado", "Conflicto con hija adolescente", "/casos/patricia.png", {
    desc: "Madre preocupada, intensa y protectora, en conflicto con su hija adolescente.",
    reason: "Vino por conflictos con su hija adolescente y sensación de pérdida de autoridad.",
    core: "No quiere controlar, pero teme perder el vínculo y que a su hija le pase algo.",
    family: "Tengo una hija adolescente. Siento que la estoy perdiendo o que ya no me escucha.",
    work: "Trabajo y llego cansada, pero igual entro a discutir temas de la casa.",
    home: "Vivo con mi hija. Últimamente en la casa discutimos más de lo que quisiera.",
    siblings: "Tengo hermanos, pero me da vergüenza contar que en la casa discutimos tanto.",
    friends: "Tengo algunas amigas, pero no siempre cuento lo difícil que está siendo.",
    emotion: "Me da miedo perder el vínculo con mi hija.",
    routine: "Trabajo, casa y muchas conversaciones tensas con mi hija.",
    concern: "Me preocupa perder autoridad, pero también perder el vínculo con mi hija.",
    help: "Me gustaría entender cómo hablarle sin que todo termine en pelea.",
    follow: "Creo que detrás de mi enojo hay mucho miedo.",
    phrases: ["Yo solo quiero cuidarla.", "Siento que ya no me escucha.", "A veces salgo controladora cuando estoy asustada."]
  })),
  miguel: createProfileFromSeed("miguel", seedAdvanced("Miguel", 32, "intermedio", "Migración y adaptación", "/casos/miguel.png", {
    desc: "Hombre migrante, respetuoso y contenido, mezclando esperanza con cansancio.",
    reason: "Le ha costado adaptarse después de migrar y siente que empezó de cero.",
    core: "Teme perder partes de quien era antes y quedarse solo.",
    family: "Parte de mi familia está lejos. Hablamos por teléfono, aunque no es lo mismo.",
    work: "Trabajo. No es exactamente lo que hacía antes, pero por ahora me permite sostenerme.",
    home: "Vivo solo, en un lugar que arriendo. A veces se siente tranquilo, pero también solitario.",
    siblings: "Tengo hermanos lejos. Hablamos, pero cada uno está tratando de sostener lo suyo.",
    friends: "Estoy armando vínculos de a poco. Cansa tener que explicar todo desde cero.",
    emotion: "No quiero sonar ingrato, pero a veces extraño quién era antes.",
    routine: "Trabajo, hago trámites, hablo con mi familia y trato de armar vida acá.",
    concern: "Me preocupa quedarme solo acá o perder partes de quien era antes.",
    help: "Quisiera poder hablar de esto sin parecer ingrato.",
    follow: "Creo que lo difícil es armar vida acá sin perder lo que dejé atrás.",
    phrases: ["Estoy empezando de cero.", "No quiero sonar ingrato.", "Extraño quién era antes."]
  })),
  sofia: createProfileFromSeed("sofia", seedAdvanced("Sofía", 24, "intermedio", "Redes sociales y comparación", "/casos/sofia.png", {
    desc: "Joven lúcida e irónica, ambivalente frente a redes y comparación.",
    reason: "Usa intensamente redes sociales, se compara y le cuesta desconectarse.",
    core: "Le da vergüenza admitir cuánto le afecta la validación externa.",
    family: "Mi familia no entiende mucho por qué me afecta tanto lo que veo en redes.",
    work: "Estudio y trabajo algunas horas. El celular se me mete en todos los espacios.",
    home: "Vivo con mi familia. Igual paso harto tiempo en mi pieza o conectada al celular.",
    siblings: "Tengo una hermana. A veces también me comparo con lo que ella logra.",
    friends: "Tengo amistades, pero también me comparo con ellas por lo que suben.",
    emotion: "Me da vergüenza admitir que algo tan de redes me afecta tanto.",
    routine: "Estudio, trabajo y reviso redes más de lo que quisiera.",
    concern: "Me preocupa depender tanto de algo que sé que no debería importarme así.",
    help: "Quisiera entender por qué me cuesta tanto soltar el celular aunque sepa que termino peor.",
    follow: "Creo que lo que me cuesta decir es que las redes me importan más de lo que aparento.",
    phrases: ["Sé que suena superficial.", "Me comparo más de lo que digo.", "Quedo pendiente de si reaccionan."]
  })),
  claudio: createProfileFromSeed("claudio", seedAdvanced("Claudio", 40, "avanzado", "Estancamiento vital", "/casos/claudio.png", {
    desc: "Adulto racional y contenido, con rutina estable pero sensación de estancamiento.",
    reason: "Siente estancamiento vital, rutina rígida y dificultad para tomar decisiones.",
    core: "Teme mirar atrás y sentir que no cambió nada por miedo.",
    family: "Mi familia me ve como alguien ordenado. No siempre muestro que me siento estancado.",
    work: "Trabajo. Tengo estabilidad, pero siento que estoy en piloto automático.",
    home: "Vivo solo. Tengo una rutina bastante ordenada, aunque a veces eso mismo me encierra.",
    siblings: "Tengo hermanos, pero no hablo mucho de estas dudas con ellos.",
    friends: "Tengo algunos amigos, pero hablamos más de cosas prácticas que personales.",
    emotion: "Me cuesta conectar con lo que siento. Lo pienso más de lo que lo digo.",
    routine: "Tengo rutinas muy marcadas. Me ordenan, pero también me dejan quieto.",
    concern: "Me preocupa quedarme en lo mismo solo porque cambiar me da miedo.",
    help: "Quisiera entender qué me frena, sin hacer cambios impulsivos.",
    follow: "Creo que por fuera todo funciona, pero por dentro me siento detenido.",
    phrases: ["Estoy en piloto automático.", "Analizo mucho y no hago nada.", "No estoy mal en apariencia, pero algo hace ruido."]
  }))
};

function createProfile(profile) {
  const topics = {
    ...(profile.topics || {}),
    derivacion: profile.topics?.derivacion || [referredByByProfile[profile.id] || profile.reasonForConsultation].filter(Boolean)
  };
  if (validationElaborationByProfile[profile.id]) {
    topics.validacion_elaboracion = validationElaborationByProfile[profile.id];
  }
  if (closureResponsesByProfile[profile.id]) {
    topics.cierre = closureResponsesByProfile[profile.id];
  }
  if (contextualFollowUpsByProfile[profile.id]) {
    Object.assign(topics, contextualFollowUpsByProfile[profile.id]);
  }
  if (profile.id === "tomas") {
    topics.motivo_consulta = [
      "Creo que vine por mis papás. Ellos dicen que paso mucho tiempo en el computador y que casi no salgo.",
      "Creo que la consulta es por el tema del computador. Mis papás dicen que juego mucho y que casi no salgo.",
      "Mis papás quisieron que viniera porque están preocupados por el computador."
    ];
  }
  if (profile.id === "tomas") {
    topics.derivacion = [
      "Creo que vine por mis papás... ellos están preocupados porque dicen que paso mucho tiempo en el computador.",
      "Me trajeron mis papás. Ellos están preocupados por lo del computador.",
      "Mis papás. Ellos fueron los que quisieron que viniera.",
      "Mi mamá y mi papá. Yo no fui el que pidió venir."
    ];
    topics.derivacion_motivo_informal = [
      "Creo que vine por mis papás... ellos están preocupados porque dicen que paso mucho tiempo en el computador.",
      "Mis papás quisieron que viniera porque están preocupados por lo del computador."
    ];
    topics.derivacion_como_llego = [
      "Me trajeron mis papás. Ellos están preocupados por lo del computador.",
      "Vine porque mis papás quisieron que viniera. Ellos están preocupados por lo del computador."
    ];
    topics.derivacion_quien_mando = [
      "Mis papás. Ellos fueron los que quisieron que viniera.",
      "Mi mamá y mi papá. Yo no fui el que pidió venir."
    ];
    topics.amistades_red_social = [
      "Tengo algunos, pero más online. En persona me cuesta más.",
      "No muchos en persona. Hablo más con gente cuando juego.",
      "Tengo gente con la que juego, pero amigos cercanos en persona... no tantos.",
      "En el colegio hablo poco. Online se me hace más fácil hablar."
    ];
    topics.amistades_red_social_negacion = [
      "Sí tengo, pero no muchos cercanos. Me cuesta más en persona; online se me hace más fácil.",
      "Tengo gente con la que juego, pero amigos cercanos en persona... no tantos."
    ];
    topics.seguimiento_motivo_profundizacion = [
      "No es solo jugar por jugar. A veces en el computador siento que sé qué hacer, y afuera me cuesta más.",
      "El computador no es solo entretención. Ahí sé cómo moverme; con gente en persona me quedo pensando demasiado."
    ];
  }

  const basicFacts = {
    livesWith: profile.basicFacts?.livesWith || firstOf(topics.convivencia) || profile.familyContext || "",
    siblings: profile.basicFacts?.siblings || profile.siblings || firstOf(topics.hermanos) || "",
    studiesOrWork: profile.basicFacts?.studiesOrWork || firstOf(topics.estudios_trabajo) || profile.academicOrWorkContext || "",
    dailyRoutine: profile.basicFacts?.dailyRoutine || firstOf(topics.rutina_diaria) || profile.dailyRoutine || "",
    referredBy: profile.basicFacts?.referredBy || referredByByProfile[profile.id] || "",
    reasonForConsultation: profile.basicFacts?.reasonForConsultation || profile.reasonForConsultation || firstOf(topics.motivo_consulta) || ""
  };
  const personality = {
    communicationStyle: profile.personality?.communicationStyle || profile.communicationStyle || "",
    initialAttitude: profile.personality?.initialAttitude || profile.initialAttitude || "",
    emotionalTone: profile.personality?.emotionalTone || profile.emotionalCore || "",
    defensiveTriggers: profile.personality?.defensiveTriggers || "Juicio, presion, consejos rapidos o preguntas que reducen su experiencia a una sola causa.",
    openingTriggers: profile.personality?.openingTriggers || "Validacion, preguntas concretas, calma y seguimiento de lo que acaba de decir.",
    typicalPhrases: profile.personality?.typicalPhrases || profile.phrasesTheyUse || []
  };
  const clinicalNarrative = {
    visibleProblem: profile.clinicalNarrative?.visibleProblem || profile.reasonForConsultation || "",
    underlyingConflict: profile.clinicalNarrative?.underlyingConflict || profile.emotionalCore || "",
    emotionalCore: profile.clinicalNarrative?.emotionalCore || profile.emotionalCore || "",
    familyContext: profile.clinicalNarrative?.familyContext || profile.familyContext || "",
    socialContext: profile.clinicalNarrative?.socialContext || profile.socialContext || "",
    academicOrWorkContext: profile.clinicalNarrative?.academicOrWorkContext || profile.academicOrWorkContext || "",
    protectiveFactors: profile.clinicalNarrative?.protectiveFactors || profile.protectiveFactors || "",
    riskSignals: profile.clinicalNarrative?.riskSignals || profile.riskSignals || "",
    whatTheyKnow: profile.clinicalNarrative?.whatTheyKnow || profile.whatThePatientKnows || "",
    whatTheyAvoid: profile.clinicalNarrative?.whatTheyAvoid || profile.whatThePatientAvoids || "",
    whatTheyRevealEarly: profile.clinicalNarrative?.whatTheyRevealEarly || firstOf(topics.motivo_consulta) || "",
    whatTheyRevealLater: profile.clinicalNarrative?.whatTheyRevealLater || firstOf(topics.seguimiento_contextual) || profile.emotionalCore || ""
  };
  const disclosureLevels = {
    ...commonProgressiveDisclosure,
    ...(profile.disclosureLevels || profile.progressiveDisclosure || {})
  };
  const activeInteractionPatterns = mergeInteractionPatterns(
    commonActiveInteractionPatterns,
    activeInteractionPatternsByProfile[profile.id],
    profile.activeInteractionPatterns
  );

  return {
    ...profile,
    basicFacts,
    personality,
    clinicalNarrative,
    topics,
    disclosureLevels,
    activeInteractionPatterns,
    learningObjectives: profile.learningObjectives || learningObjectivesByProfile[profile.id] || [],
    responseGuidelines: [...commonResponseGuidelines, ...(profile.responseGuidelines || [])],
    progressiveDisclosure: disclosureLevels
  };
}

function firstOf(value) {
  return Array.isArray(value) ? value.find(Boolean) || "" : value || "";
}

function mergeInteractionPatterns(...sources) {
  const merged = {};
  for (const source of sources) {
    if (!source) continue;
    for (const [key, values] of Object.entries(source)) {
      merged[key] = Array.isArray(values) ? values : [];
    }
  }
  return merged;
}

function seedAdvanced(name, age, difficulty, mainTheme, image, data) {
  return {
    name,
    age,
    difficulty,
    mainTheme,
    image,
    shortDescription: data.desc,
    presentationStyle: "Paciente ficticio con voz propia, apertura gradual y estilo cotidiano.",
    communicationStyle: "Responde como persona, con frases naturales y sin lenguaje clínico.",
    reasonForConsultation: data.reason,
    initialAttitude: "Llega con disposición parcial, pero necesita confianza para profundizar.",
    emotionalCore: data.core,
    familyContext: data.family,
    socialContext: data.friends,
    academicOrWorkContext: data.work,
    dailyRoutine: data.routine,
    protectiveFactors: "Puede reflexionar si se siente escuchado y no juzgado.",
    riskSignals: "Malestar sostenido, cansancio emocional o retraimiento. No asumir riesgo grave si no aparece en la conversación.",
    whatThePatientKnows: "Reconoce parte del problema, aunque no siempre sabe cómo explicarlo.",
    whatThePatientAvoids: "Evita mostrar vulnerabilidad demasiado rápido.",
    phrasesTheyUse: data.phrases,
    siblings: data.siblings,
    core: data
  };
}

function createProfileFromSeed(id, seed) {
  return createProfile({
    id,
    name: seed.name,
    age: seed.age,
    difficulty: seed.difficulty,
    mainTheme: seed.mainTheme,
    shortDescription: seed.shortDescription,
    image: seed.image,
    presentationStyle: seed.presentationStyle,
    communicationStyle: seed.communicationStyle,
    reasonForConsultation: seed.reasonForConsultation,
    initialAttitude: seed.initialAttitude,
    emotionalCore: seed.emotionalCore,
    familyContext: seed.familyContext,
    socialContext: seed.socialContext,
    academicOrWorkContext: seed.academicOrWorkContext,
    dailyRoutine: seed.dailyRoutine,
    protectiveFactors: seed.protectiveFactors,
    riskSignals: seed.riskSignals,
    whatThePatientKnows: seed.whatThePatientKnows,
    whatThePatientAvoids: seed.whatThePatientAvoids,
    phrasesTheyUse: seed.phrasesTheyUse,
    topics: {
      saludo: [`Hola.`, `Hola, gracias.`],
      estado_actual: [seed.core.estado || seed.core.emotion],
      presentacion_personal_abierta: [`Soy ${seed.name}, tengo ${seed.age}. ${seed.shortDescription}`],
      motivo_consulta: [seed.core.motivo || seed.reasonForConsultation],
      familia: [seed.core.family || seed.core.familia || seed.familyContext],
      hermanos: [seed.siblings],
      convivencia: [seed.core.home || seed.core.vivienda || seed.familyContext],
      videojuegos: [seed.core.digital || "No es un tema central para mí. Lo mío va por otro lado."],
      estudios_trabajo: [seed.core.work || seed.core.trabajo || seed.academicOrWorkContext],
      amistades: [seed.core.friends || seed.core.amigos || seed.socialContext],
      emociones: [seed.core.emotion || seed.core.emocion || seed.emotionalCore],
      rutina_diaria: [seed.core.routine || seed.core.rutina || seed.dailyRoutine],
      preocupacion: [seed.core.concern || seed.core.preocupacion || seed.emotionalCore],
      ayuda: [seed.core.help || seed.core.ayuda || seed.whatThePatientKnows],
      validacion: ["Gracias. Me ayuda que lo mires sin juzgarme.", "Eso me ayuda a decirlo un poco más claro."],
      seguimiento_contextual: [seed.core.follow || seed.core.seguimiento || seed.emotionalCore],
      cierre: ["Gracias. Me sirve haberlo conversado con calma.", "Me quedo pensando en lo que hablamos."],
      riesgo: ["No he pensado en hacerme daño. Lo que sí pasa es que esto me pesa más de lo que muestro."]
    }
  });
}
