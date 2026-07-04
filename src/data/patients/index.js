import { caseProfiles } from "../caseProfiles.js";
import { patientFacts } from "../patientFacts.js";
import { marcosBasicProfile } from "./marcosBasicProfile.js";
import { marcosPremiumPatient } from "./marcos/index.js";
import { tomasDeepPatient } from "./tomas/index.js";
import { warnIncompletePatientRecords } from "./patientSchema.js";

const UNKNOWN = "No esta definido en el expediente inicial.";

const unknownPerson = (role) => ({
  role,
  name: null,
  age: null,
  occupation: null,
  personality: UNKNOWN,
  relationship: UNKNOWN,
  conflicts: UNKNOWN,
  closeness: UNKNOWN
});

const priorityPatientRecords = {
  tomas: {
    identity: {
      gender: "masculino",
      city: "Santiago",
      education: "Ensenanza media en curso",
      occupation: "Estudiante escolar",
      civilStatus: "No tengo pareja.",
      livesWith: "Vivo con mis papas.",
      socioeconomicLevel: "medio",
      beliefsRelevant: "No se consignan creencias religiosas relevantes.",
      dailyRoutine: "Voy al colegio, vuelvo a la casa y casi siempre termino en mi pieza usando el computador.",
      supportNetwork: "Tengo mas contacto con gente online que con amigos cercanos en persona."
    },
    biography: {
      childhood: "Fue un nino tranquilo, con preferencia por actividades solitarias y rutinas conocidas.",
      caregivers: "Crecio con ambos padres presentes, preocupados y algo controladores cuando lo ven encerrarse.",
      school: "En el colegio cumple, pero participa poco y evita exponerse en grupos.",
      adolescence: "Durante la adolescencia aumento el tiempo en computador y disminuyo la vida social presencial.",
      significantRelationships: "Sus vinculos mas fluidos aparecen en juegos online, donde sabe como participar.",
      studies: "Sigue en el colegio. No hay un problema academico central, pero si incomodidad social.",
      work: "No trabaja.",
      losses: "No se registran perdidas significativas en el expediente inicial.",
      majorChanges: "Aumento de discusiones familiares por el computador durante el ultimo ano.",
      criticalEvents: "Derivacion impulsada por los padres por preocupacion y peleas recurrentes.",
      currentSituation: "Llega con resistencia moderada, sintiendose juzgado por el uso del computador."
    },
    timeline: [
      { period: "infancia", event: "Preferencia por espacios tranquilos y actividades previsibles." },
      { period: "2023", event: "Comienza a pasar mas tiempo online y a evitar conversaciones familiares." },
      { period: "2025", event: "Aumentan discusiones familiares por computador y salidas sociales." },
      { period: "2026", event: "Sus padres insisten en consultar." }
    ],
    family: {
      composition: "Vivo con mi mama Marcela y mi papa Rodrigo. No tengo hermanos.",
      mother: {
        role: "madre",
        name: "Marcela",
        age: 43,
        occupation: "administrativa",
        personality: "preocupada, insistente y directa cuando se angustia",
        relationship: "cercana pero tensionada por el computador",
        conflicts: "discuten porque ella interpreta el juego como aislamiento",
        closeness: "media"
      },
      father: {
        role: "padre",
        name: "Rodrigo",
        age: 45,
        occupation: "tecnico",
        personality: "practico, menos expresivo y a veces rigido",
        relationship: "presente, aunque Tomás siente que escucha poco",
        conflicts: "tiende a pedir soluciones rapidas",
        closeness: "media-baja"
      },
      siblings: [],
      partner: null,
      children: [],
      friends: [
        "companeros online con quienes juega",
        "pocos companeros cercanos en el colegio"
      ]
    },
    personality: {
      temperament: "reservado, sensible al juicio y algo evasivo",
      anxietyLevel: "moderado en situaciones sociales",
      initialOpenness: "baja",
      responseStyle: "frases cortas, pausas y explicaciones graduales",
      defenses: ["evitacion", "retraimiento", "minimizar lo emocional"],
      humor: "seco y escaso",
      trustInitial: 5,
      resistances: ["preguntas acusatorias", "reducir todo al computador", "presion familiar"],
      typicalPhrases: [
        "No se bien como explicarlo.",
        "Siento que ven solo esa parte.",
        "No es solo jugar por jugar.",
        "En persona me cuesta saber que decir.",
        "En el juego por lo menos se que hacer."
      ],
      avoids: ["hablar de sentirse raro", "admitir soledad", "mostrar necesidad de ayuda"],
      mobilizers: ["validacion sin juicio", "preguntas concretas", "seguimiento de frases que ya dijo"],
      emotionalRhythm: "se abre lentamente si no se siente retado",
      unknownAnswer: "No se bien. No es algo que tenga tan claro todavia."
    },
    emotionalState: {
      currentlyFeels: "incomodo, observado y pasado a llevar",
      worries: "que todos crean que el problema es solo el computador",
      fears: "quedar raro o decir algo mal en persona",
      shame: "le da verguenza reconocer que le cuesta relacionarse",
      needs: "ser escuchado sin reto",
      hides: "que el juego tambien le sirve para no sentirse tan fuera de lugar",
      selfUnknown: "no entiende del todo por que estar con gente le agota tanto",
      expectations: "espera que no lo reten y que lo intenten entender"
    },
    consultation: {
      manifestMotive: "Sus padres estan preocupados porque pasa mucho tiempo jugando y casi no sale.",
      whyNow: "Creo que vine por mis papas. Ellos dicen que paso mucho tiempo en el computador y que casi no salgo.",
      recentTrigger: "Las discusiones por el computador se volvieron mas frecuentes.",
      whyNotBefore: "No habria pedido venir solo; pensaba que hablarlo iba a terminar en reto.",
      motivatedBy: "sus padres",
      expects: "que entiendan que no es solo apagar el computador",
      fearsTherapy: "que el terapeuta piense igual que sus padres",
      beliefAboutProblem: "siente que el computador es una parte visible, no todo el problema"
    },
    sensitiveInfo: {
      earlyBoundary: "Prefiero ir de a poco con eso. Me cuesta hablarlo si siento que ya hay una idea hecha.",
      riskResponse: "No, no he pensado en hacerme dano. Me pasa mas que me encierro o evito hablar.",
      substanceResponse: "No, no consumo alcohol ni otras sustancias. No es un tema para mi.",
      items: [
        {
          id: "dificultad_social",
          label: "dificultad social y verguenza",
          keywords: ["verguenza", "raro", "social", "amigos"],
          content: "En persona se bloquea y teme quedar como raro.",
          revealConditions: { minTrust: 25, minSession: 1, requires: ["validacion", "pregunta_respetuosa"] }
        }
      ]
    }
  },

  sofia: {
    identity: {
      gender: "femenino",
      city: "Santiago",
      education: "educacion superior en curso",
      occupation: "estudia y trabaja algunas horas",
      civilStatus: "No estoy en pareja ahora.",
      livesWith: "Vivo con mi familia.",
      socioeconomicLevel: "medio",
      beliefsRelevant: "Valora la independencia, aunque depende mucho de la mirada externa.",
      dailyRoutine: "Estudio, trabajo algunas horas y reviso redes en espacios que se van alargando.",
      supportNetwork: "Tengo amistades y familia, pero a veces tambien me comparo con ellas."
    },
    biography: {
      childhood: "Crecio como una nina despierta y observadora, con sensibilidad a la aprobacion externa.",
      caregivers: "Padres presentes, con tendencia a minimizar el impacto que las redes tienen en ella.",
      school: "Buen rendimiento y vida social activa, aunque siempre comparandose en silencio.",
      adolescence: "Las redes empezaron a ocupar un lugar fuerte en su autoestima y pertenencia.",
      significantRelationships: "Tiene amigas, pero la comparacion aparece incluso con gente cercana.",
      studies: "Estudia y trabaja parcialmente, con dificultad para desconectarse del celular.",
      work: "Trabajo parcial que intenta compatibilizar con estudios.",
      losses: "No hay duelo central consignado.",
      majorChanges: "Mayor dependencia de la validacion digital en los ultimos anos.",
      criticalEvents: "Un periodo de comparacion intensa la hizo sentir que su vida no alcanzaba.",
      currentSituation: "Consulta porque sabe que las redes le hacen mal, pero vuelve a ellas."
    },
    timeline: [
      { period: "adolescencia", event: "Empieza a usar redes como espacio de comparacion y pertenencia." },
      { period: "2024", event: "Aumenta la necesidad de revisar reacciones y comparar logros." },
      { period: "2026", event: "Decide consultar por sentirse atrapada en el ciclo de mirar, compararse y volver." }
    ],
    family: {
      composition: "Vivo con mi mama Carolina, mi papa Mauricio y una hermana menor.",
      mother: {
        role: "madre",
        name: "Carolina",
        age: 52,
        occupation: "profesora",
        personality: "protectora, practica, minimiza un poco el problema",
        relationship: "cercana pero poco comprensiva del mundo digital",
        conflicts: "le dice que deje el celular como si fuera simple",
        closeness: "media"
      },
      father: {
        role: "padre",
        name: "Mauricio",
        age: 55,
        occupation: "comerciante",
        personality: "tranquilo y poco expresivo",
        relationship: "cordial, no muy emocional",
        conflicts: "no entiende por que le afectan tanto las redes",
        closeness: "media-baja"
      },
      siblings: [
        {
          role: "hermana",
          name: "Antonia",
          age: 18,
          occupation: "estudiante",
          personality: "sociable",
          relationship: "cercana pero tambien comparativa",
          conflicts: "Sofia se compara con su seguridad",
          closeness: "media"
        }
      ],
      partner: null,
      children: [],
      friends: ["dos amigas de la universidad", "amistades con alta presencia en redes"]
    },
    personality: {
      temperament: "lucida, ironica, ambivalente y sensible a la comparacion",
      anxietyLevel: "moderado",
      initialOpenness: "media",
      responseStyle: "habla con claridad, usa ironia suave y se contradice sin ocultarlo",
      defenses: ["intelectualizacion", "humor", "minimizar diciendo que es tonto"],
      humor: "ironico, no infantil",
      trustInitial: 12,
      resistances: ["que le digan simplemente que deje el celular", "sentirse superficial"],
      typicalPhrases: [
        "Se que suena tonto, pero igual me afecta.",
        "No es tan simple como cerrar la aplicacion.",
        "Me comparo aunque sepa que no deberia.",
        "Me da rabia que me importe tanto."
      ],
      avoids: ["admitir necesidad de aprobacion", "sentirse dependiente de likes"],
      mobilizers: ["validacion sin burla", "explorar ambivalencia", "preguntas sobre sentido personal"],
      emotionalRhythm: "puede abrirse rapido si siente que no la ridiculizan",
      unknownAnswer: "No se si lo tengo tan claro. Quizas nunca lo habia mirado desde ese lugar."
    },
    emotionalState: {
      currentlyFeels: "ambivalente, cansada de compararse y algo avergonzada",
      worries: "depender demasiado de la validacion externa",
      fears: "que su vida real no sea suficiente",
      shame: "sentir que algo aparentemente superficial la controla",
      needs: "poder hablarlo sin ser tratada como exagerada",
      hides: "cuanto revisa reacciones y cuanto le cambia el animo",
      selfUnknown: "no sabe que busca exactamente cada vez que entra a redes",
      expectations: "entender por que vuelve aunque sabe que termina peor"
    },
    consultation: {
      manifestMotive: "Uso de redes, comparacion constante y malestar con la autoimagen.",
      whyNow: "Vine porque uso mucho las redes y me comparo todo el tiempo. Se que me hace mal a ratos, pero igual vuelvo.",
      recentTrigger: "Empezo a notar que podia estar bien y terminar mal despues de revisar historias.",
      whyNotBefore: "Le parecia demasiado superficial como para pedir ayuda.",
      motivatedBy: "ella misma",
      expects: "entender por que le cuesta soltar el celular",
      fearsTherapy: "que la juzguen por algo que suena poco serio",
      beliefAboutProblem: "cree que no se trata solo de redes, sino de como se mide a si misma"
    },
    sensitiveInfo: {
      earlyBoundary: "Puedo hablar de eso, pero me cuesta si suena como que es una tontera. Prefiero ir de a poco.",
      riskResponse: "No, no he pensado en hacerme dano. Me afecta compararme, pero no he llegado a eso.",
      substanceResponse: "No, no consumo sustancias. Mi tema es mas el celular y las redes.",
      items: [
        {
          id: "validacion_externa",
          label: "dependencia de validacion externa",
          keywords: ["likes", "validacion", "aprobacion", "comparacion"],
          content: "Queda pendiente de reacciones y eso le cambia el animo.",
          revealConditions: { minTrust: 25, minSession: 1, requires: ["validacion"] }
        }
      ]
    }
  },

  daniela: {
    identity: {
      gender: "femenino",
      city: "Santiago",
      education: "educacion superior en curso",
      occupation: "estudiante y cuidadora principal de su hijo",
      civilStatus: "No estoy en pareja ahora.",
      livesWith: "Vivo con mi hijo.",
      socioeconomicLevel: "medio-bajo",
      beliefsRelevant: "Valora mucho ser una buena madre y cumplir con sus estudios.",
      dailyRoutine: "Cuido a mi hijo, estudio cuando puedo y duermo poco.",
      supportNetwork: "Mi familia ayuda a ratos, aunque me cuesta pedir ayuda sin sentir culpa."
    },
    biography: {
      childhood: "Crecio con un sentido fuerte de responsabilidad y cuidado hacia otros.",
      caregivers: "Familia presente, con apoyo parcial y expectativas de que ella se organice.",
      school: "Fue responsable y constante, acostumbrada a rendir.",
      adolescence: "Se proyecto estudiando y trabajando, antes de asumir la maternidad.",
      significantRelationships: "Su vinculo principal actual es su hijo; mantiene amistades con menor frecuencia.",
      studies: "Estudia mientras cuida a su hijo, con sensacion de no llegar a todo.",
      work: "No trabaja formalmente ahora.",
      losses: "No hay perdida central consignada.",
      majorChanges: "La maternidad reorganizo su tiempo, identidad y prioridades.",
      criticalEvents: "El agotamiento acumulado la llevo a consultar.",
      currentSituation: "Consulta con culpa por necesitar descanso y espacio propio."
    },
    timeline: [
      { period: "2019", event: "Inicia estudios superiores." },
      { period: "2023", event: "Nace su hijo Mateo y cambia radicalmente su rutina." },
      { period: "2025", event: "Retoma mayor carga academica con cansancio acumulado." },
      { period: "2026", event: "Consulta por culpa, agotamiento y necesidad de autocuidado." }
    ],
    family: {
      composition: "Vivo con mi hijo Mateo. Mi mama Rosa ayuda a ratos, pero la responsabilidad principal la siento mia.",
      mother: {
        role: "madre",
        name: "Rosa",
        age: 54,
        occupation: "tecnica en enfermeria",
        personality: "cuidada, practica y a veces exigente",
        relationship: "apoya, aunque Daniela siente que debe demostrar que puede",
        conflicts: "Daniela teme pedir demasiado",
        closeness: "media-alta"
      },
      father: unknownPerson("padre"),
      siblings: [],
      partner: null,
      children: [
        {
          role: "hijo",
          name: "Mateo",
          age: 3,
          occupation: null,
          personality: "carinoso y demandante como nino pequeno",
          relationship: "vinculo amoroso y central",
          conflicts: "Daniela se culpa por cansarse",
          closeness: "alta"
        }
      ],
      friends: ["amigas que ve poco porque su vida va a otro ritmo"]
    },
    personality: {
      temperament: "amorosa, cansada, culpable y esforzada",
      anxietyLevel: "moderado",
      initialOpenness: "media",
      responseStyle: "habla con afecto, se corrige para no sonar mala madre",
      defenses: ["culpa", "autoexigencia", "justificar cansancio"],
      humor: "escaso",
      trustInitial: 10,
      resistances: ["idealizar la maternidad", "sugerir que deberia poder sola"],
      typicalPhrases: [
        "Amo a mi hijo, pero estoy cansada.",
        "Me da culpa decirlo.",
        "Siento que deberia poder organizarme mejor.",
        "No quiero sonar mala mama."
      ],
      avoids: ["rabia", "necesidad de descanso", "frustracion con apoyos"],
      mobilizers: ["validar ambivalencia", "separar amor de agotamiento", "explorar red de apoyo"],
      emotionalRhythm: "se emociona si se siente comprendida",
      unknownAnswer: "No se. Me cuesta separar lo que siento de la culpa que aparece despues."
    },
    emotionalState: {
      currentlyFeels: "agotada, culpable y sobreexigida",
      worries: "fallar como mama o estudiante",
      fears: "ser egoista por necesitar descanso",
      shame: "admitir cansancio cuando ama a su hijo",
      needs: "permiso para cuidarse sin sentir abandono",
      hides: "momentos de irritacion y ganas de estar sola",
      selfUnknown: "no sabe cuanto descanso puede pedir sin sentirse mala madre",
      expectations: "poder decir que esta cansada sin ser juzgada"
    },
    consultation: {
      manifestMotive: "Maternidad, estudios, cansancio y culpa por necesitar autocuidado.",
      whyNow: "Vine porque estoy tratando de compatibilizar maternidad, estudio y algo de cuidado para mi. Me siento cansada y culpable.",
      recentTrigger: "Un periodo de acumulacion de tareas y poco sueno la dejo mas sobrepasada.",
      whyNotBefore: "Sentia que pedir ayuda era admitir que no podia.",
      motivatedBy: "ella misma",
      expects: "hablar de cansancio sin sentirse mala madre",
      fearsTherapy: "que interpreten su cansancio como falta de amor",
      beliefAboutProblem: "sabe que ama a su hijo, pero no entiende como sostenerse a si misma"
    },
    sensitiveInfo: {
      earlyBoundary: "Me cuesta entrar tan directo en eso, porque enseguida siento culpa. Puedo contarlo de a poco.",
      riskResponse: "No, no he pensado en hacerme dano. Estoy agotada y culpable, pero no he pensado en eso.",
      substanceResponse: "No, no consumo sustancias. No es un tema para mi.",
      items: [
        {
          id: "ambivalencia_maternidad",
          label: "ambivalencia y culpa materna",
          keywords: ["culpa", "maternidad", "mama", "descanso", "hijo"],
          content: "Puede amar a su hijo y a la vez necesitar descanso.",
          revealConditions: { minTrust: 25, minSession: 1, requires: ["validacion"] }
        }
      ]
    }
  },

  claudio: {
    identity: {
      gender: "masculino",
      city: "Santiago",
      education: "profesional universitario",
      occupation: "trabajador con estabilidad laboral",
      civilStatus: "No estoy casado. Actualmente no estoy en pareja.",
      livesWith: "Vivo solo.",
      socioeconomicLevel: "medio",
      beliefsRelevant: "Valora la responsabilidad, el autocontrol y no complicar a otros.",
      dailyRoutine: "Trabajo, vuelvo a casa y mantengo rutinas muy marcadas.",
      supportNetwork: "Tengo algunos amigos, pero hablamos mas de cosas practicas que personales."
    },
    biography: {
      childhood: "Crecio en una familia que valoraba hacer lo correcto, cumplir y no complicar.",
      caregivers: "Padres presentes, ordenados y poco expresivos emocionalmente.",
      school: "Buen rendimiento, perfil responsable y reservado.",
      adolescence: "Aprendio a pensar antes de actuar y a evitar decisiones impulsivas.",
      significantRelationships: "Tuvo una relacion de pareja importante que termino sin conflicto dramatico, pero dejo una sensacion de detencion.",
      studies: "Completo estudios superiores y construyo estabilidad laboral.",
      work: "Tiene trabajo estable y funcionamiento conservado.",
      losses: "No hay duelo agudo; si una perdida de sentido despues de cambios vitales.",
      majorChanges: "Separacion y aumento de rutina rigida en los ultimos anos.",
      criticalEvents: "No hay crisis aguda; consulta por desgaste persistente y estancamiento.",
      currentSituation: "Quiere entender por que le cuesta decidir y mover algo en su vida."
    },
    timeline: [
      { period: "infancia", event: "Aprende a valorar responsabilidad, orden y autocontrol." },
      { period: "2010", event: "Consolida una vida laboral estable." },
      { period: "2024", event: "Termina una relacion significativa y mantiene funcionamiento externo." },
      { period: "2025", event: "La rutina se vuelve mas rigida y aparece sensacion de piloto automatico." },
      { period: "2026", event: "Consulta por estancamiento y dificultad para decidir." }
    ],
    family: {
      composition: "Mi familia cercana son mis padres, Alicia y Ricardo, y una hermana, Paula. Vivo solo.",
      mother: {
        role: "madre",
        name: "Alicia",
        age: 67,
        occupation: "jubilada",
        personality: "ordenada, cuidadosa y poco confrontacional",
        relationship: "correcta y afectuosa, pero poco emocional",
        conflicts: "no suelen hablar de temas personales profundos",
        closeness: "media"
      },
      father: {
        role: "padre",
        name: "Ricardo",
        age: 70,
        occupation: "jubilado",
        personality: "responsable, exigente y practico",
        relationship: "Claudio internalizo su idea de cumplir y no fallar",
        conflicts: "le cuesta mostrar vulnerabilidad frente a el",
        closeness: "media-baja"
      },
      siblings: [
        {
          role: "hermana",
          name: "Paula",
          age: 37,
          occupation: "profesional",
          personality: "resuelta y directa",
          relationship: "se hablan, pero no siempre de lo personal",
          conflicts: "ella le dice que piensa demasiado",
          closeness: "media"
        }
      ],
      partner: null,
      children: [],
      friends: ["dos amigos de larga data con conversaciones practicas"]
    },
    personality: {
      temperament: "racional, analitico, contenido y educado",
      anxietyLevel: "moderado y encubierto por control",
      initialOpenness: "baja-media",
      responseStyle: "responde con sobriedad, matices y cautela; evita dramatizar",
      defenses: ["intelectualizacion", "racionalizacion", "postergacion"],
      humor: "muy sutil",
      trustInitial: 8,
      resistances: ["consejos rapidos", "diagnosticos prematuros", "presion para decidir"],
      typicalPhrases: [
        "No diria que estoy en crisis.",
        "Me cuesta tomar una decision sin tener demasiada certeza.",
        "Desde afuera todo funciona.",
        "Quizas lo he pensado demasiado."
      ],
      avoids: ["emociones intensas al inicio", "separacion en sesion 1 sin contexto", "historia familiar profunda"],
      mobilizers: ["encuadre claro", "preguntas especificas", "validacion sin apurar soluciones"],
      emotionalRhythm: "se abre si puede ordenar antes de sentir",
      unknownAnswer: "No tengo tan clara esa respuesta. Creo que necesitaria pensarlo un poco mas."
    },
    emotionalState: {
      currentlyFeels: "detenido, cansado y algo desconectado",
      worries: "quedarse en lo mismo por miedo a equivocarse",
      fears: "cambiar algo que funciona y arrepentirse",
      shame: "sentir malestar cuando su vida externa parece estable",
      needs: "ordenar sin tener que resolverlo todo de inmediato",
      hides: "la sensacion de que vive mas desde el deber que desde el deseo",
      selfUnknown: "no distingue bien si es miedo, costumbre o cansancio",
      expectations: "entender que le frena sin hacer cambios impulsivos"
    },
    consultation: {
      manifestMotive: "Sensacion de estancamiento vital, rutina rigida y dificultad para tomar decisiones.",
      whyNow: "Creo que vine porque hace tiempo siento que estoy funcionando en automatico. No es una crisis puntual, pero si una sensacion de estar detenido.",
      recentTrigger: "La sensacion de repeticion se hizo dificil de ignorar despues de meses de rutina.",
      whyNotBefore: "Seguía funcionando y pensaba que no ameritaba pedir ayuda.",
      motivatedBy: "el mismo",
      expects: "entender que lo frena sin decisiones impulsivas",
      fearsTherapy: "que lo empujen a resolver rapido",
      beliefAboutProblem: "cree que el problema esta en necesitar demasiada certeza antes de moverse"
    },
    sensitiveInfo: {
      earlyBoundary: "Puede tener relacion, pero creo que seria apresurado entrar tan rapido en eso. Por ahora me resulta mas facil partir por la rutina y el desgaste.",
      riskResponse: "No, no he pensado en hacerme dano. Mi malestar va mas por sentirme detenido.",
      substanceResponse: "No, no consumo sustancias. No es un tema para mi.",
      items: [
        {
          id: "separacion",
          label: "separacion y miedo a equivocarse",
          keywords: ["separacion", "ex pareja", "pareja anterior"],
          content: "Despues de una separacion siguio funcionando, pero quedo mas apagado.",
          revealConditions: { minTrust: 35, minSession: 2, requires: ["pregunta_pertinente", "validacion"] }
        },
        {
          id: "familia_de_origen",
          label: "familia de origen y deber",
          keywords: ["infancia", "familia de origen", "padres", "historia familiar"],
          content: "Aprendio a ordenar su vida desde responsabilidad y poco contacto emocional.",
          revealConditions: { minTrust: 40, minSession: 2, requires: ["pregunta_pertinente"] }
        }
      ]
    }
  },

  camila: {
    identity: {
      gender: "femenino",
      city: "Santiago",
      education: "educacion superior completa",
      occupation: "trabajadora dependiente",
      civilStatus: "No estoy en pareja ahora.",
      livesWith: "Vivo sola, aunque sigo muy pendiente de mi familia.",
      socioeconomicLevel: "medio",
      beliefsRelevant: "Asocia cuidado con disponibilidad y teme ser egoista.",
      dailyRoutine: "Trabajo, respondo mensajes y suelo resolver demandas de otros despues de la jornada.",
      supportNetwork: "Tengo amigas y familia, pero muchas veces yo termino siendo la que sostiene."
    },
    biography: {
      childhood: "Crecio ocupando un lugar responsable dentro de la familia.",
      caregivers: "Padres presentes, con dependencia emocional y practica hacia ella.",
      school: "Buena alumna, colaboradora y atenta a necesidades de otros.",
      adolescence: "Aprendio a anticiparse a problemas familiares para evitar conflictos.",
      significantRelationships: "Mantiene amistades, aunque tambien se siente requerida por ellas.",
      studies: "Completo estudios y trabaja, pero su disponibilidad familiar sigue ocupando mucho espacio.",
      work: "Trabajo estable con cansancio emocional al terminar la jornada.",
      losses: "No se registra duelo central.",
      majorChanges: "Aumento de demandas familiares y dificultad para poner limites.",
      criticalEvents: "Un periodo de agotamiento y culpa la hizo pedir ayuda.",
      currentSituation: "Consulta porque estar disponible para todos se volvio insostenible."
    },
    timeline: [
      { period: "infancia", event: "Asume tempranamente un rol colaborador en la familia." },
      { period: "2022", event: "Comienza a vivir sola, pero mantiene alta disponibilidad familiar." },
      { period: "2025", event: "Aumenta el agotamiento por responder a demandas fuera del trabajo." },
      { period: "2026", event: "Consulta por culpa, cansancio y dificultad para poner limites." }
    ],
    family: {
      composition: "Vivo sola. Mi mama Miriam, mi papa Jorge y mi hermano Ignacio estan muy presentes.",
      mother: {
        role: "madre",
        name: "Miriam",
        age: 58,
        occupation: "duena de casa",
        personality: "carinosa, ansiosa y demandante sin notarlo",
        relationship: "cercana pero absorbente",
        conflicts: "Camila siente culpa si no responde",
        closeness: "alta"
      },
      father: {
        role: "padre",
        name: "Jorge",
        age: 60,
        occupation: "trabajador independiente",
        personality: "practico y poco expresivo",
        relationship: "le pide ayuda en asuntos concretos",
        conflicts: "Camila siente que debe resolver",
        closeness: "media"
      },
      siblings: [
        {
          role: "hermano",
          name: "Ignacio",
          age: 25,
          occupation: "estudiante",
          personality: "disperso y dependiente",
          relationship: "Camila lo protege",
          conflicts: "ella se sobrecarga ayudandolo",
          closeness: "media-alta"
        }
      ],
      partner: null,
      children: [],
      friends: ["amigas que la quieren, pero tambien la buscan como apoyo"]
    },
    personality: {
      temperament: "calida, responsable, autoexigente y culpable",
      anxietyLevel: "moderado",
      initialOpenness: "media",
      responseStyle: "explica con cuidado para no sonar egoista",
      defenses: ["complacer", "justificar", "culpa"],
      humor: "suave y autocritico",
      trustInitial: 12,
      resistances: ["sugerir cortes bruscos", "juzgar a la familia", "llamarla dependiente"],
      typicalPhrases: [
        "Me cuesta decir que no.",
        "Siento que si no estoy, fallo.",
        "No quiero que suene como que no quiero ayudar.",
        "Me da culpa cansarme."
      ],
      avoids: ["rabia hacia la familia", "necesidad de distancia", "resentimiento"],
      mobilizers: ["validar cansancio", "distinguir ayudar de sobrecargarse", "tareas pequenas de limite"],
      emotionalRhythm: "se abre si no la hacen sentir egoista",
      unknownAnswer: "No se. Me cuesta responderlo sin pensar primero en como le afectaria a los demas."
    },
    emotionalState: {
      currentlyFeels: "cansada, disponible de mas y culpable",
      worries: "que poner limites signifique dejar de querer",
      fears: "que otros se molesten o se alejen",
      shame: "sentir rabia por demandas de gente que quiere",
      needs: "cuidarse sin sentir abandono",
      hides: "enojo y cansancio acumulado",
      selfUnknown: "no sabe donde termina el cuidado y empieza la sobrecarga",
      expectations: "aprender a cuidarse sin abandonar a otros"
    },
    consultation: {
      manifestMotive: "Sobrecarga relacional, culpa y dificultad para poner limites.",
      whyNow: "Vine porque estoy cansada de estar siempre disponible. Me cuesta poner limites sin sentirme mala persona.",
      recentTrigger: "Se dio cuenta de que despues del trabajo seguia resolviendo problemas de otros hasta tarde.",
      whyNotBefore: "Pensaba que era parte de querer a su familia.",
      motivatedBy: "ella misma",
      expects: "entender como cuidarse sin sentirse egoista",
      fearsTherapy: "que le digan simplemente que corte con todos",
      beliefAboutProblem: "cree que ayudar le da sentido, pero tambien la esta agotando"
    },
    sensitiveInfo: {
      earlyBoundary: "Me cuesta hablarlo porque enseguida siento que estoy siendo injusta con mi familia. Puedo ir de a poco.",
      riskResponse: "No, no he pensado en hacerme dano. Estoy cansada y con culpa, pero no en ese sentido.",
      substanceResponse: "No, no consumo sustancias. A veces uso el celular hasta tarde respondiendo mensajes.",
      items: [
        {
          id: "rabia_culpa",
          label: "rabia y culpa por cuidar",
          keywords: ["rabia", "culpa", "limites", "familia"],
          content: "Siente rabia por estar disponible y luego culpa por sentirla.",
          revealConditions: { minTrust: 25, minSession: 1, requires: ["validacion"] }
        }
      ]
    }
  }
};

const baselineIdentityOverrides = {
  valentina: {
    gender: "femenino",
    city: "Santiago",
    education: "universitaria",
    occupation: "estudiante universitaria",
    civilStatus: "No estoy en pareja ahora.",
    livesWith: "Vivo con mi familia.",
    supportNetwork: "Tengo amigas y mi familia, pero muchas veces no quiero preocuparlos."
  },
  marcos: {
    gender: "masculino",
    city: "Santiago",
    commune: "Nunoa",
    education: "educacion superior o tecnica completa",
    occupation: marcosBasicProfile.profile.occupation,
    civilStatus: marcosBasicProfile.profile.civilStatus,
    livesWith: marcosBasicProfile.profile.livesWith,
    housingType: "un departamento arrendado",
    residenceExperience: marcosBasicProfile.profile.housingContext,
    familyComposition: `${marcosBasicProfile.profile.livesWith} ${marcosBasicProfile.profile.children} ${marcosBasicProfile.profile.familySummary}`,
    supportNetwork: marcosBasicProfile.profile.supportNetwork
  },
  elena: {
    gender: "femenino",
    city: "Santiago",
    education: "educacion media completa",
    occupation: "trabaja algunas horas",
    civilStatus: "No estoy en pareja ahora.",
    livesWith: "Vivo sola la mayor parte del tiempo.",
    supportNetwork: "Tengo hijos y algunas amigas, pero me cuesta pedir compania."
  },
  nicolas: {
    gender: "masculino",
    city: "Santiago",
    education: "ensenanza media en curso",
    occupation: "estudiante escolar",
    civilStatus: "No, no tengo pareja.",
    livesWith: "Vivo con mi familia.",
    supportNetwork: "No cuento mucho estas cosas; antes hablaba mas con companeros."
  },
  rodrigo: {
    gender: "masculino",
    city: "Santiago",
    education: "educacion superior o tecnica",
    occupation: "trabajador",
    civilStatus: "Estoy separado.",
    livesWith: "Vivo solo desde la separacion. Mis hijos estan conmigo algunos dias.",
    supportNetwork: "Tengo amigos y familia, pero me cuesta hablar de la separacion."
  },
  fernanda: {
    gender: "femenino",
    city: "Santiago",
    education: "educacion superior o tecnica",
    occupation: "trabajadora en retorno laboral",
    civilStatus: "Si, tengo pareja.",
    livesWith: "Vivo con mi pareja.",
    supportNetwork: "Tengo apoyo de mi pareja y familia, aunque no siempre digo como estoy."
  },
  hector: {
    gender: "masculino",
    city: "Santiago",
    education: "educacion media completa",
    occupation: "jubilado",
    civilStatus: "Si, estoy casado.",
    livesWith: "Vivo con mi esposa.",
    supportNetwork: "Mi esposa y mi familia estan, aunque muchos vinculos eran del trabajo."
  },
  andres: {
    gender: "masculino",
    city: "Santiago",
    education: "universitaria en curso",
    occupation: "estudiante universitario",
    civilStatus: "No tengo pareja ahora.",
    livesWith: "Vivo con mi familia.",
    supportNetwork: "Tengo a mi familia y conozco gente en la universidad, pero me cuesta sentirme parte."
  },
  patricia: {
    gender: "femenino",
    city: "Santiago",
    education: "educacion media o tecnica",
    occupation: "trabajadora",
    civilStatus: "No estoy en pareja ahora.",
    livesWith: "Vivo con mi hija.",
    supportNetwork: "Tengo algunas amigas, pero me da verguenza contar que discutimos tanto."
  },
  miguel: {
    gender: "masculino",
    city: "Santiago",
    education: "formacion previa en su pais de origen",
    occupation: "trabajador",
    civilStatus: "No estoy en pareja ahora.",
    livesWith: "Vivo solo por ahora.",
    supportNetwork: "Mi familia esta lejos y estoy armando redes aca."
  }
};

export const patientMasterRecords = Object.fromEntries(
  Object.keys(caseProfiles).map((caseId) => [
    caseId,
    buildPatientRecord(caseId)
  ])
);

warnIncompletePatientRecords(patientMasterRecords);

export function getPatientMasterRecord(caseId) {
  return patientMasterRecords[caseId] || null;
}

function buildPatientRecord(caseId) {
  if (caseId === "marcos") return marcosPremiumPatient;
  if (caseId === "tomas") return tomasDeepPatient;

  const profile = caseProfiles[caseId] || {};
  const facts = patientFacts[caseId] || {};
  const priority = priorityPatientRecords[caseId] || {};
  const identityOverride = baselineIdentityOverrides[caseId] || {};
  const defaultSessionPlan = buildDefaultSessionPlan({ caseId, facts, profile });
  const base = {
    id: caseId,
    identity: {
      name: facts.name || profile.name || caseId,
      age: profile.age || facts.age || null,
      gender: identityOverride.gender || "no especificado",
      city: identityOverride.city || "Santiago",
      education: identityOverride.education || facts.academic || facts.school || UNKNOWN,
      occupation: identityOverride.occupation || facts.works || facts.academic || UNKNOWN,
      civilStatus: identityOverride.civilStatus || UNKNOWN,
      livesWith: identityOverride.livesWith || facts.family || UNKNOWN,
      socioeconomicLevel: identityOverride.socioeconomicLevel || "medio",
      beliefsRelevant: identityOverride.beliefsRelevant || "No se consignan creencias especificas relevantes.",
      dailyRoutine: identityOverride.dailyRoutine || facts.habits || profile.dailyRoutine || UNKNOWN,
      supportNetwork: identityOverride.supportNetwork || facts.social || profile.socialContext || UNKNOWN
    },
    biography: {
      childhood: "No se explora en detalle en el expediente inicial.",
      caregivers: "No se explora en detalle en el expediente inicial.",
      school: facts.school || profile.academicOrWorkContext || UNKNOWN,
      adolescence: "No se explora en detalle en el expediente inicial.",
      significantRelationships: facts.social || profile.socialContext || UNKNOWN,
      studies: facts.academic || profile.academicOrWorkContext || UNKNOWN,
      work: facts.works || UNKNOWN,
      losses: "No se registran perdidas centrales en el expediente inicial.",
      majorChanges: profile.mainTheme || facts.temaCentral || UNKNOWN,
      criticalEvents: facts.motive || profile.reasonForConsultation || UNKNOWN,
      currentSituation: facts.motive || profile.reasonForConsultation || UNKNOWN
    },
    timeline: [
      { period: "historia previa", event: facts.temaCentral || profile.mainTheme || UNKNOWN },
      { period: "actualidad", event: facts.motive || profile.reasonForConsultation || UNKNOWN }
    ],
    family: {
      composition: identityOverride.familyComposition || facts.family || profile.familyContext || identityOverride.livesWith || UNKNOWN,
      mother: unknownPerson("madre"),
      father: unknownPerson("padre"),
      siblings: [],
      partner: identityOverride.civilStatus && /pareja|casado|casada/.test(identityOverride.civilStatus)
        ? { role: "pareja", name: null, age: null, occupation: null, personality: UNKNOWN, relationship: identityOverride.civilStatus, conflicts: UNKNOWN, closeness: UNKNOWN }
        : null,
      children: /hijo|hija|hijos/.test(facts.family || "") ? [{ role: "hijo/a", name: null, age: null, occupation: null, personality: UNKNOWN, relationship: facts.family, conflicts: UNKNOWN, closeness: UNKNOWN }] : [],
      friends: facts.social ? [facts.social] : []
    },
    personality: {
      temperament: profile.presentationStyle || "cauteloso y coherente con su motivo de consulta",
      anxietyLevel: "moderado segun contexto",
      initialOpenness: "baja a media",
      responseStyle: profile.communicationStyle || "responde con cautela y se abre gradualmente",
      defenses: ["evitacion leve", "racionalizacion", "minimizacion"],
      humor: "sobrio",
      trustInitial: 8,
      resistances: profile.whatThePatientAvoids ? [profile.whatThePatientAvoids] : ["preguntas invasivas o muy rapidas"],
      typicalPhrases: profile.phrasesTheyUse || [],
      avoids: profile.whatThePatientAvoids ? [profile.whatThePatientAvoids] : [],
      mobilizers: ["validacion", "preguntas concretas", "ritmo respetuoso"],
      emotionalRhythm: "apertura gradual",
      unknownAnswer: "No tengo tan claro eso. Prefiero ir de a poco con lo que si puedo responder."
    },
    emotionalState: {
      currentlyFeels: facts.concern || profile.emotionalCore || UNKNOWN,
      worries: facts.concern || profile.emotionalCore || UNKNOWN,
      fears: facts.concreteConcern || facts.concern || UNKNOWN,
      shame: "No se explicita en el expediente inicial.",
      needs: facts.expectation || "ser escuchado sin juicio",
      hides: "No se explicita en el expediente inicial.",
      selfUnknown: "No entiende completamente por que esto se volvio dificil.",
      expectations: facts.expectation || UNKNOWN
    },
    consultation: {
      manifestMotive: facts.motive || profile.reasonForConsultation || profile.mainTheme || UNKNOWN,
      whyNow: facts.motive || profile.reasonForConsultation || UNKNOWN,
      recentTrigger: facts.concreteDisclosures?.[0] || profile.reasonForConsultation || UNKNOWN,
      whyNotBefore: "No se consigna con detalle en el expediente inicial.",
      motivatedBy: "No se consigna con detalle en el expediente inicial.",
      expects: facts.expectation || UNKNOWN,
      fearsTherapy: "Teme ser juzgado o simplificado.",
      beliefAboutProblem: facts.concreteConcern || facts.concern || profile.emotionalCore || UNKNOWN
    },
    sensitiveInfo: {
      earlyBoundary: "Prefiero ir de a poco con eso. Puedo responder mejor desde lo que esta pasando ahora.",
      riskResponse: "No, no he pensado en hacerme dano. Mi malestar va por otro lado.",
      substanceResponse: "No, no consumo sustancias. No es un tema central para mi.",
      items: []
    },
    pedagogy: {
      goals: profile.learningObjectives || [],
      discover: [facts.temaCentral || profile.mainTheme || UNKNOWN],
      commonErrors: [
        "apurar conclusiones",
        "hacer preguntas multiples sin pausa",
        "dar consejos antes de explorar"
      ],
      clinicalSignals: [profile.riskSignals || facts.concreteConcern || facts.concern || UNKNOWN],
      skills: [
        "encuadre",
        "preguntas abiertas",
        "validacion",
        "seguimiento contextual",
        "cierre formativo"
      ],
      approaches: ["integrativo", "humanista", "cognitivo conductual", "sistemico"],
      pertinentQuestions: ["motivo de consulta", "rutina", "emociones", "red de apoyo"],
      invasiveQuestions: ["trauma o antecedentes sensibles sin alianza"]
    },
    sessionPlan: defaultSessionPlan,
    clinicalPlan: defaultSessionPlan
  };

  return deepMerge(base, {
    ...priority,
    id: caseId,
    identity: {
      ...base.identity,
      ...identityOverride,
      ...(priority.identity || {}),
      name: facts.name || profile.name || priority.identity?.name || caseId,
      age: profile.age || facts.age || priority.identity?.age || null
    },
    pedagogy: {
      ...base.pedagogy,
      goals: priority.pedagogy?.goals || profile.learningObjectives || base.pedagogy.goals
    },
    sessionPlan: priority.sessionPlan || defaultSessionPlan,
    clinicalPlan: priority.clinicalPlan || priority.sessionPlan || defaultSessionPlan
  });
}

function buildDefaultSessionPlan({ facts = {}, profile = {} }) {
  const theme = facts.temaCentral || profile.mainTheme || profile.reasonForConsultation || "motivo de consulta";
  const recommended = profile.difficulty === "Avanzado" ? 4 : profile.difficulty === "Introductorio" ? 2 : 3;

  return {
    maxSessions: 4,
    expectedRange: {
      minimum: 1,
      recommended,
      maximum: 4
    },
    expectedSessions: {
      minimum: 1,
      maximum: 4,
      recommended
    },
    continueIf: [
      "El motivo de consulta aun no esta suficientemente delimitado.",
      "No se ha explorado red de apoyo, contexto familiar o recursos cotidianos.",
      "Aparecen senales de malestar persistente que requieren seguimiento.",
      "No se ha realizado cierre, sintesis o acuerdo de objetivos para la continuidad."
    ],
    closeIf: [
      "El estudiante clarifica el motivo de consulta y el estado emocional actual.",
      "No aparecen senales de riesgo que exijan intervencion urgente.",
      "Se exploran apoyos basicos y proximos pasos realistas.",
      "El cierre incluye sintesis y acuerdo formativo."
    ],
    referIf: [
      "Ideacion suicida activa o riesgo vital.",
      "Violencia actual, vulneracion grave o riesgo para terceros.",
      "Consumo problematico severo.",
      "Sintomas psicoticos, crisis aguda o deterioro funcional importante.",
      "Necesidad de intervencion especializada que excede el simulador."
    ],
    riskProtocolIf: [
      "Riesgo vital actual o ideacion suicida activa.",
      "Violencia actual o amenaza inminente.",
      "Vulneracion grave o deterioro agudo."
    ],
    sessionGoals: {
      session1: [
        "Establecer encuadre.",
        `Explorar ${theme}.`,
        "Identificar estado emocional actual, apoyos y riesgo.",
        "Definir si corresponde cerrar, continuar o derivar."
      ],
      session2: [
        "Profundizar historia del problema.",
        "Explorar contexto familiar, social o laboral/academico.",
        "Identificar patrones de afrontamiento."
      ],
      session3: [
        "Explorar recursos personales.",
        "Construir una comprension inicial compartida.",
        "Acordar objetivos breves de continuidad."
      ],
      session4: [
        "Realizar sintesis del proceso.",
        "Evaluar cierre, derivacion o continuidad externa.",
        "Practicar cierre formativo y limites del simulador."
      ]
    },
    betweenSessions: {
      afterSession1: "El paciente puede llegar con algo mas de confianza si hubo encuadre y escucha respetuosa.",
      afterSession2: "El paciente puede profundizar en temas personales si la entrevista anterior fue cuidadosa.",
      afterSession3: "El paciente puede reconocer patrones o recursos, sin que eso implique resolucion completa.",
      afterSession4: "El paciente puede aceptar cierre, derivacion o continuidad segun la decision clinica del estudiante."
    }
  };
}

function deepMerge(target, source) {
  if (!source || typeof source !== "object") return target;
  const output = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (Array.isArray(value)) {
      output[key] = value;
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      output[key] = deepMerge(output[key] && typeof output[key] === "object" ? output[key] : {}, value);
    } else if (value !== undefined) {
      output[key] = value;
    }
  }
  return output;
}
