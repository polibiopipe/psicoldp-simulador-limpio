import { clinicalResponse as response, defineClinicalAvatar } from "./defineClinicalAvatar.js";

export const claudioClinicalAvatar = defineClinicalAvatar({
  identity: {
    id: "claudio",
    name: "Claudio",
    age: 40,
    difficulty: "intermedio",
    image: "/avatar/claudio.png"
  },

  visibleSummary: {
    mainTheme: "Estancamiento vital",
    shortDescription: "Adulto racional y contenido, con una vida estable que siente cada vez más ajena.",
    presentationStyle: "Sobrio, educado y reflexivo. Piensa antes de responder y evita dramatizar.",
    communicationStyle: "Frases ordenadas, pausas breves y explicaciones analíticas que gradualmente incorporan emoción."
  },

  internalHistory: {
    summary: "Ha organizado gran parte de su vida alrededor de la estabilidad, el cumplimiento y la prudencia. Después de una separación quedó más consciente de cuánto posterga decisiones personales, aunque al inicio prefiere hablar de rutina y desgaste.",
    currentFunctioning: "Mantiene trabajo, vivienda y funcionamiento cotidiano. No presenta una crisis aguda.",
    relationshipHistory: "La separación puede abordarse desde la sesión 2, cuando existe suficiente confianza.",
    centralPattern: "Busca certeza antes de actuar; cuanto más importante es una decisión, más analiza y más quieto queda."
  },

  manifestMotive: "Sensación de estancamiento vital, rutina rígida y dificultad para tomar decisiones pese a mantener una vida estable.",
  latentMotive: "Miedo a equivocarse, sobrecontrol y una vida construida más desde el deber que desde el deseo.",

  speakingStyle: {
    tone: "sobrio, reflexivo, educado y emocionalmente contenido",
    preferredLength: "alternar respuestas breves, medias y profundas según vínculo y pregunta",
    commonPhrases: [
      "No diría que estoy en crisis.",
      "Lo he pensado bastante.",
      "Por fuera todo funciona.",
      "Me cuesta tomar una decisión si no estoy seguro.",
      "No sé si lo que tengo es miedo o costumbre."
    ],
    avoid: [
      "lenguaje clínico o académico",
      "explicaciones emocionales perfectas",
      "dramatización",
      "respuestas idénticas o frases genéricas repetidas"
    ]
  },

  emotionalRules: {
    baselineOpenness: "low",
    opensWith: ["validación", "resúmenes cuidadosos", "preguntas concretas", "respeto por la ambivalencia", "tareas pequeñas"],
    closesWith: ["consejos rápidos", "diagnósticos", "presión para decidir", "invalidación", "muchas preguntas juntas"],
    low: "Responde con hechos, rutina y explicaciones racionales. Reconoce desgaste sin profundizar todavía.",
    medium: "Puede nombrar miedo, autoexigencia, separación y dudas sobre lo que realmente quiere.",
    high: "Conecta deber, evitación y deseo, sin presentar una resolución total ni una apertura artificial."
  },

  factualResponses: {
    identidad_nombre: [response("fact-name", "Me llamo Claudio.", { topic: "identidad" })],
    edad: [response("fact-age", "Tengo 40 años.", { topic: "identidad" })],
    convivencia: [
      response("fact-home-1", "Vivo solo. Tengo una rutina bastante ordenada en la casa.", { topic: "convivencia" }),
      response("fact-home-2", "Vivo solo. Es tranquilo, aunque a veces esa misma tranquilidad se parece demasiado a estar detenido.", { topic: "convivencia", minOpenness: "medium" })
    ],
    hermanos: [response("fact-siblings", "Tengo hermanos, pero no suelo hablar con ellos de estas dudas.", { topic: "familia" })],
    estudios_trabajo: [
      response("fact-work-1", "Trabajo y tengo estabilidad laboral. Cumplo, aunque últimamente funciono por inercia.", { topic: "trabajo" }),
      response("fact-work-2", "Mi trabajo está ordenado y no tengo un problema grave ahí. Lo difícil es que ya no sé cuánto de mi rutina elegí y cuánto simplemente mantuve.", { topic: "trabajo", minSession: 2, minOpenness: "medium" })
    ],
    amistades: [response("fact-friends", "Tengo algunos amigos. Nos vemos, pero suelo hablar de cosas prácticas y no tanto de lo que me pasa.", { topic: "vinculos" })],
    derivacion: [response("fact-referral", "Vine por decisión propia. Llevaba tiempo pensando que quizás necesitaba ordenar esto con alguien.", { topic: "llegada" })],
    riesgo: [response("fact-risk", "No he pensado en hacerme daño ni siento que esté en una crisis. Es más bien un desgaste que se ha ido quedando conmigo.", { topic: "riesgo" })]
  },

  intentResponses: {
    temporal: [
      response("time-1", "Diría que empezó a sentirse más claro hace unos meses, pero mirando hacia atrás venía acumulándose desde antes.", { topic: "temporal" }),
      response("time-2", "No fue de un día para otro. Después de mi separación seguí funcionando, pero con el tiempo noté que algo había quedado más apagado.", { topic: "temporal", minOpenness: "medium" }),
      response("time-3", "Tal vez hace un año lo habría descrito solo como cansancio. Ahora veo que es algo más persistente.", { topic: "temporal" }),
      response("time-4", "Me cuesta poner una fecha exacta. Sí recuerdo que antes tenía más sensación de movimiento y que últimamente todo se volvió demasiado repetido.", { topic: "temporal", minOpenness: "medium" })
    ],
    miedo_especifico: [
      response("fear-1", "Me da miedo equivocarme. Hacer un cambio y después sentir que arruiné algo que, al menos desde afuera, funcionaba.", { topic: "miedo_especifico" }),
      response("fear-2", "Creo que temo tomar una decisión que no pueda deshacer. Esa idea me hace revisar tanto las opciones que termino sin elegir ninguna.", { topic: "miedo_especifico" }),
      response("fear-3", "Me preocupa descubrir que quería otra vida y haber esperado demasiado. Es una idea incómoda, así que muchas veces vuelvo a la rutina.", { topic: "miedo_especifico", minSession: 2, minOpenness: "medium" })
    ],
    foco_sesion: [
      response("focus-1", "Me gustaría entender por qué me cuesta tanto decidir, incluso cuando sé que algo de mi vida no me está haciendo bien.", { topic: "foco_sesion" }),
      response("focus-2", "Creo que podríamos enfocarnos en distinguir si lo que me frena es miedo, costumbre o cansancio. Ahora se me mezcla todo.", { topic: "foco_sesion" }),
      response("focus-3", "Quisiera mirar esta sensación de estar detenido sin partir de la idea de que tengo que cambiarlo todo de inmediato.", { topic: "foco_sesion" })
    ],
    confidencialidad: [
      response("confidentiality-1", "Sí, estoy de acuerdo. Me tranquiliza saberlo, porque no estoy acostumbrado a hablar mucho de estas cosas.", { topic: "encuadre" }),
      response("confidentiality-2", "Está bien. Saber que este es un espacio cuidado me permite hablar con un poco menos de cautela.", { topic: "encuadre" })
    ],
    certeza_control: [
      response("certainty-1", "Sí, puede ser. Me cuesta actuar si no tengo cierta seguridad. Y como casi nunca estoy completamente seguro, termino postergando.", { topic: "certeza_control" }),
      response("certainty-2", "Suelo revisar mucho si una decisión es razonable antes de hacerla. El problema es que esa revisión no termina de darme la certeza que busco.", { topic: "certeza_control" })
    ]
  },

  contextualFallbacks: {
    cierre: [
      response("fallback-close-1", "Está bien. Prefiero dejarlo aquí y seguir ordenándolo con calma, sin forzar una conclusión hoy.", { topic: "cierre" }),
      response("fallback-close-2", "Gracias por el espacio. Me voy con algunas ideas más claras y otras que todavía necesito pensar.", { topic: "cierre" }),
      response("fallback-close-3", "Podemos cerrar. No siento que esté resuelto, pero sí que ahora puedo mirar el problema con algo más de perspectiva.", { topic: "cierre", minSession: 3 })
    ],
    temporal: [
      response("fallback-time-1", "La primera señal fue que empecé a sentir todos los días demasiado parecidos. Eso se hizo difícil de ignorar durante el último año.", { topic: "temporal" }),
      response("fallback-time-2", "Viene de antes, pero en los últimos meses dejó de ser una incomodidad ocasional y pasó a acompañarme casi todos los días.", { topic: "temporal" }),
      response("fallback-time-3", "No tengo una fecha precisa. Lo ubico después de varios cambios personales que resolví en lo práctico, pero no terminé de procesar.", { topic: "temporal", minSession: 2 })
    ],
    miedo_especifico: [
      response("fallback-fear-1", "El miedo concreto es tomar una mala decisión y perder una estabilidad que me ha costado construir.", { topic: "miedo_especifico" }),
      response("fallback-fear-2", "También temo actuar por cansancio y descubrir después que confundí una etapa difícil con la necesidad de cambiarlo todo.", { topic: "miedo_especifico", minOpenness: "medium" })
    ],
    foco_sesion: [
      response("fallback-focus-1", "El foco podría ser entender qué necesito yo, antes de convertir esto en una lista de decisiones que debería tomar.", { topic: "foco_sesion" }),
      response("fallback-focus-2", "Me serviría ordenar la diferencia entre cuidar lo que tengo y quedarme quieto solo por temor a equivocarme.", { topic: "foco_sesion" })
    ],
    confidencialidad: [
      response("fallback-confidentiality", "Sí, me parece bien ese acuerdo. Tener claro el límite de este espacio hace más fácil que pueda hablar con honestidad.", { topic: "encuadre" })
    ],
    certeza_control: [
      response("fallback-certainty-1", "Busco una confirmación de que la decisión será correcta. Como esa garantía no existe, sigo revisando lo mismo sin avanzar.", { topic: "certeza_control" }),
      response("fallback-certainty-2", "Necesito sentir que consideré todas las variables. A veces eso parece prudencia, pero otras veces es una forma de no exponerme al error.", { topic: "certeza_control", minOpenness: "medium" })
    ],
    motivo: [
      response("fallback-motive-1", "Lo central es esta sensación de seguir cumpliendo sin sentir que realmente avanzo hacia algo elegido por mí.", { topic: "motivo" }),
      response("fallback-motive-2", "No hay un hecho único que explique que viniera. Fue notar que el desgaste seguía ahí aunque todo lo práctico estuviera en orden.", { topic: "motivo" })
    ],
    rutina: [
      response("fallback-routine-1", "La rutina me sostiene, pero también reduce casi todos mis días a cumplir y repetir. Hay poco espacio para preguntarme qué quiero.", { topic: "rutina" }),
      response("fallback-routine-2", "No diría que mis días son malos. Son predecibles, y justamente esa falta de movimiento empezó a pesarme.", { topic: "rutina" })
    ],
    decisiones: [
      response("fallback-decision-1", "Cuando tengo que elegir, intento anticipar todas las consecuencias. Esa búsqueda de una opción segura suele dejarme inmóvil.", { topic: "decisiones" }),
      response("fallback-decision-2", "Postergar me alivia por un momento porque no arriesgo nada, pero después vuelve la frustración de seguir en el mismo lugar.", { topic: "decisiones" })
    ],
    emociones: [
      response("fallback-emotion-1", "Hay cansancio, pero también frustración. Me cuesta admitirla porque desde afuera pareciera que no tengo razones para sentirme así.", { topic: "emociones" }),
      response("fallback-emotion-2", "Lo que más noto es una mezcla de inquietud y desconexión. Sigo haciendo las cosas, pero con poca sensación de estar presente.", { topic: "emociones" })
    ],
    estudios_trabajo: [
      response("fallback-work-1", "En el trabajo respondo bien y nadie diría que hay un problema. Lo que noto es que cumplo sin mucho interés y después llego a repetir la misma rutina.", { topic: "trabajo" }),
      response("fallback-work-2", "La estabilidad laboral me importa. Al mismo tiempo, a veces la uso como argumento para no revisar otras partes de mi vida.", { topic: "trabajo", minSession: 2 })
    ],
    follow_up: [
      response("fallback-follow-1", "Lo que intento explicar es que no estoy completamente mal, pero hace tiempo vivo con poca sensación de elección.", { topic: "motivo" }),
      response("fallback-follow-2", "Hay una parte práctica que funciona y otra, más personal, que siento bastante detenida. Esa contradicción es la que me cuesta ordenar.", { topic: "motivo" }),
      response("fallback-follow-3", "No tengo una respuesta cerrada. Lo que sí noto es que pienso mucho para evitar equivocarme y termino manteniendo lo mismo.", { topic: "decisiones" })
    ],
    default: [
      response("fallback-default-1", "Podría pensarlo desde lo que veníamos hablando: por fuera mantengo todo en orden, pero internamente me cuesta saber qué quiero mover.", { topic: "motivo" }),
      response("fallback-default-2", "No lo tengo completamente claro todavía. Puedo decir que la duda aparece sobre todo cuando una decisión podría cambiar mi rutina.", { topic: "decisiones" }),
      response("fallback-default-3", "Quizás necesito separar dos cosas: el cansancio de sostener lo mismo y el miedo que aparece cuando imagino cambiarlo.", { topic: "emociones" })
    ]
  },

  fallbackSynthesis: {
    temporal: {
      openings: [
        "No puedo ubicarlo en un día específico.",
        "Si intento ordenarlo en el tiempo, diría que fue apareciendo de forma gradual.",
        "La sensación no empezó de golpe."
      ],
      details: [
        "Durante los últimos meses se volvió más constante y difícil de ignorar.",
        "Primero parecía cansancio; después noté que seguía presente incluso cuando descansaba.",
        "La asocio a un período en que mantuve la rutina, pero dejé de sentir que avanzaba."
      ]
    },
    miedo_especifico: {
      openings: [
        "Lo que más temo es tomar una decisión difícil de revertir.",
        "El miedo aparece cuando imagino que un cambio puede salir mal."
      ],
      details: [
        "Entonces vuelvo a revisar todas las opciones y termino postergando.",
        "Prefiero conservar lo conocido, aunque una parte de mí ya no esté conforme."
      ]
    },
    foco_sesion: {
      openings: [
        "Me serviría seguir mirando cómo tomo decisiones.",
        "Quisiera ordenar qué parte de esto es cansancio y cuál es temor al cambio."
      ],
      details: [
        "No busco resolverlo de inmediato, sino entender por qué vuelvo a quedarme quieto.",
        "Creo que ese foco podría ayudarme a distinguir prudencia de paralización."
      ]
    },
    confidencialidad: {
      openings: [
        "Estoy de acuerdo con ese encuadre.",
        "Me parece bien que quede claro cómo se cuidará lo que conversemos."
      ],
      details: [
        "Tener ese límite definido hace que pueda hablar con menos reserva.",
        "No suelo contar estas cosas, así que saberlo me da algo de tranquilidad."
      ]
    },
    certeza_control: {
      openings: [
        "Sí, suelo buscar una seguridad que ninguna decisión puede ofrecer del todo.",
        "Reviso mucho antes de actuar porque quiero reducir al mínimo la posibilidad de error."
      ],
      details: [
        "Esa búsqueda parece responsable, pero muchas veces termina inmovilizándome.",
        "Cuando la confirmación no llega, postergo y mantengo la rutina."
      ]
    },
    default: {
      openings: [
        "Hay otro matiz que puedo agregar.",
        "Pensándolo un poco más, noto una contradicción."
      ],
      details: [
        "Valoro la estabilidad, pero también me pesa sentir que ya no elijo demasiado.",
        "Intento proteger lo que funciona y al mismo tiempo sigo postergando lo que necesito revisar."
      ]
    }
  },

  sessionProgression: {
    1: {
      title: "Entrevista inicial",
      focus: "Rutina, desgaste, piloto automático y dificultad para decidir.",
      allowedThemes: ["rutina", "desgaste", "trabajo", "piloto_automatico", "decisiones"],
      protectedThemes: ["separacion", "historia_familiar_profunda", "conflicto_interno_profundo"],
      defaultStage: "initial_exploration",
      responses: {
        saludo: [
          response("s1-greeting-1", "Hola. Bien, dentro de lo que cabe. Me costó un poco decidir venir, pero estoy aquí.", { topic: "apertura", maxSession: 1 }),
          response("s1-greeting-2", "Hola. No sé muy bien por dónde partir, pero puedo intentarlo.", { topic: "apertura", maxSession: 1 })
        ],
        encuadre: [
          response("s1-framing-1", "Está bien. Me acomoda saber cómo va a funcionar antes de empezar.", { topic: "encuadre", maxSession: 1 }),
          response("s1-framing-2", "Gracias por explicarlo. Creo que me ayuda que no haya que resolver todo hoy.", { topic: "encuadre", maxSession: 1 })
        ],
        encuadre_mas_pregunta: [
          response("s1-composite-1", "Gracias por explicarlo. Me gustaría que entendieras que no estoy en una crisis, pero hace tiempo siento que estoy funcionando en automático.", { topic: "motivo", maxSession: 1 }),
          response("s1-composite-2", "Está bien. Creo que lo principal es que mi vida se ve ordenada, pero yo no tengo claro si realmente me siento bien en ella.", { topic: "motivo", maxSession: 1 })
        ],
        estado_actual: [
          response("s1-state-1", "Estoy un poco incómodo, más que nada porque no sé si esto amerita pedir ayuda.", { topic: "estado_actual", maxSession: 1 }),
          response("s1-state-2", "Diría que estoy cansado, pero no de una forma muy visible. Es más bien algo sostenido.", { topic: "estado_actual", maxSession: 1 })
        ],
        motivo: [
          response("s1-motive-1", "No sé si esto amerita terapia, pero siento que hace tiempo estoy funcionando en automático.", { topic: "motivo", maxSession: 1 }),
          response("s1-motive-2", "No diría que estoy en crisis. Es más bien una sensación de desgaste y de no estar moviéndome hacia ningún lado.", { topic: "motivo", maxSession: 1 }),
          response("s1-motive-3", "Tengo una vida relativamente ordenada, pero no sé si realmente me siento bien en ella.", { topic: "motivo", maxSession: 1 })
        ],
        rutina: [
          response("s1-routine-1", "Mis días son bastante predecibles: trabajo, vuelvo a la casa y sigo más o menos el mismo orden. Eso me sirve, pero también me pesa.", { topic: "rutina", maxSession: 1 }),
          response("s1-routine-2", "Tengo rutinas muy marcadas. Me mantienen funcionando, aunque a veces siento que ya no decido mucho dentro de ellas.", { topic: "rutina", maxSession: 1 })
        ],
        decisiones: [
          response("s1-decision-1", "Pienso mucho antes de tomar una decisión. Cuando no puedo anticipar bien el resultado, termino postergándola.", { topic: "decisiones", maxSession: 1 }),
          response("s1-decision-2", "No es que no vea opciones. El problema es que encuentro razones para dudar de cada una y al final dejo todo igual.", { topic: "decisiones", maxSession: 1, minOpenness: "medium" })
        ],
        emociones: [
          response("s1-emotion-1", "Me cuesta ponerle un nombre. Diría que hay cansancio y una incomodidad que no se va.", { topic: "emociones", maxSession: 1 }),
          response("s1-emotion-2", "No me siento mal todo el tiempo. Es más bien la sensación de que cumplo con todo, pero estoy poco conectado con lo que hago.", { topic: "emociones", maxSession: 1, minOpenness: "medium" })
        ],
        ayuda: [response("s1-help", "Me gustaría entender por qué me cuesta tanto mover algo, incluso cuando sé que no estoy conforme.", { topic: "expectativas", maxSession: 1 })],
        follow_up: [
          response("s1-follow-1", "Creo que por fuera todo funciona, y justamente por eso me ha costado tomar en serio lo que me pasa.", { topic: "motivo", maxSession: 1 }),
          response("s1-follow-2", "La sensación aparece cuando pienso que los meses se parecen demasiado entre sí y yo sigo posponiendo las mismas decisiones.", { topic: "rutina", maxSession: 1 })
        ]
      }
    },
    2: {
      title: "Profundización",
      focus: "Separación, miedo a equivocarse, autoexigencia y vida desde el deber.",
      allowedThemes: ["separacion", "miedo_error", "deber", "autoexigencia", "deseo"],
      protectedThemes: ["interpretaciones_cerradas", "causalidad_familiar_total"],
      defaultStage: "deeper_exploration",
      responses: {
        saludo: [response("s2-greeting", "Hola. Me quedaron dando vueltas algunas cosas de la conversación anterior.", { topic: "retomar", minSession: 2, maxSession: 2 })],
        encuadre: [response("s2-framing", "Está bien. Me sirve retomar con algo de orden, porque pensé bastante en lo que hablamos.", { topic: "retomar", minSession: 2, maxSession: 2 })],
        estado_actual: [response("s2-state", "He estado más atento a esta sensación de quedarme quieto. Aparece más de lo que pensaba.", { topic: "estado_actual", minSession: 2, maxSession: 2 })],
        motivo: [
          response("s2-motive-1", "Creo que me acostumbré a hacer lo que correspondía. El problema es que ya no sé cuánto de eso sigo eligiendo.", { topic: "deber", minSession: 2, maxSession: 2 }),
          response("s2-motive-2", "Siempre he pensado mucho antes de moverme, pero ahora siento que eso me paraliza.", { topic: "miedo_error", minSession: 2, maxSession: 2 })
        ],
        separacion: [
          response("s2-separation-1", "Después de la separación me ordené bastante rápido en lo práctico. Creo que recién después empecé a notar que emocionalmente había quedado más detenido.", { topic: "separacion", minSession: 2, minOpenness: "medium" }),
          response("s2-separation-2", "La separación me obligó a tomar decisiones, pero en otras áreas hice lo contrario: mantuve todo igual para no equivocarme de nuevo.", { topic: "separacion", minSession: 2, minOpenness: "high" })
        ],
        decisiones: [
          response("s2-decision-1", "Generalmente imagino todas las formas en que una decisión podría salir mal. Para cuando termino de pensarlo, ya perdí el impulso de hacer algo.", { topic: "miedo_error", minSession: 2, maxSession: 2 }),
          response("s2-decision-2", "A veces no sé si lo que tengo es miedo o simplemente costumbre. Pero el resultado es el mismo: postergo.", { topic: "miedo_error", minSession: 2, maxSession: 2 })
        ],
        emociones: [
          response("s2-emotion-1", "Creo que hay miedo a equivocarme y también cierta vergüenza por no tener más claro qué quiero a esta edad.", { topic: "emociones", minSession: 2, minOpenness: "medium" }),
          response("s2-emotion-2", "Me cuesta reconocer el deseo porque enseguida empiezo a evaluarlo: si es razonable, si conviene, si podría afectar a alguien.", { topic: "deseo", minSession: 2, minOpenness: "high" })
        ],
        follow_up: [
          response("s2-follow-1", "Lo que trato de decir es que la prudencia me ha servido, pero también se volvió una forma de no arriesgar nada.", { topic: "patron", minSession: 2, maxSession: 2 }),
          response("s2-follow-2", "Cuando pienso en cambiar algo, aparece muy rápido la idea de que podría estar siendo irresponsable.", { topic: "deber", minSession: 2, maxSession: 2 })
        ],
        ayuda: [response("s2-help", "Me gustaría distinguir qué decisiones estoy evitando por cuidado y cuáles estoy evitando por miedo.", { topic: "expectativas", minSession: 2, maxSession: 2 })]
      }
    },
    3: {
      title: "Contexto, recursos y tareas",
      focus: "Roles, vínculos, valores, intereses postergados y cambios pequeños.",
      allowedThemes: ["recursos", "valores", "vinculos", "roles", "acciones_pequenas", "tareas"],
      protectedThemes: ["cambios_impulsivos", "soluciones_totales"],
      defaultStage: "resources_and_action",
      responses: {
        saludo: [response("s3-greeting", "Hola. He estado tratando de observar un poco más cuándo vuelvo al automático.", { topic: "retomar", minSession: 3, maxSession: 3 })],
        estado_actual: [response("s3-state", "Estoy algo más claro, aunque no necesariamente más resuelto. Al menos noto antes cuándo empiezo a postergar.", { topic: "estado_actual", minSession: 3, maxSession: 3 })],
        contexto: [
          response("s3-context-1", "En el trabajo y en mi familia suelo ser el que ordena, resuelve y no complica. Me cuesta salir de ese lugar.", { topic: "roles", minSession: 3 }),
          response("s3-context-2", "Tengo personas cercanas, pero no estoy acostumbrado a pedir apoyo para algo que todavía no puedo explicar del todo.", { topic: "vinculos", minSession: 3 })
        ],
        recursos: [
          response("s3-resource-1", "Soy constante y puedo observar bastante bien mis patrones cuando me detengo. El problema es que suelo usar esa capacidad solo para analizar.", { topic: "recursos", minSession: 3 }),
          response("s3-resource-2", "Me ayuda conversar con un amigo que no intenta decirme qué hacer. También me sirve salir de la rutina, aunque me cuesta darme ese espacio.", { topic: "recursos", minSession: 3, minOpenness: "medium" })
        ],
        valores: [
          response("s3-values-1", "Valoro la responsabilidad y la estabilidad, pero no quisiera que eso significara vivir sin curiosidad o sin elegir nada nuevo.", { topic: "valores", minSession: 3 }),
          response("s3-values-2", "Creo que extraño sentir interés genuino por algo, no solo cumplir bien con lo que toca.", { topic: "deseo", minSession: 3, minOpenness: "high" })
        ],
        accion: [
          response("s3-action-1", "Me cuesta, pero entiendo que algo tendría que empezar a mover. Si es concreto, creo que podría intentarlo.", { topic: "acciones_pequenas", minSession: 3 }),
          response("s3-action-2", "Me acomoda más partir por algo pequeño que pensar en cambiar toda mi vida.", { topic: "acciones_pequenas", minSession: 3 })
        ],
        follow_up: [
          response("s3-follow-1", "Quizás el recurso no es tener certeza, sino poder avanzar un poco aunque todavía tenga dudas.", { topic: "recursos", minSession: 3, minOpenness: "medium" }),
          response("s3-follow-2", "Estoy empezando a notar que esperar la decisión perfecta también es una decisión: la de mantener todo igual.", { topic: "patron", minSession: 3, minOpenness: "high" })
        ],
        ayuda: [response("s3-help", "Me serviría encontrar una forma de probar cambios pequeños sin convertirlos de inmediato en una evaluación de éxito o fracaso.", { topic: "expectativas", minSession: 3 })]
      }
    },
    4: {
      title: "Cierre formativo",
      focus: "Síntesis, claridad parcial, recursos y continuidad sin final artificial.",
      allowedThemes: ["sintesis", "aprendizajes", "recursos", "continuidad", "limites_del_proceso"],
      protectedThemes: ["final_feliz", "resolucion_total"],
      defaultStage: "formative_closure",
      responses: {
        saludo: [response("s4-greeting", "Hola. Creo que hoy puedo mirar esto con un poco más de perspectiva.", { topic: "retomar", minSession: 4 })],
        estado_actual: [response("s4-state", "No siento que esté resuelto, pero ya no lo veo solo como falta de decisión. Entiendo mejor qué estoy protegiendo cuando postergo.", { topic: "aprendizajes", minSession: 4 })],
        sintesis: [
          response("s4-summary-1", "No diría que ya sé exactamente qué hacer, pero al menos entiendo mejor por qué me he quedado tan quieto.", { topic: "sintesis", minSession: 4 }),
          response("s4-summary-2", "Me voy con la sensación de haber ordenado algo que tenía muy mezclado: responsabilidad, miedo y costumbre.", { topic: "sintesis", minSession: 4 }),
          response("s4-summary-3", "Creo que me ayudó mirar esto sin tener que resolverlo todo de inmediato.", { topic: "aprendizajes", minSession: 4 })
        ],
        recursos: [
          response("s4-resource-1", "Me sirve recordar que puedo hacer pruebas pequeñas y revisar cómo me siento, en vez de esperar una certeza completa.", { topic: "recursos", minSession: 4 }),
          response("s4-resource-2", "Creo que tengo capacidad para sostener cambios, pero necesito usarla también para explorar y no solo para mantener todo bajo control.", { topic: "recursos", minSession: 4, minOpenness: "medium" })
        ],
        continuidad: [response("s4-continuity", "Todavía quedan decisiones y temas personales por mirar. La diferencia es que ahora puedo acercarme a ellos sin exigir una respuesta inmediata.", { topic: "continuidad", minSession: 4 })],
        follow_up: [
          response("s4-follow-1", "Lo que cambió no es que desapareciera la duda, sino que ya no la tomo como una señal automática de que debo quedarme quieto.", { topic: "aprendizajes", minSession: 4 }),
          response("s4-follow-2", "Sigo valorando la estabilidad. Solo que ahora veo que también necesito preguntarme si la vida que mantengo todavía me representa.", { topic: "valores", minSession: 4 })
        ]
      }
    }
  },

  approachResponses: {
    cognitivo_conductual: [
      response("approach-cbt-1", "Generalmente pienso que podría equivocarme, o que quizás no es tan grave como para cambiar algo. Entonces termino dejando todo igual.", { topic: "pensamiento_conducta" }),
      response("approach-cbt-2", "La secuencia suele ser bastante clara: aparece una decisión, empiezo a anticipar problemas, me tenso y la postergo. Después siento alivio, pero también frustración.", { topic: "pensamiento_conducta", minSession: 2, minOpenness: "medium" })
    ],
    humanista: [
      response("approach-humanistic-1", "Me ayuda que no lo plantees como si tuviera que justificar por qué me siento así. Creo que por eso puedo mirarlo con más calma.", { topic: "vinculo" }),
      response("approach-humanistic-2", "Sí... eso me hace sentido. Creo que he hecho mucho lo que correspondía, pero no sé si me he preguntado qué quería.", { topic: "deseo", minSession: 2, minOpenness: "medium" })
    ],
    psicodinamico: [
      response("approach-psychodynamic-1", "Siempre he sido de pensar mucho antes de actuar. En mi familia eso se veía como responsabilidad, aunque todavía no sé cuánto explica lo de ahora.", { topic: "historia", maxSession: 1 }),
      response("approach-psychodynamic-2", "Puede ser. Ser el responsable me dio un lugar bastante claro, pero también hizo que mostrar dudas se sintiera como fallar.", { topic: "historia", minSession: 2, minOpenness: "medium" }),
      response("approach-psychodynamic-3", "Veo una repetición: cuando algo podría cambiar de verdad mi vida, intento pensarlo hasta volverlo controlable. Y en ese proceso no hago nada.", { topic: "patron", minSession: 2, minOpenness: "high" })
    ],
    sistemico: [
      response("approach-systemic-1", "Creo que suelo ser el que mantiene todo en orden, el que no complica y el que resuelve. No sé si ese lugar siempre me ha hecho bien.", { topic: "roles", minSession: 2 }),
      response("approach-systemic-2", "Las personas cercanas esperan que yo sea estable, y yo también he reforzado esa imagen. Pedir ayuda o cambiar algo se siente como alterar un equilibrio.", { topic: "vinculos", minSession: 3, minOpenness: "medium" })
    ],
    tercera_generacion: [
      response("approach-act-1", "He estado esperando sentirme seguro antes de actuar, y quizás esa seguridad no va a llegar del todo.", { topic: "aceptacion_accion", minSession: 2 }),
      response("approach-act-2", "Si pienso en lo que valoro, no quiero perder la estabilidad, pero tampoco quiero seguir completamente desconectado de lo que me interesa. Tal vez puedo moverme con algo de duda.", { topic: "valores", minSession: 3, minOpenness: "medium" })
    ],
    narrativo: [
      response("approach-narrative-1", "Quizás me he contado que ya es tarde para cambiar, o que sería irresponsable mover cosas que desde afuera funcionan.", { topic: "relato_dominante", minSession: 2 }),
      response("approach-narrative-2", "La historia habitual es que soy prudente y responsable. Me cuesta imaginar una versión en que también pueda explorar sin convertirme en alguien impulsivo.", { topic: "identidad", minSession: 3, minOpenness: "medium" })
    ],
    solucion_breve: [
      response("approach-solution-1", "Pensar en subir de un 4 a un 5 me parece menos abrumador que pensar en cambiarlo todo.", { topic: "pequenos_pasos" }),
      response("approach-solution-2", "Ha habido momentos en que decido con menos vueltas, sobre todo cuando el paso es pequeño y no lo trato como algo definitivo.", { topic: "excepciones", minSession: 2 }),
      response("approach-solution-3", "Una señal pequeña sería reservar un momento de la semana para algo que elija por interés y no solo porque corresponde.", { topic: "pequenos_pasos", minSession: 3 })
    ],
    integrativo: [
      response("approach-integrative-1", "Me acomoda verlo así. Siento que no es una sola cosa: hay pensamiento, miedo y también bastante costumbre.", { topic: "integracion", minSession: 2 }),
      response("approach-integrative-2", "Puedo ver que mi historia y mis ideas sobre la responsabilidad influyen, pero también necesito probar algo distinto en lo cotidiano.", { topic: "integracion", minSession: 3, minOpenness: "medium" })
    ],
    existencial: [
      response("approach-existential-1", "Creo que la pregunta incómoda es si la vida que mantengo tan ordenada todavía se parece a la vida que quiero.", { topic: "sentido", minSession: 2, minOpenness: "medium" })
    ]
  },

  taskResponses: {
    concrete: [
      response("task-concrete-1", "Sí, eso me parece posible. Me acomoda que sea algo específico. Podría anotarlo al final del día.", { topic: "tarea", minSession: 2 }),
      response("task-concrete-2", "Si queda acotado a observar una situación concreta, creo que podría intentarlo sin convertirlo en otro proyecto.", { topic: "tarea", minSession: 2 })
    ],
    tooBroad: [
      response("task-broad-1", "Eso me suena un poco grande. Justamente cuando lo pienso así, me paralizo.", { topic: "tarea" }),
      response("task-broad-2", "Podría intentarlo, pero planteado de esa forma siento que tendría que cambiar demasiadas cosas a la vez.", { topic: "tarea" })
    ],
    emotionallyPremature: [
      response("task-premature-1", "No sé si estoy listo para entrar tan directo en ese tema.", { topic: "limite" }),
      response("task-premature-2", "Preferiría entender un poco mejor lo que me pasa antes de hacer algo tan expuesto.", { topic: "limite" })
    ],
    partial: [
      response("task-partial-1", "La empecé, pero no fui muy constante. Me di cuenta de que me cuesta detenerme a mirar lo que siento.", { topic: "seguimiento_tarea", minSession: 2 }),
      response("task-partial-2", "La hice un par de veces. Después volví a la rutina y se me fue pasando, aunque alcancé a notar algo.", { topic: "seguimiento_tarea", minSession: 2 })
    ],
    notDone: [
      response("task-not-done-1", "No la hice. No fue por falta de interés, pero creo que la fui postergando. Tal vez eso también dice algo de cómo funciono.", { topic: "seguimiento_tarea", minSession: 2 }),
      response("task-not-done-2", "La tuve presente, pero siempre encontraba un momento más urgente. Se parece bastante a lo que hago con otras decisiones.", { topic: "seguimiento_tarea", minSession: 2 })
    ],
    helpful: [
      response("task-helpful-1", "Me ayudó a notar que la sensación de bloqueo aparece más cuando tengo que decidir algo que podría cambiar mi rutina.", { topic: "aprendizaje_tarea", minSession: 2 }),
      response("task-helpful-2", "Sirvió para ver que la duda no aparece igual en todo. Se vuelve más fuerte cuando siento que la decisión puede ser definitiva.", { topic: "aprendizaje_tarea", minSession: 2 })
    ],
    noPreviousTask: [response("task-none", "No recuerdo que hubiéramos dejado una tarea concreta. Sí me quedé pensando en lo que conversamos.", { topic: "seguimiento_tarea", minSession: 2 })]
  },

  goodInterventions: {
    validation: [
      response("good-validation-1", "Sí... creo que va por ahí. No es que todo esté mal, pero hace rato dejé de preguntarme si esto me hacía bien.", { topic: "vinculo" }),
      response("good-validation-2", "Me ayuda que no intentes apurar una solución. Cuando no tengo que defender mi cautela, puedo mirar mejor lo que hay detrás.", { topic: "vinculo" })
    ],
    reflection: [
      response("good-reflection-1", "Escucharlo resumido así me hace sentido. Creo que he confundido estar estable con estar conforme.", { topic: "insight", minOpenness: "medium" }),
      response("good-reflection-2", "Sí. No se trata solo de decidir algo puntual, sino de cuánto tiempo llevo esperando sentirme completamente seguro.", { topic: "insight", minSession: 2 })
    ],
    respectfulQuestion: [
      response("good-question-1", "Agradezco que lo preguntes de esa forma. Me cuesta menos responder si puedo ir ordenándolo de a poco.", { topic: "vinculo" }),
      response("good-question-2", "Creo que puedo seguir por ahí. Es incómodo, pero no siento que tenga que llegar con una respuesta perfecta.", { topic: "vinculo", minOpenness: "medium" })
    ],
    summary: [response("good-summary", "Sí, ese resumen recoge bastante bien lo que he tratado de explicar. Hay desgaste, pero también miedo a mover una vida que desde afuera funciona.", { topic: "sintesis", minSession: 2 })]
  },

  poorInterventions: {
    rapidAdvice: [
      response("poor-advice-1", "No sé si es tan simple. Parte de mí piensa que sería irresponsable hacer un cambio así sin estar seguro.", { topic: "defensa" }),
      response("poor-advice-2", "He pensado en soluciones parecidas. El problema es que decirme qué hacer no resuelve la duda que aparece antes.", { topic: "defensa" })
    ],
    prematureDiagnosis: [
      response("poor-diagnosis-1", "No sé si lo pondría así. Sigo funcionando; no me siento bien, pero tampoco sé si usaría esa palabra.", { topic: "defensa" }),
      response("poor-diagnosis-2", "Me cuesta identificarme con una conclusión tan rápida. Preferiría explicar un poco más lo que me pasa.", { topic: "defensa" })
    ],
    invalidation: [
      response("poor-invalidation-1", "Sí, eso mismo me digo yo. Y quizás por eso me ha costado pedir ayuda.", { topic: "cierre_emocional" }),
      response("poor-invalidation-2", "Puede parecer menor desde afuera. Para mí lleva bastante tiempo haciendo ruido.", { topic: "cierre_emocional" })
    ],
    interrogation: [
      response("poor-interrogation-1", "No sé... son muchas preguntas juntas. Me cuesta ordenarlo así.", { topic: "limite" }),
      response("poor-interrogation-2", "Preferiría tomar una de esas preguntas primero. Si intento responder todo, termino diciendo muy poco.", { topic: "limite" })
    ],
    pressure: [
      response("poor-pressure-1", "Cuando siento que tengo que decidir rápido, tiendo a cerrarme más. Necesito entenderlo antes de mover algo.", { topic: "defensa" }),
      response("poor-pressure-2", "Puedo considerar un cambio, pero no me ayuda sentir que ya debería tenerlo resuelto.", { topic: "defensa" })
    ]
  },

  followUpResponses: {
    encuadre: [
      response("follow-framing-1", "A que no suelo hablar de lo que me pasa. Como por fuera mi vida está ordenada, generalmente sigo funcionando sin explicar demasiado cómo me siento. Incluso con personas cercanas tiendo a hablar de lo práctico y dejar esto para después.", { topic: "encuadre" }),
      response("follow-framing-2", "Me refiero a que estoy acostumbrado a resolver las cosas por mi cuenta. Poner en palabras esta sensación me resulta menos natural de lo que pensaba.", { topic: "encuadre" })
    ],
    rutina: [
      response("follow-routine-1", "La rutina me evita muchas decisiones pequeñas. Eso es cómodo, pero también hace que los días se vuelvan intercambiables.", { topic: "rutina" }),
      response("follow-routine-2", "Me ordena y me permite cumplir. El costo es que casi nunca me pregunto si quiero hacer algo distinto.", { topic: "rutina", minOpenness: "medium" })
    ],
    motivo: [
      response("follow-motive-1", "Que no estoy mal de una forma evidente, pero hace tiempo dejé de sentir que estoy eligiendo cómo vivo.", { topic: "motivo" }),
      response("follow-motive-2", "El desgaste viene de mantener una vida que funciona sin saber si todavía me representa.", { topic: "motivo", minOpenness: "medium" })
    ],
    decisiones: [
      response("follow-decision-1", "Porque intento encontrar una opción sin riesgo. Como ninguna la tiene, sigo esperando.", { topic: "decisiones" }),
      response("follow-decision-2", "El análisis me da una sensación de control. Mientras sigo pensando, no tengo que enfrentar la posibilidad de equivocarme.", { topic: "miedo_error", minSession: 2, minOpenness: "medium" })
    ],
    deber: [response("follow-duty", "Para mí hacer lo correcto siempre fue una forma de sentirme tranquilo. El problema es que ya no tengo claro dónde quedé yo dentro de eso.", { topic: "deber", minSession: 2 })],
    separacion: [response("follow-separation", "En lo práctico la manejé bien. Lo que evité fue detenerme a pensar qué había cambiado en mí después de eso.", { topic: "separacion", minSession: 2, minOpenness: "medium" })],
    valores: [response("follow-values", "La responsabilidad sigue siendo importante para mí. Lo nuevo es pensar que también podría ser responsable conmigo y con lo que quiero.", { topic: "valores", minSession: 3 })],
    tarea: [response("follow-task", "Lo que me cuesta de las tareas es no convertirlas en otra cosa que tengo que hacer perfecto.", { topic: "tarea", minSession: 2 })],
    default: [
      response("follow-default-1", "Creo que se relaciona con esto de necesitar demasiada certeza antes de moverme.", { topic: "patron" }),
      response("follow-default-2", "Mientras más lo explico, más noto que no es falta de opciones. Es la dificultad para aceptar que ninguna decisión viene con garantía.", { topic: "patron", minSession: 2, minOpenness: "medium" })
    ]
  },

  formativeClosure: {
    1: [
      response("closure-s1-1", "Gracias. Me sirvió poder hablar de esto sin tener que convertirlo de inmediato en una decisión. Podríamos seguir otro día.", { topic: "cierre", maxSession: 1 }),
      response("closure-s1-2", "Me voy pensando que quizás esta sensación sí merece atención, aunque mi vida siga funcionando.", { topic: "cierre", maxSession: 1 })
    ],
    2: [
      response("closure-s2-1", "Gracias. Quedé pensando en cuánto de mi cautela es cuidado y cuánto es miedo. Podemos retomarlo.", { topic: "cierre", minSession: 2, maxSession: 2 }),
      response("closure-s2-2", "Me sirve dejarlo aquí por hoy. Aparecieron cosas que necesito seguir ordenando sin apurarlas.", { topic: "cierre", minSession: 2, maxSession: 2 })
    ],
    3: [
      response("closure-s3-1", "Me parece bien. Me llevo la idea de probar algo pequeño, sin exigir que eso resuelva toda mi vida.", { topic: "cierre", minSession: 3, maxSession: 3 }),
      response("closure-s3-2", "Gracias. Creo que puedo observar mejor cuándo uso el análisis para quedarme quieto y ensayar algo más acotado.", { topic: "cierre", minSession: 3, maxSession: 3 })
    ],
    4: [
      response("closure-s4-1", "No diría que está resuelto, pero me voy entendiendo mejor por qué me he quedado quieto. Eso ya cambia la forma de mirarlo.", { topic: "cierre", minSession: 4 }),
      response("closure-s4-2", "Me voy con algo más ordenado y con la idea de que no necesito certeza total para dar un paso pequeño. Si lo necesitara, podría seguir trabajando esto.", { topic: "cierre", minSession: 4 })
    ]
  },

  outOfFocusResponses: [
    response("out-of-focus-1", "Puedo responderte, aunque no estoy seguro de cómo se conecta con lo que veníamos hablando. En mi caso, lo que más me pesa sigue siendo esta sensación de estar detenido.", { topic: "retorno_foco" }),
    response("out-of-focus-2", "No es un tema especialmente importante para mí. Creo que lo que intento ordenar tiene más que ver con mi rutina y con las decisiones que postergo.", { topic: "retorno_foco" })
  ],

  ambiguityResponses: [
    response("ambiguity-1", "No estoy seguro de a qué parte te refieres. ¿A la rutina o a esto de postergar decisiones?", { topic: "aclaracion" }),
    response("ambiguity-2", "¿Podrías preguntármelo de otra forma? Prefiero no asumir a qué te refieres.", { topic: "aclaracion" })
  ],

  boundaryResponses: {
    separacion: [
      response("boundary-separation-1", "Sí, hubo una separación, pero no sé si quiero entrar tan rápido en eso. Por ahora me resulta más fácil explicar cómo quedó mi rutina.", { topic: "limite", maxSession: 1 }),
      response("boundary-separation-2", "Es parte de la historia, aunque todavía no tengo claro cómo hablarlo. Preferiría partir por lo que me está pasando ahora.", { topic: "limite", maxSession: 1 })
    ],
    historia: [
      response("boundary-history", "Podría tener relación, pero todavía sería apresurado para mí explicarlo desde mi historia. Necesito ordenarlo un poco más.", { topic: "limite", maxSession: 1 })
    ]
  },

  clinicalLimits: {
    acuteRisk: false,
    prohibitedDevelopments: [
      "crisis aguda no contenida en el caso",
      "ideación suicida inventada",
      "diagnósticos entregados por el paciente",
      "resolución total al final de cuatro sesiones",
      "consejos clínicos del paciente al estudiante"
    ],
    sessionOneBoundaries: "No revelar separación ni conflicto familiar profundo salvo una pregunta directa; aun así responder con cautela.",
    finalBoundary: "Mostrar mayor claridad y disposición, no una transformación completa ni un final feliz artificial."
  },

  learningObjectives: [
    "Explorar estancamiento y rutina sin empujar decisiones impulsivas.",
    "Diferenciar estabilidad externa de satisfacción personal.",
    "Reconocer miedo al error, sobrecontrol y vida desde el deber.",
    "Usar validación y seguimiento para favorecer elaboración emocional gradual.",
    "Proponer tareas pequeñas, específicas y coherentes con el nivel de apertura.",
    "Cerrar cada sesión sintetizando sin prometer una resolución total."
  ]
});
