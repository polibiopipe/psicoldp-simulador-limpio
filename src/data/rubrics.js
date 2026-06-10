export const feedbackRubric = {
  encuadre: {
    label: "Encuadre inicial",
    description: "Explica el propósito de la entrevista, confidencialidad y límites éticos."
  },
  vinculo: {
    label: "Vínculo y clima de confianza",
    description: "Construye una interacción respetuosa, cálida y no enjuiciadora."
  },
  preguntasAbiertas: {
    label: "Preguntas abiertas",
    description: "Usa preguntas que favorecen exploración y no solo respuestas cerradas."
  },
  escuchaValidacion: {
    label: "Escucha y validación",
    description: "Reconoce emociones y significados sin apresurarse a aconsejar."
  },
  exploracionMotivo: {
    label: "Exploración del motivo de consulta",
    description: "Indaga qué trae al paciente, cómo lo vive y qué contexto lo rodea."
  },
  seguimientoContextual: {
    label: "Seguimiento contextual",
    description: "Retoma frases del paciente y profundiza en lo que acaba de decir."
  },
  eticaRiesgo: {
    label: "Ética y señales de riesgo",
    description: "Considera confidencialidad, límites y señales que podrían requerir derivación o apoyo."
  },
  cierre: {
    label: "Cierre de entrevista",
    description: "Resume, valida y deja continuidad o próximos pasos formativos."
  }
};

export const rubricCriteria = Object.entries(feedbackRubric).map(([id, item]) => ({
  id,
  title: item.label,
  description: item.description
}));

export const levelLabels = {
  achieved: "Logrado",
  partial: "Parcialmente logrado",
  needsWork: "Requiere mejorar",
  notObserved: "No observado"
};
