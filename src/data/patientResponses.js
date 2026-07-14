import { patientFacts } from "./patientFacts.js";

const commonTails = [
  "No sé si lo estoy explicando bien, pero para mí no es tan simple.",
  "A veces lo digo más corto porque me cuesta mostrar toda la parte de atrás.",
  "Cuando lo pienso con calma, hay varias cosas mezcladas.",
  "Me cuesta hablarlo sin sentir que estoy dejando mal a alguien.",
  "Quizás suena raro, pero en el momento se siente bien real."
];

const kits = {
  tomas: {
    saludo: ["Hola.", "Hola... sí.", "Ya, hola.", "Hola, gracias.", "Hola... estoy conectado."],
    cortesia: ["Gracias... no sé muy bien cómo funciona esto, pero está bien.", "Hola. Igual me cuesta un poco hablar, pero puedo intentarlo.", "Ya... sí, está bien."],
    presentacion: [
      "No sé bien qué contar... Tengo 18, voy al colegio y últimamente en mi casa están preocupados porque paso mucho tiempo jugando. A mí me cuesta explicarlo, porque no siento que sea solo el computador.",
      "Soy Tomás, Tengo 18. Voy al colegio y paso harto tiempo en el computador. En mi casa dicen que eso es un problema, pero yo siento que hay más cosas.",
      "No sé bien cómo partir... Tengo 18, voy al colegio y últimamente me cuesta estar mucho con gente. Juego bastante, pero no es solo por jugar.",
      "Me llamo Tomás. Estoy acá porque mis papás están preocupados por mí, sobre todo por el computador y porque casi no salgo."
    ],
    rol: ["No mucho... supongo que eres quien va a hablar conmigo, pero no sé bien cómo funciona esto."],
    motivo: [
      "Creo que es por el tema del computador. Mis papás dicen que paso mucho tiempo jugando y que casi no salgo, pero yo siento que no es tan simple.",
      "Mis papás dicen que paso mucho tiempo jugando y que casi no salgo. Yo siento que ellos ven solo esa parte.",
      "Me trajeron porque en mi casa están preocupados por el computador y porque casi no salgo."
    ],
    emocion: [
      "Me cuesta cuando tengo que hablar en persona. En el juego por lo menos sé qué hacer.",
      "Afuera siento que estoy como observado. Entonces me quedo callado o vuelvo al computador.",
      "No sé si quiero estar solo o si me acostumbré a estar así.",
      "Cuando todos parten retándome, me cierro antes de explicar nada."
    ],
    contexto: [
      "En mi casa todo parte por el computador, pero creo que también me pasa que en persona no sé bien cómo actuar.",
      "En el colegio puedo estar ahí, pero no sentirme parte. Cuando hay grupos me bloqueo.",
      "Con mis papás discutimos y después me voy a la pieza. Ahí al menos no tengo que seguir justificándome.",
      "Online hablo más fácil. No tengo que estar pensando si quedé raro."
    ],
    validacion: [
      "Sí... puede ser. En el juego no tengo que estar pensando todo el rato si caigo bien o mal.",
      "Nunca lo había pensado así, pero sí, jugar también es como estar en un lugar donde sé qué hacer.",
      "Gracias por decirlo así. Casi siempre parten diciendo que el computador es el problema.",
      "Eso me hace más sentido. No es que quiera pelear, a veces no sé cómo explicar lo otro."
    ],
    juicio: [
      "Eso mismo me dicen todos. Por eso no me dan muchas ganas de hablar.",
      "Si vamos a partir con que juego porque quiero puro perder el tiempo, no sé qué más decir.",
      "Me da lata cuando lo ponen así, como si fuera solo apagar el computador.",
      "Cuando siento que me están retando, prefiero cerrar la conversación."
    ],
    consejo: [
      "Puede ser, pero no es tan fácil como apagar el computador y listo.",
      "Si pudiera dejar de encerrarme así de simple, creo que ya lo habría hecho.",
      "Eso me suena a lo que me dicen en la casa. Me cuesta porque no toca la parte de afuera.",
      "Entiendo la idea, pero cuando estoy incómodo no pienso tan ordenado."
    ],
    resistencia: ["No sé.", "Puede ser.", "No sé si quiero hablar de eso todavía.", "Me cuesta decirlo sin que suene como excusa."],
    apertura: ["Creo que jugar no es solo jugar para mí.", "A veces me gustaría poder salir más, pero cuando llega el momento me bloqueo.", "Me cuesta pedir que me entiendan sin que parezca que estoy defendiendo el computador."],
    preferencias: ["Me gustan los juegos online porque ahí tengo un rol.", "Prefiero estar en mi pieza cuando las conversaciones empiezan como reto.", "Me gustaría que me escucharan antes de decir que todo es culpa del computador."],
    cierre: ["Ya... gracias.", "Gracias. Igual me costó, pero pude decir algo más.", "Me voy un poco más tranquilo que al inicio."],
    cierreApresurado: ["Ya... no sé, siento que todavía no expliqué mucho.", "Está bien, pero me quedé con cosas mezcladas.", "Ok, aunque no sé si se entendió lo del computador."],
    seguimiento: {
      computador: ["El computador aparece siempre en las discusiones. Para mis papás todo parte ahí, como si fuera la causa de todo.", "Yo juego harto, sí, pero no siento que sea tan simple. A veces juego porque ahí no tengo que pensar si caigo bien o mal.", "Cuando estoy en el computador siento que tengo un lugar. Afuera, en cambio, no sé bien dónde ponerme."],
      encierro: ["Sí... a veces me encierro en la pieza o me quedo jugando. No siempre es porque quiera estar solo, sino porque no sé cómo seguir hablando sin que termine en pelea.", "Normalmente juego, veo videos o me pongo audífonos. Es como apagar un poco todo lo que está pasando afuera.", "A veces me voy antes de que la conversación termine en reto."],
      papas: ["Con mis papás discutimos harto por el computador. Ellos se preocupan, pero a veces parten retándome.", "Cuando intentan hablarme, yo ya siento que viene el reto. Entonces contesto corto o me voy a la pieza.", "Me cuesta explicarles que no es solo flojera o juego."],
      colegio: ["En el colegio me cuesta más hablar con otros. Cuando hay trabajos en grupo me bloqueo.", "Siento que todos saben cómo actuar y yo no. Por eso prefiero quedarme callado para no decir algo raro.", "No es que odie el colegio, pero socialmente me cansa."],
      social: ["Tengo más contactos online que amigos del colegio. En persona me cuesta acercarme.", "Cuando estoy con compañeros siento que voy tarde a todo, como si todos supieran una regla que yo no.", "A veces quiero hablar, pero no sé cuándo meterme."]
    }
  },
  valentina: {
    saludo: ["Hola... sí, gracias.", "Hola, gracias.", "Hola. Estoy un poco nerviosa, pero bien.", "Sí, hola.", "Gracias por recibirme."],
    cortesia: ["Gracias. Me viene bien poder ordenar un poco lo que me está pasando.", "Hola, gracias. Igual me cuesta parar y hablar de esto, pero lo intento.", "Gracias por el espacio."],
    presentacion: ["Soy Valentina, tengo 21 y estudio en la universidad. Últimamente siento que estoy funcionando con pura presión, como si no pudiera parar.", "Me llamo Valentina. Estudio y en teoría debería estar bien, pero siento que nunca alcanzo.", "Tengo 21 y estoy en la universidad. Me cuesta descansar sin pensar que estoy perdiendo tiempo."],
    rol: ["Entiendo que vas a conversar conmigo sobre lo que me está pasando, aunque igual no sé muy bien por dónde empezar."],
    motivo: ["Vine porque estoy muy sobrepasada con la universidad. Me cuesta parar y cuando descanso me siento culpable.", "No me está alcanzando el tiempo. Incluso cuando termino algo, siento que debería estar haciendo otra cosa.", "Creo que estoy cansada, pero me cuesta decirlo sin justificarme."],
    emocion: ["Me cuesta aceptar que estoy cansada. Una parte mía piensa que debería poder con todo.", "La culpa aparece apenas descanso. Como si parar fuera fallar.", "Me da miedo bajar el ritmo y que se note que no soy tan capaz.", "Tengo la cabeza haciendo listas incluso cuando estoy acostada."],
    contexto: ["En mi familia confían mucho en mí. No me lo dicen como presión, pero yo igual lo siento.", "La universidad ocupa todo el día y también la noche, aunque no esté estudiando.", "Postergué amigas, descanso y cosas simples porque siempre hay algo pendiente.", "Cuando veo a otros avanzar, siento que voy tarde."],
    validacion: ["Sí... creo que eso tiene sentido. Me cuesta aceptar que estoy cansada sin justificarlo.", "Gracias. Me ayuda que no lo pongas como falta de organización solamente.", "Puede ser. Nunca lo digo así, pero la culpa ocupa mucho espacio.", "Me alivia un poco que no suene como exageración."],
    juicio: ["Ya... puede ser, pero me cuesta sentir que no estoy fallando.", "Si fuera solo organizarme mejor, ya lo habría resuelto.", "Me cierra un poco escucharlo así, porque yo misma ya me critico bastante.", "No quiero sonar dramática, pero tampoco me ayuda sentir que es debilidad."],
    consejo: ["Sé que debería organizarme mejor, pero siento que ese no es todo el problema.", "He hecho listas, calendarios y horarios. A veces eso solo me da más cosas para cumplir.", "Entiendo el consejo, pero mi cabeza no se apaga porque alguien me diga que descanse.", "Me cuesta, porque descansar me deja con más culpa, no con alivio."],
    resistencia: ["No sé si es tan grave.", "Quizás todos están igual y yo lo estoy tomando mal.", "Me da vergüenza decir que no puedo.", "Siento que debería poder resolverlo sola."],
    apertura: ["Creo que mi valor se me mezcla mucho con rendir.", "Si bajo un poco el ritmo, siento que decepciono.", "Me cuesta separar lo que quiero yo de lo que esperan de mí."],
    preferencias: ["Me gusta estudiar, pero no vivir sintiendo que todo es una prueba.", "Me gustaría descansar sin culpa.", "Quisiera poder hacer algo por gusto y no por rendimiento."],
    cierre: ["Gracias. Me sirve haberlo dicho en voz alta.", "Me voy con la sensación de que al menos ordené un poco.", "Gracias, me cuesta hablarlo sin sentir culpa."],
    cierreApresurado: ["Sí... aunque siento que quedó mucho por ordenar.", "Está bien, pero me quedo pensando en todo lo que no dije.", "Ok, gracias. Igual no sé si alcancé a explicar la presión."],
    seguimiento: {
      culpa: ["La culpa aparece cuando siento que no estoy haciendo suficiente. Aunque haya estudiado, igual pienso que podría haber hecho más.", "Si descanso, mi cabeza empieza a revisar pendientes.", "Me siento culpable incluso por cosas chicas, como ver una serie."],
      descanso: ["Cuando descanso me cuesta apagar la cabeza. Puedo estar acostada, pero sigo pensando en pendientes.", "Descansar no se siente como descanso; se siente como atraso.", "A veces me obligo a parar, pero no disfruto nada."],
      universidad: ["La universidad me ocupa casi todo el día. Termino algo y ya estoy pensando en lo siguiente.", "Siento que siempre hay alguien más preparado.", "Me gusta mi carrera, pero últimamente la vivo como pura exigencia."],
      familia: ["Mi familia confía mucho en mí. No me lo dicen como presión, pero yo igual lo siento así.", "Me da miedo que piensen que no era tan capaz.", "No quiero preocuparlos, entonces digo que estoy bien."],
      cansancio: ["Estoy cansada, pero me cuesta decirlo sin agregar una explicación.", "No es solo sueño. Es como estar siempre funcionando.", "Me levanto ya pensando en todo lo que falta."]
    }
  },
  marcos: {
    saludo: ["Hola.", "Hola, sí.", "Buenas.", "Hola, gracias.", "Aquí estoy."],
    cortesia: ["Gracias. No soy mucho de hablar de estas cosas, pero veamos.", "Hola. Sí, gracias.", "Está bien. Me cuesta un poco esto, pero puedo intentarlo."],
    presentacion: ["Soy Marcos, tengo 38 y trabajo. En general soy de seguir no más, pero últimamente estoy cansado y más irritable de lo normal.", "Me llamo Marcos. Trabajo hace años y suelo funcionar, pero ahora llego con poca paciencia.", "Tengo 38. No soy de hablar mucho de estas cosas, pero la pega me está pasando la cuenta."],
    rol: ["Supongo que eres quien va a hacer la entrevista. No tengo tan claro qué se espera de mí."],
    motivo: ["Ando cansado y más irritable. Creo que tiene que ver con la pega, aunque me cuesta reconocerlo.", "Últimamente llego a la casa sin energía. Sigo cumpliendo, pero me noto más pesado.", "Vine porque mi pareja me dijo que sería bueno hablar. Algo de razón debe tener."],
    emocion: ["Me molesta irritarme por cosas chicas. Después me da culpa.", "No diría que estoy triste. Es más como estar apagado.", "Me cuesta reconocer que estoy cansado porque igual sigo funcionando.", "A veces siento que mi mejor parte se queda en la pega."],
    contexto: ["En el trabajo todo se volvió urgente. Uno termina apagando incendios todo el día.", "En la casa trato de estar, pero llego con poco resto.", "Con amigos no hablo mucho de esto. Se bromea y se cambia de tema.", "El teléfono mantiene la pega metida en la casa."],
    validacion: ["Sí, puede ser. Me cuesta admitir que estoy más cansado de lo que digo.", "Gracias. A veces siento que si lo digo, suena a queja.", "Me hace sentido que lo mires como desgaste, no como falta de ganas.", "Eso ayuda, porque no quiero sentirme inútil por estar cansado."],
    juicio: ["No sé... no me ayuda mucho sentir que esto es solo falta de actitud.", "Si fuera ponerle más ganas, ya estaría resuelto.", "Me cuesta hablar si suena a que estoy fallando por no aguantar.", "Ya me exijo bastante para cumplir, no necesito otro reto."],
    consejo: ["Puede ser, pero no es tan simple como tomarme unos días y listo.", "Descansar suena bien, pero la pega sigue estando ahí.", "Entiendo el consejo, pero no sé cómo aplicarlo sin dejar cosas botadas.", "Me cuesta porque siempre hay algo urgente esperando."],
    resistencia: ["No es tan grave.", "Hay gente peor.", "Capaz estoy exagerando.", "No me gusta verme quejándome."],
    apertura: ["Me preocupa estar llegando a la casa con lo peor de mí.", "Antes el trabajo me hacía sentido; ahora solo cumplo.", "Sigo funcionando, pero no sé cuánto de eso es estar bien."],
    preferencias: ["Me gusta cumplir y sentirme útil.", "Antes me gustaba resolver problemas en la pega.", "Me gustaría llegar a la casa con algo de energía para mi vida."],
    cierre: ["Gracias. Igual me cuesta hablar, pero sirvió ordenarlo un poco.", "Bueno, me voy pensando en varias cosas.", "Gracias. No fue tan incómodo como pensé."],
    cierreApresurado: ["Está bien, aunque siento que apenas entramos al tema.", "Ok. Igual queda harto por ordenar.", "Gracias, pero no sé si alcancé a explicar bien lo de la pega."],
    seguimiento: {
      trabajo: ["La pega se me queda encima incluso cuando salgo. Llego a la casa y sigo pensando en pendientes.", "Antes sentía que resolvía cosas. Ahora siento que nunca termino.", "Hay días en que todo es urgente y nada se cierra realmente."],
      cansancio: ["Es un cansancio que no se pasa solo durmiendo. Llego apagado, como con poca paciencia para todo.", "Me levanto y ya siento que voy atrasado.", "No es solo sueño; es como no tener resto para nadie."],
      irritabilidad: ["Me irrito por cosas chicas. Después me da culpa, porque no siempre tiene que ver con la otra persona.", "Contesto corto y después me arrepiento.", "Me molesta notar que estoy más pesado que antes."],
      familia: ["En la casa trato de estar, pero llego con poco resto. Mi pareja lo nota antes que yo.", "Me preocupa que mi familia reciba la parte más cansada de mí.", "A veces solo quiero silencio, pero sé que eso también afecta."],
      social: ["Con amigos no hablo de esto. Uno dice que está cansado y seguimos con otra cosa.", "Me cuesta mostrarme vulnerable. Prefiero bromear.", "No quiero que me miren como alguien que no puede."]
    }
  },
  elena: {
    saludo: ["Hola, muchas gracias.", "Hola.", "Buenos días, gracias.", "Hola, qué amable.", "Sí, hola."],
    cortesia: ["Muchas gracias. Me da un poco de vergüenza hablar de mí, pero lo agradezco.", "Gracias. Es amable de tu parte.", "Sí, gracias. Espero poder explicarme bien."],
    presentacion: ["Soy Elena, tengo 52. Me cuesta hablar de mí, porque estoy más acostumbrada a preocuparme por los demás, pero últimamente me he sentido sola.", "Me llamo Elena. Tengo hijos y siempre he estado pendiente de la familia, pero ahora me cuesta reconocer que también necesito compañía.", "Tengo 52. No sé si lo mío es tan importante, pero me he sentido más sola de lo que suelo decir."],
    rol: ["Creo que vamos a conversar un poco sobre lo que me está pasando. Igual me da algo de vergüenza hablar de mí."],
    motivo: ["Me he sentido un poco sola. Hay cosas familiares que me tienen preocupada y me cuesta pedir ayuda.", "Vine porque últimamente me cuesta más estar tranquila. No quiero preocupar a mis hijos, pero algo me pasa.", "No sé si es algo tan importante, pero me he sentido distinta y más sola."],
    emocion: ["Me da pudor decir que me siento sola.", "A veces hago cosas para no quedarme pensando.", "Me cuesta pedir compañía porque siento que molesto.", "No quiero ser una carga para nadie."],
    contexto: ["Mis hijos tienen sus vidas y eso está bien. Igual extraño conversar más.", "Siempre he sido yo la que sostiene, entonces pedir ayuda se me hace raro.", "Tengo amigas, pero cada una está con sus cosas.", "Cuando la casa queda silenciosa, ahí aparece más fuerte."],
    validacion: ["Gracias. Me cuesta reconocerlo, pero sí, a veces me siento bastante sola.", "Es bonito que lo diga así. No quiero parecer malagradecida con mi familia.", "Sí... quizás también necesito permitirme pedir compañía.", "Me alivia que no suene como que estoy culpando a alguien."],
    juicio: ["No quisiera que se entienda como que mi familia hace algo mal. Me cuesta hablar de esto.", "Si parece que estoy reclamando, prefiero no decirlo así.", "Me cierro un poco cuando siento que van a juzgar a mis hijos.", "No es que ellos no me quieran. Es más difícil que eso."],
    consejo: ["Sí, entiendo la idea, pero pedir ayuda me cuesta más de lo que parece.", "Podría llamar más, pero me da vergüenza necesitar tanto.", "Sé que debería decirlo, pero no quiero preocupar a nadie.", "Me cuesta hacer algo solo para mí sin sentir que estoy quitando tiempo."],
    resistencia: ["No sé si vale la pena hablar tanto de mí.", "Hay personas con problemas más grandes.", "No quiero preocupar a nadie.", "Quizás se me va a pasar."],
    apertura: ["A veces pienso que cuidé tanto a otros que no aprendí a cuidarme.", "Me pregunto qué queda para mí ahora.", "Me cuesta decir que necesito compañía."],
    preferencias: ["Me gusta cuidar a mi familia.", "Me haría bien tener un espacio donde no tenga que ser fuerte todo el tiempo.", "Me gustaría pedir ayuda sin sentir que molesto."],
    cierre: ["Muchas gracias. Me quedo un poco más tranquila.", "Gracias por escucharme con paciencia.", "Me voy pensando que quizás puedo hablar un poco más de mí."],
    cierreApresurado: ["Está bien, aunque me quedé con cosas guardadas.", "Gracias, pero me cuesta cerrar tan rápido.", "Sí... quizás otro día podría explicarlo mejor."],
    seguimiento: {
      soledad: ["La soledad aparece más cuando la casa queda tranquila. Ahí me doy cuenta de que me guardé muchas cosas.", "No es estar sola solamente; es sentir que no quiero molestar a nadie.", "A veces la casa está ordenada y aun así se siente vacía."],
      hijos: ["Mis hijos tienen sus vidas y eso está bien. Yo trato de no preocuparlos con lo mío.", "No quiero que sientan que tienen que hacerse cargo de mí.", "Los quiero mucho, por eso mismo me guardo algunas cosas."],
      ayuda: ["Pedir ayuda me cuesta mucho. Siento que estoy molestando o quitándole tiempo a alguien.", "Me cuesta decir 'necesito compañía'. Me sale preguntar por los demás.", "Cuando alguien me ayuda, agradezco, pero también me da culpa."],
      familia: ["En la familia hay roces, como en todas. Yo suelo ceder para que no se arme conflicto.", "No quiero hablar mal de nadie, pero algunas cosas me pesan.", "A veces estoy pendiente de todos y nadie pregunta mucho por mí."],
      trabajo: ["Trabajar algunas horas me ayuda a ordenar el día.", "Cuando estoy ocupada no pienso tanto.", "Me sirve salir, aunque después vuelva la sensación de silencio."]
    }
  },
  nicolas: {
    saludo: ["Hola.", "Ya... hola.", "Hola.", "Sí.", "Hola, supongo."],
    cortesia: ["Ya... hola.", "Está bien.", "Gracias, supongo.", "No sé qué decir, pero hola."],
    presentacion: ["No sé qué contar. Tengo 18, voy al colegio y me mandaron porque dicen que estoy más callado y bajé las notas.", "Soy Nicolás. Tengo 18 y no pedí venir, pero el colegio dijo que tenía que hablar.", "No sé... voy al colegio y últimamente todos dicen que estoy raro o más callado."],
    rol: ["No sé. Me dijeron que tenía que hablar contigo."],
    motivo: ["Me mandaron del colegio. Dicen que estoy más callado y que bajé las notas, pero no fue idea mía venir.", "Estoy acá porque el colegio dijo que tenía que venir. Dicen que participo poco.", "No sé. Los adultos creen que algo me pasa porque bajé las notas."],
    emocion: ["No sé... cansado, supongo.", "Me molesta que pregunten como si ya supieran la respuesta.", "Prefiero quedarme callado para no meterme en problemas.", "Siento que da lo mismo lo que diga."],
    contexto: ["En el colegio prefiero hablar poco.", "En mi casa casi siempre terminan preguntando por notas.", "Con compañeros estoy más distante.", "Me pongo audífonos y así no tengo que explicar tanto."],
    validacion: ["Puede ser. Al menos no suena como reto.", "Ya... eso es distinto a que me digan flojo.", "Sí, quizás. No me gusta que decidan por mí.", "Gracias, supongo. Es raro que no partan retándome."],
    juicio: ["Eso dicen todos, que soy flojo o que no pongo de mi parte.", "Si va a ser otro reto, mejor no digo nada.", "Ya, entonces para qué preguntar.", "Me pasa que los adultos creen que ya entendieron todo."],
    consejo: ["Ya... pero no es tan simple.", "Eso me lo han dicho muchas veces.", "No sé si sirve decirme lo que tengo que hacer.", "Si pudiera hacerlo así no más, ya lo habría hecho."],
    resistencia: ["No sé.", "Da lo mismo.", "Puede ser.", "No quiero hablar de eso."],
    apertura: ["A veces me callo porque siento que nadie escucha de verdad.", "No es que no tenga nada que decir.", "Me cuesta hablar si siento que después lo van a usar para retarme."],
    preferencias: ["Prefiero estar tranquilo.", "Me gustaría que me preguntaran sin asumir que soy flojo.", "Me sirve que no me apuren."],
    cierre: ["Ya.", "Ok. Gracias.", "Está bien, hablamos."],
    cierreApresurado: ["Ya, como sea.", "Ok, pero no dije mucho.", "Está bien, supongo."],
    seguimiento: {
      colegio: ["En el colegio prefiero hablar poco. Siento que si digo algo, después lo miran como problema.", "No es que no entienda nada; es que me cuesta participar.", "Cuando todos miran, prefiero quedarme piola."],
      notas: ["Bajé las notas, sí. Pero siento que todos se quedaron solo con eso.", "No sé si bajé tanto, pero ahora todo gira alrededor de eso.", "Cuando preguntan por notas siento que ya viene el reto."],
      silencio: ["Me quedo callado porque es más fácil. Si hablo, siento que después lo pueden usar para retarme.", "Callarme me evita problemas.", "A veces quiero decir algo, pero después pienso que no vale la pena."],
      familia: ["En mi casa el tema termina siendo el colegio.", "Mi mamá se preocupa, pero igual todo suena a reto.", "No sé cómo hablar sin que pregunten por notas."],
      social: ["Con compañeros me fui alejando. No pasó una cosa grande, simplemente dejé de hablar.", "No sé si tengo ganas de acercarme.", "Prefiero estar aparte para que no me molesten."]
    }
  },
  camila: makeAdvancedKit({
    name: "Camila",
    intro: "Soy Camila, tengo 29. Trabajo y ayudo harto a mi familia; últimamente siento que estoy disponible para todos menos para mí.",
    motive: "Vine porque estoy cansada de estar siempre disponible. Me cuesta poner límites sin sentirme mala persona.",
    concern: "Me preocupa que si digo que no, los demás piensen que soy egoísta o que ya no pueden contar conmigo.",
    expectation: "Me gustaría aprender a hablar de mis límites sin sentir que estoy abandonando a alguien.",
    voice: "amable",
    topics: ["limites", "familia", "culpa", "trabajo", "cansancio"],
    lines: ["Me da culpa decir que no.", "Si puedo ayudar, siento que debería hacerlo.", "A veces digo que sí antes de pensar si puedo."]
  }),
  rodrigo: makeAdvancedKit({
    name: "Rodrigo",
    intro: "Soy Rodrigo, tengo 45. Trabajo y soy papá; estoy separado hace poco y trato de mantenerme firme, aunque no siempre me resulta.",
    motive: "Vine por la separación. He andado con cambios de ánimo y trato de hacerme el fuerte, pero no siempre puedo.",
    concern: "Me preocupa fallar como papá o que mis hijos me vean demasiado afectado.",
    expectation: "Quisiera ordenar lo que me pasa sin desarmarme frente a todos.",
    voice: "práctico",
    topics: ["separacion", "familia", "trabajo", "cansancio", "soledad"],
    lines: ["Hay que seguir no más.", "No quiero que mis hijos me vean mal.", "Me cuesta hablar de tristeza directamente."]
  }),
  fernanda: makeAdvancedKit({
    name: "Fernanda",
    intro: "Soy Fernanda, tengo 34. Estoy volviendo al trabajo después de una licencia larga y me da miedo no poder rendir como antes.",
    motive: "Estoy volviendo al trabajo después de una licencia y me da miedo que todos noten que no rindo igual.",
    concern: "Me preocupa sentirme observada y confirmar que ya no soy la misma de antes.",
    expectation: "Espero poder hablar de esto sin que suene a que no quiero trabajar.",
    voice: "cuidadosa",
    topics: ["retorno", "trabajo", "cansancio", "familia", "juicio"],
    lines: ["Siento que todos van a estar mirando.", "No quiero parecer incapaz.", "Me cuesta confiar en que puedo retomar de a poco."]
  }),
  hector: makeAdvancedKit({
    name: "Héctor",
    intro: "Soy Héctor, tengo 61. Jubilé hace poco y pensé que iba a ser más simple, pero me cuesta llenar los días.",
    motive: "Jubilé hace poco y me está costando más de lo que pensé. Tengo tiempo, pero a veces se siente vacío.",
    concern: "Me preocupa perder el lugar que tenía o que me miren como alguien que ya no aporta.",
    expectation: "Quizás necesito encontrar una rutina que tenga sentido sin sentir que dependo de otros.",
    voice: "reservado",
    topics: ["jubilacion", "rutina", "familia", "soledad", "utilidad"],
    lines: ["Uno se acostumbra a ser útil.", "Me levanto temprano igual, pero no sé para qué.", "No quiero que estén pendientes de mí como si no pudiera solo."]
  }),
  daniela: makeAdvancedKit({
    name: "Daniela",
    intro: "Soy Daniela, tengo 27. Estoy criando a mi hijo y estudiando; lo amo, pero estoy agotada y me cuesta decirlo sin culpa.",
    motive: "Vine porque estoy tratando de compatibilizar maternidad, estudio y algo de cuidado para mí. Me siento cansada y culpable.",
    concern: "Me preocupa ser egoísta cuando pienso en mis proyectos o en descansar.",
    expectation: "Me gustaría poder decir que estoy cansada sin sentir que estoy fallando como mamá.",
    voice: "amorosa",
    topics: ["maternidad", "culpa", "universidad", "familia", "cansancio"],
    lines: ["Amo a mi hijo, pero estoy cansada.", "Me da culpa querer un rato para mí.", "A veces no sé dónde quedo yo."]
  }),
  andres: makeAdvancedKit({
    name: "Andrés",
    intro: "Soy Andrés, tengo 19. Entré hace poco a la universidad y siento que todos saben moverse mejor que yo.",
    motive: "Vine porque entré a la universidad y siento que no encajo. Trato de parecer tranquilo, pero por dentro me comparo mucho.",
    concern: "Me preocupa no estar a la altura y decepcionar a mi familia.",
    expectation: "Quisiera entender si esto le pasa a más gente o si de verdad estoy fuera de lugar.",
    voice: "inseguro",
    topics: ["pertenencia", "universidad", "familia", "comparacion", "cansancio"],
    lines: ["Siento que todos saben moverse menos yo.", "Mi familia está orgullosa y eso pesa.", "No quiero que se note que estoy perdido."]
  }),
  patricia: makeAdvancedKit({
    name: "Patricia",
    intro: "Soy Patricia, tengo 48. Tengo una hija adolescente y últimamente siento que todo entre nosotras termina en pelea.",
    motive: "Vine por conflictos con mi hija adolescente. Me preocupa perder autoridad y también perder el vínculo.",
    concern: "Me da miedo que le pase algo o que deje de confiar en mí.",
    expectation: "Me gustaría entender cómo hablarle sin que todo termine en pelea.",
    voice: "preocupada",
    topics: ["familia", "hija", "control", "miedo", "trabajo"],
    lines: ["Yo solo quiero cuidarla.", "Siento que ya no me escucha.", "A veces salgo controladora cuando en realidad estoy asustada."]
  }),
  miguel: makeAdvancedKit({
    name: "Miguel",
    intro: "Soy Miguel, tengo 32. Migré hace poco y estoy tratando de armar vida acá, aunque a veces siento que partí de cero.",
    motive: "Vine porque me ha costado adaptarme después de migrar. Trabajo, intento avanzar, pero a veces siento que empecé de cero.",
    concern: "Me preocupa perder partes de quién era antes o quedarme solo acá.",
    expectation: "Quisiera poder hablar de esto sin parecer ingrato, porque también valoro estar acá.",
    voice: "respetuoso",
    topics: ["migracion", "trabajo", "familia", "social", "soledad"],
    lines: ["No quiero sonar ingrato.", "A veces siento que empecé de cero.", "Extraño cosas que acá nadie conoce."]
  }),
  sofia: makeAdvancedKit({
    name: "Sofía",
    intro: "Soy Sofía, tengo 24. Estudio, trabajo algunas horas y paso demasiado tiempo en redes; sé que me comparo, pero igual vuelvo.",
    motive: "Vine porque uso mucho las redes y me comparo todo el tiempo. Sé que me hace mal a ratos, pero igual vuelvo.",
    concern: "Me preocupa necesitar validación para sentir que estoy bien.",
    expectation: "Quisiera entender por qué me cuesta tanto soltar el celular aunque sepa que termino peor.",
    voice: "irónica",
    topics: ["digital", "comparacion", "trabajo", "universidad", "social"],
    lines: ["Sé que suena tonto, pero me pega.", "Miro cinco minutos y se me va una hora.", "Me río de mí misma, pero igual me afecta."]
  }),
  claudio: makeAdvancedKit({
    name: "Claudio",
    intro: "Soy Claudio, tengo 40. Tengo trabajo estable y una rutina ordenada, pero siento que estoy en piloto automático.",
    motive: "Vine porque siento que estoy estancado. Tengo estabilidad, pero me cuesta tomar decisiones y cambiar algo.",
    concern: "Me preocupa mirar hacia atrás y sentir que elegí no moverme por miedo.",
    expectation: "Quisiera entender qué me frena, sin hacer cambios impulsivos.",
    voice: "analítico",
    topics: ["decisiones", "trabajo", "rutina", "familia", "cambio"],
    lines: ["En teoría estoy bien.", "Analizo tanto que al final no hago nada.", "La rutina me ordena, pero también me encierra."]
  })
};

export const patientResponses = Object.fromEntries(
  Object.entries(kits).map(([caseId, kit]) => [caseId, buildResponses(caseId, kit)])
);

patientResponses.sofia = enhanceSofiaResponses(patientResponses.sofia);

export const patientConversationUnits = kits;

function makeAdvancedKit({ name, intro, motive, concern, expectation, voice, topics, lines }) {
  const [primary, secondary, tertiary] = lines;
  return {
    saludo: ["Hola.", "Hola, gracias.", "Sí, hola.", "Gracias.", "Hola... aquí estoy."],
    cortesia: [`Gracias. ${voice === "irónica" ? "Prometo intentar tomármelo en serio." : "Me ayuda partir con calma."}`, "Está bien, podemos conversar.", "Gracias por decirlo así."],
    presentacion: [intro, `${name}. ${primary} ${secondary}`, `No sé por dónde partir. ${intro}`],
    rol: ["Entiendo que vamos a conversar un poco. No sé exactamente qué se espera de mí, pero puedo intentarlo."],
    motivo: [motive, `${motive} ${concern}`, `Creo que vine por eso: ${motive.charAt(0).toLowerCase()}${motive.slice(1)}`],
    emocion: [`${concern}`, `${primary} A veces trato de seguir igual, pero se nota.`, `${secondary} Y cuando lo digo en voz alta me cuesta sostenerlo.`, `${tertiary} Eso me deja dando vueltas.`],
    contexto: [`${primary} En mi día a día eso aparece más de lo que me gustaría.`, `${secondary} No es una sola cosa; se mete en la casa, en la rutina y en cómo hablo con otros.`, `${tertiary} A veces intento hacer como que no pasa, pero igual vuelve.`],
    validacion: ["Gracias. Me ayuda que no suene como un reto.", "Sí, eso se acerca más a lo que me pasa.", "Me alivia que lo pongas así, sin juzgar de entrada.", "Puede ser. Nunca lo había ordenado de esa manera."],
    juicio: ["Cuando lo dices así, me dan menos ganas de seguir hablando.", "Eso me hace sentir que ya hay una conclusión antes de escucharme.", "Me cuesta si esto se vuelve un reto.", "No creo que sea tan simple como que yo esté haciendo todo mal."],
    consejo: ["Entiendo la idea, pero si fuera tan simple ya lo habría hecho.", "Suena razonable, pero en la práctica me cuesta mucho más.", "Quizás sirve después, pero ahora necesito entender qué me pasa.", "Me cuesta recibirlo como consejo rápido porque siento que falta contexto."],
    resistencia: ["No sé si lo puedo explicar bien.", "Quizás no es tan grave.", "Me cuesta hablar de eso todavía.", "No quiero que suene como excusa."],
    apertura: [`${primary} Creo que eso dice más de mí de lo que pensaba.`, `${secondary} Esa parte me pesa más cuando estoy a solas.`, `${tertiary} Me cuesta reconocerlo, pero sí me afecta.`],
    preferencias: [expectation, "Me gustaría que esta conversación no fuera solo para decirme qué hacer.", "Me sirve ir de a poco y no sentir que tengo que resolver todo hoy."],
    cierre: ["Gracias. Me voy con algo más ordenado.", "Gracias por escuchar sin apurarme.", "Me queda dando vueltas, pero de una forma un poco más clara."],
    cierreApresurado: ["Está bien, aunque siento que todavía no alcancé a explicar bien.", "Ok, pero me quedo con varias cosas pendientes.", "Gracias, aunque fue un poco rápido para mí."],
    seguimiento: makeFollowUps(topics, lines, concern)
  };
}

function buildResponses(caseId, kit) {
  const facts = patientFacts[caseId];
  const concrete = {
    pregunta_escolar: expand([facts.school], 4, ["Eso igual se cruza con lo que estoy viviendo."]),
    pregunta_academica: expand([facts.academic], 4, ["A veces lo digo simple, pero me mueve más de lo que parece."]),
    pregunta_laboral: expand([facts.works], 4, ["Trato de cumplir, aunque por dentro no siempre esté igual."]),
    pregunta_familiar: expand([facts.family], 4, ["Me cuesta hablarlo sin cuidar demasiado a los demás."]),
    pregunta_social: expand([facts.social], 4, ["No siempre sé cuánto contar o a quién acercarme."]),
    pregunta_videojuegos: expand([facts.videogames], 4, ["No es el centro de todo, pero igual dice algo de cómo estoy."]),
    pregunta_habitos: expand([facts.habits], 4, ["La rutina muestra más de lo que digo al principio."])
  };

  return {
    saludo: expand(kit.saludo, 10, ["Podemos partir.", "Estoy tratando de estar acá."]),
    cortesia_vinculo: expand(kit.cortesia, 10, ["Me ayuda que lo digas así.", "Prefiero ir de a poco."]),
    nombre: [nameResponse(facts.name)],
    edad: [`Tengo ${facts.age}.`],
    presentacion_personal_abierta: expand(kit.presentacion, 10, commonTails),
    rol_entrevistador: expand(kit.rol, 6, commonTails),
    motivo_de_consulta: expand(kit.motivo, 15, commonTails),
    preferencias_valoracion: expand(kit.preferencias, 15, commonTails),
    ...concrete,
    exploracion_emocional: expand(kit.emocion, 20, commonTails),
    exploracion_contextual: expand(kit.contexto, 20, commonTails),
    validacion_emocional: expand(kit.validacion, 20, commonTails),
    juicio_o_critica: expand(kit.juicio, 20, commonTails),
    consejo_apresurado: expand(kit.consejo, 20, commonTails),
    resistencia_evasion: expand(kit.resistencia, 20, commonTails),
    apertura_progresiva: expand(kit.apertura, 20, commonTails),
    seguimiento_contextual: buildSeguimiento(kit.seguimiento),
    cierre: expand(kit.cierre, 15, commonTails),
    cierre_apresurado: expand(kit.cierreApresurado, 10, commonTails),
    respuesta_general: expand([...kit.apertura, ...kit.contexto], 10, commonTails),
    desconocida: expand(kit.resistencia, 6, commonTails)
  };
}

function nameResponse(name) {
  return `Me llamo ${name}.`;
}

function buildSeguimiento(seguimiento) {
  const entries = Object.entries(seguimiento);
  const mapped = Object.fromEntries(
    entries.map(([topic, seeds]) => [topic, expand(seeds, 5, commonTails)])
  );
  mapped.default = expand(entries.flatMap(([, seeds]) => seeds).slice(0, 8), 8, commonTails);
  return mapped;
}

function makeFollowUps(topics, lines, concern) {
  const [primary, secondary, tertiary] = lines;
  return Object.fromEntries(
    topics.map((topic, index) => [
      topic,
      [
        `${primary} Cuando aparece ese tema, me cuesta hacer como si nada.`,
        `${secondary} En esa parte siento que se me mezclan varias cosas.`,
        `${tertiary} A veces lo evito porque no sé cómo explicarlo bien.`,
        `${concern} Eso se nota más cuando hablamos sobre ${readableTopic(topic)}.`,
        `Con ${readableTopic(topic)} me pasa que intento ordenar una cosa y aparecen tres más.`
      ]
    ])
  );
}

function readableTopic(topic) {
  const labels = {
    limites: "los límites",
    separacion: "la separación",
    retorno: "el retorno al trabajo",
    jubilacion: "la jubilación",
    maternidad: "la maternidad",
    pertenencia: "la universidad",
    migracion: "la migración",
    digital: "las redes",
    decisiones: "las decisiones",
    familia: "mi familia",
    trabajo: "el trabajo",
    universidad: "la universidad",
    cansancio: "el cansancio",
    culpa: "la culpa",
    rutina: "la rutina",
    social: "lo social",
    soledad: "la soledad",
    hija: "mi hija",
    control: "el control",
    miedo: "el miedo",
    comparacion: "la comparación",
    cambio: "el cambio",
    utilidad: "sentirme útil",
    juicio: "sentirme observada"
  };
  return labels[topic] || topic;
}

function expand(seeds, target, tails = []) {
  const cleanSeeds = seeds.filter(Boolean);
  const cleanTails = tails.length ? tails : commonTails;
  const responses = [];

  for (let index = 0; responses.length < target; index += 1) {
    const seed = cleanSeeds[index % cleanSeeds.length];
    if (index < cleanSeeds.length) {
      responses.push(seed);
    } else {
      const tail = cleanTails[index % cleanTails.length];
      responses.push(`${seed} ${tail}`);
    }
  }

  return responses;
}

function enhanceSofiaResponses(baseResponses) {
  const motivo = [
    "No sé si suena grave, pero me está afectando más de lo que quiero admitir. Tiene que ver con las redes.",
    "Creo que vine porque me está afectando más de lo que quiero admitir. Tiene que ver con las redes y con compararme todo el tiempo.",
    "No sé si suena grave, pero me cuesta desconectarme. A veces entro a redes y termino sintiéndome peor.",
    "Me pasa que digo que no me importa, pero después quedo pendiente de cómo me ven o de si alguien reaccionó."
  ];

  const seguimiento = [
    "Creo que tiene que ver con las redes. Me da vergüenza decirlo porque suena superficial, pero me comparo mucho.",
    "Me pasa que puedo estar bien, pero entro a redes y empiezo a compararme. Con cómo se ven otros, con lo que hacen, con la vida que muestran.",
    "Que me importa más de lo que digo. Hago como que me da lo mismo, pero a veces quedo pendiente de si alguien reaccionó o no.",
    "Me comparo con gente que ni conozco. Sé que muchas cosas están editadas, pero igual me afecta.",
    "A veces subo algo y después reviso más de la cuenta si alguien lo vio.",
    "Me da vergüenza admitirlo, porque siento que debería ser más madura con esto.",
    "No es solo la foto o el like. Es la sensación de que todos avanzan y yo no.",
    "Puedo perder mucho rato mirando cosas y después quedo con una sensación fea, como de no estar haciendo suficiente."
  ];

  const apertura = [
    "A veces digo que me da lo mismo, pero no es tan cierto. Me quedo pendiente de si alguien vio lo que subí.",
    "Sé que suena superficial, pero igual me afecta. Me comparo más de lo que me gustaría admitir.",
    "Me da rabia depender tanto de algo que sé que no debería importarme.",
    "A veces puedo estar bien, veo algo en redes y se me cambia el ánimo.",
    "Me comparo con gente que ni conozco, y aun así siento que estoy quedando atrás.",
    "No es solo verme mejor o peor. Es sentir que mi vida no alcanza.",
    "Me cuesta desconectarme porque cuando lo hago siento que me pierdo algo o que desaparezco.",
    "Sí... creo que sí. Me gustaría entender por qué algo que sé que no debería importarme igual me afecta tanto."
  ];

  const validacion = [
    "Gracias. Me ayuda que no lo tomes como algo tonto.",
    "Gracias. Me ayuda que no suene como un reto.",
    "Sí... creo que eso es lo que me cuesta, sentir que tiene sentido hablarlo.",
    "Me alivia un poco que no suene como reto.",
    "Quizás por eso me cuesta decirlo. Siento que alguien podría decirme 'simplemente deja el celular'.",
    "Sí, creo que necesito poder hablarlo sin sentirme ridícula.",
    "Sí... eso me alivia un poco. Me da vergüenza, pero me afecta más de lo que digo."
  ];

  const juicio = [
    "Eso es justo lo que me da miedo, que piensen que es una tontera.",
    "Ya... por eso a veces prefiero no decir nada.",
    "Sé que suena superficial, pero decirlo así hace que me cierre más.",
    "Si fuera tan fácil dejarlo, ya lo habría hecho.",
    "No es solo 'usar menos el celular'. Ojalá fuera así."
  ];

  const baja = [
    "No sé si lo puedo explicar bien... creo que tiene que ver con las redes. Me comparo más de lo que me gustaría admitir.",
    "Quizás no es tan grave, pero igual me pasa que entro a redes y termino sintiéndome peor.",
    "Me da vergüenza decirlo porque siento que va a sonar superficial, pero quedo pendiente de cómo me ven.",
    "No quiero que suene como excusa. Sé que podría soltar el celular, pero igual vuelvo a mirar."
  ];

  return {
    ...baseResponses,
    motivo_de_consulta: expand(motivo, 15, commonTails),
    seguimiento_contextual: {
      ...baseResponses.seguimiento_contextual,
      default: expand(seguimiento, 12, commonTails),
      digital: expand(seguimiento, 12, commonTails),
      comparacion: expand(seguimiento, 12, commonTails),
      social: expand(seguimiento, 10, commonTails)
    },
    exploracion_emocional: expand([...seguimiento.slice(0, 3), ...apertura], 20, commonTails),
    exploracion_contextual: expand(seguimiento, 20, commonTails),
    validacion_emocional: expand(validacion, 20, commonTails),
    juicio_o_critica: expand(juicio, 20, commonTails),
    respuesta_general: expand([...baja, ...apertura], 12, commonTails),
    desconocida: expand(baja, 8, commonTails),
    resistencia_evasion: expand(baja, 10, commonTails),
    apertura_progresiva: expand(apertura, 20, commonTails)
  };
}
