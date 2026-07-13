import { responseBank as baseBank } from "./responseProfiles.js";

const categoryMap = {
  pregunta_abierta: "open",
  pregunta_cerrada: "closed",
  encuadre_o_consentimiento: "validation",
  validacion_emocional: "validation",
  juicio_o_critica: "judgment",
  consejo_apresurado: "advice",
  exploracion_familiar: "family",
  exploracion_emocional: "emotion",
  exploracion_academica_escolar_laboral: "schoolWork",
  exploracion_redes_apoyo: "support",
  exploracion_contextual: "schoolWork",
  cierre_adecuado: "goodClosure",
  cierre_apresurado: "prematureClosure",
  respuesta_general: "open"
};

const basicResponseBank = {
  tomas: {
    saludo: {
      apertura_baja: ["Hola."],
      apertura_media: ["Hola.", "Hola... si."],
      apertura_alta: ["Hola.", "Hola, si."]
    },
    nombre: {
      apertura_baja: ["Me llamo Tomás."],
      apertura_media: ["Me llamo Tomás."],
      apertura_alta: ["Me llamo Tomás."]
    },
    edad: {
      apertura_baja: ["Tengo 18."],
      apertura_media: ["Tengo 18."],
      apertura_alta: ["Tengo 18."]
    },
    presentacion_inicial: {
      apertura_baja: ["Ya."],
      apertura_media: ["Ya, entiendo."],
      apertura_alta: ["Ya, esta bien."]
    },
    motivo_de_consulta: {
      apertura_baja: [
        "Es por el computador, creo. Eso dicen mis papas.",
        "Me trajeron porque dicen que juego mucho.",
        "No se... en mi casa creen que estoy demasiado encerrado.",
        "Supongo que es porque no salgo tanto.",
        "Mi mama dice que casi no hablo y que paso puro jugando."
      ],
      apertura_media: [
        "Mis papas dicen que paso mucho tiempo jugando y que casi no salgo. Yo siento que ellos ven solo esa parte.",
        "Es por los videojuegos, pero no creo que sea solo eso. A veces afuera me siento incomodo.",
        "Me trajeron porque dicen que estoy aislado. Igual no se como explicarles que no siempre quiero estar con gente.",
        "En mi casa todo termina siendo por el computador. Pero para mi jugar tambien es una forma de estar tranquilo.",
        "Dicen que estoy encerrado. Puede ser, pero no es que quiera pelear con todos."
      ],
      apertura_alta: [
        "Creo que juego porque ahi me siento menos raro. En persona me cuesta saber que decir.",
        "No es solo que me guste jugar. A veces me conecto porque afuera siento que no encajo.",
        "Mis papas ven el juego como el problema, pero para mi tambien es el lugar donde no me siento tan observado.",
        "Me cuesta estar con gente. En el juego por lo menos se que hacer.",
        "Creo que vine por eso... porque en mi casa estan preocupados y yo tampoco se muy bien como salir de esto."
      ]
    }
  },
  valentina: {
    saludo: {
      apertura_baja: ["Hola... si, gracias."],
      apertura_media: ["Hola... si, gracias.", "Hola, gracias."],
      apertura_alta: ["Hola, gracias.", "Hola... si."]
    },
    nombre: {
      apertura_baja: ["Valentina."],
      apertura_media: ["Valentina."],
      apertura_alta: ["Valentina."]
    },
    edad: {
      apertura_baja: ["Tengo 21."],
      apertura_media: ["Tengo 21."],
      apertura_alta: ["Tengo 21."]
    },
    presentacion_inicial: {
      apertura_baja: ["Ya, entiendo."],
      apertura_media: ["Perfecto, gracias."],
      apertura_alta: ["Si, entiendo. Gracias por explicarlo."]
    },
    motivo_de_consulta: {
      apertura_baja: [
        "Estoy un poco sobrepasada con la universidad.",
        "Creo que es por estres, nada tan grave.",
        "No me esta alcanzando el tiempo.",
        "Me cuesta organizarme, supongo.",
        "Vine porque me he sentido muy cansada."
      ],
      apertura_media: [
        "Estoy muy sobrepasada con la universidad. Me cuesta parar, y cuando paro me siento culpable.",
        "Siento que siempre deberia estar haciendo algo. Incluso cuando descanso, mi cabeza sigue pensando en pendientes.",
        "La universidad me tiene agotada, pero tambien siento que no puedo bajar el ritmo.",
        "Mi familia espera mucho de mi y yo tambien. Entonces me cuesta permitirme fallar.",
        "No se si estoy cansada o si simplemente no estoy rindiendo como deberia."
      ],
      apertura_alta: [
        "Creo que me da miedo decepcionar. Si bajo un poco el ritmo, siento que todos van a notar que no soy tan capaz.",
        "Me cuesta descansar porque siento que mi valor depende de cumplir.",
        "A veces pienso que si no puedo con todo, entonces estoy fallando.",
        "No es solo la universidad. Es la sensacion de que tengo que demostrar todo el tiempo que puedo.",
        "Me agota vivir como si cualquier pausa fuera una falta."
      ]
    }
  },
  marcos: {
    saludo: {
      apertura_baja: ["Hola."],
      apertura_media: ["Hola.", "Hola, buenas."],
      apertura_alta: ["Hola.", "Hola, gracias."]
    },
    nombre: {
      apertura_baja: ["Marcos."],
      apertura_media: ["Marcos."],
      apertura_alta: ["Marcos."]
    },
    edad: {
      apertura_baja: ["Tengo 38."],
      apertura_media: ["Tengo 38."],
      apertura_alta: ["Tengo 38."]
    },
    presentacion_inicial: {
      apertura_baja: ["Ya."],
      apertura_media: ["Ya, entiendo."],
      apertura_alta: ["Esta bien, entiendo."]
    },
    motivo_de_consulta: {
      apertura_baja: [
        "Ando cansado, mas irritable.",
        "Creo que es estres de la pega.",
        "No es tan grave, pero me he sentido mas pesado.",
        "Vine porque me dijeron que seria bueno hablar.",
        "Estoy funcionando, pero mas cansado de lo normal."
      ],
      apertura_media: [
        "Ultimamente ando mas irritable y cansado. Llego a la casa sin energia.",
        "En la pega sigo cumpliendo, pero cada vez me cuesta mas.",
        "Me molesta que cualquier cosa me haga reaccionar mal.",
        "No se si es solo trabajo, pero siento que ya no disfruto nada como antes.",
        "Estoy agotado, aunque me cuesta reconocerlo."
      ],
      apertura_alta: [
        "Me da miedo estar fallando. En la pega cumplo, pero en la casa llego apagado.",
        "Antes sentia que mi trabajo tenia sentido. Ahora solo hago lo que toca.",
        "Siento que estoy siendo una version peor de mi, mas corto, mas pesado, mas ausente.",
        "Me preocupa que mi familia reciba lo peor de mi despues del trabajo.",
        "No se en que momento me acostumbre a estar siempre cansado."
      ]
    }
  },
  elena: {
    saludo: {
      apertura_baja: ["Hola, muchas gracias."],
      apertura_media: ["Hola, muchas gracias.", "Hola, gracias por recibirme."],
      apertura_alta: ["Hola, muchas gracias.", "Hola, que amable."]
    },
    nombre: {
      apertura_baja: ["Me llamo Elena."],
      apertura_media: ["Me llamo Elena."],
      apertura_alta: ["Me llamo Elena."]
    },
    edad: {
      apertura_baja: ["Tengo 52."],
      apertura_media: ["Tengo 52."],
      apertura_alta: ["Tengo 52."]
    },
    presentacion_inicial: {
      apertura_baja: ["Ya, muchas gracias."],
      apertura_media: ["Entiendo, muchas gracias por explicarme."],
      apertura_alta: ["Si, entiendo. Me deja mas tranquila saberlo."]
    },
    motivo_de_consulta: {
      apertura_baja: [
        "Me he sentido un poco sola.",
        "No se si es algo tan importante.",
        "Vine porque ultimamente me cuesta mas estar tranquila.",
        "Hay cosas familiares que me tienen preocupada.",
        "No quiero preocupar a nadie, pero me he sentido distinta."
      ],
      apertura_media: [
        "Me he sentido mas sola de lo que quiero reconocer. Me cuesta decirlo porque no quiero preocupar a mis hijos.",
        "Siempre he estado pendiente de los demas, pero ahora no se bien que hacer conmigo.",
        "Hay conflictos familiares y trato de no meter mas problemas, pero igual me afectan.",
        "Me cuesta pedir ayuda. Siento que molesto.",
        "A veces hago como que estoy bien para que los demas no se preocupen."
      ],
      apertura_alta: [
        "Creo que me da miedo necesitar a otros. Siempre fui yo la que sostenia, no la que pedia.",
        "Me pregunto que lugar tengo ahora, cuando ya no todos me necesitan de la misma forma.",
        "Me siento sola, pero tambien me cuesta decirle a alguien que lo estoy.",
        "No quiero ser una carga, por eso muchas veces me guardo lo que siento.",
        "A veces pienso que he cuidado tanto a otros que no aprendi a cuidarme a mi."
      ]
    }
  },
  nicolas: {
    saludo: {
      apertura_baja: ["Hola."],
      apertura_media: ["Hola.", "Hola..."],
      apertura_alta: ["Hola.", "Hola, si."]
    },
    nombre: {
      apertura_baja: ["Nicolás."],
      apertura_media: ["Nicolás."],
      apertura_alta: ["Nicolás."]
    },
    edad: {
      apertura_baja: ["Tengo 18."],
      apertura_media: ["Tengo 18."],
      apertura_alta: ["Tengo 18."]
    },
    presentacion_inicial: {
      apertura_baja: ["Ya."],
      apertura_media: ["Ya, esta bien."],
      apertura_alta: ["Ya, entiendo."]
    },
    motivo_de_consulta: {
      apertura_baja: [
        "Me mandaron del colegio.",
        "No se. Dijeron que tenia que venir.",
        "Porque no participo mucho, creo.",
        "Dicen que baje las notas.",
        "No fue idea mia."
      ],
      apertura_media: [
        "Me mandaron porque dicen que estoy mas callado y que baje las notas.",
        "En el colegio creen que algo me pasa, pero no se si de verdad les importa.",
        "Dicen que no participo. Yo prefiero quedarme piola.",
        "Me trajeron porque estoy mas desconectado, segun ellos.",
        "Supongo que estan preocupados, pero a veces siento que solo quieren que no moleste."
      ],
      apertura_alta: [
        "Creo que nadie me pregunta mucho antes de decidir que me pasa.",
        "Me siento visto solo cuando dejo de hacer lo que esperan.",
        "No es que no tenga nada que decir. Es que casi nunca siento que valga la pena decirlo.",
        "Me quedo callado porque asi evito problemas.",
        "A veces siento que para los adultos soy flojo o raro, pero no alguien que esta tratando de entenderse."
      ]
    }
  }
};

const humanContinuations = {
  tomas: {
    apertura_baja: [
      "No se... me cuesta hablar de eso.",
      "Igual no quiero que se arme otro reto.",
      "Prefiero decirlo corto por ahora.",
      "No se si me explico, pero eso es lo que sale."
    ],
    apertura_media: [
      "Igual hay dias en que me doy cuenta despues, cuando ya conteste mal.",
      "No es que me de lo mismo; es que me bloqueo antes.",
      "Puede sonar como excusa, pero para mi se siente real.",
      "A veces quiero decir mas, pero no encuentro como partir."
    ],
    apertura_alta: [
      "Nunca lo habia pensado asi, pero creo que ahi se mezcla vergüenza con rabia.",
      "Suena raro, pero a veces defender el computador es defender el unico lugar donde me siento capaz.",
      "Me cuesta admitirlo, pero creo que me da miedo no encajar afuera.",
      "Cuando lo digo sin que me reten, se nota que hay mas cosas debajo."
    ]
  },
  valentina: {
    apertura_baja: [
      "Se que suena exagerado, pero eso me pasa.",
      "No se si deberia darle tanta vuelta.",
      "Lo digo y altiro pienso que quizas estoy reclamando demasiado.",
      "Me cuesta decirlo sin justificarme."
    ],
    apertura_media: [
      "Ahi aparece la culpa, aunque racionalmente sepa que no tiene mucho sentido.",
      "Me pasa que ordeno todo, pero por dentro sigo acelerada.",
      "No es solo tiempo; tambien es la sensacion de no estar haciendo suficiente.",
      "Lo explico mucho porque si no siento que no vale."
    ],
    apertura_alta: [
      "Nunca lo habia puesto asi, pero mi descanso siempre queda condicionado a rendir primero.",
      "Creo que me asusta bajar el ritmo y que se note que no soy tan capaz como parezco.",
      "Me cuesta separar lo que quiero de lo que siento que esperan de mi.",
      "Cuando lo digo en voz alta, noto que estoy cansada de demostrar."
    ]
  },
  marcos: {
    apertura_baja: [
      "No se si llamarlo problema, la verdad.",
      "Debe pasarle a mucha gente.",
      "Prefiero no darle tanto color.",
      "Lo digo porque se nota, no porque quiera quejarme."
    ],
    apertura_media: [
      "Despues me queda dando vueltas, sobre todo cuando respondo mal en la casa.",
      "No es solo cansancio fisico; es como andar con poca paciencia para todo.",
      "Me molesta reconocerlo, pero me esta afectando mas de lo que digo.",
      "Sigo cumpliendo, pero cada vez con menos resto."
    ],
    apertura_alta: [
      "Si soy honesto, me da miedo estar fallando en varios lados al mismo tiempo.",
      "Antes me sentia util; ahora a veces solo estoy apagando incendios.",
      "Me cuesta mostrar esto porque siento que deberia poder sostenerlo.",
      "Cuando bajo la guardia, aparece culpa por la persona en que me estoy convirtiendo en la casa."
    ]
  },
  elena: {
    apertura_baja: [
      "No quisiera que se entienda mal.",
      "Quizas no es para tanto, pero lo siento.",
      "Me da un poco de pudor decirlo.",
      "Prefiero decirlo con cuidado."
    ],
    apertura_media: [
      "A veces lo noto cuando la casa queda tranquila y ya no tengo a quien cuidar.",
      "No quiero culpar a nadie, pero igual me duele.",
      "Me cuesta pedir algo para mi sin sentir que molesto.",
      "Lo suavizo porque no quiero preocupar a nadie."
    ],
    apertura_alta: [
      "Nunca lo habia dicho asi, pero a veces no se que lugar tengo si no estoy sosteniendo a otros.",
      "Creo que me asusta necesitar y que eso pese para los demas.",
      "Cuando puedo hablar sin culpar a nadie, aparece mas claro que tambien necesito compañia.",
      "Me emociona un poco reconocerlo, porque suelo dejarme para el final."
    ]
  },
  nicolas: {
    apertura_baja: [
      "No se.",
      "Eso.",
      "No tengo mucho mas que decir.",
      "Me cuesta explicarlo."
    ],
    apertura_media: [
      "Igual me da lata que todos crean que ya saben lo que pasa.",
      "No es que no me importe nada, pero prefiero no meterme.",
      "Si preguntan mucho, me cierro.",
      "A veces me gustaria que no fuera todo sobre notas."
    ],
    apertura_alta: [
      "Nunca lo digo, pero me molesta que me vean solo cuando bajo.",
      "Puede ser que me quede callado para que no me miren mas.",
      "No se decirlo bien, pero a veces siento que da lo mismo lo que explique.",
      "Si no me sermonean, puedo contar un poco mas."
    ]
  }
};

function buildEntry(caseId, category, level, text, index) {
  return {
    id: `${caseId}_${category}_${level}_${index}`,
    text,
    level
  };
}

function buildBasicCategory(caseId, category, buckets) {
  return Object.fromEntries(
    ["apertura_baja", "apertura_media", "apertura_alta"].map((level) => [
      level,
      (buckets[level] || buckets.apertura_baja || []).map((text, index) =>
        buildEntry(caseId, category, level, text, index)
      )
    ])
  );
}

function sentenceJoin(primary, continuation) {
  if (!continuation || primary.length > 190) return primary;
  return `${primary} ${continuation}`;
}

function expandCategory(caseId, category) {
  const sourceKey = categoryMap[category];
  const source = baseBank[caseId]?.[sourceKey] || baseBank[caseId]?.open || [];
  const levels = humanContinuations[caseId];

  return Object.fromEntries(
    ["apertura_baja", "apertura_media", "apertura_alta"].map((level) => {
      const continuations = levels[level];
      const entries = source.map((text, index) =>
        buildEntry(caseId, category, level, sentenceJoin(text, continuations[index % continuations.length]), index)
      );

      let cursor = 0;
      while (entries.length < 10) {
        const text = source[cursor % source.length] || "No se bien que decir todavia.";
        const continuation = continuations[(cursor + entries.length) % continuations.length];
        entries.push(
          buildEntry(
            caseId,
            category,
            level,
            sentenceJoin(text, continuation),
            entries.length
          )
        );
        cursor += 1;
      }

      return [level, entries.slice(0, 10)];
    })
  );
}

export const responseBank = Object.fromEntries(
  Object.keys(baseBank).map((caseId) => [
    caseId,
    {
      ...Object.fromEntries(
        Object.keys(categoryMap).map((category) => [category, expandCategory(caseId, category)])
      ),
      ...Object.fromEntries(
        Object.entries(basicResponseBank[caseId] || {}).map(([category, buckets]) => [
          category,
          buildBasicCategory(caseId, category, buckets)
        ])
      )
    }
  ])
);

export const responseCategories = [...new Set([...Object.keys(categoryMap), ...Object.keys(basicResponseBank.tomas)])];
