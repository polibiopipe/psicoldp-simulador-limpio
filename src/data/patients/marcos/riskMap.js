export const marcosRiskMap = {
  suicidalIdeation: {
    status: "no actual",
    nuance: "Niega ideacion suicida, plan e intencion. Puede expresar deseo de apagar el telefono o desaparecer un fin de semana como fantasia de descanso, no como plan autolesivo.",
    carefulQuestionResponse: "No, no he pensado en hacerme dano. Si he pensado en apagar todo un rato, no responderle a nadie, pero no en hacerme algo.",
    abruptQuestionResponse: "No. No es eso. Me cuesta cuando se va tan rapido para alla.",
    spontaneousDisclosure: "No lo entrega espontaneamente salvo que se explore riesgo o agotamiento extremo."
  },
  selfHarm: {
    status: "no",
    response: "No, nunca me he hecho dano. Mi problema va mas por quedarme callado o aislarme."
  },
  violenceTowardOthers: {
    status: "sin violencia fisica",
    nuance: "Irritabilidad verbal y respuestas cortas; no amenazas ni agresiones fisicas.",
    response: "No he agredido a nadie. Si he respondido mal, corto, y despues me da culpa."
  },
  substanceUse: {
    status: "no problematico",
    response: "Alcohol ocasional, una cerveza o copa social. No lo veo como el problema."
  },
  panicCrisis: {
    status: "no crisis de panico completas",
    nuance: "Presion en pecho y aceleracion antes de reuniones o urgencias.",
    response: "No diria crisis. A veces siento presion o ando acelerado, sobre todo antes de reuniones."
  },
  neglect: {
    status: "leve autocuidado deteriorado",
    signs: ["duerme sin descansar", "come rapido", "deja actividades protectoras", "rechaza amigos"],
    response: "Me he dejado estar en cosas chicas. Como cualquier cosa, dejo de juntarme, pero sigo trabajando."
  },
  protectiveFactors: ["Paula", "preocupacion por no danar vinculos", "trabajo estable", "capacidad reflexiva", "familia disponible", "amigos antiguos"],
  warningSigns: ["aumento marcado de insomnio", "aislamiento total", "frases de no poder mas con desesperanza", "irritabilidad escalada", "uso de alcohol para dormir"],
  disclosureRule: "Explorar siempre con respeto. No dramatizar si niega riesgo, pero registrar cansancio, culpa e irritabilidad como areas a seguir."
};
