export const guidedInterventionTypes = [
  {
    id: "saludo_encuadre",
    label: "Saludo / encuadre",
    intent: "encuadre_o_consentimiento",
    stageHint: "apertura_encuadre"
  },
  {
    id: "motivo_consulta",
    label: "Motivo de consulta",
    intent: "motivo_de_consulta",
    stageHint: "motivo_consulta"
  },
  {
    id: "pregunta_abierta",
    label: "Pregunta abierta",
    intent: "respuesta_general",
    stageHint: "motivo_consulta"
  },
  {
    id: "validacion_emocional",
    label: "Validacion emocional",
    intent: "validacion_emocional",
    stageHint: "emocion_principal"
  },
  {
    id: "seguimiento",
    label: "Seguimiento",
    intent: "seguimiento_contextual",
    stageHint: "preocupacion_principal"
  },
  {
    id: "contexto_familiar_social",
    label: "Contexto familiar o social",
    intent: "exploracion_contextual",
    stageHint: "contexto_basico"
  },
  {
    id: "ocupacion_vivienda",
    label: "Ocupacion / vivienda",
    intent: "ocupacion_actividad",
    stageHint: "contexto_basico"
  },
  {
    id: "exploracion_emocional",
    label: "Exploracion emocional",
    intent: "exploracion_emocional",
    stageHint: "emocion_principal"
  },
  {
    id: "recursos_personales",
    label: "Recursos personales",
    intent: "preferencias_valoracion",
    stageHint: "recursos_personales"
  },
  {
    id: "cierre_sesion",
    label: "Cierre de sesion",
    intent: "cierre",
    stageHint: "cierre_continuidad"
  }
];

export const sessionStageFlow = {
  1: [
    { name: "apertura_encuadre", label: "Apertura y encuadre" },
    { name: "motivo_consulta", label: "Motivo de consulta" },
    { name: "contexto_basico", label: "Contexto basico" },
    { name: "emocion_principal", label: "Emocion principal" },
    { name: "preocupacion_principal", label: "Preocupacion principal" },
    { name: "cierre_continuidad", label: "Cierre o continuidad" }
  ],
  2: [
    { name: "retomar_sesion", label: "Retomar sesion anterior" },
    { name: "profundizar_motivo", label: "Profundizar motivo" },
    { name: "explorar_patrones", label: "Explorar patrones" },
    { name: "impacto_cotidiano", label: "Impacto cotidiano" },
    { name: "tema_pendiente", label: "Tema pendiente" },
    { name: "cierre_continuidad", label: "Cierre" }
  ],
  3: [
    { name: "retomar_proceso", label: "Retomar proceso" },
    { name: "contexto_relacional", label: "Contexto relacional" },
    { name: "recursos_personales", label: "Recursos personales" },
    { name: "redes_apoyo", label: "Redes de apoyo" },
    { name: "ordenar_comprension", label: "Ordenar comprension" },
    { name: "cierre_continuidad", label: "Cierre" }
  ],
  4: [
    { name: "retomar_proceso", label: "Retomar proceso" },
    { name: "sintesis_problema", label: "Sintesis del problema" },
    { name: "aprendizajes_proceso", label: "Aprendizajes del proceso" },
    { name: "recursos_proximos_pasos", label: "Recursos y proximos pasos simulados" },
    { name: "cierre_formativo_final", label: "Cierre formativo final" }
  ]
};

export const guidedStageSuggestions = {
  apertura_encuadre: [
    "Antes de comenzar, quisiera explicarte el objetivo de esta entrevista.",
    "Que te gustaria que entendiera de lo que estas viviendo?",
    "Puedes tomarte tu tiempo para responder."
  ],
  motivo_consulta: [
    "Que te trae por aca hoy?",
    "Que te preocupa mas de esto?",
    "Desde cuando sientes que esto ocurre?"
  ],
  contexto_basico: [
    "Como es esto en tu casa o con las personas cercanas?",
    "Que pasa en tu rutina cuando aparece esta preocupacion?",
    "Donde vives o con quien compartes tu dia a dia?"
  ],
  emocion_principal: [
    "Que sientes cuando esto aparece?",
    "Que parte de esto te cuesta mas decir?",
    "Tiene sentido que esto sea importante para ti."
  ],
  preocupacion_principal: [
    "Que es lo que mas te preocupa de todo esto?",
    "A que te refieres con eso?",
    "Que crees que queda mas abierto para seguir conversando?"
  ],
  recursos_personales: [
    "Que te ha ayudado aunque sea un poco?",
    "Con quien puedes hablar cuando esto se vuelve mas pesado?",
    "Que cosas tuyas te han sostenido hasta ahora?"
  ],
  cierre_continuidad: [
    "Antes de terminar, me gustaria resumir lo que conversamos.",
    "Como te vas despues de esta conversacion?",
    "Podriamos continuar en una proxima sesion simulada."
  ],
  retomar_sesion: [
    "La vez pasada hablamos de varias cosas. Que quedo dando vueltas?",
    "Que te parecio importante de la conversacion anterior?",
    "Por donde te gustaria que retomemos hoy?"
  ],
  profundizar_motivo: [
    "Que parte de esto se ha hecho mas clara desde la sesion anterior?",
    "Que sigue siendo dificil de explicar?",
    "Como se expresa esto en tu dia a dia?"
  ],
  explorar_patrones: [
    "Cuando suele repetirse esto?",
    "Que pasa justo antes de que aparezca esta reaccion?",
    "Que haces despues cuando esto ocurre?"
  ],
  impacto_cotidiano: [
    "Como impacta esto tu rutina?",
    "Que cambia en tus relaciones cuando esto aparece?",
    "Que momentos del dia se vuelven mas dificiles?"
  ],
  tema_pendiente: [
    "Que tema sientes que todavia queda pendiente?",
    "Que seria importante no dejar fuera?",
    "Que te gustaria retomar con mas calma?"
  ],
  contexto_relacional: [
    "Como reaccionan las personas cercanas cuando esto ocurre?",
    "Que lugar ocupas tu en esa dinamica?",
    "Que se repite en tus relaciones cuando aparece este tema?"
  ],
  redes_apoyo: [
    "Con quien cuentas hoy?",
    "A quien podrias pedir apoyo sin sentirte tan expuesto?",
    "Que tipo de apoyo te resulta mas posible?"
  ],
  ordenar_comprension: [
    "Si ordenaramos lo conversado, que seria lo mas importante?",
    "Que crees que entendimos mejor hasta ahora?",
    "Que parte de esta situacion todavia falta mirar?"
  ],
  sintesis_problema: [
    "Como resumirias lo que has ido entendiendo?",
    "Que se ha repetido en estas conversaciones?",
    "Que tema parece estar al centro de lo que te ocurre?"
  ],
  aprendizajes_proceso: [
    "Que aprendiste de ti en estas sesiones simuladas?",
    "Que te resulto util ordenar?",
    "Que mirada nueva aparece sobre esto?"
  ],
  recursos_proximos_pasos: [
    "Que recurso tuyo quieres recordar despues de este proceso?",
    "Que proximo paso simulado se ve mas realista?",
    "Que te gustaria seguir cuidando?"
  ],
  cierre_formativo_final: [
    "Antes de cerrar el proceso, que te llevas de estas conversaciones?",
    "Que queda mas ordenado que al inicio?",
    "Como te gustaria cerrar esta simulacion?"
  ]
};

export function getGuidedInterventionType(typeId) {
  return guidedInterventionTypes.find((type) => type.id === typeId) || null;
}

export function getSessionStages(sessionNumber = 1) {
  return sessionStageFlow[sessionNumber] || sessionStageFlow[1];
}

export function getStageSuggestions(stageName) {
  return guidedStageSuggestions[stageName] || guidedStageSuggestions.motivo_consulta;
}

export function resolveConversationStage({
  sessionNumber = 1,
  history = [],
  selectedInterventionType = ""
} = {}) {
  const stages = getSessionStages(sessionNumber);
  const selectedType = getGuidedInterventionType(selectedInterventionType);
  const completedStages = Array.from(
    new Set(
      history
        .map((entry) => entry.conversationStage?.stageName || entry.analysis?.guidedIntervention?.stageName)
        .filter(Boolean)
    )
  );
  const guidedTurnCount = history.filter((entry) => !entry.isSessionPrelude).length;
  const naturalIndex = Math.min(guidedTurnCount, stages.length - 1);
  const targetStageName = selectedType?.stageHint || stages[naturalIndex]?.name || stages[0].name;
  const stageIndex = Math.max(0, stages.findIndex((stage) => stage.name === targetStageName));
  const stage = stages[stageIndex] || stages[naturalIndex] || stages[0];

  return {
    sessionNumber,
    stageName: stage.name,
    stageLabel: stage.label,
    stageIndex,
    completedStages
  };
}
