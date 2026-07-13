import { patientFacts } from "../data/patientFacts.js";
import { getGuidedInterventionType, resolveConversationStage } from "../data/guidedConversation.js";
import { normalizeText } from "../utils/textUtils.js";

const acknowledgementByCase = {
  tomas: "Ya... gracias.",
  valentina: "Gracias. Me ayuda poder ordenarlo con calma.",
  marcos: "Gracias. Me sirve que lo plantees asi.",
  elena: "Muchas gracias. Me tranquiliza que podamos conversar con calma.",
  nicolas: "Ya. Mientras no sea como un reto, esta bien.",
  camila: "Gracias. Me ayuda que podamos ir de a poco.",
  rodrigo: "Gracias. Me sirve saber como va a funcionar.",
  fernanda: "Gracias. Me tranquiliza hacerlo con calma.",
  hector: "Bueno, entiendo.",
  daniela: "Gracias. Me ayuda saber que no tengo que resolver todo hoy.",
  andres: "Ya, gracias. Me sirve que lo expliques asi.",
  patricia: "Gracias. Me parece bien partir asi.",
  miguel: "Gracias. Me ayuda saber que podemos conversar con calma.",
  sofia: "Gracias. Me ayuda que no suene como reto.",
  claudio: "Esta bien. Me acomoda partir ordenadamente."
};

const simpleGreetingByCase = {
  tomas: ["Hola...", "Hola. No se muy bien que decir, pero estoy aqui."],
  valentina: ["Hola, gracias.", "Hola. Me parece bien conversar."],
  marcos: ["Hola.", "Hola. Podemos conversar."],
  elena: ["Hola, muchas gracias.", "Hola. Podemos conversar."],
  nicolas: ["Hola.", "Ya... hola."],
  camila: ["Hola. Gracias.", "Hola. Podemos conversar."],
  rodrigo: ["Hola.", "Hola. Podemos partir."],
  fernanda: ["Hola, gracias.", "Hola. Podemos empezar con calma."],
  hector: ["Hola.", "Bueno, hola."],
  daniela: ["Hola. Gracias por recibirme.", "Hola. Podemos conversar."],
  andres: ["Hola.", "Hola, gracias."],
  patricia: ["Hola. Si, podemos conversar.", "Hola. Gracias."],
  miguel: ["Hola. Muchas gracias.", "Hola. Podemos conversar."],
  sofia: ["Hola...", "Hola. Gracias."],
  claudio: ["Hola. Esta bien, podemos empezar.", "Hola. Podemos conversar."]
};

const framingByCase = {
  tomas: ["Ya... me sirve saberlo.", "Ya. Esta bien saber como funciona esto."],
  valentina: ["Gracias. Me ayuda que lo expliques asi.", "Gracias. Me sirve partir con un poco de orden."],
  marcos: ["Gracias. Me sirve que lo plantees asi.", "Esta bien. Me ayuda saber que no hay que resolver todo ahora."],
  elena: ["Muchas gracias. Me tranquiliza que podamos conversar con calma.", "Gracias. Me sirve saberlo antes de partir."],
  nicolas: ["Ya. Mientras no sea como un reto, esta bien.", "Ya... esta bien saberlo."],
  camila: ["Gracias. Me ayuda que podamos ir de a poco.", "Gracias. Me sirve saber que puedo partir con calma."],
  rodrigo: ["Gracias. Me sirve saber como va a funcionar.", "Esta bien. Me ayuda ordenar un poco el espacio."],
  fernanda: ["Gracias. Me tranquiliza hacerlo con calma.", "Gracias. Me sirve que lo expliques antes."],
  hector: ["Bueno, entiendo.", "Esta bien. Me sirve saberlo."],
  daniela: ["Gracias. Me ayuda saber que no tengo que resolver todo hoy.", "Gracias. Me sirve que lo digas asi."],
  andres: ["Ya, gracias. Me sirve que lo expliques asi.", "Gracias. Me ayuda partir con calma."],
  patricia: ["Gracias. Me parece bien partir asi.", "Gracias. Me ayuda que lo aclares."],
  miguel: ["Gracias. Me ayuda saber que podemos conversar con calma.", "Gracias. Me sirve entender el espacio."],
  sofia: ["Gracias. Me ayuda que no suene como reto.", "Ya. Me sirve que lo digas asi."],
  claudio: ["Esta bien. Me acomoda partir ordenadamente.", "Esta bien. Me sirve saber como va a ser."]
};

const validationBriefByCase = {
  tomas: "Gracias. Me ayuda que no suene como un reto.",
  valentina: "Gracias. Me ayuda que no lo tomes como una falla mia.",
  marcos: "Gracias. Me sirve que no lo tomes como falta de ganas.",
  elena: "Gracias. Me alivia que podamos hablarlo sin apuro.",
  nicolas: "Ya... gracias. Me ayuda que no sea otro reto.",
  camila: "Gracias. Me ayuda que no parezca que soy mala persona por cansarme.",
  rodrigo: "Gracias. Me sirve que no tenga que hacerme el fuerte todo el rato.",
  fernanda: "Gracias. Me ayuda que no suene como que no quiero volver a trabajar.",
  hector: "Gracias. Me sirve que no lo mires como solo tener mas tiempo libre.",
  daniela: "Gracias. Me ayuda saber que no tengo que resolver todo hoy.",
  andres: "Gracias. Me ayuda que no lo veas como una tontera.",
  patricia: "Gracias. Me ayuda que no lo veas solo como ganas de controlar.",
  miguel: "Gracias. Me ayuda poder decirlo sin sentir que parezco ingrato.",
  sofia: "Gracias. Me ayuda que no suene como un reto.",
  claudio: "Gracias. Me ayuda que no suene como que estoy inventando un problema."
};

const explicitFollowUpByCase = {
  tomas: "Que mis papas creen que todo es por el computador, pero no es solo eso. A veces me voy a jugar porque me siento pasado a llevar o porque no se como decir lo que me pasa.",
  valentina: "Que no es solo estar cansada. Es como si incluso cuando paro siguiera sintiendo que deberia estar haciendo algo.",
  marcos: "Que no es solo cansancio fisico. Es como si llegara sin paciencia para nada, incluso para la gente que quiero.",
  elena: "Que no es solo estar sola. Es que me cuesta pedir compania sin sentir que estoy molestando.",
  nicolas: "Que no es solo que este callado. Siento que muchas veces ya decidieron que pasa conmigo antes de escucharme.",
  camila: "Que no es solo estar ocupada. Es que digo que si aunque por dentro ya no tenga energia para seguir disponible.",
  rodrigo: "Que no es solo separarme. Es tratar de seguir siendo papa, trabajador y estar bien, aunque por dentro todavia me mueva.",
  fernanda: "Que no es solo volver al trabajo. Es sentir que todos van a mirar si todavia puedo rendir como antes.",
  hector: "Que no es solo tener mas tiempo libre. Es que sin la rutina del trabajo a veces no se bien donde ponerme.",
  daniela: "Que siento que no deberia cansarme tanto, como si descansar fuera fallarle a los demas.",
  andres: "Que no es solo entrar a la universidad. Es sentir que estoy ahi, pero todavia mirando desde afuera.",
  patricia: "Que no es solo querer controlar. Es miedo a perder el vinculo con mi hija y no saber como acercarme sin pelear.",
  miguel: "Que no es solo vivir en otro pais. Es tener que empezar de nuevo y al mismo tiempo extranar quien era antes.",
  sofia: "Que no es solo dejar de mirar o dejar de compararme. Es que despues me quedo pensando en eso mucho mas de lo que quisiera.",
  claudio: "Que no es solo aburrimiento. Por fuera mi vida esta ordenada, pero siento que llevo tiempo viviendo en automatico."
};

const guidedCompositeOpenQuestionByCase = {
  tomas: "Ya... me sirve saberlo. Me gustaria que entendieras que no es solo que juego mucho; tambien me cuesta estar con gente en persona.",
  valentina: "Gracias. Me ayuda que lo expliques asi. Me gustaria que entendieras que estoy cansada de exigirme todo el tiempo y que descansar me da culpa.",
  marcos: "Gracias. Me sirve que lo plantees asi. Me gustaria que entendieras que sigo funcionando, pero cada vez con menos paciencia.",
  elena: "Muchas gracias. Me tranquiliza que podamos conversar con calma. Me gustaria que entendieras que me cuesta pedir ayuda porque no quiero preocupar a mis hijos.",
  nicolas: "Ya... esta bien saberlo. Me gustaria que entendieras que no fue idea mia venir y que a veces siento que ya tienen una idea hecha de mi.",
  camila: "Gracias. Me ayuda que podamos ir de a poco. Me gustaria que entendieras que estoy cansada de estar disponible para todos y que me cuesta decir que no.",
  rodrigo: "Gracias. Me sirve saber como va a funcionar. Me gustaria que entendieras que intento estar firme por mis hijos, pero la separacion igual me movio harto.",
  fernanda: "Gracias. Me tranquiliza hacerlo con calma. Me gustaria que entendieras que quiero volver a trabajar, pero me asusta no rendir como antes.",
  hector: "Bueno, entiendo. Me gustaria que entendieras que jubilar no ha sido solo tener mas tiempo; a veces el dia se siente demasiado vacio.",
  daniela: "Gracias. Me ayuda saber que no tengo que resolver todo hoy. Me gustaria que entendieras que estoy cansada, pero tambien me siento culpable por estar cansada.",
  andres: "Ya, gracias. Me sirve que lo expliques asi. Me gustaria que entendieras que me siento fuera de lugar en la universidad y no quiero decepcionar a mi familia.",
  patricia: "Gracias. Me gustaria que entendieras que no quiero controlar todo, pero me da miedo perder el vinculo con mi hija.",
  miguel: "Gracias. Me ayuda saber que podemos conversar con calma. Me gustaria que entendieras que estoy tratando de empezar de nuevo sin perder lo que deje atras.",
  sofia: "Gracias. Me ayuda que no suene como reto. Me gustaria que entendieras que me comparo mas de lo que digo.",
  claudio: "Esta bien. Me gustaria que entendieras que no estoy mal en apariencia, pero siento que estoy viviendo en automatico."
};

const guidedProgressionByCase = {
  tomas: {
    motiveBase: "Creo que es por el tema del computador. Mis papas dicen que paso mucho tiempo jugando y que casi no salgo, pero yo siento que no es tan simple.",
    derivation: "Vine con mi mama. Ella insistio mas. Yo no se si habria venido solo, pero tampoco queria seguir peleando por lo mismo.",
    followUp: "No es solo jugar. Cuando me siento pasado a llevar o no se que hacer, me voy al computador porque ahi siento que controlo algo.",
    emotion: "A veces me cierro y me voy al computador porque ahi no tengo que explicar tanto lo que me pasa.",
    context: "Mis papas creen que el problema es el computador, pero a veces siento que no me escuchan antes de retarme.",
    repetitionFallback: "Si, tiene que ver con eso, pero no es solo el computador. Es mas que cuando me siento pasado a llevar, me encierro ahi y despues todo se transforma en pelea."
  },
  valentina: {
    motiveBase: "Vine porque estoy muy sobrepasada con la universidad. Me cuesta parar y cuando descanso me siento culpable.",
    derivation: "Vine por decision mia. Igual me costo admitir que necesitaba hablar, porque siento que deberia poder ordenarme sola.",
    followUp: "Lo que mas se repite es que nunca siento que hice suficiente. Termino una cosa y ya estoy pensando en la siguiente.",
    emotion: "Me angustia parar. Puedo estar descansando, pero mi cabeza sigue haciendo listas.",
    context: "Mi familia espera mucho de mi, aunque no siempre lo digan directamente. Yo tambien me pongo esa presion.",
    repetitionFallback: "Si, tiene que ver con la universidad, pero mas con la culpa que aparece cuando bajo el ritmo."
  },
  marcos: {
    motiveBase: "Ando cansado y mas irritable. Creo que tiene que ver con la pega, aunque me cuesta reconocerlo.",
    derivation: "Vine porque me lo sugirieron y porque ya se estaba notando en la casa. Solo, no se si habria pedido hora tan rapido.",
    followUp: "Sigo cumpliendo, pero llego cada vez con menos paciencia. Eso es lo que me preocupa.",
    emotion: "Me molesta verme asi. Me pongo corto con cosas chicas y despues me queda culpa.",
    context: "La pega se me mete en la casa. Llego con la cabeza llena y mi pareja termina recibiendo mi cansancio.",
    repetitionFallback: "Si, viene por la pega, pero lo mas dificil es que ya no se queda solo en el trabajo."
  },
  elena: {
    motiveBase: "Me he sentido un poco sola. Hay cosas familiares que me tienen preocupada y me cuesta pedir ayuda.",
    derivation: "Vine porque alguien cercano me dijo que podia hacerme bien conversar. Sola me cuesta pedir estas cosas.",
    followUp: "Me cuesta decir que necesito compania. Siento que puedo molestar o preocupar a mis hijos.",
    emotion: "Me da verguenza sentirme sola a esta edad. Siempre fui yo la que estaba para los demas.",
    context: "En mi familia todos tienen sus cosas. Por eso muchas veces me guardo lo mio.",
    repetitionFallback: "Si, tiene que ver con sentirme sola, pero tambien con no saber como pedir ayuda sin sentirme una carga."
  },
  nicolas: {
    motiveBase: "Me mandaron del colegio. Dicen que estoy mas callado y que baje las notas, pero no fue idea mia venir.",
    derivation: "Me mandaron del colegio. Yo no habria venido solo, porque siento que igual ya tienen una idea hecha.",
    followUp: "Cuando preguntan asi, siento que buscan que admita algo. Entonces prefiero responder corto.",
    emotion: "Me da lata hablar si despues lo usan para retarme. Por eso me quedo piola.",
    context: "En la casa y en el colegio el tema termina siendo que estoy mas callado o que baje las notas.",
    repetitionFallback: "Si, vine por lo del colegio, pero lo que molesta es que casi nadie pregunta antes de decidir que me pasa."
  },
  camila: {
    motiveBase: "Vine porque estoy cansada de estar siempre disponible. Me cuesta poner limites sin sentirme mala persona.",
    derivation: "Vine por decision mia, aunque me costo hacerme el espacio. Siempre habia algo de alguien mas antes.",
    followUp: "Me doy cuenta tarde de que dije que si a demasiadas cosas. Despues quedo agotada y con culpa si quiero parar.",
    emotion: "Me da miedo que se molesten conmigo si digo que no. Suena absurdo, pero me pasa.",
    context: "En mi familia suelo ser la que responde, resuelve o acompana. Cuesta salir de ese lugar.",
    repetitionFallback: "Si, tiene que ver con los limites, pero sobre todo con la culpa que aparece cuando intento cuidarme."
  },
  rodrigo: {
    motiveBase: "Vine por la separacion. He andado con cambios de animo y trato de hacerme el fuerte, pero no siempre puedo.",
    derivation: "Vine porque senti que ya no bastaba con seguir funcionando. Nadie me obligo, pero tampoco fue facil decidirlo.",
    followUp: "Trato de ordenar todo por mis hijos, pero por dentro a veces estoy mas revuelto de lo que muestro.",
    emotion: "Me cuesta decir que estoy triste. Prefiero hablar de horarios o cosas practicas.",
    context: "La separacion cambio la rutina de todos. Intento que mis hijos no carguen con eso.",
    repetitionFallback: "Si, tiene que ver con la separacion, pero tambien con no saber quien soy ahora en esta nueva rutina."
  },
  fernanda: {
    motiveBase: "Estoy volviendo al trabajo despues de una licencia y me da miedo que todos noten que no rindo igual.",
    derivation: "Vine porque quiero volver bien, no solo aparecer y fingir que todo esta resuelto.",
    followUp: "Me importa trabajar, pero me asusta sentir que todos estan mirando si ya soy la misma de antes.",
    emotion: "Me pongo tensa antes de que pase algo. A veces imagino criticas que nadie ha dicho todavia.",
    context: "Mi familia intenta ayudar, pero a veces siento que tambien me estan observando.",
    repetitionFallback: "Si, tiene que ver con volver al trabajo, pero lo que mas pesa es sentirme evaluada todo el tiempo."
  },
  hector: {
    motiveBase: "Jubile hace poco y me esta costando mas de lo que pense. Tengo tiempo, pero a veces se siente vacio.",
    derivation: "Vine porque me insistieron un poco y porque yo tambien note que estaba dando vueltas sin rumbo.",
    followUp: "Me cuesta decir que extrano trabajar. No solo la pega, tambien sentir que tenia un lugar claro.",
    emotion: "Me incomoda depender mas de otros o que esten pendientes de mi como si ya no pudiera solo.",
    context: "Antes mi rutina estaba armada por el trabajo. Ahora tengo que decidir que hacer con el dia.",
    repetitionFallback: "Si, tiene que ver con jubilar, pero no es solo tiempo libre; es sentir que perdi un lugar."
  },
  daniela: {
    motiveBase: "Vine porque estoy tratando de compatibilizar maternidad, estudio y algo de cuidado para mi. Me siento cansada y culpable.",
    derivation: "Vine por decision mia. Me costo, porque pedir este espacio ya me hace sentir que estoy dejando algo pendiente.",
    followUp: "Amo a mi hijo, pero hay dias en que no me queda nada para mi. Decir eso me da culpa.",
    emotion: "Me da culpa cansarme. Como si admitirlo significara que no estoy agradecida o que estoy fallando.",
    context: "Mi familia ayuda a ratos, pero la responsabilidad la siento encima casi todo el tiempo.",
    repetitionFallback: "Si, tiene que ver con estudiar y criar, pero sobre todo con sentir culpa cada vez que pienso en mi."
  },
  andres: {
    motiveBase: "Vine porque entre a la universidad y siento que no encajo. Trato de parecer tranquilo, pero por dentro me comparo mucho.",
    derivation: "Vine porque pense que podia servirme hablarlo. En mi casa no quiero preocuparlos mas de la cuenta.",
    followUp: "Me comparo con companeros que parecen entender todo. Yo trato de disimular que estoy perdido.",
    emotion: "Me da verguenza decir que no me siento parte. Como si no deberia estar ahi.",
    context: "Mi familia esta orgullosa, y eso me alegra, pero tambien siento que no puedo fallar.",
    repetitionFallback: "Si, tiene que ver con la universidad, pero mas con sentir que estoy mirando desde afuera."
  },
  patricia: {
    motiveBase: "Vine por conflictos con mi hija adolescente. Me preocupa perder autoridad y tambien perder el vinculo.",
    derivation: "Vine porque las peleas ya se estaban repitiendo demasiado. Nadie me obligo, pero senti que necesitaba mirar esto.",
    followUp: "A veces parto queriendo cuidarla y termino controlando mas de lo que quisiera.",
    emotion: "Me da miedo que deje de confiar en mi. Ese miedo a veces sale como enojo.",
    context: "En la casa todo se tensa rapido. Yo llego cansada y ella ya viene a la defensiva.",
    repetitionFallback: "Si, tiene que ver con mi hija, pero no es solo autoridad; tambien me da miedo perder el vinculo."
  },
  miguel: {
    motiveBase: "Vine porque me ha costado adaptarme despues de migrar. Trabajo, intento avanzar, pero a veces siento que empece de cero.",
    derivation: "Vine por decision mia. Me costo pedir ayuda, porque no quiero sonar ingrato con la oportunidad de estar aca.",
    followUp: "Estoy armando vida de nuevo, pero a veces pesa tener que explicar todo desde cero.",
    emotion: "Me da pena extrañar lo que deje, y al mismo tiempo siento culpa por decirlo.",
    context: "Parte de mi familia esta lejos. Hablamos por telefono, pero no es lo mismo.",
    repetitionFallback: "Si, tiene que ver con migrar, pero no solo con adaptarme; tambien con sentir que perdi partes de quien era."
  },
  sofia: {
    motiveBase: "Vine porque uso mucho las redes y me comparo todo el tiempo. Se que me hace mal a ratos, pero igual vuelvo.",
    derivation: "Vine por decision mia, aunque me da verguenza admitir que esto me afecta tanto.",
    followUp: "Puedo estar bien, entro a redes y empiezo a sentir que mi vida no alcanza.",
    emotion: "Me da rabia depender de algo que se que no deberia importarme tanto.",
    context: "Mi familia no entiende mucho por que esto me afecta. A veces yo tampoco quiero admitirlo.",
    repetitionFallback: "Si, tiene que ver con redes, pero mas con como quedo despues de compararme."
  },
  claudio: {
    motiveBase: "Vine porque siento que estoy estancado. Tengo estabilidad, pero me cuesta tomar decisiones y cambiar algo.",
    derivation: "Vine por decision mia. No fue algo urgente, pero hace rato siento que estoy postergando demasiado.",
    followUp: "Tengo una rutina que funciona por fuera, pero por dentro siento que hago todo en automatico.",
    emotion: "Me cuesta reconocerlo porque suena raro quejarse cuando todo se ve estable.",
    context: "Mi entorno me ve ordenado. Por eso no siempre muestro que me siento detenido.",
    repetitionFallback: "Si, tiene que ver con sentirme estancado, pero mas con el miedo a mover algo y equivocarme."
  }
};

const residenceByCase = {
  tomas: "Vivo con mis papas. Ultimamente discutimos harto por el tema del computador.",
  valentina: "Vivo con mi familia. A veces eso tambien me pesa, porque siento que esperan mucho de mi.",
  marcos: "Vivo con mi pareja. Ultimamente me preocupa llegar tan cansado a la casa.",
  elena: "Vivo sola. Mis hijos estan pendientes, pero yo trato de no preocuparlos mucho.",
  nicolas: "Vivo con mi familia. No hablo mucho de estas cosas en la casa.",
  camila: "Vivo sola, pero sigo muy pendiente de mi familia.",
  rodrigo: "Vivo solo desde la separacion. Mis hijos estan conmigo algunos dias.",
  fernanda: "Vivo con mi pareja. Me apoya, aunque igual me cuesta contarle cuanto me asusta volver al trabajo.",
  hector: "Vivo con mi esposa. Desde que jubile paso mas tiempo en la casa.",
  daniela: "Vivo con mi hijo. Mi familia me ayuda a ratos, pero la responsabilidad principal la siento en mi.",
  andres: "Vivo con mi familia. Ellos estan orgullosos de que este en la universidad, y eso tambien pesa.",
  patricia: "Vivo con mi hija. Ultimamente en la casa discutimos mas de lo que quisiera.",
  miguel: "Vivo solo por ahora. Estoy armando mi vida aca de a poco.",
  sofia: "Vivo con mi familia. Igual paso harto tiempo en mi pieza o conectada al celular.",
  claudio: "Vivo solo. Tengo una rutina bastante ordenada, aunque a veces eso mismo me hace sentir estancado."
};

const occupationByCase = {
  tomas: "Estoy cerrando cuarto medio. Tengo 18, asi que gran parte de mi dia sigue siendo colegio, casa y computador, pero tambien pensar que hare despues.",
  valentina: "Estudio en la universidad. Ultimamente siento que todo gira en torno a cumplir, estudiar y no atrasarme.",
  marcos: "Trabajo en una empresa, en un area mas bien administrativa/comercial. Ultimamente la pega me esta dejando sin energia.",
  elena: "Trabajo algunas horas y paso bastante tiempo pendiente de la casa y de mi familia.",
  nicolas: "Estoy en cuarto medio. No trabajo. Me mandaron porque dicen que estoy mas callado, baje las notas y estoy trabado con lo que viene despues.",
  camila: "Trabajo. Ademas ayudo mucho a mi familia, y a veces siento que mi dia sigue aunque ya haya salido de la pega.",
  rodrigo: "Trabajo y soy papa. Despues de la separacion, gran parte de mi dia tambien se va en reorganizar tiempos familiares.",
  fernanda: "Estoy retomando mi trabajo despues de una licencia larga. Me importa hacerlo bien, pero me da miedo no rendir como antes.",
  hector: "Jubile hace poco. Antes mi vida giraba mucho en torno al trabajo, y ahora estoy tratando de encontrar una rutina nueva.",
  daniela: "Estudio y cuido a mi hijo. Entre las dos cosas, el dia se me va completo.",
  andres: "Estudio en la universidad. Entre hace poco y todavia me cuesta sentir que pertenezco ahi.",
  patricia: "Trabajo y soy mama. Ultimamente mi dia termina muy cruzado por los conflictos con mi hija.",
  miguel: "Trabajo. No es exactamente lo que hacia antes de migrar, pero por ahora me permite sostenerme.",
  sofia: "Estudio y trabajo algunas horas. Igual el celular y las redes se me meten en casi todo el dia.",
  claudio: "Trabajo. Tengo una pega estable y una rutina bastante ordenada, pero siento que estoy en piloto automatico."
};

const stageIntentByIntervention = {
  saludo_encuadre: "encuadre_o_consentimiento",
  motivo_consulta: "motivo_de_consulta",
  pregunta_abierta: "respuesta_general",
  validacion_emocional: "validacion_emocional",
  seguimiento: "seguimiento_contextual",
  contexto_familiar_social: "exploracion_contextual",
  ocupacion_vivienda: "ocupacion_actividad",
  exploracion_emocional: "exploracion_emocional",
  recursos_personales: "preferencias_valoracion",
  cierre_sesion: "cierre"
};

export function generateGuidedPatientResponse({
  caseId,
  sessionNumber = 1,
  conversationStage,
  selectedInterventionType,
  studentMessage,
  conversationHistory = [],
  opennessLevel = "apertura_media",
  detectedIntent = "desconocida"
}) {
  const intervention = getGuidedInterventionType(selectedInterventionType);
  if (!intervention) return null;

  const facts = patientFacts[caseId] || patientFacts.tomas;
  const stage =
    conversationStage ||
    resolveConversationStage({
      sessionNumber,
      history: conversationHistory,
      selectedInterventionType
  });
  const flexibleResponse = generatePatientResponse({
    caseData: facts,
    caseId,
    usedResponseIds: conversationHistory.map((entry) => entry.responseId).filter(Boolean),
    selectedInterventionType,
    conversationHistory,
    coveredTopics: collectCoveredTopics(conversationHistory),
    opennessLevel,
    studentMessage
  });
  const intent = flexibleResponse.resolvedIntent;
  const normalizedStudentMessage = normalizeText(studentMessage);
  const explicitReferenceDetected = hasExplicitContextualReference(normalizedStudentMessage);
  const ambiguityDetected = isAmbiguousShortMessage(normalizedStudentMessage) && !explicitReferenceDetected;
  const coherence = assessInterventionTypeCoherence({
    selectedInterventionType,
    studentMessage,
    detectedIntent,
    concreteIntent: null,
    resolvedGuidedIntent: intent
  });

  if (isDevRuntime()) {
    console.log("DEBUG FLEXIBLE PATIENT RESPONSE", {
      caseId,
      selectedInterventionType,
      studentMessage,
      resolvedIntent: intent,
      lastPatientMessage: conversationHistory.at(-1)?.answer || "",
      usedResponseIds: conversationHistory.map((entry) => entry.responseId).filter(Boolean),
      coveredTopics: flexibleResponse.coveredTopics,
      opennessLevel,
      ambiguityDetected,
      explicitReferenceDetected,
      selectedResponseId: flexibleResponse.responseId,
      responseText: flexibleResponse.responseText
    });
  }

  const responseType =
    intent === "encuadre_mas_pregunta" || intent === "encuadre_mas_pregunta_abierta"
      ? "encuadre_mas_pregunta_abierta"
      : `guiado:flexible:${intent}`;

  return {
    responseText: flexibleResponse.responseText,
    intent,
    responseId: flexibleResponse.responseId,
    responseType,
    fallbackUsed: false,
    stage,
    selectedInterventionType,
    resolvedGuidedIntent: intent,
    coveredTopic: flexibleResponse.coveredTopic,
    opennessDelta: flexibleResponse.opennessDelta,
    interventionLabel: intervention.label,
    coherence
  };
}

export function generatePatientResponse({
  caseData,
  caseId,
  selectedInterventionType,
  studentMessage,
  conversationHistory = [],
  usedResponseIds = [],
  coveredTopics = [],
  opennessLevel = "apertura_media"
}) {
  const facts = caseData || patientFacts[caseId] || patientFacts.tomas;
  const resolvedIntent = resolveGuidedIntent({
    selectedInterventionType,
    studentMessage,
    conversationHistory
  });
  const coveredTopic = topicFromFlexibleIntent(resolvedIntent, studentMessage, conversationHistory);
  const candidates = buildFlexibleCandidates({
    caseId,
    facts,
    resolvedIntent,
    selectedInterventionType,
    studentMessage,
    conversationHistory,
    opennessLevel,
    coveredTopics
  });
  const candidateResponse = pickUnused(candidates, conversationHistory, caseId, selectedInterventionType, resolvedIntent);
  const selected = avoidRepeatedResponse({
    caseId,
    candidateResponse,
    candidatePool: candidates,
    usedResponses: conversationHistory.map((entry) => entry.answer).filter(Boolean),
    usedResponseIds,
    studentMessage,
    selectedInterventionType,
    conversationHistory,
    intent: resolvedIntent,
    stageName: resolvedIntent
  });

  return {
    responseText: selected.text,
    responseId: selected.id,
    resolvedIntent,
    coveredTopic,
    coveredTopics: Array.from(new Set([...coveredTopics, coveredTopic].filter(Boolean))),
    opennessDelta: opennessDeltaForIntent(resolvedIntent),
    wasRepeated: selected.wasRepeated
  };
}

export function resolveGuidedIntent({ selectedInterventionType, studentMessage = "", conversationHistory = [] }) {
  const text = normalizeText(studentMessage);
  if (!text) return stageIntentByIntervention[selectedInterventionType] || null;

  if (isSimpleGreeting(text)) return "saludo_simple";
  if (hasExplicitContextualReference(text)) return "seguimiento_contextual_explicito";
  if (isAmbiguousShortMessage(text)) return "respuesta_ambigua";
  if (hasFramingCue(text) && hasOpenQuestionCue(text)) return "encuadre_mas_pregunta";
  if (hasFramingCue(text)) return "encuadre";
  if (hasValidationCue(text)) return "validacion_emocional";
  if (hasClosingCue(text)) return "cierre";
  if (hasMotiveCue(text)) return "motivo_de_consulta";

  const concreteIntent = detectConcreteQuestionIntent(studentMessage);
  if (concreteIntent) return concreteIntent;

  if (hasFollowUpCue(text, conversationHistory)) return "seguimiento_contextual";
  if (hasFamilyContextCue(text)) return "contexto_familiar_social";

  if (selectedInterventionType === "saludo_encuadre") {
    if (hasStudentPresentationCue(text)) return "presentacion_estudiante";
    return "encuadre";
  }

  return stageIntentByIntervention[selectedInterventionType] || null;
}

function buildFlexibleCandidates({
  caseId,
  facts,
  resolvedIntent,
  selectedInterventionType,
  studentMessage,
  conversationHistory,
  opennessLevel
}) {
  const progression = getGuidedProgression(caseId, facts);
  const acknowledgement = acknowledgementByCase[caseId] || "Gracias. Podemos conversarlo con calma.";
  const motiveWasCovered = hasUsedResponseKey(conversationHistory, `${caseId}_motivo_base`) ||
    conversationHistory.some((entry) => areResponsesSimilar(entry.answer, progression.motiveBase));
  const lastPatientMessage = conversationHistory.at(-1)?.answer || "";

  if (resolvedIntent === "respuesta_ambigua") {
    return [responseItem(caseId, "respuesta_ambigua", "No se bien que responder a eso.")];
  }

  if (resolvedIntent === "nombre") return [`Me llamo ${facts.name}.`];
  if (resolvedIntent === "edad") return [`Tengo ${facts.age}.`];
  if (resolvedIntent === "saludo_simple") return simpleGreetingByCase[caseId] || ["Hola."];
  if (resolvedIntent === "encuadre") return framingByCase[caseId] || [acknowledgement];
  if (resolvedIntent === "presentacion_estudiante") return simpleGreetingByCase[caseId] || ["Hola. Esta bien."];
  if (resolvedIntent === "encuadre_mas_pregunta" || resolvedIntent === "encuadre_mas_pregunta_abierta") {
    return [
      responseItem(
        caseId,
        "encuadre_mas_pregunta",
        guidedCompositeOpenQuestionByCase[caseId] || joinNatural(framingByCase[caseId]?.[0] || acknowledgement, facts.concreteConcern || facts.concern || facts.motive)
      )
    ];
  }

  if (resolvedIntent === "motivo_de_consulta") {
    return motiveWasCovered
      ? [
          responseItem(caseId, "motivo_profundizacion", progression.followUp),
          responseItem(caseId, "motivo_matiz", progression.repetitionFallback),
          responseItem(caseId, "contexto_caso", progression.context)
        ].filter(Boolean)
      : [
          responseItem(caseId, "motivo_base", progression.motiveBase),
          responseItem(caseId, "motivo_profundizacion", progression.followUp),
          responseItem(caseId, "preocupacion_principal", facts.concreteConcern || facts.concern)
        ].filter(Boolean);
  }

  if (resolvedIntent === "derivacion_llegada_consulta" || resolvedIntent === "derivacion_llegada") {
    return [
      responseItem(caseId, "derivacion_llegada", progression.derivation),
      responseItem(caseId, "motivo_voluntariedad", progression.repetitionFallback),
      responseItem(caseId, "contexto_caso", progression.context)
    ].filter(Boolean);
  }

  if (resolvedIntent === "vivienda_residencia") return [responseItem(caseId, "vivienda_residencia", residenceByCase[caseId] || facts.family)].filter(Boolean);
  if (resolvedIntent === "ocupacion_actividad") return [responseItem(caseId, "ocupacion_actividad", occupationByCase[caseId] || facts.works || facts.academic || facts.school)].filter(Boolean);

  if (resolvedIntent === "contexto_familiar_social" || resolvedIntent === "exploracion_contextual") {
    return [
      responseItem(caseId, "contexto_familiar", progression.context),
      responseItem(caseId, "contexto_relacional", joinNatural(facts.family, facts.social)),
      responseItem(caseId, "seguimiento_emocion", progression.emotion)
    ].filter(Boolean);
  }

  if (resolvedIntent === "seguimiento_contextual_explicito") {
    return [
      responseForExplicitFollowUp({ caseId, facts, studentMessage, currentMessage: lastPatientMessage }),
      responseForFollowUpTopic({ caseId, facts, studentMessage, currentMessage: lastPatientMessage }),
      responseItem(caseId, "seguimiento_profundizacion", progression.followUp),
      responseItem(caseId, "seguimiento_emocion", progression.emotion),
      responseItem(caseId, "seguimiento_contexto", progression.context)
    ].filter(Boolean);
  }

  if (resolvedIntent === "seguimiento_contextual") {
    return [
      responseForFollowUpTopic({ caseId, facts, studentMessage, currentMessage: lastPatientMessage }),
      responseItem(caseId, "seguimiento_profundizacion", progression.followUp),
      responseItem(caseId, "seguimiento_emocion", progression.emotion),
      responseItem(caseId, "seguimiento_contexto", progression.context),
      responseItem(caseId, "seguimiento_reformulacion", progression.repetitionFallback)
    ].filter(Boolean);
  }

  if (resolvedIntent === "validacion_emocional") {
    const openDetail = opennessLevel === "apertura_baja" ? progression.emotion : joinNatural(progression.emotion, progression.followUp);
    return [
      responseItem(caseId, "validacion_apertura", joinNatural(validationBriefByCase[caseId] || "Eso ayuda un poco.", openDetail)),
      responseItem(caseId, "validacion_breve", validationBriefByCase[caseId]),
      responseItem(caseId, "validacion_matiz", joinNatural("Eso ayuda un poco.", progression.repetitionFallback))
    ].filter(Boolean);
  }

  if (resolvedIntent === "cierre") {
    return [
      responseItem(caseId, "cierre_continuidad", closeForSession(facts, 1)),
      responseItem(caseId, "cierre_breve", "Si... creo que podemos retomarlo otro dia."),
      responseItem(caseId, "cierre_matiz", joinNatural("Me parece bien dejarlo hasta aqui por ahora.", facts.expectation))
    ].filter(Boolean);
  }

  if (selectedInterventionType === "pregunta_abierta") {
    return [
      responseItem(caseId, "pregunta_abierta_contextual", progression.followUp),
      responseItem(caseId, "pregunta_abierta_emocion", progression.emotion),
      responseItem(caseId, "pregunta_abierta_contexto", progression.context)
    ].filter(Boolean);
  }

  return [
    responseItem(caseId, "respuesta_general_contextual", progression.followUp),
    responseItem(caseId, "respuesta_general_emocion", progression.emotion),
    responseItem(caseId, "respuesta_general_contexto", progression.context)
  ].filter(Boolean);
}

function buildGuidedCandidates({ caseId, facts, intent, interventionType, stage, opennessLevel, history }) {
  const disclosureIndex = Math.max(0, Math.min((history.length || 0) % 4, (facts.concreteDisclosures || []).length - 1));
  const firstDisclosure = facts.concreteDisclosures?.[disclosureIndex] || facts.concreteDisclosures?.[0] || facts.concreteConcern || facts.concern;
  const secondDisclosure = facts.concreteDisclosures?.[(disclosureIndex + 1) % (facts.concreteDisclosures?.length || 1)] || facts.concreteConcern || facts.concern;
  const acknowledgement = acknowledgementByCase[caseId] || "Gracias. Podemos conversarlo con calma.";
  const progression = getGuidedProgression(caseId, facts);

  if (intent === "nombre") return [`Me llamo ${facts.name}.`];
  if (intent === "edad") return [`Tengo ${facts.age}.`];
  if (intent === "vivienda_residencia") return [residenceByCase[caseId] || facts.family].filter(Boolean);
  if (intent === "ocupacion_actividad") return [occupationByCase[caseId] || facts.works || facts.academic || facts.school].filter(Boolean);
  if (intent === "derivacion_llegada") {
    return [
      responseItem(caseId, "derivacion_llegada", progression.derivation),
      responseItem(caseId, "motivo_voluntariedad", progression.repetitionFallback),
      responseItem(caseId, "contexto_familiar", progression.context)
    ].filter(Boolean);
  }
  if (intent === "saludo_simple") return simpleGreetingByCase[caseId] || ["Hola."];
  if (intent === "encuadre") return framingByCase[caseId] || [acknowledgement];
  if (intent === "presentacion_estudiante") return simpleGreetingByCase[caseId] || ["Hola. Esta bien."];
  if (intent === "encuadre_mas_pregunta" || intent === "encuadre_mas_pregunta_abierta") {
    return [guidedCompositeOpenQuestionByCase[caseId] || joinNatural(framingByCase[caseId]?.[0] || acknowledgement, facts.concreteConcern || facts.concern || facts.motive)].filter(Boolean);
  }
  if (intent === "validacion_emocional" || interventionType === "validacion_emocional") {
    const concrete = opennessLevel === "apertura_baja" ? firstDisclosure : joinNatural(firstDisclosure, secondDisclosure);
    return [
      validationBriefByCase[caseId],
      joinNatural(validationBriefByCase[caseId] || facts.validationBridge || acknowledgement, concrete),
      joinNatural(facts.validationBridge || acknowledgement, concrete)
    ].filter(Boolean);
  }

  if (interventionType === "saludo_encuadre") {
    return [
      acknowledgement,
      joinNatural(acknowledgement, openingContinuation(facts, stage.sessionNumber)),
      joinNatural(acknowledgement, facts.expectation)
    ].filter(Boolean);
  }

  if (interventionType === "motivo_consulta") {
    return [
      responseItem(caseId, "motivo_base", progression.motiveBase),
      responseItem(caseId, "derivacion_llegada", progression.derivation),
      responseItem(caseId, "motivo_profundizacion", progression.followUp),
      responseItem(caseId, "contexto_caso", progression.context),
      responseItem(caseId, "preocupacion_principal", facts.concreteConcern || facts.concern)
    ].filter(Boolean);
  }

  if (interventionType === "pregunta_abierta") {
    return buildOpenQuestionCandidates({ facts, stage, firstDisclosure, secondDisclosure });
  }

  if (interventionType === "seguimiento") {
    const topicResponse = responseForFollowUpTopic({ caseId, facts, studentMessage: history.at(-1)?.question || "", currentMessage: "" });
    return [
      topicResponse,
      responseItem(caseId, "seguimiento_profundizacion", progression.followUp),
      responseItem(caseId, "seguimiento_emocion", progression.emotion),
      responseItem(caseId, "seguimiento_contexto", progression.context),
      responseItem(caseId, "seguimiento_reformulacion", progression.repetitionFallback),
      joinNatural(facts.followUpBridge || "Creo que lo que trato de decir es esto.", firstDisclosure),
      secondDisclosure,
      facts.concreteConcern || facts.concern
    ].filter(Boolean);
  }

  if (interventionType === "contexto_familiar_social") {
    return [
      joinNatural(facts.family, facts.social),
      joinNatural("En mi contexto cercano pasa esto.", facts.family),
      joinNatural("Con otras personas tambien aparece.", facts.social)
    ].filter(Boolean);
  }

  if (interventionType === "ocupacion_vivienda") {
    return [
      joinNatural(occupationByCase[caseId] || facts.works || facts.academic || facts.school, residenceByCase[caseId] || facts.family),
      occupationByCase[caseId] || facts.works || facts.academic || facts.school,
      residenceByCase[caseId] || facts.family
    ].filter(Boolean);
  }

  if (interventionType === "exploracion_emocional") {
    return [
      firstDisclosure,
      joinNatural("Me cuesta decirlo, pero", lowerFirst(facts.concreteConcern || facts.concern)),
      joinNatural("Cuando lo siento mas fuerte,", lowerFirst(secondDisclosure))
    ].filter(Boolean);
  }

  if (interventionType === "recursos_personales") {
    return [
      facts.preferences,
      joinNatural("Algo que todavia me sostiene es esto.", facts.preferences),
      joinNatural("Creo que podria apoyarme un poco en eso.", facts.expectation)
    ].filter(Boolean);
  }

  if (interventionType === "cierre_sesion") {
    return [
      closeForSession(facts, stage.sessionNumber),
      joinNatural("Creo que podria seguir hablando de esto en otra sesion.", facts.concreteConcern || facts.concern),
      joinNatural("Me voy con algo mas ordenado.", facts.expectation)
    ].filter(Boolean);
  }

  return [
    facts.concreteConcern || facts.concern || facts.motive,
    firstDisclosure,
    facts.expectation
  ].filter(Boolean);
}

function buildOpenQuestionCandidates({ facts, stage, firstDisclosure, secondDisclosure }) {
  if (["apertura_encuadre", "motivo_consulta", "profundizar_motivo"].includes(stage.stageName)) {
    return [facts.motive, firstDisclosure, facts.concreteConcern || facts.concern].filter(Boolean);
  }
  if (["contexto_basico", "contexto_relacional", "redes_apoyo"].includes(stage.stageName)) {
    return [joinNatural(facts.family, facts.social), facts.family, facts.social].filter(Boolean);
  }
  if (["recursos_personales", "recursos_proximos_pasos"].includes(stage.stageName)) {
    return [facts.preferences, facts.expectation, joinNatural(facts.preferences, facts.expectation)].filter(Boolean);
  }
  if (["cierre_continuidad", "cierre_formativo_final"].includes(stage.stageName)) {
    return [closeForSession(facts, stage.sessionNumber), facts.expectation].filter(Boolean);
  }
  return [firstDisclosure, secondDisclosure, facts.concreteConcern || facts.concern].filter(Boolean);
}

function detectConcreteQuestionIntent(studentMessage = "") {
  const text = normalizeText(studentMessage);
  if (/\b(cual es tu nombre|como te llamas|me dices tu nombre|quien eres)\b/.test(text)) return "nombre";
  if (/\b(cuantos anos tienes|que edad tienes|edad)\b/.test(text)) return "edad";
  if (/\b(quien te mando|quien te pidio venir|quien pidio que vinieras|quien quiso que vinieras|como llegaste aqui|como llegaste aca|viniste solo|viniste sola|te enviaron|te mandaron|te trajeron|te derivo|te derivaron|quien te trajo|tus papas te trajeron|tus padres te trajeron|tu mama te trajo|tu papa te trajo|fue idea tuya|viniste por tu cuenta|te enviaron tus padres|te mandaron tus padres)\b/.test(text)) return "derivacion_llegada_consulta";
  if (/\b(donde vives|con quien vives|vives solo|vives sola|vives con alguien|vives con tus papas|vives con tu familia|vives con tu pareja)\b/.test(text)) return "vivienda_residencia";
  if (/\b(a que te dedicas|en que trabajas|cual es tu trabajo|trabajas|estudias o trabajas|que haces actualmente|que haces durante el dia)\b/.test(text)) return "ocupacion_actividad";
  if (/\b(no tienes amigos|tienes amigos|teni amigos|tenis amigos|tienes amigas|tienes amistades|tienes companeros|amistades|amigos|amigas|companeros|con quien hablas|hablas con gente|tienes grupo|sales con alguien)\b/.test(text)) return "amistades_red_social";
  return null;
}

function assessInterventionTypeCoherence({ selectedInterventionType, studentMessage, detectedIntent, concreteIntent, resolvedGuidedIntent }) {
  const text = normalizeText(studentMessage);
  const expected = expectedIntentsForType[selectedInterventionType] || [];
  const resolvedIntent = concreteIntent || resolvedGuidedIntent || detectedIntent;
  const isClearlyClosing = /\b(cerrar|terminar|proxima sesion|siguiente sesion|continuar en otra)\b/.test(text);
  const isClearlyMotive = /\b(que te trae|por que viniste|motivo|que te preocupa)\b/.test(text);
  const isClearlyValidation = /\b(no estoy para juzgar|te escucho|comprendo|entiendo|tiene sentido|podemos ir paso a paso)\b/.test(text);

  let isCoherent = expected.includes(resolvedIntent) || resolvedIntent === "desconocida" || resolvedIntent === "respuesta_general";
  if (selectedInterventionType === "cierre_sesion" && isClearlyClosing) isCoherent = true;
  if (selectedInterventionType === "motivo_consulta" && isClearlyMotive) isCoherent = true;
  if (selectedInterventionType === "validacion_emocional" && isClearlyValidation) isCoherent = true;
  if (selectedInterventionType === "motivo_consulta" && isClearlyClosing) isCoherent = false;
  if (selectedInterventionType === "cierre_sesion" && isClearlyMotive) isCoherent = false;

  return {
    isCoherent,
    expectedIntents: expected,
    detectedIntent: resolvedIntent
  };
}

const expectedIntentsForType = {
  saludo_encuadre: ["saludo", "saludo_simple", "encuadre", "encuadre_o_consentimiento", "encuadre_mas_pregunta", "encuadre_mas_pregunta_abierta", "cortesia_vinculo", "presentacion_estudiante", "validacion_emocional"],
  motivo_consulta: ["motivo_de_consulta", "preocupacion_principal", "derivacion_llegada", "derivacion_llegada_consulta", "seguimiento_contextual", "seguimiento_contextual_explicito"],
  pregunta_abierta: ["respuesta_general", "motivo_de_consulta", "preocupacion_principal", "exploracion_emocional"],
  validacion_emocional: ["validacion_emocional"],
  seguimiento: ["seguimiento_contextual", "seguimiento_contextual_explicito", "exploracion_emocional"],
  contexto_familiar_social: ["pregunta_familiar", "pregunta_social", "amistades_red_social", "exploracion_contextual", "vivienda_residencia"],
  ocupacion_vivienda: ["ocupacion_actividad", "vivienda_residencia", "pregunta_laboral", "pregunta_academica", "pregunta_escolar"],
  exploracion_emocional: ["exploracion_emocional", "preocupacion_principal"],
  recursos_personales: ["preferencias_valoracion", "pregunta_social", "amistades_red_social"],
  cierre_sesion: ["cierre"]
};

function isSimpleGreeting(text = "") {
  const normalized = normalizeText(text);
  if (!normalized) return false;
  return (
    /^(hola|buenos dias|buenas tardes|buenas noches|buen dia)$/.test(normalized) ||
    /^(hola|buenos dias|buenas tardes|buenas noches) (como estas|como te encuentras)$/.test(normalized) ||
    /^hola (soy|me llamo) [a-z]+$/.test(normalized)
  );
}

function isAmbiguousShortMessage(text = "") {
  return /^(y|ya|mmm|ah|ok|bueno|dale)$/.test(normalizeText(text));
}

function hasExplicitContextualReference(text = "") {
  return /\b(me dijiste que|dijiste que|mencionaste que|cuando dices|cuando dijiste|a que te refieres con|que quieres decir con|que no es tan simple|por que no es tan simple|eso que dijiste|lo que mencionaste)\b/.test(text);
}

function hasFramingCue(text = "") {
  return /\b(antes de comenzar|objetivo|entrevista|espacio|confidencialidad|confidencial|explicarte|explicar|conversar con calma|podemos conversar|como funciona|fines educativos)\b/.test(text);
}

function hasOpenQuestionCue(text = "") {
  return /\b(que te gustaria que entienda|que te gustaria que entendiera|que te gustaria que comprenda|que quieres que entienda|que quieres que comprenda|lo que estas viviendo|que estas viviendo|que te trae|que te preocupa|que te gustaria contar|que esperas)\b/.test(text);
}

function hasValidationCue(text = "") {
  return /\b(no estoy para juzgar|no vengo a juzgar|sin juzgar|no juzgarte|comprenderte|quiero comprenderte|a tu ritmo|tomarte tu tiempo|puedes tomarte tu tiempo|te escucho|lo que sientes es importante|entiendo|comprendo|tiene sentido|no sea solo|no es solo|quiero comprender)\b/.test(text);
}

function hasStudentPresentationCue(text = "") {
  return /\b(quisiera presentarme|quiero presentarme|me presento|mi nombre es|soy quien va a conversar|soy el estudiante)\b/.test(text);
}

function hasClosingCue(text = "") {
  return /\b(adios|nos vemos|hasta la proxima|dejarlo hasta aqui|retomarlo|proxima sesion|otra sesion|cerrar|cerramos por hoy|terminar por hoy|terminamos la sesion|gracias por venir|hasta aqui|continuar otro dia|podemos dejarlo)\b/.test(text);
}

function hasFollowUpCue(text = "", conversationHistory = []) {
  const hasPreviousPatientMessage = Boolean(conversationHistory.at(-1)?.answer);
  return (
    hasPreviousPatientMessage &&
    /\b(a que te refieres|a que te refieres con|que quieres decir|cuentame mas|explicame|como lo ves tu|que lugar tiene el computador|por que juegas|como asi|eso tiene que ver|por que dices|que pasa cuando|que pasa con eso|que significa|en que sentido|no es tan simple|cuando sientes|cuando dices|y que pasa)\b/.test(text)
  );
}

function hasMotiveCue(text = "") {
  return /\b(que te trae|por que viniste|por que estas aca|por que estas aqui|(y tu )?que haces (aqui|aca)|cual es tu consulta|motivo|que te preocupa|que paso para que vinieras|que esta pasando)\b/.test(text);
}

function hasFamilyContextCue(text = "") {
  return /\b(casa|familia|papas|papa|mama|padres|hijos|hija|hijo|pareja|como se vive|en tu casa|con ellos|social|amigos|companeros)\b/.test(text);
}

function collectCoveredTopics(history = []) {
  return Array.from(
    new Set(
      history
        .flatMap((entry) => [
          entry.responseCategory,
          entry.analysis?.contextualTopic,
          entry.conversationStage?.stageName
        ])
        .filter(Boolean)
    )
  );
}

function topicFromFlexibleIntent(intent, studentMessage = "", history = []) {
  if (intent === "saludo_simple") return "saludo";
  if (intent === "encuadre" || intent === "encuadre_mas_pregunta") return "encuadre";
  if (intent === "motivo_de_consulta") return "motivo_de_consulta";
  if (intent === "derivacion_llegada_consulta" || intent === "derivacion_llegada") return "llegada_consulta";
  if (intent === "contexto_familiar_social" || intent === "exploracion_contextual") return "contexto";
  if (intent === "validacion_emocional") return "validacion";
  if (intent === "cierre") return "cierre";
  if (intent === "seguimiento_contextual" || intent === "seguimiento_contextual_explicito") {
    const text = normalizeText(`${studentMessage} ${history.at(-1)?.answer || ""}`);
    if (/\b(computador|jugar|juego|videojuego|videojuegos|redes|celular)\b/.test(text)) return "digital";
    if (/\b(casa|familia|papas|padres|mama|papa|hija|hijo|pareja)\b/.test(text)) return "contexto";
    return "seguimiento";
  }
  if (intent === "vivienda_residencia") return "vivienda";
  if (intent === "ocupacion_actividad") return "ocupacion";
  return intent || "respuesta_general";
}

function opennessDeltaForIntent(intent) {
  if (intent === "validacion_emocional") return 8;
  if (intent === "seguimiento_contextual" || intent === "seguimiento_contextual_explicito") return 4;
  if (intent === "encuadre" || intent === "encuadre_mas_pregunta") return 3;
  if (intent === "juicio_o_critica") return -10;
  if (intent === "consejo_apresurado") return -6;
  return 0;
}

function hasUsedResponseKey(history = [], responseId) {
  return history.some((entry) => entry.responseId === responseId);
}

function openingContinuation(facts, sessionNumber) {
  if (sessionNumber === 1) return facts.expectation;
  if (sessionNumber === 2) return "Me quedaron dando vueltas algunas cosas de la vez pasada.";
  if (sessionNumber === 3) return "Creo que hay cosas de mi contexto que tambien influyen.";
  return "Estas conversaciones me han servido para ordenar un poco lo que me pasa.";
}

function closeForSession(facts, sessionNumber) {
  if (sessionNumber >= 4) {
    return joinNatural("Creo que me llevo algo mas ordenado de estas conversaciones.", facts.expectation);
  }
  return joinNatural("Creo que podria seguir hablando de esto en una proxima sesion.", facts.concreteConcern || facts.concern);
}

function getGuidedProgression(caseId, facts = {}) {
  return (
    guidedProgressionByCase[caseId] || {
      motiveBase: facts.motive,
      derivation: facts.motive,
      followUp: facts.concreteConcern || facts.concern || facts.motive,
      emotion: facts.concreteDisclosures?.[0] || facts.concreteConcern || facts.concern,
      context: joinNatural(facts.family, facts.social) || facts.concreteConcern || facts.concern,
      repetitionFallback: facts.concreteConcern || facts.concern || facts.motive
    }
  );
}

function responseItem(caseId, key, text) {
  if (!text) return null;
  return {
    id: `${caseId}_${key}`,
    text
  };
}

function responseForFollowUpTopic({ caseId, facts, studentMessage = "", currentMessage = "" }) {
  const progression = getGuidedProgression(caseId, facts);
  const text = normalizeText(`${studentMessage} ${currentMessage}`);

  if (/\b(computador|jugar|juego|videojuego|videojuegos|redes|celular|telefono)\b/.test(text)) {
    return responseItem(caseId, "seguimiento_digital", progression.followUp);
  }
  if (/\b(papa|papas|mama|padres|familia|hija|hijo|pareja|casa)\b/.test(text)) {
    return responseItem(caseId, "seguimiento_contexto", progression.context);
  }
  if (/\b(sientes|sentiste|emocion|pasado a llevar|no te entienden|te entienden|cansado|culpa|miedo|verguenza)\b/.test(text)) {
    return responseItem(caseId, "seguimiento_emocion", progression.emotion);
  }
  if (/\b(viniste|enviaron|mandaron|trajeron|derivaron|solo|sola)\b/.test(text)) {
    return responseItem(caseId, "seguimiento_derivacion", progression.derivation);
  }

  return responseItem(caseId, "seguimiento_profundizacion", progression.followUp);
}

function responseForExplicitFollowUp({ caseId, facts, studentMessage = "", currentMessage = "" }) {
  const text = normalizeText(`${studentMessage} ${currentMessage}`);
  const progression = getGuidedProgression(caseId, facts);
  if (/\b(no es tan simple|no era tan simple|no tan simple)\b/.test(text)) {
    return responseItem(caseId, "seguimiento_explicito_no_es_tan_simple", explicitFollowUpByCase[caseId] || progression.followUp);
  }
  return responseItem(caseId, "seguimiento_explicito", explicitFollowUpByCase[caseId] || progression.followUp);
}

function pickUnused(candidates, history, caseId, interventionType, stageName) {
  const normalized = normalizeCandidates(candidates, caseId, interventionType, stageName);
  const used = new Set(history.map((entry) => entry.responseId).filter(Boolean));
  const unused = normalized.filter((candidate) => !used.has(candidate.id));
  if (unused.length) return unused[0];
  const fallback = normalized[0] || {
    text: "No estoy seguro de haber entendido bien, pero puedo intentar responderlo con calma.",
    id: makeGuidedResponseId(caseId, interventionType, stageName, "fallback", 0)
  };
  return {
    text: makeVariation(fallback.text),
    id: `${fallback.id}_variation`
  };
}

export function avoidRepeatedResponse({
  caseId,
  candidateResponse,
  candidatePool,
  usedResponses = [],
  usedResponseIds = [],
  studentMessage,
  selectedInterventionType,
  conversationHistory = [],
  intent,
  stageName
}) {
  const normalizedPool = normalizeCandidates(candidatePool, caseId, selectedInterventionType, stageName);
  const repeated =
    usedResponseIds.includes(candidateResponse.id) ||
    usedResponses.some((previous) => areResponsesSimilar(candidateResponse.text, previous));

  const topicAlternatives = buildProgressiveAlternatives({
    caseId,
    studentMessage,
    conversationHistory,
    intent
  });
  const alternatives = normalizeCandidates(
    [...topicAlternatives, ...normalizedPool],
    caseId,
    selectedInterventionType,
    stageName
  );
  const replacement = repeated
    ? alternatives.find(
        (candidate) =>
          candidate.id !== candidateResponse.id &&
          !usedResponseIds.includes(candidate.id) &&
          !usedResponses.some((previous) => areResponsesSimilar(candidate.text, previous))
      )
    : null;
  const selected = replacement || candidateResponse;

  return {
    ...selected,
    candidateResponseId: candidateResponse.id,
    candidateResponse: candidateResponse.text,
    usedResponseIds,
    wasRepeated: repeated
  };
}

function buildProgressiveAlternatives({ caseId, studentMessage = "", conversationHistory = [], intent }) {
  const facts = patientFacts[caseId] || patientFacts.tomas;
  const progression = getGuidedProgression(caseId, facts);
  const text = normalizeText(`${studentMessage} ${conversationHistory.at(-1)?.answer || ""}`);

  if (intent === "validacion_emocional") {
    return [
      responseItem(caseId, "validacion_matiz_contextual", joinNatural("Eso ayuda un poco.", progression.emotion)),
      responseItem(caseId, "validacion_apertura_contextual", joinNatural(validationBriefByCase[caseId] || "Gracias.", progression.repetitionFallback)),
      responseItem(caseId, "validacion_breve", validationBriefByCase[caseId])
    ].filter(Boolean);
  }

  if (intent === "seguimiento_contextual_explicito") {
    return [
      responseForExplicitFollowUp({ caseId, facts, studentMessage, currentMessage: conversationHistory.at(-1)?.answer || "" }),
      responseForFollowUpTopic({ caseId, facts, studentMessage, currentMessage: conversationHistory.at(-1)?.answer || "" }),
      responseItem(caseId, "seguimiento_emocion", progression.emotion)
    ].filter(Boolean);
  }

  if (intent === "derivacion_llegada" || intent === "derivacion_llegada_consulta" || /\b(viniste|enviaron|mandaron|trajeron|derivaron|solo|sola)\b/.test(text)) {
    return [
      responseItem(caseId, "derivacion_llegada", progression.derivation),
      responseItem(caseId, "motivo_voluntariedad", progression.repetitionFallback)
    ].filter(Boolean);
  }

  if (/\b(papa|papas|mama|padres|familia|hija|hijo|pareja|casa)\b/.test(text)) {
    return [
      responseItem(caseId, "contexto_familiar", progression.context),
      responseItem(caseId, "seguimiento_emocion", progression.emotion)
    ].filter(Boolean);
  }

  if (/\b(computador|jugar|juego|videojuego|videojuegos|redes|celular|telefono)\b/.test(text)) {
    return [
      responseItem(caseId, "seguimiento_digital", progression.followUp),
      responseItem(caseId, "seguimiento_contexto", progression.context)
    ].filter(Boolean);
  }

  return [
    responseItem(caseId, "motivo_profundizacion", progression.followUp),
    responseItem(caseId, "seguimiento_emocion", progression.emotion),
    responseItem(caseId, "seguimiento_reformulacion", progression.repetitionFallback)
  ].filter(Boolean);
}

function normalizeCandidates(candidates, caseId, interventionType, stageName) {
  return candidates
    .filter(Boolean)
    .map((candidate, index) => {
      if (typeof candidate === "string") {
        return {
          text: candidate,
          id: makeGuidedResponseId(caseId, interventionType, stageName, candidate, index)
        };
      }
      return {
        text: candidate.text,
        id: candidate.id || makeGuidedResponseId(caseId, interventionType, stageName, candidate.text, index)
      };
    })
    .filter((candidate) => Boolean(candidate.text));
}

function areResponsesSimilar(nextResponse = "", previousResponse = "") {
  const nextWords = meaningfulWords(nextResponse);
  const previousWords = meaningfulWords(previousResponse);
  if (nextWords.length < 4 || previousWords.length < 4) {
    return normalizeText(nextResponse) === normalizeText(previousResponse);
  }
  const previousSet = new Set(previousWords);
  const overlap = nextWords.filter((word) => previousSet.has(word)).length;
  const overlapRatio = overlap / Math.min(nextWords.length, previousWords.length);
  return overlapRatio >= 0.58;
}

function meaningfulWords(text = "") {
  const stopWords = new Set([
    "que",
    "con",
    "por",
    "para",
    "pero",
    "porque",
    "esto",
    "esta",
    "este",
    "eso",
    "mas",
    "muy",
    "del",
    "las",
    "los",
    "una",
    "uno",
    "como",
    "creo",
    "siento",
    "tengo",
    "estoy"
  ]);
  return normalizeText(text)
    .split(/\s+/)
    .filter((word) => word.length >= 4 && !stopWords.has(word));
}

function makeGuidedResponseId(caseId, interventionType, stageName, text, index) {
  return `${caseId}_guided_${interventionType}_${stageName}_${index}_${text}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 150);
}

function makeVariation(text) {
  if (!text) return "Me cuesta agregar algo más por ahora.";
  return "Creo que ya dije lo principal sobre eso. Me cuesta agregar algo más por ahora.";
}

function joinNatural(first, second) {
  if (!first) return second;
  if (!second) return first;
  const a = normalizeText(first);
  const b = normalizeText(second);
  if (a.includes(b) || b.includes(a)) return first;
  return `${first} ${second}`;
}

function lowerFirst(text = "") {
  if (!text) return "";
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function isDevRuntime() {
  return typeof import.meta !== "undefined" && import.meta.env?.DEV === true;
}
