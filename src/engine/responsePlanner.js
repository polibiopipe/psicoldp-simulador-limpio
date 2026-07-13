import { caseFacts } from "../data/caseFacts.js";
import { patientProfiles } from "../data/patientProfiles.js";

const concretePlans = {
  tomas: {
    pregunta_escolar_concreta: ["Sí, voy al colegio.", "Últimamente me cuesta más participar, sobre todo cuando hay trabajos en grupo.", "También me incomoda hablar delante de otros."],
    pregunta_academica_concreta: ["Sí, estudio en el colegio.", "Me va más o menos, pero participar me cuesta.", "Prefiero pasar piola."],
    pregunta_laboral_concreta: ["No, no trabajo.", "Estoy en el colegio y paso harto tiempo en el computador.", "En la casa igual eso genera peleas."],
    pregunta_vivienda_concreta: ["Sí, vivo con mis papás.", "También con mi hermana menor.", "Últimamente discutimos harto por el computador."],
    pregunta_familiar_concreta: ["Más o menos.", "Con mis papás el tema del computador termina en pelea.", "Siento que ya tienen una opinión lista sobre mí."],
    pregunta_social_concreta: ["Algunos.", "Más online que en el colegio.", "En persona me cuesta saber qué decir."],
    pregunta_habitos_concreta: ["Más o menos.", "A veces me quedo tarde jugando o viendo videos.", "No siempre es por querer jugar, a veces es para no pensar."],
    pregunta_videojuegos: ["Sí, juego bastante.", "Para mí no es solo jugar, también es desconectarme un rato.", "En el juego por lo menos sé qué hacer."]
  },
  valentina: {
    pregunta_escolar_concreta: ["No, ya no voy al colegio.", "Ahora estudio en la universidad.", "La exigencia se me ha hecho pesada."],
    pregunta_academica_concreta: ["Sí, estudio en la universidad.", "Últimamente siento que no me alcanza el tiempo para todo.", "Cuando paro, igual me siento culpable."],
    pregunta_laboral_concreta: ["No trabajo formalmente.", "La universidad me ocupa como si fuera jornada completa.", "Mi cabeza no se apaga mucho."],
    pregunta_vivienda_concreta: ["Vivo con mi familia.", "En la casa se valora mucho cumplir y esforzarse.", "A veces siento que no puedo bajar el ritmo."],
    pregunta_familiar_concreta: ["Sí, mi familia está presente.", "Ellos confían mucho en mí y eso a veces pesa.", "Me da miedo decepcionarlos."],
    pregunta_social_concreta: ["Sí, tengo amigas.", "Pero muchas veces postergo verlas por estudiar.", "Después me siento sola, aunque yo misma me aleje."],
    pregunta_habitos_concreta: ["Descanso poco.", "Y cuando descanso, igual me siento culpable.", "Mi cabeza sigue haciendo listas."],
    pregunta_videojuegos: ["No, no juego videojuegos.", "Si uso el celular para distraerme, después siento que perdí tiempo.", "Eso también me genera culpa."]
  },
  marcos: {
    pregunta_escolar_concreta: ["No, no voy al colegio.", "Trabajo hace años.", "Últimamente la pega me está dejando sin energía."],
    pregunta_academica_concreta: ["No estudio actualmente.", "A veces pienso en capacitarme, pero llego muy cansado.", "Todo se siente como otra exigencia."],
    pregunta_laboral_concreta: ["Sí, trabajo.", "Últimamente la pega me está dejando sin energía.", "Sigo cumpliendo, pero cada vez con menos resto."],
    pregunta_vivienda_concreta: ["Sí, vivo con mi pareja.", "Me preocupa que a veces llegue tan irritable a la casa.", "No quiero que reciba lo peor de mí."],
    pregunta_familiar_concreta: ["Sí, tengo familia.", "Me preocupa llegar corto o pesado a la casa.", "Después me da culpa."],
    pregunta_social_concreta: ["Tengo amigos.", "Pero no hablo mucho de estas cosas con ellos.", "Casi siempre bromeamos y cambiamos de tema."],
    pregunta_habitos_concreta: ["Duermo, pero no siempre descanso.", "Me acuesto pensando en pendientes o despierto cansado.", "Me molesta sentirme así."],
    pregunta_videojuegos: ["No, no juego videojuegos.", "Lo que más me consume ahora es el trabajo y el teléfono con correos.", "Me cuesta desconectarme."]
  },
  elena: {
    pregunta_escolar_concreta: ["No, no voy al colegio.", "Hace tiempo no estudio formalmente.", "A veces he pensado tomar algún taller, pero me cuesta darme permiso."],
    pregunta_academica_concreta: ["No estudio ahora.", "A veces me gustaría aprender algo nuevo o salir un poco más.", "Me cuesta priorizar algo para mí."],
    pregunta_laboral_concreta: ["Trabajo algunas horas.", "Me ayuda a ordenar el día y mantenerme ocupada.", "Cuando estoy ocupada pienso menos en la soledad."],
    pregunta_vivienda_concreta: ["Sí, paso mucho tiempo sola.", "Igual trato de no preocupar a mis hijos.", "A veces la casa se siente demasiado silenciosa."],
    pregunta_familiar_concreta: ["Sí, tengo hijos.", "No quiero cargarlos con mis cosas.", "Por eso a veces me guardo lo que siento."],
    pregunta_social_concreta: ["Tengo algunas amigas.", "Pero cada una tiene su vida y no siempre quiero molestar.", "Me cuesta decir que necesito compañía."],
    pregunta_habitos_concreta: ["Duermo más o menos.", "Hay noches en que me quedo pensando en la familia.", "No quiero darle tanta importancia, pero me pesa."],
    pregunta_videojuegos: ["No, no juego videojuegos.", "Uso más el teléfono para hablar con familia o mirar cosas.", "A veces espero que alguien me escriba primero."]
  },
  nicolas: {
    pregunta_escolar_concreta: ["Sí, voy al colegio.", "Aunque no me gusta mucho hablar allá.", "Prefiero quedarme callado."],
    pregunta_academica_concreta: ["Sí, estoy en el colegio.", "Bajé un poco las notas y dicen que participo menos.", "Me carga que todo sea sobre eso."],
    pregunta_laboral_concreta: ["No, no trabajo.", "Estoy en el colegio.", "Igual todos preguntan qué voy a hacer después."],
    pregunta_vivienda_concreta: ["Vivo con mi familia.", "En la casa casi siempre el tema termina siendo el colegio.", "Por eso prefiero no hablar tanto."],
    pregunta_familiar_concreta: ["Más o menos.", "En mi casa preguntan harto por las notas.", "A veces siento que no escuchan mucho más."],
    pregunta_social_concreta: ["Pocos.", "Antes hablaba más con algunos compañeros, pero ahora estoy más apartado.", "Prefiero quedarme piola."],
    pregunta_habitos_concreta: ["Más o menos.", "A veces me pongo audífonos o veo videos para no hablar con nadie.", "No sé, me ayuda a estar tranquilo."],
    pregunta_videojuegos: ["A veces juego.", "No es lo principal, pero me sirve para distraerme.", "Así no tengo que explicar nada."]
  }
};

const motivePlans = {
  tomas: ["Mis papás dicen que paso mucho tiempo jugando y que casi no salgo.", "Yo siento que ellos ven solo esa parte.", "Igual no es que quiera pelear con todos."],
  valentina: ["Vine porque estoy sobrepasada con la universidad.", "Me cuesta parar y cuando descanso me siento culpable.", "Siento que debería poder con todo."],
  marcos: ["Ando cansado, más irritable.", "Creo que es estrés de la pega.", "Sigo funcionando, pero cada vez con menos energía."],
  elena: ["Me he sentido un poco sola.", "Hay cosas familiares que me tienen preocupada.", "No quiero preocupar a mis hijos."],
  nicolas: ["Me mandaron del colegio.", "Dicen que estoy más callado y que bajé las notas.", "No fue idea mía venir."]
};

const rolePlans = {
  tomas: ["No mucho... supongo que eres quien va a hablar conmigo, pero no sé bien cómo funciona esto.", "", ""],
  valentina: ["Entiendo que vas a conversar conmigo sobre lo que me está pasando, aunque igual no sé muy bien por dónde empezar.", "", ""],
  marcos: ["Supongo que eres quien va a hacer la entrevista. No tengo tan claro qué se espera de mí.", "", ""],
  elena: ["Creo que vamos a conversar un poco sobre lo que me está pasando. Igual me da algo de vergüenza hablar de mí.", "", ""],
  nicolas: ["No sé. Me dijeron que tenía que hablar contigo.", "", ""]
};

const courtesyPlans = {
  tomas: [
    ["Hola... sí, gracias.", "", ""],
    ["Gracias... no sé muy bien cómo funciona esto, pero está bien.", "", ""],
    ["Ya... sí, está bien.", "", ""],
    ["Hola. Igual me cuesta un poco hablar, pero puedo intentarlo.", "", ""],
    ["Gracias... no sé qué se supone que diga ahora.", "", ""]
  ],
  valentina: [
    ["Gracias. Me viene bien poder ordenar un poco lo que me está pasando.", "", ""],
    ["Hola, gracias. Igual me cuesta parar y hablar de esto, pero lo intento.", "", ""],
    ["Gracias por el espacio.", "", ""],
    ["Sí, gracias. Creo que necesito ordenar varias cosas.", "", ""],
    ["Hola. Me siento un poco nerviosa, pero bien.", "", ""]
  ],
  marcos: [
    ["Gracias. No soy mucho de hablar de estas cosas, pero veamos.", "", ""],
    ["Hola. Sí, gracias.", "", ""],
    ["Gracias. La verdad no sé muy bien por dónde partir.", "", ""],
    ["Está bien. Me cuesta un poco esto, pero puedo intentarlo.", "", ""],
    ["Hola. Vine porque creo que ya era necesario hablar.", "", ""]
  ],
  elena: [
    ["Muchas gracias. Me da un poco de vergüenza hablar de mí, pero lo agradezco.", "", ""],
    ["Gracias. Es amable de tu parte.", "", ""],
    ["Hola, muchas gracias.", "", ""],
    ["Gracias. Me cuesta pedir ayuda, pero estoy aquí.", "", ""],
    ["Sí, gracias. Espero poder explicarme bien.", "", ""]
  ],
  nicolas: [
    ["Hola.", "", ""],
    ["Ya... hola.", "", ""],
    ["No sé qué decir, pero hola.", "", ""],
    ["Está bien.", "", ""],
    ["Gracias, supongo.", "", ""]
  ]
};

const fallbackPlans = {
  tomas: ["No sé bien qué decir con eso.", "Me cuesta ordenarlo todavía.", ""],
  valentina: ["No sé bien por dónde tomar eso.", "Creo que tendría que pensarlo un poco para responderte bien.", ""],
  marcos: ["No tengo tan claro cómo responder eso.", "Podría explicarlo mejor si vamos por partes.", ""],
  elena: ["No sé si sabría responderlo de inmediato.", "Me cuesta hablar de mí sin dar muchas vueltas.", ""],
  nicolas: ["No sé.", "No entendí muy bien qué quieres saber.", ""]
};

const personalIntroPlans = {
  tomas: [
    "No sé bien qué contar... tengo 18, estoy cerrando cuarto medio y últimamente en mi casa están preocupados porque paso mucho tiempo jugando.",
    "A mí me cuesta explicarlo, porque no siento que sea solo el computador ni solo decidir rápido qué hacer después.",
    ""
  ],
  valentina: [
    "Soy Valentina, tengo 21 y estudio en la universidad.",
    "Últimamente siento que estoy funcionando con pura presión, como si no pudiera parar.",
    ""
  ],
  marcos: [
    "Soy Marcos, tengo 38 y trabajo.",
    "En general soy de seguir no más, pero últimamente estoy cansado y más irritable de lo normal.",
    ""
  ],
  elena: [
    "Soy Elena, tengo 52.",
    "Me cuesta hablar de mí, porque estoy más acostumbrada a preocuparme por los demás, pero últimamente me he sentido sola.",
    ""
  ],
  nicolas: [
    "No sé qué contar.",
    "Tengo 18, estoy en cuarto medio y me mandaron porque dicen que estoy más callado, bajé las notas y no avanzo con lo que viene después.",
    ""
  ]
};

const followUpPlans = {
  tomas: [
    ["No sé bien cómo explicarlo.", "En mi casa todo parte por el computador, pero siento que no es solo eso. También me pasa que cuando estoy con gente no sé bien qué decir.", ""],
    ["Creo que lo dije mal.", "No es que el computador sea todo. Es más que cuando estoy jugando no tengo que pensar tanto en si estoy actuando raro.", ""],
    ["Me cuesta ordenar porque mis papás ven una cosa y yo siento otra.", "Ellos ven que juego mucho, pero yo siento que afuera me bloqueo.", ""],
    ["A veces quiero explicarles que no juego solo por jugar, pero suena como excusa.", "Entonces mejor no digo nada.", ""],
    ["En el colegio también me pasa.", "Cuando hay que hablar o hacer grupos, siento que todos saben qué hacer menos yo.", ""],
    ["No sé si quiero estar solo o si me acostumbré a estar así.", "Esa parte me confunde.", ""],
    ["Cuando estoy en el computador siento que tengo un lugar.", "Afuera, en cambio, no sé bien dónde ponerme.", ""],
    ["Me cuesta decirlo porque siento que van a pensar que estoy inventando para seguir jugando.", "", ""]
  ],
  valentina: [
    ["Me cuesta ordenar qué es cansancio real y qué es culpa por no estar haciendo más.", "", ""],
    ["No sé si estoy sobrepasada o si simplemente no estoy organizándome bien.", "", ""],
    ["Me cuesta decir que no puedo, porque siento que debería poder.", "", ""],
    ["Tengo muchas cosas en la cabeza al mismo tiempo y todas parecen urgentes.", "", ""],
    ["Me cuesta separar lo que quiero yo de lo que esperan de mí.", "", ""]
  ],
  marcos: [
    ["Me cuesta ordenar si esto es solo cansancio o si ya me está cambiando el carácter.", "", ""],
    ["No sé en qué momento empecé a llegar tan apagado a la casa.", "", ""],
    ["Me cuesta reconocer que no estoy bien, porque igual sigo funcionando.", "", ""],
    ["Siento que cumplo en la pega, pero después no me queda nada para mi casa.", "", ""],
    ["Me cuesta decirlo porque suena a queja, y no me gusta verme así.", "", ""]
  ],
  elena: [
    ["Me cuesta ordenar qué cosas son mías y qué cosas sigo cargando por los demás.", "", ""],
    ["No sé bien cómo hablar de mí sin sentir que estoy molestando.", "", ""],
    ["Me cuesta decir que me siento sola, porque me da vergüenza.", "", ""],
    ["A veces no sé si necesito ayuda o solo compañía.", "", ""],
    ["Me cuesta pedir algo sin sentir que estoy siendo una carga.", "", ""]
  ],
  nicolas: [
    ["No sé... me cuesta explicar porque siento que igual ya tienen una idea hecha de mí.", "", ""],
    ["Me cuesta ordenar si estoy aburrido, cansado o simplemente no quiero hablar.", "", ""],
    ["No sé qué decir sin que después lo usen para retarme.", "", ""],
    ["Me cuesta hablar porque siento que da lo mismo lo que diga.", "", ""],
    ["No sé... es como que todos preguntan, pero pocos escuchan de verdad.", "", ""]
  ]
};

const contextualFollowUpPlans = {
  tomas: {
    encierro: [
      ["Sí... a veces me encierro en la pieza o me quedo jugando.", "No siempre es porque quiera estar solo, sino porque no sé cómo seguir hablando sin que termine en pelea.", ""],
      ["Normalmente juego, veo videos o me pongo audífonos.", "Es como apagar un poco todo lo que está pasando afuera.", ""],
      ["Sí. Me voy antes de que la conversación termine en pelea.", "Es como la forma más fácil de no seguir discutiendo.", ""],
      ["A veces cierro la puerta y me pongo audífonos.", "Ahí por lo menos no tengo que seguir justificándome.", ""],
      ["Me encierro cuando siento que no me van a escuchar.", "No es que quiera desaparecer, es que me cuesta seguir hablando.", ""]
    ],
    computador: [
      ["El computador aparece siempre en las discusiones.", "Para mis papás todo parte ahí, como si fuera la causa de todo.", ""],
      ["Yo juego harto, sí, pero no siento que sea tan simple.", "A veces juego porque ahí no tengo que pensar si caigo bien o mal.", ""],
      ["En el computador siento que tengo un lugar más claro que afuera.", "Sé qué hacer y no tengo que estar adivinando cómo actuar.", ""]
    ],
    colegio: [
      ["En el colegio me cuesta más hablar con otros.", "Cuando hay trabajos en grupo me bloqueo.", ""],
      ["Siento que todos saben cómo actuar y yo no.", "Por eso prefiero quedarme callado para no decir algo raro.", ""],
      ["No es que odie el colegio, pero socialmente me cansa.", "Me quedo pensando mucho en qué decir o cuándo meterme.", ""]
    ],
    papas: [
      ["Con mis papás discutimos harto por el computador.", "Ellos se preocupan, pero a veces parten retándome.", ""],
      ["Cuando intentan hablarme, yo ya siento que viene el reto.", "Entonces contesto corto o me voy a la pieza.", ""],
      ["Me cuesta explicarles que no es solo flojera o juego.", "A veces siento que ya tienen una idea hecha de mí.", ""]
    ],
    bloqueo: [
      ["Sí, me bloqueo.", "Quiero decir algo, pero en el momento no me sale y termino quedándome callado.", ""],
      ["Me pasa sobre todo cuando hay más gente mirando.", "Siento que cualquier cosa que diga va a sonar rara.", ""]
    ],
    cuesta: [
      ["Me cuesta explicar que jugar no es solo jugar.", "A veces es la forma que tengo de no sentirme tan incómodo o tan observado.", ""],
      ["Me cuesta decirlo sin que suene como excusa.", "Entonces muchas veces lo dejo ahí y no explico más.", ""]
    ],
    gente: [
      ["Cuando estoy con gente me pongo más pendiente de todo.", "Pienso demasiado en qué decir y al final hablo poco.", ""],
      ["En persona me cuesta saber cómo actuar.", "Online puedo pensar un poco más antes de responder.", ""]
    ]
  },
  valentina: {
    descanso: [
      ["Cuando descanso me cuesta apagar la cabeza.", "Puedo estar acostada, pero sigo pensando en pendientes.", ""],
      ["Si paro mucho rato, aparece culpa.", "Siento que debería estar avanzando en algo.", ""]
    ],
    culpa: [
      ["La culpa aparece cuando siento que no estoy haciendo suficiente.", "Aunque haya estudiado, igual pienso que podría haber hecho más.", ""],
      ["Me cuesta descansar sin sentir que estoy fallando.", "Sé que suena exagerado, pero me pasa.", ""]
    ],
    universidad: [
      ["La universidad me ocupa casi todo el día.", "Termino algo y ya estoy pensando en lo siguiente.", ""],
      ["No es solo estudiar.", "Es sentir que cualquier pausa me atrasa.", ""]
    ],
    familia: [
      ["Mi familia confía mucho en mí.", "No me lo dicen como presión, pero yo igual lo siento así.", ""],
      ["Me da miedo decepcionarlos.", "Siento que tengo que demostrar que puedo.", ""]
    ],
    exigencia: [
      ["Me exijo porque siento que si bajo el ritmo algo se cae.", "No sé muy bien cómo hacerlo de otra manera.", ""],
      ["A veces no sé si quiero hacer todo o si siento que tengo que hacerlo.", "Esa diferencia me cuesta verla.", ""]
    ]
  },
  marcos: {
    trabajo: [
      ["La pega se me queda encima incluso cuando salgo.", "Llego a la casa y sigo pensando en pendientes.", ""],
      ["Sigo cumpliendo, pero cada vez me cuesta más.", "No quiero fallar, entonces sigo no más.", ""]
    ],
    cansancio: [
      ["Es un cansancio que no se pasa solo durmiendo.", "Llego apagado, como con poca paciencia para todo.", ""],
      ["Me cuesta reconocerlo, porque igual funciono.", "Pero se nota cuando llego a la casa.", ""]
    ],
    irritabilidad: [
      ["Me irrito por cosas chicas.", "Después me da culpa, porque no siempre tiene que ver con la otra persona.", ""],
      ["A veces respondo corto sin querer.", "En el momento solo quiero silencio.", ""]
    ],
    casa: [
      ["En la casa trato de estar, pero llego con poco resto.", "Mi pareja lo nota antes que yo.", ""],
      ["Me preocupa que reciban mi peor versión.", "No es justo, pero a veces pasa.", ""]
    ],
    pareja: [
      ["Mi pareja me ha dicho que estoy más irritable.", "No lo dice para atacarme, pero me pega igual.", ""],
      ["Ella intenta acercarse y yo a veces respondo corto.", "Después me quedo pensando en eso.", ""]
    ]
  },
  elena: {
    soledad: [
      ["La soledad aparece más cuando la casa queda tranquila.", "Ahí me doy cuenta de que me guardé muchas cosas.", ""],
      ["No siempre estoy sola físicamente, pero igual me siento así.", "Me cuesta decirlo sin sentir vergüenza.", ""]
    ],
    hijos: [
      ["Mis hijos tienen sus vidas y eso está bien.", "Yo trato de no preocuparlos con lo mío.", ""],
      ["A veces quisiera pedirles más compañía.", "Pero me freno porque no quiero ser una carga.", ""]
    ],
    ayuda: [
      ["Pedir ayuda me cuesta mucho.", "Siento que estoy molestando o quitándole tiempo a alguien.", ""],
      ["Estoy acostumbrada a resolver y sostener.", "Cuando me toca pedir, me quedo sin palabras.", ""]
    ],
    carga: [
      ["Me da miedo ser una carga.", "Por eso muchas veces digo que estoy bien aunque no sea tan así.", ""],
      ["No quiero que los demás sientan que tienen que hacerse cargo de mí.", "Entonces me guardo varias cosas.", ""]
    ],
    cuidado: [
      ["Siempre he estado pendiente de los demás.", "A veces no sé bien qué necesito yo.", ""],
      ["Cuidar a otros me sale más fácil que hablar de mí.", "Me cuesta cambiar ese lugar.", ""]
    ]
  },
  nicolas: {
    colegio: [
      ["En el colegio prefiero hablar poco.", "Siento que si digo algo, después lo miran como problema.", ""],
      ["No es que no entienda nada.", "Me cuesta meterme y participar como quieren.", ""]
    ],
    notas: [
      ["Bajé las notas, sí.", "Pero siento que todos se quedaron solo con eso.", ""],
      ["Cuando preguntan por notas, ya sé cómo va la conversación.", "Por eso contesto corto.", ""]
    ],
    silencio: [
      ["Me quedo callado porque es más fácil.", "Si hablo, siento que después lo pueden usar para retarme.", ""],
      ["No siempre es que no tenga nada que decir.", "A veces no vale la pena decirlo.", ""]
    ],
    adultos: [
      ["Los adultos preguntan, pero a veces ya vienen con una idea.", "Entonces da lo mismo explicar.", ""],
      ["Me carga cuando suena a sermón.", "Ahí me cierro al tiro.", ""]
    ],
    companeros: [
      ["Con mis compañeros estoy más distante.", "Antes hablaba más, pero ahora prefiero quedarme piola.", ""],
      ["A veces siento que si digo algo va a ser raro.", "Entonces mejor no digo nada.", ""]
    ]
  }
};

const emotionPlans = {
  tomas: ["Cuando estoy con mis compañeros me pongo tenso.", "Me cuesta saber cuándo hablar o qué decir.", "Siento que todos cachan si hago algo raro."],
  valentina: ["Me cuesta decirlo sin justificarme.", "Puedo estar cansada, pero al tiro pienso que debería seguir.", "Si descanso, aparece culpa."],
  marcos: ["Me cuesta reconocerlo.", "Llego con poca paciencia y respondo corto.", "Después me da culpa, pero en el momento solo quiero silencio."],
  elena: ["Me da pudor hablar de mí.", "A veces digo que estoy bien para no preocupar a nadie.", "Pero hay días en que la soledad pesa."],
  nicolas: ["No sé bien.", "Cuando todos preguntan, me cierro.", "Prefiero quedarme callado para no meterme en problemas."]
};

const familyPlans = {
  tomas: ["Casi siempre terminan mal esas conversaciones.", "Mis papás parten enojados por el computador y yo contesto pesado o me encierro.", "Después me siento mal, pero en el momento quiero que me dejen tranquilo."],
  valentina: ["Mi familia confía mucho en mí.", "No me presionan todo el tiempo, pero siento que esperan que me vaya bien.", "Me da miedo decepcionarlos."],
  marcos: ["En la casa se nota que llego cansado.", "Mi pareja me habla y a veces respondo corto.", "No es que no me importe, es que llego sin paciencia."],
  elena: ["Trato de no preocupar a mi familia.", "Mis hijos tienen sus vidas y yo no quiero cargarles mis cosas.", "Por eso muchas veces me guardo lo que siento."],
  nicolas: ["En mi casa casi siempre preguntan por el colegio.", "Si hablamos, termina siendo sobre notas o participación.", "Por eso prefiero decir poco."]
};

function planId(caseId, intent, directAnswer) {
  return `${caseId}_${intent}_${directAnswer}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120);
}

function selectFollowUpPlan(caseId, intentAnalysis, state) {
  const variants = followUpPlans[caseId] || followUpPlans.tomas;
  const text = intentAnalysis.normalizedText;
  const lastPatientMessage = (state.lastPatientMessage || "").toLowerCase();
  let preferredIndex = 0;

  if (caseId === "tomas") {
    if (text.includes("no es solo") || text.includes("computador")) preferredIndex = 1;
    if (text.includes("ordenar") || text.includes("explicar")) preferredIndex = 0;
    if (text.includes("papas") || text.includes("casa")) preferredIndex = 2;
    if (text.includes("colegio") || text.includes("observado")) preferredIndex = 4;
    if (text.includes("excusa")) preferredIndex = 3;
    if (!text.includes("ordenar") && !text.includes("explicar") && lastPatientMessage.includes("computador")) preferredIndex = 1;
  }

  const usedIds = new Set(state.usedResponseIds || []);
  const ordered = [...variants.slice(preferredIndex), ...variants.slice(0, preferredIndex)];
  const selected = ordered.find(([directAnswer]) => !usedIds.has(planId(caseId, "seguimiento", directAnswer))) || variants[preferredIndex] || variants[0];
  const [directAnswer, contextualDetail, emotionalTone] = selected;

  return {
    id: planId(caseId, "seguimiento", directAnswer),
    directAnswer,
    contextualDetail,
    emotionalTone
  };
}

function selectCourtesyPlan(caseId, intentAnalysis, state) {
  const variants = courtesyPlans[caseId] || courtesyPlans.tomas;
  const seed = intentAnalysis.normalizedText.length + (state.turnCount || 0);
  const usedIds = new Set(state.usedResponseIds || []);
  const ordered = [...variants.slice(seed % variants.length), ...variants.slice(0, seed % variants.length)];
  const selected = ordered.find(([directAnswer]) => !usedIds.has(planId(caseId, "cortesia_vinculo", directAnswer))) || variants[seed % variants.length] || variants[0];
  const [directAnswer, contextualDetail, emotionalTone] = selected;

  return {
    id: planId(caseId, "cortesia_vinculo", directAnswer),
    directAnswer,
    contextualDetail,
    emotionalTone
  };
}

function selectContextualFollowUpPlan(caseId, intentAnalysis, state) {
  const topic = intentAnalysis.contextualFollowUpTopic;
  const casePlans = contextualFollowUpPlans[caseId] || contextualFollowUpPlans.tomas;
  const variants = casePlans[topic] || followUpPlans[caseId] || followUpPlans.tomas;
  const text = intentAnalysis.normalizedText;
  let preferredIndex = 0;

  if (caseId === "tomas" && topic === "encierro" && text.includes("que haces")) {
    preferredIndex = 1;
  }

  const usedIds = new Set(state.usedResponseIds || []);
  const ordered = [...variants.slice(preferredIndex), ...variants.slice(0, preferredIndex)];
  const selected =
    ordered.find(([directAnswer]) => !usedIds.has(planId(caseId, `seguimiento_contextual_${topic || "general"}`, directAnswer))) ||
    variants[preferredIndex] ||
    variants[0];
  const [directAnswer, contextualDetail, emotionalTone] = selected;

  return {
    id: planId(caseId, `seguimiento_contextual_${topic || "general"}`, directAnswer),
    directAnswer,
    contextualDetail,
    emotionalTone
  };
}

export function planResponse({ caseId, intentAnalysis, state }) {
  const facts = caseFacts[caseId] || caseFacts.tomas;
  const profile = patientProfiles[caseId] || patientProfiles.tomas;
  const intent = intentAnalysis.detectedIntent;
  const concrete = concretePlans[caseId]?.[intent];

  if (intent === "saludo") return { directAnswer: caseId === "elena" ? "Hola, muchas gracias." : "Hola.", contextualDetail: "", emotionalTone: "" };
  if (intent === "cortesia_vinculo") {
    return selectCourtesyPlan(caseId, intentAnalysis, state);
  }
  if (intent === "nombre") return { directAnswer: caseId === "valentina" || caseId === "marcos" || caseId === "nicolas" ? facts.name + "." : `Me llamo ${facts.name}.`, contextualDetail: "", emotionalTone: "" };
  if (intent === "edad") return { directAnswer: `Tengo ${facts.age}.`, contextualDetail: "", emotionalTone: "" };
  if (intent === "rol_entrevistador") {
    const [directAnswer, contextualDetail, emotionalTone] = rolePlans[caseId] || rolePlans.tomas;
    return { directAnswer, contextualDetail, emotionalTone };
  }
  if (intent === "encuadre_o_consentimiento") {
    return { directAnswer: "Ya, entiendo.", contextualDetail: "Me sirve saber cómo va a funcionar esto.", emotionalTone: "" };
  }
  if (intent === "presentacion_personal_abierta") {
    const [directAnswer, contextualDetail, emotionalTone] = personalIntroPlans[caseId] || personalIntroPlans.tomas;
    return { id: planId(caseId, intent, directAnswer), directAnswer, contextualDetail, emotionalTone };
  }
  if (intent === "seguimiento") {
    return selectFollowUpPlan(caseId, intentAnalysis, state);
  }
  if (intent === "motivo_de_consulta") {
    const [directAnswer, contextualDetail, emotionalTone] = motivePlans[caseId] || motivePlans.tomas;
    return { directAnswer, contextualDetail, emotionalTone };
  }
  if (intent === "pregunta_videojuegos" && caseId === "tomas" && /que (juegos|juegas)|juegos usas/.test(intentAnalysis.normalizedText)) {
    return {
      directAnswer: "Juego más online, con gente que conozco de ahí.",
      contextualDetail: "No sé... en el juego se me hace más fácil hablar que en el colegio.",
      emotionalTone: ""
    };
  }
  if (concrete) {
    const [directAnswer, contextualDetail, emotionalTone] = concrete;
    return { directAnswer, contextualDetail, emotionalTone };
  }
  if (intent === "seguimiento_contextual") {
    return selectContextualFollowUpPlan(caseId, intentAnalysis, state);
  }
  if (intent === "juicio_o_critica") {
    return {
      directAnswer: profile.typicalPhrases[0],
      contextualDetail: "Cuando siento que ya está decidido lo que me pasa, me dan menos ganas de hablar.",
      emotionalTone: ""
    };
  }
  if (intent === "consejo_apresurado") {
    return {
      directAnswer: "Puede ser, pero no me sale tan fácil.",
      contextualDetail: profile.typicalPhrases[1],
      emotionalTone: ""
    };
  }
  if (intent === "validacion_emocional") {
    return {
      directAnswer: "Sí... puede ser.",
      contextualDetail: profile.typicalPhrases[1],
      emotionalTone: "Me cuesta decirlo, pero eso se acerca más a lo que me pasa."
    };
  }
  if (intent === "exploracion_emocional") {
    const [directAnswer, contextualDetail, emotionalTone] = emotionPlans[caseId] || emotionPlans.tomas;
    return {
      directAnswer,
      contextualDetail,
      emotionalTone
    };
  }
  if (intent === "exploracion_familiar") {
    const [directAnswer, contextualDetail, emotionalTone] = familyPlans[caseId] || familyPlans.tomas;
    return {
      directAnswer,
      contextualDetail,
      emotionalTone
    };
  }

  const [directAnswer, contextualDetail, emotionalTone] = fallbackPlans[caseId] || fallbackPlans.tomas;
  return { directAnswer, contextualDetail, emotionalTone, usedFallback: true };
}
