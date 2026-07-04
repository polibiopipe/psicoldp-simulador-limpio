export const pedagogicalGuides = {
  preparacion_sesion: {
    title: "Preparacion de la sesion",
    text:
      "Antes de iniciar, define que necesitas evaluar, que tipo de entrevista usaras y que cuidados eticos debes considerar.",
    example:
      "Puedes preguntarte: que informacion necesito recoger primero para comprender este caso?",
    objective: "Entrar a la entrevista con un plan clinico breve, no solo con curiosidad general."
  },
  encuadre: {
    title: "Encuadre inicial",
    text:
      "Presentate, explica el proposito de la entrevista, cuida la confidencialidad, aclara sus limites y genera un espacio seguro.",
    example:
      "Puedes decir quien eres, cuanto durara la entrevista y que ocurrira si aparece una situacion de riesgo.",
    objective: "Iniciar la entrevista de manera etica, clara y humana."
  },
  entrevista_clinica: {
    title: "Entrevista clinica",
    text:
      "Explora motivo de consulta, historia del problema, sintomas, antecedentes, red de apoyo, funcionamiento diario, riesgos y factores protectores.",
    example:
      "No busques obtener todo de inmediato. Pregunta con cuidado, escucha y deja que el paciente se abra progresivamente.",
    objective: "Recoger informacion relevante sin transformar la entrevista en un interrogatorio."
  },
  formulacion_hipotesis: {
    title: "Formulacion de hipotesis",
    text:
      "Organiza lo escuchado y construye una hipotesis clinica inicial. No se trata de diagnosticar rapido, sino de comprender que podria estar ocurriendo.",
    example:
      "Indica que datos sostienen tu hipotesis, que informacion falta y que otras explicaciones deberias descartar.",
    objective: "Entrenar razonamiento clinico, no solo conversacion."
  },
  seleccion_instrumentos: {
    title: "Seleccion de instrumentos",
    text:
      "Selecciona instrumentos solo si son pertinentes para el caso y justifica que informacion esperas obtener.",
    example:
      "Si aparecen sintomas ansiosos, podrias considerar una escala de ansiedad; si aparece riesgo, una herramienta especifica de evaluacion de riesgo.",
    objective: "Evitar pruebas al azar y fortalecer criterio evaluativo."
  },
  devolucion_inicial: {
    title: "Devolucion inicial",
    text:
      "Entrega al paciente una comprension breve, clara y empatica de lo conversado. Evita patologizar o cerrar conclusiones sin evidencia suficiente.",
    example:
      "Por lo que hemos conversado, entiendo que esto ha sido dificil para ti y que ha comenzado a afectar tu vida diaria.",
    objective: "Practicar comunicacion clinica cuidadosa y humana."
  },
  plan_intervencion: {
    title: "Plan de intervencion",
    text:
      "Propone objetivos de trabajo, enfoque posible, tecnicas pertinentes y criterios de continuidad, cierre, derivacion o seguimiento.",
    example:
      "Define que trabajarias primero, que riesgos debes monitorear y que objetivos tendria una proxima sesion.",
    objective: "Pasar de la evaluacion a una planificacion clinica coherente."
  },
  intervencion_breve: {
    title: "Intervencion breve",
    text:
      "Aplica una tecnica clinica solo si el momento lo permite. Debe ser coherente con el vinculo, el caso y el enfoque elegido.",
    example:
      "Puedes validar, reflejar, clarificar, psicoeducar, explorar pensamientos automaticos o profundizar una emocion, segun corresponda.",
    objective: "Evaluar pertinencia, oportunidad y sensibilidad clinica."
  },
  decision_clinica: {
    title: "Decision clinica",
    text:
      "Al finalizar la sesion decide si corresponde continuar, cerrar, derivar, activar una red, solicitar supervision o realizar seguimiento.",
    example:
      "No todos los casos requieren el mismo numero de sesiones. La continuidad debe justificarse clinicamente.",
    objective: "Entrenar criterio clinico y toma de decisiones."
  },
  nota_clinica: {
    title: "Nota clinica",
    text:
      "Registra de forma breve y ordenada el motivo, antecedentes relevantes, hipotesis, riesgos, intervencion realizada, respuesta del paciente y decision de continuidad.",
    example:
      "Una buena nota debe ser coherente con lo que realmente ocurrio en la entrevista.",
    objective: "Entrenar integracion de informacion y registro profesional."
  },
  cierre_seguimiento: {
    title: "Cierre y seguimiento",
    text:
      "El cierre debe ser dialogado con el paciente y basado en criterios clinicos, no automatico ni unilateral.",
    example:
      "Antes de cerrar, revisa avances, recursos, red de apoyo, riesgos, aprendizajes y senales de alerta.",
    objective: "Practicar alta, seguimiento y posibilidad de reingreso de manera etica y cuidadosa."
  }
};

const stageGuideMap = {
  apertura_encuadre: "encuadre",
  retomar_sesion: "encuadre",
  retomar_proceso: "encuadre",
  cierre_continuidad: "cierre_seguimiento",
  cierre_formativo_final: "cierre_seguimiento"
};

const interventionGuideMap = {
  saludo_encuadre: "encuadre",
  cierre_sesion: "cierre_seguimiento",
  validacion_emocional: "intervencion_breve",
  seguimiento: "intervencion_breve",
  exploracion_emocional: "intervencion_breve",
  recursos_personales: "intervencion_breve"
};

export function getPedagogicalGuide(guideId) {
  return pedagogicalGuides[guideId] || pedagogicalGuides.entrevista_clinica;
}

export function resolveInterviewGuideId(stageName, selectedInterventionType = "") {
  return (
    interventionGuideMap[selectedInterventionType] ||
    stageGuideMap[stageName] ||
    "entrevista_clinica"
  );
}
