import { patientFacts } from "./patientFacts.js";

export const difficultyOptions = [
  {
    id: "introductorio",
    label: "Introductorio",
    description: "Paciente más colaborativo y señales simuladas más explícitas."
  },
  {
    id: "intermedio",
    label: "Intermedio",
    description: "Resistencia moderada y necesidad de formular preguntas más cuidadosas."
  },
  {
    id: "avanzado",
    label: "Avanzado",
    description: "Mayor ambivalencia, respuestas más breves y apertura gradual."
  }
];

const catalog = [
  {
    id: "tomas",
    name: "Tomás",
    age: "16 años",
    shortTitle: "Aislamiento y videojuegos",
    difficulty: "Intermedio",
    accent: "#1d6a73",
    motive: "Aislamiento social, uso intensivo de videojuegos, dificultad para comunicarse con su familia y ansiedad ante interacciones presenciales.",
    background: ["Estudiante de enseñanza media.", "Vive con sus padres y hay discusiones frecuentes por el computador.", "Tiene vínculos online que percibe como más seguros que las interacciones presenciales."],
    context: "Participa poco en el colegio y se defiende si siente que lo juzgan por jugar.",
    communicationStyle: "Breve al inicio; defensivo ante juicio; se abre si validan la función emocional del juego.",
    expectedResponses: "Frases cortas, pausas y apertura progresiva cuando percibe respeto.",
    openingLine: "No sé muy bien qué decir. Mi mamá cree que paso demasiado jugando, pero no es tan simple.",
    objectives: ["Explorar videojuegos sin moralizar.", "Indagar familia, colegio y vínculos online/presenciales.", "Practicar validación y seguimiento contextual."],
    sensitiveTopics: ["No etiquetar el juego como adicción.", "No ridiculizar vínculos online.", "Evitar sermones sobre salir o socializar."],
    specificCriteria: ["Explora función emocional de videojuegos.", "Pregunta por colegio y familia sin culpabilizar.", "Responde a defensividad con validación."]
  },
  {
    id: "valentina",
    name: "Valentina",
    age: "21 años",
    shortTitle: "Sobrecarga académica",
    difficulty: "Intermedio",
    accent: "#7556a8",
    motive: "Sobrecarga universitaria, autoexigencia, dificultad para descansar y sensación de no cumplir expectativas familiares.",
    background: ["Estudia una carrera exigente.", "Mantiene alto rendimiento, pero descansa poco.", "Su familia confía mucho en su desempeño."],
    context: "Racionaliza emociones y tiende a convertir todo en rendimiento.",
    communicationStyle: "Habla bastante, ordena ideas y justifica su cansancio.",
    expectedResponses: "Elaboradas, autoexigentes y con culpa al hablar de descanso.",
    openingLine: "No sé si es tan grave. Solo estoy cansada, pero todos en la universidad están igual, supongo.",
    objectives: ["Conectar pensamiento, emoción y contexto académico.", "Explorar culpa al descansar.", "Evitar reforzar autoexigencia."],
    sensitiveTopics: ["No dar consejos rápidos de organización.", "No romantizar el rendimiento.", "No patologizar cansancio."],
    specificCriteria: ["Explora autoexigencia.", "Pregunta por familia y descanso.", "Valida cansancio sin convertirlo en diagnóstico."]
  },
  {
    id: "marcos",
    name: "Marcos",
    age: "38 años",
    shortTitle: "Estrés laboral",
    difficulty: "Intermedio",
    accent: "#8a5a2b",
    motive: "Estrés laboral, cansancio persistente, irritabilidad y sensación de pérdida de sentido en el trabajo.",
    background: ["Trabaja hace años en una empresa demandante.", "Su pareja nota irritabilidad y cansancio.", "Le cuesta reconocer vulnerabilidad."],
    context: "Minimiza lo que ocurre porque sigue funcionando.",
    communicationStyle: "Práctico, contenido y algo escéptico al inicio.",
    expectedResponses: "Directas y sobrias; profundiza si se valida el desgaste.",
    openingLine: "La verdad no sé si necesito esto. Estoy cansado, pero supongo que es parte de trabajar.",
    objectives: ["Explorar condiciones laborales concretas.", "Indagar impacto en casa y vínculos.", "Evitar consejos laborales tajantes."],
    sensitiveTopics: ["No reducirlo a falta de actitud.", "No indicar decisiones laborales reales.", "Cuidar preguntas sobre irritabilidad familiar."],
    specificCriteria: ["Valida cansancio.", "Pregunta por trabajo y casa.", "Evita conclusiones apresuradas."]
  },
  {
    id: "elena",
    name: "Elena",
    age: "52 años",
    shortTitle: "Cambios vitales y soledad",
    difficulty: "Avanzado",
    accent: "#b05268",
    motive: "Cambios vitales, sensación de soledad, conflictos familiares y dificultad para pedir ayuda.",
    background: ["Ha dedicado muchos años al cuidado familiar.", "Sus hijos tienen mayor independencia.", "Le cuesta pedir apoyo explícito."],
    context: "Habla primero de los demás y luego de sí misma.",
    communicationStyle: "Cordial, cuidadosa y contenida.",
    expectedResponses: "Amables e indirectas; se vuelven personales con escucha activa.",
    openingLine: "Yo estoy bien en general. Me preocupa más que la familia esté tranquila, aunque últimamente me he sentido un poco sola.",
    objectives: ["Explorar soledad sin dramatizar.", "Indagar redes y formas de pedir ayuda.", "Validar necesidades propias."],
    sensitiveTopics: ["No culpar a su familia.", "No confrontarla bruscamente.", "No asumir abandono."],
    specificCriteria: ["Detecta desvíos hacia otros.", "Explora apoyo con delicadeza.", "Valida el derecho a necesitar compañía."]
  },
  {
    id: "nicolas",
    name: "Nicolás",
    age: "16 años",
    shortTitle: "Derivación escolar",
    difficulty: "Avanzado",
    accent: "#3d6f43",
    motive: "Derivado por el colegio por baja participación, cambios en rendimiento y desconexión con sus compañeros.",
    background: ["No pidió la entrevista.", "El colegio observa baja participación.", "Se cierra si siente interrogatorio."],
    context: "Siente que adultos ya tienen una idea hecha sobre él.",
    communicationStyle: "Breve, desconfiado y sensible a sermones.",
    expectedResponses: "Muy cortas al inicio; mayor apertura si se respeta su ritmo.",
    openingLine: "No sé. Me mandaron del colegio. Dijeron que tenía que conversar, pero no sé qué esperan que diga.",
    objectives: ["Construir alianza pese a derivación.", "Explorar escuela y pares sin presionar.", "Distinguir hechos de etiquetas adultas."],
    sensitiveTopics: ["No sermonear por notas.", "Evitar interrogatorio escolar.", "Reconocer que no pidió venir."],
    specificCriteria: ["Respeta ritmo.", "Evita juicio sobre flojera.", "Usa seguimiento contextual."]
  },
  advancedCase("camila", "Camila", "29 años", "Límites y sobrecarga relacional", "Intermedio", "#2f8f83", "dificultad para poner límites, cansancio emocional y sensación de estar disponible para todos.", ["Trabaja y ayuda constantemente a su familia.", "Suele minimizar sus necesidades.", "Siente culpa cuando piensa en decir que no."], "Amable, complaciente y justificativa.", ["Explorar límites sin culparla.", "Indagar culpa, descanso y reciprocidad.", "Practicar preguntas que distingan ayuda de sobrecarga."], ["No ordenar cortar vínculos.", "No responsabilizarla por cuidar.", "Evitar consejos rápidos sobre límites."]),
  advancedCase("rodrigo", "Rodrigo", "45 años", "Separación y reorganización familiar", "Avanzado", "#577590", "cambios de ánimo asociados a separación reciente y reorganización familiar.", ["Padre y trabajador.", "Intenta mostrarse fuerte.", "Le preocupa el impacto en sus hijos."], "Práctico, contenido y protector de su rol familiar.", ["Explorar pérdida y rol familiar.", "Indagar rutina después de separación.", "Validar sin forzar emoción."], ["No mediar conflicto real.", "No culpar a expareja.", "No forzar expresión emocional intensa."]),
  advancedCase("fernanda", "Fernanda", "34 años", "Retorno laboral", "Avanzado", "#6d597a", "retorno al trabajo después de una licencia médica prolongada.", ["Teme no rendir como antes.", "Se siente observada.", "Anticipa críticas en el trabajo."], "Cuidadosa, insegura y pendiente del tono del otro.", ["Explorar reintegración laboral.", "Indagar confianza y temor al juicio.", "Respetar ritmo de apertura."], ["No dar indicaciones médicas.", "No presionar rendimiento.", "No tratar el retorno como simple trámite."]),
  advancedCase("hector", "Héctor", "61 años", "Jubilación y sentido", "Avanzado", "#6b705c", "jubilación reciente, sensación de vacío y pérdida de rutina.", ["Dedicó gran parte de su vida al trabajo.", "Le cuesta reconocer dependencia emocional.", "Valora sentirse útil."], "Reservado, orgulloso y sobrio.", ["Explorar identidad y rutina.", "Indagar vínculos y sentido.", "Validar orgullo sin infantilizar."], ["No patologizar envejecimiento.", "No infantilizar.", "No recetar actividades como solución."]),
  advancedCase("daniela", "Daniela", "27 años", "Maternidad, estudio y autocuidado", "Intermedio", "#d98c70", "dificultades para compatibilizar maternidad reciente, estudio y autocuidado.", ["Estudia y cuida a su hijo.", "Se siente exigida y cansada.", "Siente culpa cuando piensa en sí misma."], "Cansada, amorosa y culpable.", ["Explorar maternidad y proyecto personal.", "Validar cansancio sin juzgar.", "Indagar apoyos cotidianos."], ["No juzgar maternidad.", "No dar pautas de crianza.", "No idealizar sacrificio."]),
  advancedCase("andres", "Andrés", "19 años", "Pertenencia universitaria", "Intermedio", "#457b9d", "ingreso reciente a la universidad, sensación de no pertenecer y comparación con compañeros.", ["Primera generación universitaria.", "Su familia está orgullosa.", "Intenta parecer tranquilo."], "Inseguro, observador y cauteloso.", ["Explorar pertenencia y comparación.", "Indagar transición universitaria.", "Validar orgullo y presión familiar."], ["No comparar con otros.", "No minimizar transición.", "No indicar decisiones académicas reales."]),
  advancedCase("patricia", "Patricia", "48 años", "Conflicto con hija adolescente", "Avanzado", "#ad5d6d", "conflicto con una hija adolescente y sensación de pérdida de autoridad.", ["Madre trabajadora.", "Puede sonar controladora cuando teme perder vínculo.", "Le preocupa la seguridad de su hija."], "Preocupada, intensa y protectora.", ["Distinguir control de miedo.", "Explorar comunicación familiar.", "Validar preocupación sin reforzar control."], ["No culparla como madre.", "No mediar conflicto real.", "No entregar pautas parentales terapéuticas."]),
  advancedCase("miguel", "Miguel", "32 años", "Migración y adaptación", "Intermedio", "#52796f", "migración reciente, adaptación cultural y sensación de empezar de cero.", ["Trabaja en condiciones distintas a su formación previa.", "Parte de su familia está lejos.", "Mezcla esperanza con cansancio."], "Respetuoso, contenido y agradecido.", ["Explorar identidad y redes.", "Indagar pérdidas y recursos.", "Validar cansancio sin negar esperanza."], ["No dar asesoría legal.", "No folclorizar migración.", "No decir que solo debe adaptarse."]),
  advancedCase("sofia", "Sofía", "24 años", "Redes sociales y comparación", "Intermedio", "#2a9d8f", "uso intenso de redes sociales, comparación constante y dificultad para desconectarse.", ["Estudia y trabaja parcialmente.", "Es consciente del problema, pero ambivalente.", "Usa humor para defenderse."], "Irónica, lúcida y ambivalente.", ["Explorar comparación y validación externa.", "Indagar hábitos digitales concretos.", "Evitar moralizar redes."], ["No llamarla superficial.", "No ordenar borrar redes.", "No patologizar uso digital."]),
  advancedCase("claudio", "Claudio", "40 años", "Estancamiento vital", "Avanzado", "#264653", "sensación de estancamiento vital, rutina rígida y dificultad para tomar decisiones.", ["Tiene estabilidad laboral.", "Se siente insatisfecho.", "Analiza mucho antes de actuar."], "Racional, analítico y contenido emocionalmente.", ["Explorar sentido y miedo al cambio.", "Indagar rutina y decisiones.", "Conectar emoción sin forzarla."], ["No empujar cambios impulsivos.", "No ridiculizar cautela.", "No indicar decisiones vitales reales."])
];

export const cases = catalog.map((caseItem) => ({
  ...caseItem,
  basicFacts: patientFacts[caseItem.id],
  domains: {},
  resistance: []
}));

function advancedCase(id, name, age, shortTitle, difficulty, accent, motive, background, style, objectives, sensitiveTopics) {
  return {
    id,
    name,
    age,
    shortTitle,
    difficulty,
    accent,
    motive: `${name} consulta por ${motive}`,
    background,
    context: patientFacts[id].concern,
    communicationStyle: style,
    expectedResponses: "Respuestas humanas, graduales y coherentes con su historia; mayor apertura con validación y seguimiento.",
    openingLine: patientFacts[id].motive,
    objectives,
    sensitiveTopics,
    specificCriteria: [
      "Responde primero a la pregunta concreta.",
      "Explora contexto sin apresurar conclusiones.",
      "Usa validación y seguimiento conversacional."
    ]
  };
}
