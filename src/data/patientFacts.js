import { getAvatarCanonicalBiography } from "./avatarCanonicalBiographies.js";

export const patientFacts = {
  tomas: {
    name: "Tomás",
    age: 18,
    school: "Sí, voy al colegio. Últimamente me cuesta más participar, sobre todo cuando hay trabajos en grupo.",
    academic: "Estoy en el colegio. No me va pésimo, pero participar me cuesta harto.",
    works: "No, no trabajo. Ahora mi rutina es colegio, casa y computador.",
    family: "Sí, vivo con mis papás. Últimamente discutimos harto por el computador.",
    social: "Algunos, pero más online. En el colegio me cuesta más acercarme.",
    videogames: "Sí, juego bastante. No lo siento solo como jugar; a veces es la forma que tengo de desconectarme.",
    habits: "Duermo más o menos. A veces me quedo jugando o viendo videos hasta tarde.",
    preferences: "Me gustan los juegos online y estar tranquilo en mi pieza. Ahí siento que sé mejor qué hacer.",
    motive: "Creo que es por el tema del computador. Mis papás dicen que paso mucho tiempo jugando y que casi no salgo, pero yo siento que no es tan simple.",
    concern: "Me preocupa que todos crean que el problema soy yo o el computador, porque en persona también me cuesta saber qué decir.",
    expectation: "No sé bien qué espero. Quizás que no partan retándome y que entiendan un poco más."
  },
  valentina: {
    name: "Valentina",
    age: 21,
    school: "No, ya salí del colegio. Ahora estudio en la universidad.",
    academic: "Sí, estudio en la universidad. Últimamente siento que no me alcanza el tiempo para todo.",
    works: "No trabajo formalmente. La universidad me ocupa como si fuera jornada completa.",
    family: "Mi familia confía mucho en mí. No me presionan todo el tiempo, pero yo igual siento que esperan mucho.",
    social: "Sí, tengo amigas, pero muchas veces postergo verlas por estudiar.",
    videogames: "No, no juego videojuegos. Si uso el celular para distraerme, después siento culpa por perder tiempo.",
    habits: "Descanso poco. Y cuando descanso, igual me siento culpable.",
    preferences: "Me gusta sentir que tengo las cosas ordenadas. El problema es que nunca siento que sea suficiente.",
    motive: "Vine porque estoy muy sobrepasada con la universidad. Me cuesta parar y cuando descanso me siento culpable.",
    concern: "Me preocupa bajar el ritmo y decepcionar a mi familia o a mí misma.",
    expectation: "Me gustaría ordenar lo que me pasa sin sentir que estoy exagerando."
  },
  marcos: {
    name: "Marcos",
    age: 38,
    school: "No, no voy al colegio. Trabajo hace años.",
    academic: "No estudio actualmente. A veces pienso en capacitarme, pero llego muy cansado.",
    works: "Sí, trabajo. Últimamente la pega me está dejando sin energía.",
    family: "Vivo con mi pareja. Me preocupa que a veces llegue tan irritable a la casa.",
    social: "Tengo amigos, pero no hablo mucho de estas cosas con ellos.",
    videogames: "No, no juego videojuegos. Lo que más me consume ahora es el trabajo y el teléfono con correos.",
    habits: "Duermo, pero no siempre descanso. Me acuesto pensando en pendientes.",
    preferences: "Me gusta resolver cosas y cumplir. Últimamente eso mismo me tiene agotado.",
    motive: "Ando cansado y más irritable. Creo que tiene que ver con la pega, aunque me cuesta reconocerlo.",
    concern: "Me preocupa estar fallando en la casa por llegar tan apagado.",
    expectation: "No sé si espero una solución. Quizás entender por qué estoy tan corto de paciencia."
  },
  elena: {
    name: "Elena",
    age: 52,
    school: "No, no voy al colegio. Hace tiempo no estudio formalmente.",
    academic: "No estudio ahora. A veces me gustaría tomar algún taller, pero me cuesta darme permiso.",
    works: "Trabajo algunas horas. Me ayuda a ordenar el día y mantenerme ocupada.",
    family: "Sí, tengo hijos. No quiero cargarlos con mis cosas, por eso a veces me guardo lo que siento.",
    social: "Tengo algunas amigas, pero cada una tiene su vida y no siempre quiero molestar.",
    videogames: "No, no juego videojuegos. Uso más el teléfono para hablar con familia o mirar cosas.",
    habits: "Duermo más o menos. Hay noches en que me quedo pensando en la familia.",
    preferences: "Me gusta estar pendiente de mi familia y tener la casa en orden. A veces eso me deja poco espacio para mí.",
    motive: "Me he sentido un poco sola. Hay cosas familiares que me tienen preocupada y me cuesta pedir ayuda.",
    concern: "Me da miedo ser una carga para los demás.",
    expectation: "Espero poder hablar sin preocupar a nadie más. Me cuesta, pero creo que lo necesito."
  },
  nicolas: {
    name: "Nicolás",
    age: 18,
    school: "Sí, voy al colegio. Aunque no me gusta mucho hablar allá.",
    academic: "Estoy en el colegio. Bajé un poco las notas y dicen que participo menos.",
    works: "No, no trabajo. Estoy en el colegio.",
    family: "Vivo con mi familia. En la casa casi siempre el tema termina siendo el colegio.",
    social: "Pocos. Antes hablaba más con algunos compañeros, pero ahora estoy más apartado.",
    videogames: "A veces juego o veo videos. Me sirve para distraerme y no tener que explicar tanto.",
    habits: "Más o menos. A veces me pongo audífonos o veo videos para no hablar con nadie.",
    preferences: "Me gusta estar tranquilo y que no me pregunten todo como si fuera interrogatorio.",
    motive: "Me mandaron del colegio. Dicen que estoy más callado y que bajé las notas, pero no fue idea mía venir.",
    concern: "Me preocupa que los adultos ya tengan una idea hecha de mí.",
    expectation: "No sé. Quizás que esto no sea otro reto por las notas."
  },
  camila: {
    name: "Camila",
    age: 29,
    school: "No, no voy al colegio. Ya terminé esa etapa.",
    academic: "No estudio ahora. Trabajo, y además siempre aparece algo familiar que resolver.",
    works: "Sí, trabajo. A veces salgo de la pega y sigo disponible para todo el mundo.",
    family: "Ayudo harto a mi familia. Me cuesta decir que no, aunque esté cansada.",
    social: "Tengo amigas, pero a veces también siento que tengo que estar para ellas.",
    videogames: "No juego videojuegos. Uso el celular para responder mensajes y termino disponible hasta tarde.",
    habits: "Descanso poco, porque cuando paro aparece la culpa o alguien necesita algo.",
    preferences: "Me gusta ayudar. El problema es que a veces siento que si no estoy disponible, fallo.",
    motive: "Vine porque estoy cansada de estar siempre disponible. Me cuesta poner límites sin sentirme mala persona.",
    concern: "Me preocupa que si empiezo a decir que no, los demás se molesten o me dejen de querer.",
    expectation: "Me gustaría entender cómo cuidarme sin sentir que abandono a los demás."
  },
  rodrigo: {
    name: "Rodrigo",
    age: 45,
    school: "No, no voy al colegio. Tengo hijos en etapa escolar, eso sí.",
    academic: "No estudio ahora. Estoy más preocupado de trabajar y ordenar la casa después de la separación.",
    works: "Sí, trabajo. Trato de mantener todo funcionando, aunque por dentro esté más revuelto.",
    family: "Soy papá. Después de la separación estoy tratando de reorganizar tiempos y no afectar a mis hijos.",
    social: "Tengo amigos, pero no me gusta hablar mucho de la separación.",
    videogames: "No juego videojuegos. A veces me quedo mirando el celular para no pensar tanto.",
    habits: "Duermo irregular. Hay noches en que me despierto pensando en pendientes de la casa o de los niños.",
    preferences: "Me gusta ser práctico y resolver. Últimamente hay cosas que no se arreglan solo haciendo más.",
    motive: "Vine por la separación. He andado con cambios de ánimo y trato de hacerme el fuerte, pero no siempre puedo.",
    concern: "Me preocupa fallar como papá o que mis hijos me vean mal.",
    expectation: "Quisiera ordenar lo que me está pasando sin desarmarme frente a todos."
  },
  fernanda: {
    name: "Fernanda",
    age: 34,
    school: "No, no voy al colegio. Mi foco ahora es volver al trabajo.",
    academic: "No estudio ahora. Me cuesta imaginar sumar algo más mientras intento retomar la rutina.",
    works: "Sí, estoy retomando el trabajo después de una licencia larga. Me da miedo no rendir como antes.",
    family: "Mi familia intenta apoyarme, pero a veces siento que me observan para ver si ya estoy bien.",
    social: "Tengo algunas personas cerca, aunque me cuesta contarles que todavía estoy insegura.",
    videogames: "No juego videojuegos. Me distraigo con series o el celular cuando no quiero pensar en el trabajo.",
    habits: "Duermo con altibajos. Antes de días laborales me cuesta más desconectarme.",
    preferences: "Me gusta hacer bien mi trabajo. Justamente por eso me asusta volver y sentirme menos capaz.",
    motive: "Estoy volviendo al trabajo después de una licencia y me da miedo que todos noten que no rindo igual.",
    concern: "Me preocupa sentirme observada y confirmar que ya no soy la misma de antes.",
    expectation: "Espero poder hablar de esto sin que suene a que no quiero trabajar."
  },
  hector: {
    name: "Héctor",
    age: 61,
    school: "No, no voy al colegio. Hace muchos años que mi vida giraba más bien en torno al trabajo.",
    academic: "No estudio ahora. Me cuesta encontrar una rutina nueva desde que jubilé.",
    works: "Ya jubilé. Todavía me cuesta decirlo sin sentir que quedé fuera de algo.",
    family: "Tengo familia, pero no quiero que estén pendientes de mí como si no pudiera solo.",
    social: "Conozco gente, pero muchos vínculos eran del trabajo y eso cambió de golpe.",
    videogames: "No juego videojuegos. Miro noticias o camino un poco para pasar el día.",
    habits: "Me levanto temprano igual, pero a veces no sé muy bien para qué.",
    preferences: "Me gusta sentirme útil. Desde que dejé de trabajar, esa parte se me movió bastante.",
    motive: "Jubilé hace poco y me está costando más de lo que pensé. Tengo tiempo, pero a veces se siente vacío.",
    concern: "Me preocupa volverme una carga o perder el lugar que tenía.",
    expectation: "No sé si busco algo concreto. Quizás entender cómo armar una rutina que tenga sentido."
  },
  daniela: {
    name: "Daniela",
    age: 27,
    school: "No, no voy al colegio. Estoy estudiando y criando al mismo tiempo.",
    academic: "Sí, estudio. Me cuesta compatibilizar clases, tareas y el cuidado de mi hijo.",
    works: "No trabajo formalmente ahora. Entre estudiar y cuidar, el día se me va completo.",
    family: "Mi familia ayuda a ratos, pero igual siento que la responsabilidad principal queda en mí.",
    social: "Veo poco a mis amigas. A veces siento que mi vida va a otro ritmo.",
    videogames: "No juego videojuegos. Uso el celular en ratos cortos, casi siempre cuando mi hijo duerme.",
    habits: "Duermo poco y cortado. A veces ni me doy cuenta de cuánto cansancio acumulo.",
    preferences: "Amo a mi hijo, pero también extraño tener un rato para mí sin culpa.",
    motive: "Vine porque estoy tratando de compatibilizar maternidad, estudio y algo de cuidado para mí. Me siento cansada y culpable.",
    concern: "Me preocupa ser egoísta cuando pienso en mis proyectos o en descansar.",
    expectation: "Me gustaría poder decir que estoy cansada sin sentir que estoy fallando como mamá."
  },
  andres: {
    name: "Andrés",
    age: 19,
    school: "No, ya salí del colegio. Entré hace poco a la universidad.",
    academic: "Sí, estudio en la universidad. Me cuesta sentir que pertenezco ahí.",
    works: "No trabajo ahora. Mi foco es estudiar, aunque igual me preocupa la plata en la casa.",
    family: "Soy primera generación en la universidad. Mi familia está orgullosa, y eso pesa.",
    social: "Conozco gente, pero siento que todos se manejan mejor que yo.",
    videogames: "A veces juego o miro videos para despejarme, pero no es el tema principal.",
    habits: "Duermo irregular cuando tengo pruebas o cuando me quedo pensando en comparaciones.",
    preferences: "Me gusta aprender, pero me cuesta no compararme todo el tiempo.",
    motive: "Vine porque entré a la universidad y siento que no encajo. Trato de parecer tranquilo, pero por dentro me comparo mucho.",
    concern: "Me preocupa no estar a la altura y decepcionar a mi familia.",
    expectation: "Quisiera entender si esto le pasa a más gente o si de verdad estoy fuera de lugar."
  },
  patricia: {
    name: "Patricia",
    age: 48,
    school: "No, no voy al colegio. Mi hija está en esa etapa y ahí han aparecido varios conflictos.",
    academic: "No estudio ahora. Trabajo y trato de estar presente en la casa.",
    works: "Sí, trabajo. Llego cansada y a veces igual tengo que entrar a discutir temas de la casa.",
    family: "Tengo una hija adolescente. Siento que la estoy perdiendo o que ya no me escucha.",
    social: "Tengo algunas amigas, pero me da vergüenza contar que en la casa discutimos tanto.",
    videogames: "No juego videojuegos. El celular y las redes sí aparecen mucho en las peleas con mi hija.",
    habits: "Duermo liviano cuando quedamos peleadas. Me quedo pensando si fui demasiado dura.",
    preferences: "Me importa cuidar a mi hija. A veces eso sale como control, aunque no sea lo que quiero.",
    motive: "Vine por conflictos con mi hija adolescente. Me preocupa perder autoridad y también perder el vínculo.",
    concern: "Me da miedo que le pase algo o que deje de confiar en mí.",
    expectation: "Me gustaría entender cómo hablarle sin que todo termine en pelea."
  },
  miguel: {
    name: "Miguel",
    age: 32,
    school: "No, no voy al colegio. Llegué al país siendo adulto.",
    academic: "Estudié antes, pero acá mi formación no pesa igual. Eso me ha costado aceptar.",
    works: "Sí, trabajo. No es exactamente lo que hacía antes, pero por ahora me permite sostenerme.",
    family: "Parte de mi familia está lejos. Hablamos por teléfono, aunque no es lo mismo.",
    social: "Estoy armando vínculos de a poco. A veces cansa tener que explicar todo desde cero.",
    videogames: "No juego videojuegos. Uso mucho el teléfono para hablar con mi familia y mirar noticias de mi país.",
    habits: "Duermo mejor algunos días. Otros me quedo pensando en lo que dejé y en lo que falta.",
    preferences: "Me gusta sentir que avanzo. Migrar me hizo empezar otra vez desde un lugar más humilde.",
    motive: "Vine porque me ha costado adaptarme después de migrar. Trabajo, intento avanzar, pero a veces siento que empecé de cero.",
    concern: "Me preocupa perder partes de quién era antes o quedarme solo acá.",
    expectation: "Quisiera poder hablar de esto sin parecer ingrato, porque también valoro estar acá."
  },
  sofia: {
    name: "Sofía",
    age: 24,
    school: "No, ya salí del colegio. Ahora estudio y trabajo parcialmente.",
    academic: "Estudio y también trabajo algunas horas. El celular se me mete en todos los espacios.",
    works: "Trabajo algunas horas. A veces reviso redes incluso cuando debería estar concentrada.",
    family: "Mi familia no entiende mucho por qué me afecta tanto lo que veo en redes.",
    social: "Tengo amistades, pero también me comparo con ellas por lo que suben.",
    videogames: "No juego videojuegos. Mi tema es más redes sociales, mirar historias y compararme.",
    habits: "Me cuesta desconectarme. Puedo decir que voy a mirar cinco minutos y se me va mucho más.",
    preferences: "Me gustan las redes, no voy a mentir. El problema es que después quedo comparándome con todo.",
    motive: "Vine porque uso mucho las redes y me comparo todo el tiempo. Sé que me hace mal a ratos, pero igual vuelvo.",
    concern: "Me preocupa necesitar validación para sentir que estoy bien.",
    expectation: "Quisiera entender por qué me cuesta tanto soltar el celular aunque sepa que termino peor."
  },
  claudio: {
    name: "Claudio",
    age: 40,
    school: "No, no voy al colegio. Mi vida está bastante estable, al menos por fuera.",
    academic: "No estudio ahora. He pensado en tomar algo, pero siempre lo postergo.",
    works: "Sí, trabajo. Tengo estabilidad, pero siento que estoy en piloto automático.",
    family: "Mi familia me ve como alguien ordenado. No siempre muestro que me siento estancado.",
    social: "Tengo algunos amigos, pero nuestras conversaciones son más prácticas que personales.",
    videogames: "No juego videojuegos. A veces me pierdo en noticias o videos para no pensar en decisiones.",
    habits: "Tengo rutinas muy marcadas. Eso me ordena, pero también me encierra un poco.",
    preferences: "Me gusta analizar antes de decidir. El problema es que a veces analizo tanto que no hago nada.",
    motive: "Vine porque siento que estoy estancado. Tengo estabilidad, pero me cuesta tomar decisiones y cambiar algo.",
    concern: "Me preocupa mirar hacia atrás y sentir que elegí no moverme por miedo.",
    expectation: "Quisiera entender qué me frena, sin hacer cambios impulsivos."
  }
};

const concreteProgressionByCase = {
  tomas: {
    temaCentral: "videojuegos, encierro, conflicto familiar y dificultad para estar con otros en persona",
    concreteDisclosures: [
      "Mis papás dicen que juego mucho y que casi no salgo. Yo siento que ven solo esa parte.",
      "En persona me cuesta saber qué decir. A veces prefiero quedarme callado antes de quedar raro.",
      "En el computador siento que tengo un lugar más claro. Afuera me cuesta más saber cómo actuar.",
      "En mi casa todo termina en discusión por el computador, entonces me cierro más."
    ],
    validationBridge: "Gracias por decirlo así. Me ayuda que no partas pensando que todo es culpa del computador.",
    followUpBridge: "Creo que lo que trato de decir es que no juego solo por jugar.",
    concreteConcern: "Me preocupa que todos crean que el problema soy yo o el computador, cuando también me cuesta estar con gente."
  },
  valentina: {
    temaCentral: "sobrecarga universitaria, autoexigencia, culpa al descansar y miedo a decepcionar",
    concreteDisclosures: [
      "Me cuesta parar. Si descanso, siento culpa, como si estuviera perdiendo tiempo.",
      "Siento que debería poder con todo, aunque por dentro esté agotada.",
      "Mi cabeza sigue haciendo listas incluso cuando trato de descansar.",
      "Me da miedo decepcionar a mi familia o que se note que no soy tan capaz."
    ],
    validationBridge: "Gracias. Me ayuda que no lo pongas como simple falta de organización.",
    followUpBridge: "Creo que lo que me cuesta decir es que no puedo apagar la cabeza.",
    concreteConcern: "Me preocupa bajar el ritmo y sentir que estoy fallando."
  },
  marcos: {
    temaCentral: "estres laboral, cansancio, irritabilidad y perdida de sentido",
    concreteDisclosures: [
      "Llego a la casa sin energía y a veces respondo más corto de lo que quisiera.",
      "Sigo cumpliendo en la pega, pero por dentro me siento apagado.",
      "Me irrito con cosas pequeñas y después me da culpa.",
      "Antes mi trabajo tenía más sentido. Ahora muchas veces solo hago lo que toca."
    ],
    validationBridge: "Gracias. Me sirve que no lo tomes como falta de ganas.",
    followUpBridge: "Lo que me preocupa es que sigo funcionando, pero cada vez con menos paciencia.",
    concreteConcern: "Me preocupa llegar a la casa sin paciencia y que mi familia reciba lo peor de mí."
  },
  elena: {
    temaCentral: "soledad, dificultad para pedir ayuda, rol de cuidadora y miedo a ser carga",
    concreteDisclosures: [
      "Me cuesta pedir ayuda. Siento que molesto, aunque nadie me lo diga así.",
      "No quiero preocupar a mis hijos, entonces guardo más de lo que cuento.",
      "Siempre he sido yo la que sostiene a todos, y ahora no sé bien cómo pedir compañía.",
      "A veces me pregunto qué queda para mí cuando ya no todos me necesitan igual."
    ],
    validationBridge: "Gracias. Me alivia que no suene como que estoy culpando a nadie.",
    followUpBridge: "Creo que me cuesta hablar de mí sin pensar primero en los demás.",
    concreteConcern: "Me preocupa ser una carga o necesitar más compañía de la que me atrevo a pedir."
  },
  nicolas: {
    temaCentral: "derivacion escolar, baja participacion, silencio y sensacion de no ser escuchado",
    concreteDisclosures: [
      "Me mandaron del colegio. Dicen que estoy más callado y que bajé las notas.",
      "Siento que ya tienen una idea hecha de mí antes de preguntarme.",
      "Prefiero quedarme piola, así no tengo que explicar todo ni meterme en problemas.",
      "No es que no tenga nada que decir. A veces siento que igual no vale la pena."
    ],
    validationBridge: "Ya... gracias. Me ayuda que no suene como otro reto.",
    followUpBridge: "Creo que lo que pasa es que me cuesta hablar cuando siento que ya decidieron por mí.",
    concreteConcern: "Me preocupa que los adultos crean que soy flojo o raro sin escuchar mucho más."
  },
  camila: {
    temaCentral: "limites, culpa, cansancio emocional y disponibilidad para otros",
    concreteDisclosures: [
      "Me cuesta decir que no. A veces digo que sí antes de pensar si realmente puedo.",
      "Siento culpa cuando no estoy disponible para mi familia o para alguien que me necesita.",
      "Termino cansada porque resuelvo cosas de otros incluso después del trabajo.",
      "Me da miedo que si pongo límites piensen que soy egoísta o que ya no pueden contar conmigo."
    ],
    validationBridge: "Gracias. Me ayuda que no lo mires como si fuera solo falta de carácter.",
    followUpBridge: "Creo que me cuesta reconocer que ayudar también me está agotando.",
    concreteConcern: "Me preocupa empezar a decir que no y que los demás se molesten conmigo."
  },
  rodrigo: {
    temaCentral: "separacion reciente, reorganizacion familiar, rol de padre y tristeza contenida",
    concreteDisclosures: [
      "Desde la separación trato de mantener todo funcionando, sobre todo por mis hijos.",
      "Me hago el fuerte, pero hay días en que la casa se siente distinta y me pesa.",
      "Me preocupa que mis hijos me vean mal o que sientan que fallé.",
      "No hablo mucho de tristeza. Prefiero resolver cosas, aunque por dentro esté revuelto."
    ],
    validationBridge: "Gracias. Me sirve que lo puedas mirar sin exigirme estar fuerte todo el rato.",
    followUpBridge: "Creo que me cuesta admitir cuánto me movió la separación.",
    concreteConcern: "Me preocupa fallar como papá o no saber cómo ordenar esta nueva vida familiar."
  },
  fernanda: {
    temaCentral: "retorno laboral, inseguridad, temor a ser observada y confianza dañada",
    concreteDisclosures: [
      "Estoy volviendo al trabajo después de una licencia larga y me da miedo no rendir como antes.",
      "Siento que todos van a mirar si ya estoy bien o si sigo distinta.",
      "Me importa trabajar, pero me asusta confirmar que no puedo con el mismo ritmo.",
      "A veces anticipo críticas antes de que pasen, y llego tensa incluso antes de empezar."
    ],
    validationBridge: "Gracias. Me ayuda que no suene como que simplemente no quiero trabajar.",
    followUpBridge: "Creo que lo difícil es volver sintiendo que todos podrían estar evaluándome.",
    concreteConcern: "Me preocupa sentirme observada y no poder confiar en mí como antes."
  },
  hector: {
    temaCentral: "jubilacion, perdida de rutina, identidad y necesidad de sentirse util",
    concreteDisclosures: [
      "Jubilé hace poco y pensé que iba a ser más simple, pero a veces el día se siente vacío.",
      "Me levanto temprano igual, solo que ahora no siempre sé para qué.",
      "Gran parte de mis vínculos estaban en el trabajo y eso cambió de golpe.",
      "Me cuesta aceptar que ya no me necesiten de la misma forma."
    ],
    validationBridge: "Gracias. Me ayuda que no lo trates como si fuera solo tener más tiempo libre.",
    followUpBridge: "Creo que lo que se me movió fue sentirme útil.",
    concreteConcern: "Me preocupa perder el lugar que tenía o que me miren como alguien que ya no aporta."
  },
  daniela: {
    temaCentral: "maternidad reciente, estudio, cansancio, culpa y autocuidado",
    concreteDisclosures: [
      "Amo a mi hijo, pero estoy cansada y me cuesta decirlo sin sentir culpa.",
      "Entre estudiar y cuidar, el día se me va completo y casi no queda un rato para mí.",
      "Cuando pienso en descansar o avanzar en mis cosas, aparece la sensación de estar fallando.",
      "A veces siento que mi vida va a otro ritmo que la de mis amigas."
    ],
    validationBridge: "Gracias. Me ayuda que no suene como que soy mala mamá por estar cansada.",
    followUpBridge: "Creo que lo que me cuesta decir es que también necesito un espacio para mí.",
    concreteConcern: "Me preocupa ser egoísta cuando pienso en mis proyectos o en descansar."
  },
  andres: {
    temaCentral: "ingreso universitario, pertenencia, comparacion y presion familiar",
    concreteDisclosures: [
      "Entré hace poco a la universidad y siento que todos se manejan mejor que yo.",
      "Mi familia está orgullosa, y eso me alegra, pero también me pesa.",
      "A veces trato de parecer tranquilo para que no se note que estoy perdido.",
      "Me comparo mucho y termino pensando que quizá no estoy a la altura."
    ],
    validationBridge: "Gracias. Me ayuda que no lo tomes como si fuera solo inseguridad mía.",
    followUpBridge: "Creo que lo que me cuesta es sentir que pertenezco ahí.",
    concreteConcern: "Me preocupa decepcionar a mi familia o confirmar que estoy fuera de lugar."
  },
  patricia: {
    temaCentral: "conflicto con hija adolescente, autoridad, miedo y vinculo familiar",
    concreteDisclosures: [
      "Tengo una hija adolescente y últimamente todo entre nosotras termina en pelea.",
      "A veces salgo controladora, pero detrás hay miedo de perder el vínculo con ella.",
      "Me preocupa que deje de confiar en mí o que le pase algo y yo no me entere.",
      "Llego cansada del trabajo y aun así siento que tengo que estar encima de todo en la casa."
    ],
    validationBridge: "Gracias. Me ayuda que no lo veas solo como ganas de controlar.",
    followUpBridge: "Creo que detrás de mi enojo hay mucho miedo.",
    concreteConcern: "Me preocupa perder autoridad, pero también perder el vínculo con mi hija."
  },
  miguel: {
    temaCentral: "migracion, adaptacion, identidad, distancia familiar y empezar de cero",
    concreteDisclosures: [
      "Migré hace poco y a veces siento que estoy empezando de cero.",
      "Trabajo en algo distinto a lo que hacía antes, y eso me mueve más de lo que digo.",
      "Parte de mi familia está lejos. Hablamos, pero no es lo mismo.",
      "No quiero sonar ingrato, porque valoro estar acá, pero igual extraño quién era antes."
    ],
    validationBridge: "Gracias. Me ayuda poder decirlo sin sentir que parezco ingrato.",
    followUpBridge: "Creo que lo difícil es armar vida acá sin perder lo que dejé atrás.",
    concreteConcern: "Me preocupa quedarme solo o perder partes de quién era antes de migrar."
  },
  sofia: {
    temaCentral: "redes sociales, comparacion, autoimagen y necesidad de reaccion externa",
    concreteDisclosures: [
      "Me comparo más de lo que me gustaría admitir, sobre todo cuando veo redes.",
      "Quedo pendiente de si alguien reacciona o no a lo que subo.",
      "Sé que no debería importarme tanto, pero igual me afecta.",
      "Puedo estar bien, entro a redes y termino sintiendo que mi vida no alcanza."
    ],
    validationBridge: "Gracias. Me ayuda que no lo tomes como algo tonto.",
    followUpBridge: "Creo que lo que me cuesta decir es que las redes me importan más de lo que aparento.",
    concreteConcern: "Me preocupa depender tanto de algo que sé que no debería importarme así."
  },
  claudio: {
    temaCentral: "estancamiento vital, rutina rigida, analisis excesivo y miedo al cambio",
    concreteDisclosures: [
      "Tengo una vida estable, pero siento que estoy en piloto automático.",
      "Analizo tanto las decisiones que al final no hago nada.",
      "La rutina me ordena, pero también me encierra un poco.",
      "Me preocupa mirar atrás y darme cuenta de que no me moví por miedo."
    ],
    validationBridge: "Gracias. Me ayuda que no suene como que estoy inventando un problema donde todo se ve estable.",
    followUpBridge: "Creo que lo que me pasa es que por fuera todo funciona, pero por dentro me siento detenido.",
    concreteConcern: "Me preocupa quedarme en lo mismo solo porque cambiar me da miedo."
  }
};

for (const [caseId, progression] of Object.entries(concreteProgressionByCase)) {
  Object.assign(patientFacts[caseId], progression);
}

for (const caseId of Object.keys(patientFacts)) {
  const biography = getAvatarCanonicalBiography(caseId);
  if (!biography) continue;

  Object.assign(patientFacts[caseId], {
    name: biography.identity.preferredName,
    age: biography.identity.age,
    school: buildCanonicalSchoolFact(biography),
    academic: buildCanonicalAcademicFact(biography),
    works: buildCanonicalWorkFact(biography),
    family: buildCanonicalFamilyFact(biography),
    social: buildCanonicalSocialFact(biography),
    habits: biography.dailyLife.sleep,
    preferences: buildCanonicalPreferencesFact(biography),
    motive: biography.consultation.immediateReason,
    concern: biography.consultation.concerns || biography.internalConflict,
    expectation: biography.consultation.expectations,
    canonicalProgram: biography.education.program,
    canonicalInstitution: biography.education.institution,
    canonicalWorkplace: biography.employment.employer,
    canonicalRole: biography.employment.role
  });
}

function buildCanonicalSchoolFact(biography) {
  if (/universitaria|universitario|ensenanza|escolar/i.test(biography.education.status || "")) {
    return biography.education.institution
      ? `Estudio ${biography.education.program} en ${biography.education.institution}.`
      : `Estoy en ${biography.education.program || biography.education.status}.`;
  }
  return "No estudio actualmente.";
}

function buildCanonicalAcademicFact(biography) {
  if (!biography.education.program || /^no cursa/i.test(biography.education.status || "")) {
    return biography.education.academicHistory || "No estudio actualmente.";
  }
  const institution = biography.education.institution ? ` en ${biography.education.institution}` : "";
  const progress = [biography.education.year, biography.education.semester].filter(Boolean).join(", ");
  return `Estudio ${biography.education.program}${institution}${progress ? `. Voy en ${progress}` : ""}.`;
}

function buildCanonicalWorkFact(biography) {
  if (/sin empleo formal/i.test(biography.employment.status || "")) {
    return biography.employment.role && biography.employment.role !== "sin empleo formal"
      ? `No tengo empleo formal; principalmente soy ${biography.employment.role}.`
      : "No trabajo formalmente.";
  }
  const employer = biography.employment.employer ? ` en ${biography.employment.employer}` : "";
  return `Trabajo como ${biography.employment.role}${employer}.`;
}

function buildCanonicalFamilyFact(biography) {
  const home = biography.identity.livingWith?.length
    ? `Vivo con ${biography.identity.livingWith.join(", ")}.`
    : "";
  return `${home} ${biography.family.familyRole || ""}`.trim();
}

function buildCanonicalSocialFact(biography) {
  const support = biography.relationships.supportNetwork || [];
  return support.length ? `Cuento con ${support.join(", ")}.` : "Tengo algunas personas cercanas.";
}

function buildCanonicalPreferencesFact(biography) {
  const hobbies = biography.interests.hobbies || [];
  return hobbies.length ? `Me gusta ${hobbies.join(", ")}.` : biography.interests.technologyUse;
}
