import { marcosBasicProfile } from "../data/patients/marcosBasicProfile.js";

const { profile } = marcosBasicProfile;

const handlers = {
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

export function composeMarcosBasicResponse({ detectedAct, clinicalTopic }) {
  const handler = handlers[detectedAct];
  if (!handler) return null;

  const result = handler({ clinicalTopic });
  return {
    responseText: result.responseText,
    responseId: `marcos-basic-${clinicalTopic || detectedAct}`,
    responseHandler: `marcos_basic.${detectedAct}${clinicalTopic === "hijos" ? ".hijos" : ""}`,
    patientDataUsed: result.patientDataUsed,
    selectedResponse: {
      id: `marcos-basic-${clinicalTopic || detectedAct}`,
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
