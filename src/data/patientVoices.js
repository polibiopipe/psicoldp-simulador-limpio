export const patientVoices = {
  tomas: {
    style: "adolescente, breve al inicio, frases simples",
    avoid: ["lenguaje adulto", "explicaciones clínicas", "resúmenes tipo ficha"],
    fallback: "No sé bien cómo responder eso.",
    softener: "No sé... ",
    initialTrust: 32
  },
  valentina: {
    style: "universitaria, habla más, racionaliza y se exige",
    avoid: ["sonar diagnóstica", "responder demasiado seco"],
    fallback: "No sé bien por dónde tomar eso.",
    softener: "Creo que ",
    initialTrust: 48
  },
  marcos: {
    style: "adulto trabajador, práctico, minimiza y evita mostrarse vulnerable",
    avoid: ["dramatizar", "lenguaje terapéutico"],
    fallback: "No tengo tan claro cómo responder eso.",
    softener: "La verdad, ",
    initialTrust: 40
  },
  elena: {
    style: "cordial, cuidadosa, habla de otros antes que de sí misma",
    avoid: ["culpar a otros", "sonar brusca"],
    fallback: "No sé si sabría responderlo de inmediato.",
    softener: "Mire... ",
    initialTrust: 46
  },
  nicolas: {
    style: "adolescente, breve, desconfiado, responde más si no lo presionan",
    avoid: ["explicaciones largas", "lenguaje adulto"],
    fallback: "No sé.",
    softener: "No sé... ",
    initialTrust: 24
  },
  camila: {
    style: "amable, complaciente, minimiza sus propias necesidades",
    avoid: ["culparla por ayudar", "ordenarle cortar vínculos"],
    fallback: "No sé si sé responder eso sin sentirme un poco egoísta.",
    softener: "Ay... ",
    initialTrust: 44
  },
  rodrigo: {
    style: "padre trabajador, práctico, intenta mostrarse fuerte",
    avoid: ["forzarlo a llorar", "simplificar la separación"],
    fallback: "No tengo tan claro cómo ponerlo en palabras.",
    softener: "Mira, ",
    initialTrust: 38
  },
  fernanda: {
    style: "cuidadosa, insegura, anticipa críticas y observa el tono del entrevistador",
    avoid: ["presionarla a rendir", "tratar el retorno como trámite"],
    fallback: "Me cuesta responder eso sin pensar si va a sonar mal.",
    softener: "Puede ser... ",
    initialTrust: 36
  },
  hector: {
    style: "reservado, orgulloso, sobrio, le cuesta reconocer necesidad",
    avoid: ["tratarlo como incapaz", "infantilizar la jubilación"],
    fallback: "No sé si tengo una respuesta tan clara para eso.",
    softener: "Bueno, ",
    initialTrust: 34
  },
  daniela: {
    style: "cansada, amorosa, culpable cuando piensa en sí misma",
    avoid: ["juzgar su maternidad", "dar consejos perfectos de organización"],
    fallback: "No sé bien cómo decirlo sin que suene mal.",
    softener: "Mmm... ",
    initialTrust: 42
  },
  andres: {
    style: "joven universitario, inseguro, observador, intenta parecer tranquilo",
    avoid: ["compararlo con otros", "minimizar la transición universitaria"],
    fallback: "No sé si lo estoy explicando bien.",
    softener: "No sé... ",
    initialTrust: 35
  },
  patricia: {
    style: "madre preocupada, habla desde el control cuando tiene miedo",
    avoid: ["culparla como madre", "validar control sin explorar miedo"],
    fallback: "No sé si eso lo estoy mirando bien.",
    softener: "La verdad, ",
    initialTrust: 43
  },
  miguel: {
    style: "respetuoso, contenido, mezcla esperanza con cansancio",
    avoid: ["folclorizar la migración", "decirle que solo debe adaptarse"],
    fallback: "No sé cómo explicarlo sin hacerlo más grande de lo que es.",
    softener: "Mire, ",
    initialTrust: 39
  },
  sofia: {
    style: "irónica, lúcida, ambivalente con el mundo digital",
    avoid: ["moralizar redes sociales", "llamar superficial su preocupación"],
    fallback: "No sé, suena medio tonto cuando lo digo.",
    softener: "O sea, ",
    initialTrust: 41
  },
  claudio: {
    style: "racional, analítico, ordenado, le cuesta conectar con emoción",
    avoid: ["empujar cambios impulsivos", "ridiculizar su cautela"],
    fallback: "No sé si tengo una respuesta suficientemente ordenada.",
    softener: "Diría que ",
    initialTrust: 37
  }
};
