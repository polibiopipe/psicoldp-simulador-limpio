const blueprint = ({
  id,
  intention,
  approach,
  activates,
  disclosure,
  goodResponse,
  evasiveResponse,
  mustNot,
  variants
}) => variants.map((question, index) => ({
  id: `${id}-${index + 1}`,
  question,
  clinicalIntention: intention,
  possibleApproach: approach,
  dossierDataToActivate: activates,
  expectedDisclosureLevel: disclosure,
  goodResponseExample: goodResponse,
  evasiveResponseIfLowTrust: evasiveResponse,
  errorsThatMustNotOccur: mustNot
}));

const commonNoFallback = [
  "No caer en respuesta generica de confusion si la pregunta es clara.",
  "No responder como terapeuta.",
  "No inventar antecedentes fuera del expediente."
];

const sets = [
  {
    id: "identity",
    intention: "identidad",
    approach: "entrevista inicial",
    activates: "identity.name, identity.age",
    disclosure: 1,
    goodResponse: "Me llamo Marcos. Tengo 38 anos.",
    evasiveResponse: "Me llamo Marcos.",
    mustNot: commonNoFallback,
    variants: ["Como te llamas?", "Cual es tu nombre?", "Me puedes decir tu nombre?", "Cuantos anos tienes, Marcos?"]
  },
  {
    id: "housing",
    intention: "vivienda",
    approach: "entrevista inicial",
    activates: "identity.city, identity.commune, identity.livesWith, identity.residenceExperience",
    disclosure: 1,
    goodResponse: "Vivo en Nunoa, con mi pareja. La casa deberia ser para descansar, pero a veces llego irritable.",
    evasiveResponse: "Vivo en Nunoa con mi pareja.",
    mustNot: commonNoFallback,
    variants: ["Donde vives?", "Con quien vives?", "Como es tu casa cuando llegas de la pega?", "Vives solo o con alguien?"]
  },
  {
    id: "family-composition",
    intention: "familia_composicion",
    approach: "sistemico",
    activates: "familyMap.composition",
    disclosure: 1,
    goodResponse: "Mi familia de origen son mi mama Teresa, mi papa Arturo y mi hermana Carolina. Vivo con Paula y no tengo hijos.",
    evasiveResponse: "Tengo a mis papas, una hermana y mi pareja.",
    mustNot: commonNoFallback,
    variants: ["Como se compone tu familia?", "Tienes hermanos?", "Tienes hijos?", "Quienes son parte de tu familia cercana?"]
  },
  {
    id: "mother",
    intention: "madre",
    approach: "psicodinamico",
    activates: "familyMap.members.mother, scene mother-wet-coat",
    disclosure: 2,
    goodResponse: "Mi mama es preocupada, bien practica. Cuida haciendo cosas, pero a veces eso tambien me hace sentir que deberia estar mejor.",
    evasiveResponse: "Mi mama es preocupada. Estamos bien.",
    mustNot: commonNoFallback,
    variants: ["Como era tu mama contigo?", "Que recuerdas de tu mama cuando eras chico?", "Como te cuida tu mama?", "Que te pasa cuando tu mama se preocupa por ti?"]
  },
  {
    id: "father",
    intention: "padre",
    approach: "psicodinamico",
    activates: "familyMap.members.father, scene father-keys",
    disclosure: 3,
    goodResponse: "Mi papa era responsable, pero su cansancio se sentia en toda la casa. Me cuesta reconocer que a veces hago algo parecido.",
    evasiveResponse: "Mi papa trabajaba mucho. Era responsable, mas bien serio.",
    mustNot: commonNoFallback,
    variants: ["Como era tu papa contigo?", "Que pasaba en tu casa cuando tu papa llegaba cansado?", "Esto te recuerda algo de tu padre?", "Que aprendiste de tu papa sobre el trabajo?"]
  },
  {
    id: "childhood",
    intention: "infancia",
    approach: "psicodinamico",
    activates: "biographyNarrative, lifeTimeline ages 6-12",
    disclosure: 2,
    goodResponse: "Mi infancia fue ordenada, pero yo estaba atento al ambiente. Aprendi a no pedir mucho si la casa estaba tensa.",
    evasiveResponse: "Fue una infancia bastante normal, con una familia trabajadora.",
    mustNot: commonNoFallback,
    variants: ["Como fue tu infancia?", "Que lugar ocupabas en tu familia?", "Que aprendiste sobre pedir ayuda cuando chico?", "Como era el clima emocional de tu casa?"]
  },
  {
    id: "school",
    intention: "historia_escolar",
    approach: "exploracion biografica",
    activates: "scene school-presentation",
    disclosure: 2,
    goodResponse: "Me iba bien porque era constante. Me daba verguenza exponer; una vez me quede en blanco y me marco mas de lo que parecia.",
    evasiveResponse: "Me iba bien, era responsable.",
    mustNot: commonNoFallback,
    variants: ["Como te iba en el colegio?", "Eras de participar en clases?", "Recuerdas alguna escena de verguenza en la escuela?", "Que pasaba cuando tenias que exponerte?"]
  },
  {
    id: "adolescence",
    intention: "adolescencia",
    approach: "biografico",
    activates: "lifeTimeline ages 13-18",
    disclosure: 2,
    goodResponse: "No fui muy rebelde. Queria pertenecer, pero sin llamar demasiado la atencion.",
    evasiveResponse: "Fue tranquila, nada tan distinto.",
    mustNot: commonNoFallback,
    variants: ["Como fue tu adolescencia?", "Como eras con tus amigos?", "Te sentias parte de algun grupo?", "Que hacias cuando habia conflictos?"]
  },
  {
    id: "first-relationship",
    intention: "primeras_relaciones",
    approach: "humanista",
    activates: "scene first-breakup-desk",
    disclosure: 3,
    goodResponse: "En mi primera relacion me decian que era demasiado serio. Cuando termino, me puse a ordenar cosas en vez de hablar de pena.",
    evasiveResponse: "Tuve una relacion adolescente, normal.",
    mustNot: commonNoFallback,
    variants: ["Como fueron tus primeras relaciones?", "Te han dicho que eres distante?", "Como reaccionas cuando una relacion se termina?", "Que te pasa cuando alguien te pide hablar mas de lo que sientes?"]
  },
  {
    id: "current-partner",
    intention: "pareja_actual",
    approach: "sistemico",
    activates: "familyMap.members.partner, relationshipMap.byRelationship.partner",
    disclosure: 1,
    goodResponse: "Tengo pareja, Paula. Me preocupa que a veces llegue tan tomado por la pega que ella sienta que no estoy realmente.",
    evasiveResponse: "Si, tengo pareja. Vivimos juntos.",
    mustNot: commonNoFallback,
    variants: ["Tienes pareja?", "Como esta tu relacion con Paula?", "Que pasa con tu pareja cuando te nota distante?", "Que te preocupa de tu convivencia?"]
  },
  {
    id: "consultation-motive",
    intention: "motivo_consulta",
    approach: "entrevista inicial",
    activates: "consultation.whyNow, symptomHistory.onset",
    disclosure: 1,
    goodResponse: "Vine porque ando cansado, mas irritable, y siento que la pega se me esta metiendo a la casa.",
    evasiveResponse: "Creo que tiene que ver con cansancio y pega.",
    mustNot: commonNoFallback,
    variants: ["Que te trae por aca?", "Por que decidiste consultar?", "Que hizo que vinieras ahora?", "Que esperas de esta conversacion?"]
  },
  {
    id: "work",
    intention: "trabajo",
    approach: "laboral",
    activates: "workHistory.currentRole",
    disclosure: 1,
    goodResponse: "Trabajo como coordinador de operaciones comerciales. Es una pega donde siempre hay urgencias y siento que todo termina pasando por mi.",
    evasiveResponse: "Trabajo en operaciones, en una empresa de servicios logisticos.",
    mustNot: commonNoFallback,
    variants: ["En que trabajas?", "Como es tu pega?", "Que representa el trabajo para ti?", "Que pasa con tus responsabilidades laborales?"]
  },
  {
    id: "boss",
    intention: "jefatura",
    approach: "sistemico",
    activates: "workHistory.bossRelationship",
    disclosure: 2,
    goodResponse: "Mi jefe Esteban confia en mi, pero tambien me pasa cosas porque sabe que las saco. Me da rabia y aun asi respondo.",
    evasiveResponse: "Mi jefe es exigente, pero valora mi trabajo.",
    mustNot: commonNoFallback,
    variants: ["Que sientes cuando tu jefe te exige mas?", "Como es la relacion con Esteban?", "Te cuesta decirle que no a tu jefe?", "Que pasa cuando te delegan urgencias?"]
  },
  {
    id: "coworkers",
    intention: "companeros",
    approach: "sistemico",
    activates: "workHistory.coworkers",
    disclosure: 2,
    goodResponse: "Me llevo bien con mis companeros, pero siento que muchas veces esperan que yo ordene el incendio.",
    evasiveResponse: "Me llevo bien, en general.",
    mustNot: commonNoFallback,
    variants: ["Que pasa con tus companeros?", "Pides ayuda en la pega?", "Como te ven en el equipo?", "Te sientes apoyado por tus colegas?"]
  },
  {
    id: "symptoms",
    intention: "sintomas_malestar",
    approach: "clinico inicial",
    activates: "symptomHistory",
    disclosure: 1,
    goodResponse: "Estoy cansado, duermo pero no descanso, ando con poca paciencia y a veces siento el cuerpo tenso antes de reuniones.",
    evasiveResponse: "Cansancio, sobre todo. Y poca paciencia.",
    mustNot: commonNoFallback,
    variants: ["Como te has sentido?", "Que sintomas has notado?", "Como esta tu energia?", "Como esta tu animo ultimamente?"]
  },
  {
    id: "sleep",
    intention: "sueno",
    approach: "clinico inicial",
    activates: "symptomHistory.sleep",
    disclosure: 1,
    goodResponse: "Duermo, pero despierto temprano pensando en pendientes. No siempre siento que descanse.",
    evasiveResponse: "He dormido peor, mas liviano.",
    mustNot: commonNoFallback,
    variants: ["Como estas durmiendo?", "Te despiertas durante la noche?", "Descansas cuando duermes?", "A que hora empiezas a pensar en pendientes?"]
  },
  {
    id: "irritability",
    intention: "irritabilidad",
    approach: "emocional",
    activates: "symptomHistory.irritability, scenes silent-dinner and mother-phone-short",
    disclosure: 2,
    goodResponse: "Respondo corto, sobre todo en la casa. Despues me da culpa porque no es que no me importe.",
    evasiveResponse: "Ando con poca paciencia.",
    mustNot: commonNoFallback,
    variants: ["Como aparece tu irritabilidad?", "Que haces cuando no quieres hablar?", "Que pasa cuando llegas cansado a casa?", "A quien le respondes mas corto?"]
  },
  {
    id: "guilt",
    intention: "culpa",
    approach: "humanista",
    activates: "symptomHistory.guilt, psychodynamicMap.guilt",
    disclosure: 2,
    goodResponse: "Me da culpa cuando trato mal a Paula o contesto corto a mi mama. En el momento solo quiero silencio, despues me pesa.",
    evasiveResponse: "Si, despues me da culpa, pero no se bien como explicarlo.",
    mustNot: commonNoFallback,
    variants: ["Que te da culpa?", "Cuando aparece la culpa?", "Que pasa despues de responder corto?", "Que te reprochas a ti mismo?"]
  },
  {
    id: "shame",
    intention: "verguenza",
    approach: "humanista",
    activates: "symptomHistory.shame, scene bathroom-dark",
    disclosure: 3,
    goodResponse: "Me da verguenza no poder manejar algo que se supone que deberia poder manejar. Me cuesta sonar como que me quejo.",
    evasiveResponse: "Verguenza no se... quizas pudor de hablar de esto.",
    mustNot: commonNoFallback,
    variants: ["Que te da verguenza reconocer?", "Te da verguenza pedir ayuda?", "Que te preocupa que yo piense de ti?", "Que te cuesta decir en voz alta?"]
  },
  {
    id: "fear",
    intention: "miedo",
    approach: "emocional",
    activates: "psychodynamicMap, cognitiveBehavioralMap.coreBeliefs",
    disclosure: 3,
    goodResponse: "Me da miedo fallar y que se note que no soy tan capaz. Tambien me asusta parecerme a mi papa cuando llego agotado.",
    evasiveResponse: "Creo que miedo a fallar, a no responder como corresponde.",
    mustNot: commonNoFallback,
    variants: ["Que te da miedo?", "Que temes que ocurra si bajas el ritmo?", "Que pasa si no respondes?", "Que seria lo peor de no poder con todo?"]
  },
  {
    id: "risk",
    intention: "riesgo_autolesion",
    approach: "seguridad",
    activates: "riskMap.suicidalIdeation",
    disclosure: 1,
    goodResponse: "No, no he pensado en hacerme dano. Si he pensado en apagar todo un rato, pero no en hacerme algo.",
    evasiveResponse: "No, no es eso. Estoy cansado, pero no en ese punto.",
    mustNot: commonNoFallback,
    variants: ["Has pensado en hacerte dano?", "Has sentido que no puedes mas?", "Has pensado que no vale la pena seguir?", "Cuando dices que estas agotado, ha aparecido alguna idea de hacerte algo?"]
  },
  {
    id: "substances",
    intention: "consumo_sustancias",
    approach: "seguridad",
    activates: "riskMap.substanceUse",
    disclosure: 1,
    goodResponse: "No consumo sustancias. Alcohol ocasional, una cerveza o copa social, pero no lo veo como el problema.",
    evasiveResponse: "No, no es un tema para mi.",
    mustNot: commonNoFallback,
    variants: ["Consumes alcohol u otras sustancias?", "Has tomado mas para dormir o desconectarte?", "Usas algo para bajar la tension?", "El alcohol se ha vuelto un problema?"]
  },
  {
    id: "support",
    intention: "red_apoyo",
    approach: "sistemico",
    activates: "identity.supportNetwork, relationshipMap.byRelationship.friends",
    disclosure: 1,
    goodResponse: "Paula es quien mas lo nota. Tengo amigos, pero no suelo llamarlos para decir que estoy mal.",
    evasiveResponse: "Tengo gente cerca, pero no hablo mucho de esto.",
    mustNot: commonNoFallback,
    variants: ["Con quien cuentas cuando estas mal?", "A quien le pides ayuda?", "Tienes amigos con quienes hablar?", "Quien nota primero que estas sobrepasado?"]
  },
  {
    id: "routine",
    intention: "rutina",
    approach: "entrevista inicial",
    activates: "identity.dailyRoutine",
    disclosure: 1,
    goodResponse: "Trabajo, vuelvo a la casa con poca energia y muchas veces sigo pensando en pendientes. Duermo, pero no siempre descanso.",
    evasiveResponse: "Trabajo mucho y llego cansado.",
    mustNot: commonNoFallback,
    variants: ["Como es un dia normal para ti?", "Como es tu rutina?", "Que haces al llegar a casa?", "Como se ve una semana tipica?"]
  },
  {
    id: "automatic-thoughts",
    intention: "pensamientos",
    approach: "cognitivo conductual",
    activates: "cognitiveBehavioralMap.automaticThoughts",
    disclosure: 2,
    goodResponse: "Pienso que si no respondo, algo va a fallar o manana sera peor. Entonces contesto aunque este agotado.",
    evasiveResponse: "Pienso mucho en pendientes y en no dejar cosas botadas.",
    mustNot: commonNoFallback,
    variants: ["Que piensas cuando llega un mensaje fuera de horario?", "Que te dices cuando algo falla?", "Que pensamiento aparece cuando intentas descansar?", "Que pasa por tu cabeza antes de responderle al jefe?"]
  },
  {
    id: "avoidance",
    intention: "evitacion",
    approach: "cognitivo conductual",
    activates: "cognitiveBehavioralMap.avoidanceBehaviors",
    disclosure: 2,
    goodResponse: "Evito hablar cuando llego cansado. Tambien reviso pendientes para sentir que tengo algo bajo control.",
    evasiveResponse: "A veces prefiero quedarme callado.",
    mustNot: commonNoFallback,
    variants: ["Que evitas cuando estas asi?", "Que haces para no sentir tanto cansancio?", "Como cortas una conversacion incomoda?", "Que haces cuando no quieres hablar?"]
  },
  {
    id: "psychodynamic-link",
    intention: "repeticion_biografica",
    approach: "psicodinamico",
    activates: "psychodynamicMap.biographicalRepetition",
    disclosure: 4,
    goodResponse: "Me cuesta decirlo, pero a veces me asusta parecerme a mi papa cuando llegaba cansado y todos bajabamos el volumen.",
    evasiveResponse: "Puede tener relacion con mi casa, pero no se si quiero entrar tan rapido en eso.",
    mustNot: commonNoFallback,
    variants: ["Esto que te pasa hoy te recuerda algo de antes?", "Sientes que repites algo de tu historia?", "Que se parece entre tu casa de antes y tu casa actual?", "Hay algo de tu padre que temas repetir?"]
  },
  {
    id: "humanistic-need",
    intention: "necesidad_emocional",
    approach: "humanista",
    activates: "humanisticMap.unspokenNeeds",
    disclosure: 3,
    goodResponse: "Quizas necesito que alguien entienda que no es que no me importe. Estoy cansado de sostener y no se como decirlo sin sentir culpa.",
    evasiveResponse: "Necesito ordenar un poco lo que me pasa.",
    mustNot: commonNoFallback,
    variants: ["Que te gustaria que alguien entendiera de ti?", "Que necesitas poder decir?", "Que seria sentirte escuchado?", "Que parte tuya sientes que nadie esta viendo?"]
  },
  {
    id: "systemic-function",
    intention: "funcion_sintoma",
    approach: "sistemico",
    activates: "systemicMap.symptomFunction",
    disclosure: 3,
    goodResponse: "Quizas mi irritabilidad termina mostrando algo que yo no digo antes: que ya no me da la energia.",
    evasiveResponse: "No se. Supongo que se nota mas en la casa que en la pega.",
    mustNot: commonNoFallback,
    variants: ["Que funcion cumple tu irritabilidad en la casa?", "Que pasa en Paula cuando tu te quedas callado?", "Que cambia en tu sistema cuando estas agotado?", "Quien nombra el problema cuando tu no lo dices?"]
  },
  {
    id: "task",
    intention: "tarea_terapeutica",
    approach: "intervencion formativa",
    activates: "pedagogicalGoals, symptomHistory.attemptedSolutions",
    disclosure: 1,
    goodResponse: "Si es algo concreto, podria intentarlo. Me serviria que no sea demasiado largo porque ahi probablemente lo postergo.",
    evasiveResponse: "Podria intentarlo, aunque no prometo hacerlo perfecto.",
    mustNot: commonNoFallback,
    variants: ["Te propongo registrar cuando aparece la irritabilidad, te parece?", "Podrias anotar que pasa al llegar a casa?", "Te parece hacer una tarea breve esta semana?", "Podrias observar que pensamiento aparece cuando respondes mensajes tarde?"]
  },
  {
    id: "closure",
    intention: "cierre_sesion",
    approach: "cierre formativo",
    activates: "pedagogicalGoals.learningObjectives",
    disclosure: 1,
    goodResponse: "Gracias. Me sirve dejar ordenado que esto no es solo cansancio de la pega. Podemos retomarlo la proxima.",
    evasiveResponse: "Si, gracias. Creo que podemos seguir otro dia.",
    mustNot: commonNoFallback,
    variants: ["Nos queda poco tiempo, podemos cerrar por hoy.", "Para cerrar, quiero resumir lo que hablamos.", "Podemos seguir trabajando esto la proxima sesion.", "Nos vemos la proxima semana y revisamos como te fue."]
  },
  {
    id: "transference",
    intention: "transferencia",
    approach: "psicodinamico",
    activates: "psychodynamicMap.probableTransference",
    disclosure: 3,
    goodResponse: "Me preocupa sonar como que exagero. Tambien me pasa que quiero responder bien, como si esto fuera otra evaluacion.",
    evasiveResponse: "No se bien. Me cuesta saber que se espera de mi aqui.",
    mustNot: commonNoFallback,
    variants: ["Que te preocupa que yo piense de ti?", "Como te sientes hablando conmigo?", "Sientes que tienes que responder bien aqui?", "Que te pasa cuando te hago preguntas directas?"]
  }
];

export const marcosTestQuestions = sets.flatMap(blueprint);

export const marcosTestQuestionCount = marcosTestQuestions.length;
