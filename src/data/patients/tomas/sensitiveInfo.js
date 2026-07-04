export const tomasSensitiveInfo = {
  earlyBoundary: "Prefiero ir de a poco con eso. Me cuesta hablarlo si siento que ya hay una idea hecha.",
  riskResponse: "No se... no como matarme ni eso. Pero a veces si he pensado que seria mas facil no estar un rato. Como apagarme.",
  substanceResponse: "No, no consumo alcohol ni otras sustancias. No es un tema para mi.",
  items: [
    {
      id: "oral_presentation_shame",
      label: "exposicion oral y verguenza",
      keywords: ["exposicion", "risa", "verguenza", "ridiculo", "octavo"],
      content: "En octavo se quedo en blanco en una exposicion y se rieron; desde ahi evita hablar frente a otros.",
      revealConditions: { minTrust: 30, minSession: 1, requires: ["validacion", "pregunta_respetuosa"] }
    },
    {
      id: "passive_disappear_thoughts",
      label: "pensamientos pasivos de desaparecer",
      keywords: ["desaparecer", "apagarme", "no estar", "hacerte dano", "suicid"],
      content: "No hay plan activo, pero puede pensar que seria mas facil apagarse un rato.",
      revealConditions: { minTrust: 40, minSession: 1, requires: ["pregunta_cuidadosa", "encuadre"] }
    },
    {
      id: "online_identity_loss",
      label: "miedo a no valer fuera del juego",
      keywords: ["juego", "computador", "servir", "valer", "online"],
      content: "Teme que fuera del juego no haya nada en lo que sea realmente bueno.",
      revealConditions: { minTrust: 35, minSession: 2, requires: ["validacion"] }
    }
  ]
};
