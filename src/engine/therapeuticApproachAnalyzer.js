import { normalizeText } from "../utils/textUtils.js";

const approachDefinitions = {
  humanista: {
    label: "humanista",
    description: "validación, escucha empática, respeto por el ritmo y ausencia de juicio",
    signals: [
      "te escucho",
      "no estoy para juzgarte",
      "no quiero juzgar",
      "no voy a juzgarte",
      "puedes tomarte tu tiempo",
      "quiero comprender tu experiencia",
      "quiero comprender lo que estas viviendo",
      "quiero comprender lo que te sucede",
      "lo que sientes es importante",
      "podemos ir a tu ritmo",
      "a tu ritmo",
      "gracias por contarlo",
      "gracias por compartir",
      "tiene sentido",
      "comprendo",
      "entiendo",
      "este es un espacio seguro",
      "podemos conversar con calma"
    ],
    patterns: [
      /\b(no|sin) (juzgar|juzgarte|juicio)\b/,
      /\b(tu ritmo|tomarte tu tiempo|te escucho|comprender tu experiencia)\b/
    ]
  },
  cognitivo_conductual: {
    label: "cognitivo-conductual",
    description: "relación entre situación, pensamiento, emoción, conducta y estrategias concretas",
    signals: [
      "que pensamiento aparece",
      "que haces cuando ocurre",
      "que emocion aparece despues",
      "que conducta se repite",
      "que evidencia tienes",
      "que podrias intentar distinto",
      "que pasa antes durante y despues",
      "que haces despues de pensar eso",
      "como se relaciona lo que piensas con lo que haces",
      "situacion pensamiento emocion conducta",
      "identificar patrones",
      "estrategias concretas"
    ],
    patterns: [
      /\b(pensamiento|piensas|pienso).*\b(emocion|sientes|conducta|haces|accion)\b/,
      /\b(situacion|ocurre|pasa).*\b(pensamiento|emocion|conducta)\b/,
      /\b(que|como).*\b(podrias|puedes).*\b(distinto|intentar|probar)\b/
    ]
  },
  cognitivo: {
    label: "cognitiva",
    description: "pensamientos, creencias, interpretaciones y significados",
    signals: [
      "que piensas cuando pasa eso",
      "que significado le das",
      "que creencia aparece",
      "como interpretas esa situacion",
      "pensamientos automaticos",
      "que te dices a ti mismo",
      "que idea aparece",
      "como lees esa situacion",
      "que interpretacion haces",
      "que pruebas tienes de eso"
    ],
    patterns: [
      /\b(que|como).*\b(piensas|interpretas|significado|creencia|idea)\b/,
      /\b(pensamiento|creencia|interpretacion|significado)\b/
    ]
  },
  conductual: {
    label: "conductual",
    description: "conductas observables, hábitos, evitación, frecuencia y consecuencias",
    signals: [
      "que haces despues",
      "cada cuanto ocurre",
      "que evitas",
      "que pasa justo antes",
      "que consecuencia tiene",
      "con que frecuencia",
      "cuantas veces",
      "que habito",
      "que haces para evitar",
      "que ocurre despues de hacerlo",
      "que refuerza eso",
      "exponerte de a poco"
    ],
    patterns: [
      /\b(que|como).*\b(haces|actuas|evitas)\b/,
      /\b(cada cuanto|frecuencia|consecuencia|despues|antes)\b/,
      /\b(conducta|habito|evitacion|refuerza|reforzamiento)\b/
    ]
  },
  psicoanalitico_psicodinamico: {
    label: "psicoanalítica/psicodinámica",
    description: "historia personal, vínculos tempranos, repetición y conflicto interno",
    signals: [
      "esto te ha pasado antes",
      "que recuerdos aparecen",
      "sientes que esto se repite",
      "que significa para ti",
      "de donde crees que viene",
      "como ha sido tu historia con esto",
      "cuando eras pequeno",
      "en tu infancia",
      "vinculos tempranos",
      "conflicto interno",
      "deseos no dichos",
      "que se repite en tus relaciones"
    ],
    patterns: [
      /\b(infancia|recuerdos|historia personal|repeticion)\b/,
      /\b(de donde|donde crees que viene|vinculos tempranos)\b/
    ]
  },
  sistemico: {
    label: "sistémica",
    description: "familia, vínculos, roles, comunicación y contexto relacional",
    signals: [
      "que pasa en tu familia",
      "como reaccionan los demas",
      "que ocurre cuando tu mama responde asi",
      "que lugar ocupas en esa dinamica",
      "como se comunican en casa",
      "que cambia en los demas cuando tu haces eso",
      "que rol tienes en tu familia",
      "como responde tu pareja",
      "como responde tu colegio",
      "que pasa en tu casa",
      "patrones relacionales",
      "dinamica familiar",
      "como afecta a los demas"
    ],
    patterns: [
      /\b(familia|casa|pareja|mama|papa|hija|hijos|colegio|trabajo).*\b(reaccionan|responden|comunican|dinamica|rol)\b/,
      /\b(que pasa|como es|como se comunican).*\b(familia|casa|pareja|colegio|trabajo)\b/,
      /\b(rol|dinamica|patron relacional|patrones relacionales)\b/
    ]
  },
  gestaltico: {
    label: "gestáltica",
    description: "aquí y ahora, conciencia corporal, experiencia inmediata e integración de partes",
    signals: [
      "que sientes ahora al decir eso",
      "donde lo sientes en el cuerpo",
      "que aparece en este momento",
      "que parte de ti quiere eso y que parte no",
      "aqui y ahora",
      "en este momento",
      "que notas en tu cuerpo",
      "que te pasa ahora",
      "que aparece al decirlo",
      "una parte de ti"
    ],
    patterns: [
      /\b(ahora|este momento|aqui y ahora).*\b(sientes|aparece|notas)\b/,
      /\b(cuerpo|corporal|parte de ti)\b/
    ]
  },
  existencial: {
    label: "existencial",
    description: "sentido, libertad, responsabilidad, elección, soledad y proyecto vital",
    signals: [
      "que sentido tiene esto para ti",
      "que lugar ocupa esto en tu vida",
      "que decision sientes que estas evitando",
      "como te posicionas frente a esto",
      "que quieres hacer con esta parte de tu vida",
      "proyecto vital",
      "que vida quieres construir",
      "que eliges",
      "que responsabilidad sientes",
      "que significa para tu vida",
      "sentido de vida"
    ],
    patterns: [
      /\b(sentido|vida|proyecto vital|decision|eleccion|responsabilidad|soledad)\b/,
      /\b(que quieres|que lugar ocupa|como te posicionas)\b/
    ]
  },
  narrativo: {
    label: "narrativa",
    description: "relatos personales, identidad, externalización y resignificación",
    signals: [
      "que historia te cuentas sobre ti",
      "como nombrarias este problema",
      "en que momentos el problema pierde fuerza",
      "esto te define o es algo que te ocurre",
      "que otra version de ti aparece",
      "que relato aparece",
      "como contarias esta historia",
      "que nombre le pondrias",
      "cuando no domina el problema",
      "que dice esto de ti",
      "otra version de esta historia"
    ],
    patterns: [
      /\b(historia|relato|version|nombrarias|nombre le pondrias)\b/,
      /\b(define|definir|identidad|problema pierde fuerza)\b/
    ]
  },
  tercera_generacion: {
    label: "de tercera generación",
    description: "aceptación, mindfulness, valores, regulación emocional y acción comprometida",
    signals: [
      "puedes observar ese pensamiento sin pelear con el",
      "que valor importante aparece aqui",
      "que accion seria coherente con lo que valoras",
      "que podrias aceptar sin dejar de cuidarte",
      "que haces cuando intentas controlar esa emocion",
      "observar ese pensamiento",
      "sin fusionarte",
      "accion comprometida",
      "lo que valoras",
      "mindfulness",
      "aceptar esa emocion",
      "regular esa emocion",
      "dejar pasar ese pensamiento"
    ],
    patterns: [
      /\b(observar|aceptar|mindfulness|valor|valoras|accion comprometida)\b/,
      /\b(pensamiento|emocion).*\b(sin pelear|sin fusionarte|dejar pasar|controlar)\b/
    ]
  }
};

export function analyzeTherapeuticApproaches(studentMessages = []) {
  const messages = studentMessages
    .map((message) => String(message || "").trim())
    .filter(Boolean);
  const scores = scoreApproaches(messages);
  const sorted = Object.entries(scores)
    .map(([id, data]) => ({ id, ...data, ...approachDefinitions[id] }))
    .sort((a, b) => b.score - a.score || b.examples.length - a.examples.length);
  const detected = sorted.filter((item) => item.score > 0);
  const primary = detected[0] || null;
  const secondary = detected
    .slice(1)
    .filter((item) => item.score >= Math.max(1, Math.ceil((primary?.score || 0) * 0.45)))
    .slice(0, 3);
  const mixedApproach = secondary.length > 0;
  const detectedSignals = detected.map((item) => ({
    id: item.id,
    label: item.label,
    score: item.score,
    signals: item.signalsFound,
    examples: item.examples
  }));

  return {
    primaryApproach: primary
      ? buildApproachSummary(primary)
      : {
          id: "no_observado",
          label: "no observado con claridad",
          score: 0,
          description: "no se detectan señales suficientes para orientar un enfoque"
        },
    secondaryApproaches: secondary.map(buildApproachSummary),
    detectedSignals,
    mixedApproach,
    feedbackText: buildFeedbackText({ primary, secondary, detected, messages }),
    suggestions: buildSuggestions({ primary, secondary, detected, messages })
  };
}

function scoreApproaches(messages) {
  const initialScores = Object.fromEntries(
    Object.keys(approachDefinitions).map((id) => [
      id,
      {
        score: 0,
        signalsFound: [],
        examples: []
      }
    ])
  );

  for (const originalMessage of messages) {
    const normalized = normalizeText(originalMessage);
    for (const [id, definition] of Object.entries(approachDefinitions)) {
      const matchedSignals = definition.signals.filter((signal) =>
        normalized.includes(normalizeText(signal))
      );
      const matchedPatterns = (definition.patterns || [])
        .filter((pattern) => pattern.test(normalized))
        .map((pattern) => pattern.source);
      const totalMatches = matchedSignals.length + matchedPatterns.length;
      if (!totalMatches) continue;
      initialScores[id].score += totalMatches;
      initialScores[id].signalsFound.push(...matchedSignals, ...matchedPatterns);
      if (!initialScores[id].examples.includes(originalMessage)) {
        initialScores[id].examples.push(originalMessage);
      }
    }
  }

  for (const data of Object.values(initialScores)) {
    data.signalsFound = Array.from(new Set(data.signalsFound)).slice(0, 8);
    data.examples = data.examples.slice(0, 3);
  }

  return initialScores;
}

function buildApproachSummary(approach) {
  return {
    id: approach.id,
    label: approach.label,
    score: approach.score,
    description: approach.description,
    examples: approach.examples.slice(0, 2)
  };
}

function buildFeedbackText({ primary, secondary, detected, messages }) {
  if (!messages.length) {
    return "No hay intervenciones suficientes para inferir de manera orientativa un enfoque terapéutico. Cuando escribas más preguntas, el sistema podrá observar señales formativas con mayor claridad.";
  }

  if (!primary) {
    return "Las intervenciones registradas todavía no muestran señales suficientes para orientar un enfoque terapéutico predominante. Esto no implica un error; sugiere que sería útil formular preguntas con una línea comprensiva más explícita.";
  }

  const secondaryLabels = secondary.map((item) => item.label);
  if (!secondaryLabels.length) {
    return `Se observa un predominio de una orientación ${primary.label}, especialmente por señales vinculadas con ${primary.description}. Esta lectura es orientativa y no significa que se haya aplicado formalmente un modelo terapéutico.`;
  }

  if (secondary.length >= 3 && primary.score - secondary[0].score <= 1) {
    return `Aparecen preguntas de distintas orientaciones, con señales de ${[primary.label, ...secondaryLabels].join(", ")}. La mezcla puede enriquecer la entrevista, pero todavía no se aprecia una línea comprensiva sostenida; sería recomendable definir mejor desde qué marco deseas orientar la exploración.`;
  }

  return `Se observa una integración inicial entre una orientación ${primary.label} y elementos ${secondaryLabels.join(", ")}. Esto puede ser adecuado si se mantiene coherencia, pero conviene explicitar desde qué mirada se está comprendiendo el caso.`;
}

function buildSuggestions({ primary, secondary, detected, messages }) {
  if (!messages.length) {
    return [
      "Realiza algunas intervenciones de encuadre, validación y exploración para recibir una lectura orientativa más útil.",
      "Recuerda que este análisis no evalúa competencia clínica, solo señales formativas en la redacción de preguntas."
    ];
  }

  if (!detected.length) {
    return [
      "Formula preguntas que hagan visible tu línea de comprensión: experiencia subjetiva, contexto relacional, pensamientos, conductas, historia o sentido.",
      "Evita saltar entre temas sin explicar el propósito de tus preguntas."
    ];
  }

  const suggestions = [
    `Si deseas sostener una orientación ${primary.label}, intenta mantener continuidad con preguntas coherentes con ${primary.description}.`
  ];

  if (secondary.length) {
    suggestions.push("Cuando integres enfoques, explicita la razón de pasar de una mirada a otra para que la entrevista conserve coherencia.");
  } else {
    suggestions.push("Puedes complementar tu foco con exploración contextual o emocional sin perder la línea principal de la entrevista.");
  }

  suggestions.push("Usa esta lectura como insumo para supervisión docente; no corresponde a una certificación de uso de modelos terapéuticos.");
  return suggestions;
}
