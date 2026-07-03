import { marcosBasicProfile } from "../data/patients/marcosBasicProfile.js";

const { profile } = marcosBasicProfile;

const handlers = {
  saludo: () => ({
    responseText: "Hola. Aqui estoy, un poco cansado, pero puedo conversar.",
    patientDataUsed: {
      emotionalState: profile.emotionalState,
      speakingStyle: "reservado y disponible"
    }
  }),
  identidad_nombre: () => ({
    responseText: `Me llamo ${profile.name}.`,
    patientDataUsed: pick("name")
  }),
  edad: () => ({
    responseText: `Tengo ${profile.age}.`,
    patientDataUsed: pick("age")
  }),
  vivienda: () => ({
    responseText: `Vivo en ${profile.city}, con mi pareja. ${profile.housingContext}`,
    patientDataUsed: pick("city", "livesWith", "housingContext")
  }),
  familia_composicion: ({ clinicalTopic }) => {
    if (clinicalTopic === "hijos") {
      return {
        responseText: `${profile.children} ${profile.livesWith}`,
        patientDataUsed: pick("children", "livesWith")
      };
    }

    return {
      responseText: profile.familySummary,
      patientDataUsed: pick("familySummary")
    };
  },
  estado_civil_pareja: () => ({
    responseText: `${profile.civilStatus} Me preocupa que a veces llegue tan irritable a la casa.`,
    patientDataUsed: pick("civilStatus", "emotionalState")
  }),
  ocupacion_estudios: () => ({
    responseText: profile.occupation,
    patientDataUsed: pick("occupation")
  }),
  motivo_consulta: () => ({
    responseText: profile.consultationReason,
    patientDataUsed: pick("consultationReason")
  }),
  apertura_vinculo: ({ state }) => {
    const variants = [
      "Si, me parece bien. Me cuesta un poco hablar de mi al principio, pero puedo ir contandote.",
      "Si, esta bien. No suelo hablar mucho de estas cosas, pero entiendo que puede servir.",
      "Si, claro. Soy medio reservado al principio, pero puedo partir contandote algunas cosas.",
      "Podemos ir de a poco. Me acomoda mas hablar asi, sin sentir que tengo que contar todo altiro.",
      "Si, podemos hacerlo asi. Me ayuda que no sea como un interrogatorio.",
      "Me parece. Quizas puedo partir por lo mas simple y despues vemos si aparece algo mas."
    ];
    const { text, index } = chooseUnusedVariant(variants, state);

    return {
      responseText: text,
      responseId: `marcos-basic-apertura_vinculo-${index + 1}`,
      responseHandler: `marcos_basic.apertura_vinculo.${index + 1}`,
      patientDataUsed: {
        speakingStyle: "reservado al inicio",
        openness: "apertura gradual"
      }
    };
  },
  sintomas_malestar: () => ({
    responseText: profile.emotionalState,
    patientDataUsed: pick("emotionalState")
  }),
  red_apoyo: () => ({
    responseText: profile.supportNetwork,
    patientDataUsed: pick("supportNetwork")
  }),
  rutina: () => ({
    responseText: profile.routine,
    patientDataUsed: pick("routine")
  }),
  consumo_sustancias: () => ({
    responseText: profile.substances,
    patientDataUsed: pick("substances")
  }),
  riesgo_autolesion: () => ({
    responseText: profile.risk,
    patientDataUsed: pick("risk")
  })
};

export const MARCOS_BASIC_ACTS = new Set(Object.keys(handlers));

export function composeMarcosBasicResponse({ detectedAct, clinicalTopic, state }) {
  const handler = handlers[detectedAct];
  if (!handler) return null;

  const result = handler({ clinicalTopic, state });
  const responseId = result.responseId || `marcos-basic-${clinicalTopic || detectedAct}`;
  const responseHandler = result.responseHandler || `marcos_basic.${detectedAct}${clinicalTopic === "hijos" ? ".hijos" : ""}`;

  return {
    responseText: result.responseText,
    responseId,
    responseHandler,
    patientDataUsed: result.patientDataUsed,
    selectedResponse: {
      id: responseId,
      text: result.responseText,
      topic: clinicalTopic || detectedAct,
      minDisclosure: "low",
      reveals: []
    }
  };
}

function pick(...keys) {
  return Object.fromEntries(keys.map((key) => [key, profile[key]]));
}

function chooseUnusedVariant(variants, state = {}) {
  const usedTexts = state.usedResponseTexts || [];
  const index = variants.findIndex((text) => !usedTexts.includes(text));
  const safeIndex = index >= 0 ? index : Math.max(0, variants.length - 1);
  return {
    text: variants[safeIndex],
    index: safeIndex
  };
}
