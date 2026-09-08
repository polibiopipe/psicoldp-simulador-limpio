// Dialogue wording for the canonical facts. Keep names, events and quantities
// aligned with avatarCanonicalBiographies; these lines add no new backstory.
const keys = ["routine", "weekend", "sleep", "eating", "caffeine", "exercise", "reason", "expectation", "relationalPattern", "internalConflict", "stakes"];
const lines = {
  tomas: [
    "Voy al colegio, vuelvo a casa, hago las tareas pendientes y juego online por la tarde o noche.",
    "Duermo más y juego con amigos online. Evito las salidas familiares si creo que vamos a discutir.",
    "Duermo entre seis y siete horas. Me acuesto tarde cuando juego o veo videos.",
    "Como en casa. A veces ceno rápido para volver a mi pieza.", "Tomo bebida cola de vez en cuando.", "Camino al colegio, pero casi no hago deporte.",
    "Discutimos en casa por el computador. También tengo que decidir si estudiar una carrera técnica o trabajar después del colegio.",
    "Espero que no me reten y que entiendan que el computador no explica todo.",
    "Cuando me siento juzgado, me retiro y hablo poco. Me cuesta menos hablar si entienden lo que significa jugar para mí, sin tanta presión.",
    "Quiero demostrar que puedo ser autónomo, pero temo fracasar en persona, donde no controlo las reglas sociales.",
    "Si esto sigue, puedo aislarme más, perder la confianza de mi familia y quedarme paralizado frente a la vida adulta."
  ],
  valentina: [
    "Me levanto cerca de las 6:15 y tomo el bus a las 7:05. Llego a Talca antes de las 8:30, tengo clases hasta la tarde y me quedo en biblioteca. Vuelvo entre las 18:00 y las 19:00, ceno y estudio hasta cerca de la 1:00.",
    "Intento adelantar trabajos y duermo algo más, pero suelo sentirme culpable si descanso.",
    "Duermo entre cinco y seis horas en la semana. Antes de las evaluaciones me cuesta quedarme dormida.",
    "Desayuno rápido y a veces postergo el almuerzo cuando tengo trabajos.", "Tomo dos o tres cafés diarios. En períodos de prueba puedo tomar una bebida energética.", "Antes caminaba o hacía rutinas breves en casa. Este semestre casi no hago ejercicio.",
    "Me saqué un 4,7 en Métodos de Investigación II. Me quedé revisando la prueba y la pauta durante horas, no dormí y cancelé una salida.",
    "Quiero ordenarme y aprender a rendir mejor.",
    "Intento mostrarme ordenada y explicar todo sin preocupar a otros. Hasta el cansancio termino tratándolo como otra tarea que tengo que resolver.",
    "Quiero sostener mi proyecto académico, pero siento que descansar significa perder valor o decepcionar.",
    "Si sigo así, puedo agotarme más y alejarme de mis amigas. Me cuesta dejar de pensar que solo valgo cuando rindo."
  ],
  marcos: [
    "Trabajo, reviso los correos pendientes y vuelvo al departamento con poca energía para conversar.", "Hago compras, descanso algo y reviso pendientes del trabajo si siento presión.", "Duermo, pero despierto cansado y pensando en pendientes.", "Almuerzo rápido y llego con poco apetito cuando estoy muy estresado.", "Tomo dos cafés diarios, a veces más en cierre de mes.", "Antes jugaba fútbol de vez en cuando. Ahora casi nada.",
    "Respondí muy mal a una pregunta cotidiana de Paula. Desde el cambio de jefatura también asumí las tareas de un compañero que salió de la empresa.", "Quiero entender por qué estoy tan corto de paciencia.",
    "Intento resolver todo y le quito importancia a mi cansancio. Si siento que me acusan, me cierro.", "Quiero seguir siendo competente, pero siento que el trabajo consume mi vida en casa.", "Puedo deteriorar mi relación de pareja y quedarme solo cumpliendo, sin disfrutar."
  ],
  elena: [
    "Trabajo algunas horas, hago compras, ordeno la casa y espero llamadas de mi familia.", "Visito a mi madre o cocino para mis hijos cuando pasan.", "Me despierto en la noche cuando estoy preocupada por la familia.", "Como ordenado, pero a veces sin ganas cuando estoy sola.", "Tomo café de vez en cuando.", "Hago poca actividad física y de forma irregular.",
    "En una reunión familiar descubrí que todos sabían una decisión de mi hijo menos yo. Me sentí desplazada.", "Quiero poder hablar sin preocupar a mis hijos.",
    "Me sale cuidar a los demás. Evito pedir y termino hablando de ellos antes que de mí.", "Me alegra que mis hijos sean autónomos, pero temo dejar de ser necesaria.", "Puedo quedarme aislada, callada y guardándome el resentimiento."
  ],
  nicolas: [
    "Voy a clases, vuelvo a casa y evito hablar mucho de lo que voy a hacer después.", "Descanso, miro videos y postergo las decisiones sobre postulaciones.", "Duermo de forma irregular cuando me preocupo por el colegio.", "Como en casa, sin cambios importantes.", "Tomo café de vez en cuando.", "Hago poca actividad física y de forma irregular.",
    "Me mandaron del colegio porque participo menos y bajé el rendimiento. No entregué una postulación importante y citaron a mi familia.", "Espero que no sea otro reto por las notas.",
    "Respondo corto y me quedo callado. Si siento que es un interrogatorio, me cierro más.", "Quiero que dejen de presionarme, pero temo quedarme paralizado y perder oportunidades.", "Puedo perder oportunidades después del colegio y sentir aún más que no estoy preparado."
  ],
  camila: [
    "Trabajo, respondo mensajes de mi familia y suelo resolver favores después del horario laboral.", "Visito a mi familia, hago compras y postergo mis propias actividades.", "Duermo seis horas y reviso mensajes antes de acostarme.", "Como en horarios irregulares cuando estoy ayudando a otros.", "Tomo un café al día.", "Salgo a caminar de vez en cuando.",
    "Cancelé por tercera vez una actividad personal para ayudar a mi hermano. Sentí rabia y después mucha culpa.", "Quiero entender cómo cuidarme sin sentirme egoísta.",
    "Me adelanto a resolver, pido poco y hasta me disculpo cuando hablo de lo que necesito.", "Quiero tener vida propia, pero temo que poner límites sea egoísta.", "Puedo agotarme y empezar a resentir relaciones que también valoro."
  ],
  rodrigo: [
    "Trabajo y me coordino con mi expareja para estar con mis hijos según el calendario.", "Hago actividades con mis hijos o trámites de la casa.", "Duermo de forma irregular desde la separación.", "Como a deshoras cuando estoy solo.", "Tomo café de vez en cuando.", "Hago poca actividad física y de forma irregular.",
    "Uno de mis hijos me preguntó por qué parecía triste. La separación cambió mi casa, mis rutinas y la convivencia con ellos.", "Quiero ordenar lo que me pasa sin desarmarme frente a mis hijos.",
    "Intento resolver y proteger a los demás. Hablo poco de lo que perdí para no preocuparlos.", "Quiero proteger a mis hijos, pero necesito reconocer una pérdida que no puedo resolver solo con horarios.", "Puedo quedarme atrapado organizando todo sin hacerme cargo de lo que me pasa con la separación."
  ],
  fernanda: [
    "Preparo mi retorno, reviso correos y anticipo las preguntas de mis compañeros.", "Descanso en casa y evito hablar demasiado del trabajo.", "Duermo con interrupciones antes de los días laborales.", "Mi apetito cambia cuando estoy ansiosa.", "Tomo café de vez en cuando.", "Hago poca actividad física y de forma irregular.",
    "Recibí el correo que confirma mi retorno al trabajo. Empecé a imaginar críticas, errores y preguntas de mis compañeros.", "Quiero hablar de esto sin que suene a que no quiero trabajar.",
    "Intento ser cuidadosa y anticipo cómo me van a evaluar. Evito pedir ajustes para no parecer incapaz.", "Quiero recuperar mi trabajo, pero temo confirmar que ya no soy tan capaz como antes.", "Puedo volver demasiado pendiente de todo y perder aún más confianza en mi trabajo."
  ],
  hector: [
    "Me levanto temprano, leo las noticias, camino un poco y busco cosas que hacer.", "Visito a mi familia o arreglo cosas de la casa.", "Me despierto temprano aunque ya no tenga la obligación.", "Como en casa con horarios ordenados.", "Tomo café de vez en cuando.", "Hago poca actividad física y de forma irregular.",
    "Visité mi antiguo trabajo y varias personas nuevas no sabían quién era. Desde que jubilé me cuesta encontrar una rutina.", "Quiero encontrar una rutina que tenga sentido.",
    "Me cuesta necesitar a otros. Me incomoda que me traten como si fuera frágil.", "Esperaba descansar, pero temo que dejar de trabajar sea dejar de importar.", "Puedo encerrarme, perder mi rutina y vivir la jubilación sintiendo que ya no sirvo."
  ],
  daniela: [
    "Llevo a Mateo al jardín, voy a clases o estudio cuando puedo. Cocino y termino ordenando tarde.", "Lavo, hago compras y tareas, y paso algo de tiempo con mi hijo.", "Duermo poco y cortado.", "Como a saltos entre las tareas y el cuidado de mi hijo.", "Tomo café de vez en cuando.", "Hago poca actividad física y de forma irregular.",
    "Me quedé dormida preparando una evaluación y olvidé una actividad de mi hijo. Sentí que había fallado en ambos lados.", "Quiero poder decir que estoy cansada sin sentirme mala madre.",
    "Me exijo mucho y me culpo. Pido ayuda recién cuando ya estoy muy sobrepasada.", "Quiero ser una madre presente y terminar mi carrera, pero siento que atender una cosa es abandonar la otra.", "Puedo terminar abandonando mis proyectos o viviendo la maternidad solo desde la culpa."
  ],
  andres: [
    "Voy a clases y a la biblioteca. El traslado es largo y después sigo estudiando en casa.", "Ayudo en casa y estudio para ponerme al día.", "Duermo de forma irregular cuando tengo pruebas.", "Como en el casino cuando alcanzo y ceno en casa.", "Tomo café de vez en cuando.", "Hago poca actividad física y de forma irregular.",
    "En un trabajo grupal no entendí una referencia que mis compañeros daban por obvia. Me sentí expuesto y fuera de lugar.", "Quiero entender si esto les pasa a otros o si estoy fuera de lugar.",
    "Observo e intento parecer tranquilo. Evito pedir ayuda porque me da miedo confirmar que no pertenezco aquí.", "Estoy orgulloso de haber llegado, pero temo ocupar un lugar para el que no estoy preparado.", "Puedo aislarme y dejar de pedir apoyo en la universidad por vergüenza."
  ],
  patricia: [
    "Trabajo, vuelvo a casa y reviso que Isidora esté bien. Terminamos discutiendo si no responde.", "Hago compras, me ocupo de la casa y a veces visito a la familia.", "Duermo liviano cuando quedo peleada con mi hija.", "Como en horarios regulares.", "Tomo café de vez en cuando.", "Hago poca actividad física y de forma irregular.",
    "Mi hija llegó tarde y no respondió el teléfono durante una hora. Discutimos y me dijo que no confío en ella.", "Quiero entender cómo hablarle sin que todo termine en pelea.",
    "Cuando tengo miedo intento controlar todo. Después me siento culpable por la distancia que genero.", "Quiero cuidar a mi hija y nuestra relación, pero mis intentos de control nos están alejando.", "Puedo deteriorar la confianza con mi hija y que discutamos cada vez más."
  ],
  miguel: [
    "Trabajo, cocino algo simple, llamo a mi familia y reviso trámites.", "Hago compras, descanso y hablo con mi familia a distancia.", "Algunas noches duermo bien y otras me quedo pensando en lo que dejé.", "Cocino cosas simples. A veces me salto comidas cuando estoy cansado.", "Tomo café de vez en cuando.", "Hago poca actividad física y de forma irregular.",
    "Reconocieron a un compañero por una idea que yo había planteado antes. Sentí que mi voz no pesa igual desde que migré.", "Quiero hablar sin parecer ingrato.",
    "Intento ser respetuoso y no quejarme. Me esfuerzo por adaptarme aunque me duela el lugar que perdí.", "Quiero construir una vida nueva, pero temo que adaptarme sea borrar quién era antes.", "Puedo aislarme y sentir que no pertenezco ni aquí ni allá."
  ],
  sofia: [
    "Voy a clases, hago turnos parciales y uso mucho las redes entre actividades.", "Me junto con amigas o trabajo. Reviso las redes más de lo que quisiera.", "Me duermo tarde si me quedo mirando las redes.", "Como normal, aunque a veces comparo mi cuerpo con lo que veo online.", "Tomo café de vez en cuando.", "Hago poca actividad física y de forma irregular.",
    "Publiqué un logro y recibí menos reacciones de las que esperaba. Borré la publicación y pasé horas comparándome.", "Quiero entender por qué me cuesta soltar el celular.",
    "Hago bromas y digo que es superficial antes de que lo diga otro. Me cuesta reconocer cuánto me afecta.", "Disfruto conectarme, pero temo depender de las reacciones de otros para sentir que soy suficiente.", "Puedo seguir midiendo mi valor por la aprobación online y perder de vista lo que yo quiero."
  ],
  claudio: [
    "Trabajo, hago compras pequeñas y mantengo la casa ordenada. Mi rutina se repite bastante.", "Camino, leo noticias y voy postergando decisiones.", "Duermo, pero despierto con poca vitalidad.", "Como de forma ordenada, casi siempre lo mismo.", "Tomo café de vez en cuando.", "Hago poca actividad física y de forma irregular.",
    "Dejé vencer una oportunidad laboral mientras analizaba los riesgos. Después sentí alivio y arrepentimiento.", "Quiero entender qué me frena sin hacer cambios impulsivos.",
    "Analizo todo e intento mantener el control. Me cuesta exponerme emocionalmente, pero las preguntas concretas y respetuosas me ayudan a hablar.", "Valoro mi estabilidad, pero temo usarla para no exponerme a vivir, relacionarme o equivocarme.", "Puedo seguir llevando una vida que funciona, pero cada vez más lejos de lo que deseo."
  ]
};

const openingReasons = {
  tomas: "Mis padres insistieron en que viniera. Dicen que paso mucho tiempo en el computador y estamos discutiendo por eso.",
  valentina: "Me siento sobrepasada por la universidad. Estudio Psicología y me está costando manejar todo.",
  marcos: "Estoy cansado e irritable. Trabajo como coordinador y vivo con Paula.",
  elena: "Me siento sola. Mis hijos ya son adultos y vivo sola la mayor parte del tiempo.",
  nicolas: "Me mandaron del colegio porque participo menos. Estoy en cuarto medio.",
  camila: "Ayudo mucho a mi familia y me cuesta decir que no. Me está costando encontrar tiempo para mí.",
  rodrigo: "Estoy separado y me está costando acostumbrarme. Vivo solo y soy padre.",
  fernanda: "Estoy volviendo al trabajo y me preocupa sentirme observada.",
  hector: "Estoy jubilado y me cuesta acostumbrarme a la nueva rutina.",
  daniela: "Estoy cansada. Estudio, tengo un hijo y me está costando compatibilizar todo.",
  andres: "Estoy en primer año de Ingeniería Comercial y me siento fuera de lugar.",
  patricia: "Estoy preocupada por las discusiones con mi hija. Vivimos juntas.",
  miguel: "Desde que migré estoy intentando armar mis redes. Trabajo y vivo solo.",
  sofia: "Uso mucho las redes y termino comparándome. Estudio Comunicación Digital.",
  claudio: "Siento que estoy en piloto automático. Vivo solo y tengo un trabajo estable."
};

export const patientConversationLines = Object.freeze(Object.fromEntries(
  Object.entries(lines).map(([id, values]) => [id, Object.freeze({ ...Object.fromEntries(keys.map((key, i) => [key, values[i]])), openingReason: openingReasons[id] })])
));
