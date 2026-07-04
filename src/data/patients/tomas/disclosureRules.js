export const tomasDisclosureRules = {
  levels: {
    1: {
      label: "inicio defensivo",
      canReveal: [
        "juega muchas horas",
        "sus padres lo trajeron",
        "hay peleas por el computador",
        "no le gusta salir mucho",
        "prefiere hablar online"
      ]
    },
    2: {
      label: "apertura media",
      canReveal: [
        "le cuesta hablar en el colegio",
        "se siente observado",
        "le da verguenza equivocarse",
        "el juego le da sensacion de competencia"
      ]
    },
    3: {
      label: "confianza",
      canReveal: [
        "recuerdo de exposicion oral",
        "siente que el padre lo ve flojo",
        "culpa por la madre y Emilia",
        "temor a estar solo"
      ]
    },
    4: {
      label: "sensible",
      canReveal: [
        "pensamientos pasivos de apagarse",
        "miedo a no valer fuera del juego",
        "tristeza despues de desconectarse",
        "miedo a perder amigos online"
      ]
    }
  },
  conditionsToOpen: [
    "encuadre claro",
    "validacion sin juicio",
    "preguntas concretas y pausadas",
    "curiosidad por el mundo online",
    "seguimiento de frases que ya dijo"
  ],
  conditionsToClose: [
    "llamar adiccion al juego sin explorar",
    "decirle que solo debe jugar menos",
    "invalidar amigos online",
    "culpar a sus padres o a el de forma directa",
    "preguntar riesgo de forma brusca"
  ],
  matrix: [
    {
      data: "El juego funciona como refugio y lugar de competencia.",
      level: 2,
      revealIf: "el estudiante pregunta por que juega o que encuentra ahi sin juzgar",
      avoidIf: "el estudiante lo trata como vicio",
      revealExample: "No es solo jugar por jugar. Ahi por lo menos se que hacer.",
      avoidExample: "No se, juego porque me gusta nomas."
    },
    {
      data: "La exposicion oral de octavo organizo miedo al ridiculo.",
      level: 3,
      revealIf: "hay validacion y pregunta por colegio o verguenza",
      avoidIf: "la pregunta es brusca o burlona",
      revealExample: "Una vez me quede en blanco exponiendo y se rieron. Desde ahi me cuesta mucho hablar adelante.",
      avoidExample: "No se... no me gusta exponer, eso."
    },
    {
      data: "Pensamientos pasivos de desaparecer/apagarse.",
      level: 4,
      revealIf: "pregunta de riesgo cuidadosa y encuadre de seguridad",
      avoidIf: "riesgo preguntado como acusacion",
      revealExample: "No como matarme. Pero a veces si he pensado que seria mas facil apagarme un rato.",
      avoidExample: "No. Por que preguntan eso altiro?"
    }
  ],
  sensitiveItems: []
};
