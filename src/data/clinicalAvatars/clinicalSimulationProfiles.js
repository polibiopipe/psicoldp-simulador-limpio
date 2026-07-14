import { caseProfiles } from "../caseProfiles.js";
import { patientFacts } from "../patientFacts.js";
import { patientMasterRecords } from "../patients/index.js";
import { claudioClinicalSimulationProfile } from "./claudioProfile.js";

const response = (id, text, options = {}) => ({
  id,
  text,
  topic: options.topic || null,
  minDisclosure: options.minDisclosure || "low",
  reveals: options.reveals || [],
  tags: options.tags || []
});

const clinicalBasicsByCase = {
  tomas: {
    livesWith: "Vivo con mis papas.",
    familyComposition: "Vivo con mis papas. En la casa el tema del computador aparece harto.",
    relationshipStatus: "No, no tengo pareja. Tengo 18 y ese no es un tema central para mi.",
    support: "Cuento mas con gente online que con gente del colegio. En persona me cuesta mas.",
    risk: "No, no he pensado en hacerme dano. Me pasa mas que me encierro o evito hablar.",
    substances: "No, no consumo alcohol ni otras sustancias. No es un tema para mi."
  },
  valentina: {
    livesWith: "Vivo con mi familia.",
    familyComposition: "Vivo con mi familia. Ellos confian mucho en mi, y eso a veces tambien pesa.",
    relationshipStatus: "No estoy en pareja ahora. Mi cabeza esta bastante tomada por la universidad.",
    support: "Tengo amigas y mi familia, pero muchas veces no quiero preocuparlos.",
    risk: "No, no he pensado en hacerme dano. Me siento sobrepasada, pero no va por ahi.",
    substances: "No, no consumo sustancias. A veces tomo cafe de mas para seguir estudiando."
  },
  marcos: {
    livesWith: "Vivo con mi pareja.",
    familyComposition: "Mi nucleo mas cercano es mi pareja. Tambien tengo familia, pero no hablo mucho de esto.",
    relationshipStatus: "Si, tengo pareja. Justamente me preocupa llegar tan irritable a la casa.",
    support: "Mi pareja nota lo que me pasa. Amigos tengo, pero no suelo hablar de estas cosas.",
    risk: "No, no he pensado en hacerme dano. Estoy cansado e irritable, pero sigo funcionando.",
    substances: "No, no consumo sustancias. Alcohol muy ocasional, pero no lo veo como el problema."
  },
  elena: {
    livesWith: "Vivo sola la mayor parte del tiempo.",
    familyComposition: "Tengo hijos y familia cercana. Trato de no cargarlos con mis cosas.",
    relationshipStatus: "No estoy en pareja ahora. Mi preocupacion ha estado mas puesta en la familia y en sentirme sola.",
    support: "Tengo hijos y algunas amigas, pero me cuesta pedir compania sin sentir que molesto.",
    risk: "No, no he pensado en hacerme dano. Me siento sola a veces, pero no he llegado a eso.",
    substances: "No, no consumo sustancias. No es un tema en mi caso."
  },
  nicolas: {
    livesWith: "Vivo con mi familia.",
    familyComposition: "Vivo con mi familia. En la casa casi siempre terminamos hablando del colegio.",
    relationshipStatus: "No, no tengo pareja. No es algo de lo que quiera hablar ahora.",
    support: "No cuento mucho estas cosas. Antes hablaba mas con companeros, pero ahora estoy mas apartado.",
    risk: "No, no he pensado en hacerme dano. Me siento mas callado y desconectado, pero no va por ahi.",
    substances: "No, no consumo alcohol ni otras sustancias."
  },
  camila: {
    livesWith: "Vivo sola, aunque sigo muy pendiente de mi familia.",
    familyComposition: "Mi familia esta muy presente. Los quiero, pero muchas veces siento que tengo que responder por todos.",
    relationshipStatus: "No estoy en pareja ahora. Gran parte de mi energia se me va en estar disponible para otros.",
    support: "Tengo amigas y familia, pero a veces yo termino siendo la que sostiene a los demas.",
    risk: "No, no he pensado en hacerme dano. Estoy cansada y con culpa, pero no en ese sentido.",
    substances: "No, no consumo sustancias. A veces uso el celular hasta tarde respondiendo mensajes."
  },
  rodrigo: {
    livesWith: "Vivo solo desde la separacion. Mis hijos estan conmigo algunos dias.",
    familyComposition: "Soy papa. Mi familia ahora esta reorganizandose despues de la separacion.",
    relationshipStatus: "Estoy separado. Todavia estoy tratando de ordenar lo que eso movio.",
    support: "Tengo amigos y familia, pero me cuesta hablar de la separacion sin sentir que me expongo demasiado.",
    risk: "No, no he pensado en hacerme dano. Hay dias dificiles, pero mi preocupacion principal son mis hijos.",
    substances: "No, no consumo sustancias. Alcohol a veces socialmente, pero no es el tema."
  },
  fernanda: {
    livesWith: "Vivo con mi pareja.",
    familyComposition: "Mi pareja y mi familia intentan apoyarme, aunque a veces siento que me observan.",
    relationshipStatus: "Si, tengo pareja. Me apoya, pero igual me cuesta contarle cuanto me asusta volver al trabajo.",
    support: "Tengo apoyo, sobre todo de mi pareja y familia, pero no siempre digo realmente como estoy.",
    risk: "No, no he pensado en hacerme dano. Mi miedo va mas por no poder retomar como antes.",
    substances: "No, no consumo sustancias. No es un tema para mi."
  },
  hector: {
    livesWith: "Vivo con mi esposa.",
    familyComposition: "Vivo con mi esposa y tengo familia. No quiero que esten pendientes de mi como si no pudiera solo.",
    relationshipStatus: "Si, estoy casado. Mi esposa me acompana, pero me cuesta reconocer que esto me afecta.",
    support: "Mi esposa y mi familia estan, aunque parte de mis vinculos eran del trabajo.",
    risk: "No, no he pensado en hacerme dano. Me siento mas vacio desde que jubile, pero no he pensado en eso.",
    substances: "No, no consumo sustancias. No es un tema en mi vida."
  },
  daniela: {
    livesWith: "Vivo con mi hijo.",
    familyComposition: "Vivo con mi hijo. Mi familia ayuda a ratos, pero siento la responsabilidad principal en mi.",
    relationshipStatus: "No estoy en pareja ahora. Mi foco esta en mi hijo, mis estudios y tratar de sostener todo.",
    support: "Mi familia me ayuda a ratos, aunque me cuesta pedir ayuda sin sentir culpa.",
    risk: "No, no he pensado en hacerme dano. Estoy agotada y culpable, pero no he pensado en eso.",
    substances: "No, no consumo sustancias. No es un tema para mi."
  },
  andres: {
    livesWith: "Vivo con mi familia.",
    familyComposition: "Vivo con mi familia. Ellos estan orgullosos de que este en la universidad, y eso tambien pesa.",
    relationshipStatus: "No tengo pareja ahora. Estoy mas concentrado en adaptarme a la universidad.",
    support: "Tengo a mi familia y conozco gente en la universidad, pero me cuesta sentirme realmente parte.",
    risk: "No, no he pensado en hacerme dano. Me siento fuera de lugar, pero no en ese punto.",
    substances: "No, no consumo sustancias. No es un tema en mi caso."
  },
  patricia: {
    livesWith: "Vivo con mi hija.",
    familyComposition: "Vivo con mi hija adolescente. Ultimamente la relacion esta mas tensa de lo que quisiera.",
    relationshipStatus: "No estoy en pareja ahora. Mi preocupacion principal esta puesta en mi hija.",
    support: "Tengo algunas amigas, pero me da verguenza contar que en la casa discutimos tanto.",
    risk: "No, no he pensado en hacerme dano. Estoy preocupada y cansada, pero no en ese sentido.",
    substances: "No, no consumo sustancias. No es un tema para mi."
  },
  miguel: {
    livesWith: "Vivo solo por ahora.",
    familyComposition: "Parte de mi familia esta lejos. Hablamos por telefono, aunque no es lo mismo.",
    relationshipStatus: "No estoy en pareja ahora. Estoy tratando de armar mi vida aca de a poco.",
    support: "Mi familia esta lejos y estoy armando redes aca. Todavia se siente bastante nuevo.",
    risk: "No, no he pensado en hacerme dano. Me siento cansado y solo a veces, pero no he pensado en eso.",
    substances: "No, no consumo sustancias. No es un tema para mi."
  },
  sofia: {
    livesWith: "Vivo con mi familia.",
    familyComposition: "Vivo con mi familia. No siempre entienden por que me afectan tanto las redes.",
    relationshipStatus: "No estoy en pareja ahora. Igual me comparo mucho con lo que veo de otras personas.",
    support: "Tengo amistades y familia, pero a veces la comparacion tambien aparece con gente cercana.",
    risk: "No, no he pensado en hacerme dano. Me afecta compararme, pero no he pensado en eso.",
    substances: "No, no consumo sustancias. Mi tema es mas el celular y las redes."
  },
  claudio: {
    livesWith: "Vivo solo.",
    familyComposition: "Mi familia cercana son mis padres y una hermana. Vivo solo, y no suelo hablar demasiado con ellos de estas cosas.",
    relationshipStatus: "No estoy casado. Actualmente no estoy en pareja.",
    support: "Tengo algunos amigos, pero hablamos mas de cosas practicas que personales.",
    risk: "No, no he pensado en hacerme dano. Mi malestar va mas por sentirme detenido.",
    substances: "No, no consumo sustancias. No es un tema para mi."
  }
};

const closingByStyle = {
  tomas: "Ya... gracias. Me cuesta hablar, pero podemos seguir otro dia.",
  nicolas: "Ya. Esta bien dejarlo hasta aca si seguimos con calma la proxima.",
  hector: "Bueno, gracias. Me sirve dejar esto ordenado y retomarlo otro dia.",
  patricia: "Gracias. Me sirve dejarlo hasta aqui sin convertirlo en otra pelea.",
  claudio: "Esta bien. Me sirve dejarlo aqui y seguir ordenandolo con calma."
};

export const clinicalEngineCaseIds = Object.keys(caseProfiles);

export const clinicalSimulationProfiles = Object.fromEntries(
  clinicalEngineCaseIds.map((caseId) => {
    const genericProfile = createClinicalSimulationProfile(caseId);
    if (caseId !== "claudio") return [caseId, genericProfile];

    return [
      caseId,
      {
        ...genericProfile,
        ...claudioClinicalSimulationProfile,
        identity: {
          ...genericProfile.identity,
          ...claudioClinicalSimulationProfile.identity
        },
        clinicalFrame: {
          ...genericProfile.clinicalFrame,
          ...claudioClinicalSimulationProfile.clinicalFrame
        },
        disclosureRules: {
          ...genericProfile.disclosureRules,
          ...claudioClinicalSimulationProfile.disclosureRules
        },
        responses: {
          ...genericProfile.responses,
          ...claudioClinicalSimulationProfile.responses
        }
      }
    ];
  })
);

function createClinicalSimulationProfile(caseId) {
  const profile = caseProfiles[caseId];
  const facts = patientFacts[caseId] || {};
  const patientRecord = patientMasterRecords[caseId] || null;
  const basics = buildRecordBasics({ patientRecord, caseId, facts, profile });
  const name = patientRecord?.identity?.name || profile?.name || facts.name || caseId;
  const age = patientRecord?.identity?.age || profile?.age || facts.age || "";
  const motive = patientRecord?.consultation?.whyNow
    || patientRecord?.consultation?.manifestMotive
    || facts.motive
    || profile?.reasonForConsultation
    || profile?.mainTheme
    || "Vine porque hay algo que me esta costando ordenar.";
  const concern = patientRecord?.emotionalState?.currentlyFeels
    || facts.concern
    || profile?.emotionalCore
    || "Me cuesta entender bien que me esta pasando.";
  const routine = patientRecord?.identity?.dailyRoutine
    || profile?.dailyRoutine
    || facts.habits
    || "Mis dias se han vuelto bastante repetidos.";
  const workOrStudy = patientRecord?.identity?.occupation || resolveWorkOrStudy(facts, profile);
  const firstDisclosure = patientRecord?.consultation?.beliefAboutProblem
    || facts.concreteDisclosures?.[0]
    || profile?.emotionalCore
    || concern;
  const secondDisclosure = patientRecord?.consultation?.recentTrigger
    || facts.concreteDisclosures?.[1]
    || facts.concreteConcern
    || concern;
  const gameFunctionResponses = buildGameFunctionResponses(patientRecord, caseId);
  const validationBridge = facts.validationBridge || "Gracias. Me ayuda que lo podamos mirar con calma.";
  const temporalResponse = buildTemporalResponse(patientRecord);
  const boundaryResponse = patientRecord?.sensitiveInfo?.earlyBoundary
    || "Prefiero no entrar tan rapido en eso. Me resulta mas facil partir por lo que esta pasando ahora.";
  const unknownResponse = patientRecord?.personality?.unknownAnswer
    || "No tengo tan claro eso. Prefiero ir de a poco con lo que si puedo responder.";
  const residenceResponse = buildResidenceResponse({ patientRecord, fallbackText: basics.livesWith });
  const childrenResponse = buildChildrenResponse({ patientRecord, fallbackText: basics.familyComposition });
  const recordTaskResponses = buildRecordTaskResponses(patientRecord);

  return {
    id: caseId,
    name,
    age,
    difficulty: profile?.difficulty || "intermedio",
    module: "Entrevista Psicologica Formativa",
    patientRecord,
    biographicalDossier: patientRecord ? {
      identity: patientRecord.identity,
      biography: patientRecord.biography,
      timeline: patientRecord.timeline,
      family: patientRecord.family,
      relationships: patientRecord.relationships || patientRecord.relationshipMap,
      personality: patientRecord.personality,
      emotionalState: patientRecord.emotionalState,
      consultation: patientRecord.consultation,
      symptoms: patientRecord.symptoms || patientRecord.symptomHistory,
      functioning: patientRecord.functioning,
      mentalStatus: patientRecord.mentalStatus,
      risk: patientRecord.risk || patientRecord.riskMap,
      protectiveFactors: patientRecord.protectiveFactors,
      communicationStyle: patientRecord.communicationStyle || patientRecord.speakingStyle,
      sensitiveInfo: patientRecord.sensitiveInfo,
      disclosureRules: patientRecord.disclosureRules || patientRecord.disclosureMatrix,
      interventionResponses: patientRecord.interventionResponses,
      taskResponses: patientRecord.taskResponses,
      sessionEvolution: patientRecord.sessionEvolution,
      pedagogy: patientRecord.pedagogy,
      evaluationCriteria: patientRecord.evaluationCriteria || patientRecord.evaluationRubric
    } : null,
    identity: {
      name,
      age: age ? `${age} anos` : "",
      livesWith: basics.livesWith,
      work: workOrStudy,
      family: basics.familyComposition || facts.family || profile?.familyContext,
      relationshipStatus: basics.relationshipStatus
    },
    clinicalFrame: {
      manifestMotive: motive,
      latentMotive: profile?.emotionalCore || concern,
      initialEmotionalState: "cauteloso",
      communicationStyle: patientRecord?.personality?.responseStyle
        || profile?.communicationStyle
        || profile?.presentationStyle
        || "Responde con cautela y se abre de forma gradual.",
      neverInvent: [
        "diagnosticos",
        "crisis aguda no descrita",
        "ideacion suicida si no aparece en la respuesta de riesgo",
        "antecedentes graves no contenidos en la ficha",
        "datos biograficos no definidos en el expediente maestro"
      ],
      patientRules: [
        "Hablar siempre como paciente.",
        "Responder primero a la pregunta concreta.",
        "No mencionar categorias internas.",
        "No revelar toda la historia de inmediato."
      ]
    },
    disclosureRules: {
      early: ["motivo_consulta", "datos_basicos", "rutina"],
      medium: ["emociones", "red_apoyo", "experiencia_vivida"],
      late: ["temas_profundos"],
      avoids: patientRecord?.personality?.avoids || (profile?.whatThePatientAvoids ? [profile.whatThePatientAvoids] : [])
    },
    pedagogicalObjectives: patientRecord?.pedagogy?.goals || profile?.learningObjectives || [],
    responses: {
      saludo: [
        response(`${caseId}-greeting-1`, "Hola. Podemos conversar.", { topic: "saludo" }),
        response(`${caseId}-greeting-2`, "Hola... si, estoy aqui. Me cuesta un poco partir, pero puedo intentarlo.", { topic: "saludo" })
      ],
      identidad_nombre: [
        response(`${caseId}-identity-name`, `Me llamo ${name}.`, { topic: "identidad" })
      ],
      edad: [
        response(`${caseId}-age`, age ? `Tengo ${age}.` : "Prefiero ir de a poco con esos datos, pero podemos hablar de lo que me trae.", { topic: "edad" })
      ],
      encuadre_confidencialidad: [
        response(`${caseId}-framing-1`, "Si, entiendo. Me parece bien saber que esto queda resguardado.", { topic: "encuadre" }),
        response(`${caseId}-framing-2`, "Gracias por explicarlo. Me ayuda saber que podemos conversar con ese cuidado.", { topic: "encuadre" })
      ],
      apertura_vinculo: [
        response(`${caseId}-rapport-1`, openingResponseForRecord(patientRecord, name), { topic: "vinculo" }),
        response(`${caseId}-rapport-2`, "Si, me parece bien. Me cuesta un poco hablar de mi al principio, pero puedo ir contandote.", { topic: "vinculo" })
      ],
      vivienda: [
        response(`${caseId}-home-1`, residenceResponse, { topic: "vivienda" })
      ],
      convivencia: [
        response(`${caseId}-home-legacy-1`, residenceResponse, { topic: "vivienda" })
      ],
      familia_composicion: [
        response(`${caseId}-family-composition-1`, basics.familyComposition || facts.family || profile?.familyContext || "Tengo familia cerca, aunque me cuesta hablar demasiado de esto con ellos.", { topic: "familia" })
      ],
      hijos: [
        response(`${caseId}-children-1`, childrenResponse, { topic: "hijos" })
      ],
      familia: [
        response(`${caseId}-family-1`, facts.family || profile?.familyContext || basics.familyComposition || "Tengo familia cerca, aunque no siempre hablo de lo que me pasa.", { topic: "familia" })
      ],
      estado_civil_pareja: [
        response(`${caseId}-relationship-1`, basics.relationshipStatus || "Prefiero ir de a poco con ese tema. No es lo primero que me sale contar.", { topic: "pareja" })
      ],
      ocupacion_estudios: [
        response(`${caseId}-work-study-1`, workOrStudy, { topic: "ocupacion" }),
        response(`${caseId}-work-study-2`, facts.works || profile?.academicOrWorkContext || workOrStudy, { topic: "ocupacion" })
      ],
      trabajo: [
        response(`${caseId}-work-legacy-1`, workOrStudy, { topic: "ocupacion" })
      ],
      motivo_consulta: [
        response(`${caseId}-motive-1`, motive, { topic: "motivo", reveals: ["motivo_consulta"] }),
        response(`${caseId}-motive-2`, facts.expectation || concern, { topic: "motivo", reveals: ["motivo_consulta"] }),
        response(`${caseId}-motive-repeat`, `Creo que lo central sigue siendo esto: ${lowerFirst(motive)}`, { topic: "motivo", minDisclosure: "medium" })
      ],
      red_apoyo: [
        response(`${caseId}-support-1`, basics.support || facts.social || "Tengo algunas personas cerca, pero no siempre me resulta facil pedir ayuda.", { topic: "apoyo" })
      ],
      apoyo_redes: [
        response(`${caseId}-support-legacy-1`, basics.support || facts.social || "Tengo algunas personas cerca, pero no siempre me resulta facil pedir ayuda.", { topic: "apoyo" })
      ],
      sintomas_malestar: [
        response(`${caseId}-distress-1`, concern, { topic: "malestar", reveals: ["malestar"] }),
        response(`${caseId}-distress-2`, profile?.emotionalCore || concern, { topic: "malestar", minDisclosure: "medium", reveals: ["malestar"] })
      ],
      emocion: [
        response(`${caseId}-emotion-legacy-1`, concern, { topic: "malestar", reveals: ["malestar"] })
      ],
      riesgo_autolesion: [
        response(`${caseId}-risk-1`, basics.risk || "No, no he pensado en hacerme dano. Mi malestar va por otro lado.", { topic: "riesgo" })
      ],
      consumo_sustancias: [
        response(`${caseId}-substances-1`, basics.substances || "No, no consumo sustancias. No es un tema central para mi.", { topic: "consumo" })
      ],
      rutina: [
        response(`${caseId}-routine-1`, routine, { topic: "rutina", reveals: ["rutina"] }),
        response(`${caseId}-routine-2`, facts.habits || routine, { topic: "rutina", reveals: ["rutina"] })
      ],
      experiencia_vivida: [
        response(`${caseId}-experience-1`, firstDisclosure, { topic: "experiencia", minDisclosure: "low" }),
        response(`${caseId}-experience-2`, secondDisclosure, { topic: "experiencia", minDisclosure: "medium" })
      ],
      videojuegos: gameFunctionResponses.length
        ? gameFunctionResponses
        : [
            response(`${caseId}-game-function-1`, firstDisclosure, { topic: "videojuegos", minDisclosure: "low" })
          ],
      temporal: [
        response(`${caseId}-time-1`, temporalResponse, { topic: "temporal" })
      ],
      miedo: [
        response(`${caseId}-fear-1`, facts.concreteConcern || concern, { topic: "miedo", minDisclosure: "medium" })
      ],
      verguenza: [
        response(`${caseId}-shame-1`, "Me cuesta decirlo con claridad. Hay algo de pudor en hablar de esto asi.", { topic: "verguenza" })
      ],
      agenda_proxima_sesion: [
        response(`${caseId}-schedule-1`, "Si, me parece bien. Creo que podemos seguir conversandolo la proxima sesion.", { topic: "agenda" })
      ],
      cierre_sesion: [
        response(`${caseId}-closure-1`, closingByStyle[caseId] || "Gracias. Me sirve dejarlo hasta aqui y retomarlo con calma la proxima vez.", { topic: "cierre" })
      ],
      cierre: [
        response(`${caseId}-closure-legacy-1`, closingByStyle[caseId] || "Gracias. Me sirve dejarlo hasta aqui y retomarlo con calma la proxima vez.", { topic: "cierre" })
      ],
      pregunta_confusa: [
        response(`${caseId}-confused-1`, "Me cuesta ubicar bien la pregunta. Si puedes preguntarlo de otra forma, creo que podria responder mejor.", { topic: "aclaracion" })
      ],
      confrontativa: [
        response(`${caseId}-confront-1`, "Dicho asi me cuesta un poco responder. Siento que necesito ir de a poco.", { topic: "defensa" })
      ],
      empatica: [
        response(`${caseId}-empathy-1`, validationBridge, { topic: "vinculo" }),
        response(`${caseId}-empathy-2`, `${validationBridge} ${secondDisclosure}`, { topic: "vinculo", minDisclosure: "medium" })
      ],
      limite_profundidad: [
        response(`${caseId}-boundary-1`, boundaryResponse, { topic: "limite" })
      ],
      no_definido: [
        response(`${caseId}-unknown-1`, unknownResponse, { topic: "no_definido" })
      ],
      repeticion: [
        response(`${caseId}-repeat-1`, `Creo que lo diria de forma parecida: ${lowerFirst(concern)}`, { topic: "repeticion" }),
        response(`${caseId}-repeat-2`, secondDisclosure, { topic: "repeticion", minDisclosure: "medium" })
      ],
      tarea_terapeutica: [
        ...(recordTaskResponses.concrete.length
          ? recordTaskResponses.concrete
          : [response(`${caseId}-task-1`, "Si, me parece. Si es algo concreto y breve, creo que podria intentarlo.", { topic: "tarea", tags: ["taskAccepted"] })])
      ],
      confirmar_tarea: [
        ...(recordTaskResponses.concrete.length
          ? recordTaskResponses.concrete
          : [response(`${caseId}-task-confirm-1`, "Si, me parece bien. Lo puedo intentar de una manera sencilla.", { topic: "tarea", tags: ["taskAccepted"] })])
      ],
      seguimiento_tarea: [
        ...(recordTaskResponses.followUp.length
          ? recordTaskResponses.followUp
          : [response(`${caseId}-task-follow-1`, "Lo intente parcialmente. Me sirvio notar algunas cosas, aunque no fui completamente constante.", { topic: "tarea", minDisclosure: "medium" })])
      ]
    }
  };
}

function lowerFirst(value) {
  const text = String(value || "").trim();
  if (!text) return "hay algo que me cuesta ordenar.";
  return `${text.charAt(0).toLowerCase()}${text.slice(1)}`;
}

function sentence(value) {
  const text = String(value || "").trim();
  if (!text || text === "No esta definido en el expediente inicial.") return "";
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function withoutFinalDot(value) {
  return String(value || "").trim().replace(/[.!?]+$/g, "");
}

function lowerFragment(value) {
  const text = withoutFinalDot(value);
  if (!text) return "";
  return `${text.charAt(0).toLowerCase()}${text.slice(1)}`;
}

function stripResidenceLead(value) {
  return withoutFinalDot(value)
    .replace(/^actualmente\s+vivo\s+/i, "")
    .replace(/^vivo\s+/i, "");
}

function buildResidenceResponse({ patientRecord, fallbackText }) {
  const identity = patientRecord?.identity || {};
  if (identity.residenceResponse) return identity.residenceResponse;

  const city = identity.city && identity.city !== "No esta definido en el expediente inicial." ? identity.city : "";
  const commune = identity.commune && identity.commune !== "No esta definido en el expediente inicial." ? identity.commune : "";
  const place = commune && city ? `${commune}, ${city}` : commune || city;
  const housingType = identity.housingType && identity.housingType !== "No esta definido en el expediente inicial."
    ? identity.housingType
    : "";
  const livesWith = stripResidenceLead(identity.livesWith || fallbackText);
  const experience = sentence(identity.residenceExperience);

  let base = "";
  if (place && housingType && livesWith) {
    base = `Vivo en ${place}, en ${lowerFragment(housingType)}, ${lowerFragment(livesWith)}.`;
  } else if (place && livesWith) {
    base = `Vivo en ${place}. ${sentence(identity.livesWith || fallbackText)}`;
  } else if (livesWith) {
    base = sentence(identity.livesWith || fallbackText);
  }

  return `${base || "Puedo contarte algo de mi casa si sirve."}${experience ? ` ${experience}` : ""}`.trim();
}

function buildChildrenResponse({ patientRecord, fallbackText }) {
  const children = patientRecord?.family?.children || [];
  const livesWith = patientRecord?.identity?.livesWith || "";

  if (!children.length) {
    const residence = sentence(livesWith);
    return `No tengo hijos.${residence ? ` ${residence}` : ""}`;
  }

  if (children.length === 1) {
    const child = children[0];
    if (!child.name && child.role === "hijo/a") {
      return sentence(child.relationship || fallbackText || "Si, tengo hijos.");
    }
    const role = child.role && child.role !== "hijo/a" ? child.role : "hijo";
    const name = child.name ? `, ${child.name}` : "";
    const age = child.age ? `, de ${child.age} anos` : "";
    return `Si, tengo un ${role}${name}${age}. ${sentence(child.relationship || fallbackText)}`.trim();
  }

  return `Si, tengo hijos. ${sentence(fallbackText || patientRecord?.family?.composition)}`.trim();
}

function buildRecordBasics({ patientRecord, caseId, facts, profile }) {
  const fallback = clinicalBasicsByCase[caseId] || {};
  const identity = patientRecord?.identity || {};
  const family = patientRecord?.family || {};
  const sensitiveInfo = patientRecord?.sensitiveInfo || {};

  return {
    livesWith: identity.livesWith || fallback.livesWith,
    familyComposition: family.composition || identity.familyComposition || fallback.familyComposition,
    relationshipStatus: identity.civilStatus || fallback.relationshipStatus,
    support: identity.supportNetwork || fallback.support || facts.social || profile?.socialContext,
    risk: sensitiveInfo.riskResponse || fallback.risk,
    substances: sensitiveInfo.substanceResponse || fallback.substances
  };
}

function buildTemporalResponse(patientRecord) {
  const timeline = patientRecord?.timeline || [];
  const consultation = patientRecord?.consultation || {};
  const currentEvent = [...timeline].reverse().find((item) => item?.event);
  const previousEvent = timeline.find((item) => item?.event && item !== currentEvent);

  if (consultation.recentTrigger && consultation.recentTrigger !== "No esta definido en el expediente inicial.") {
    return `No fue de un dia para otro. ${consultation.recentTrigger}`;
  }

  if (currentEvent && previousEvent) {
    return `No fue de un dia para otro. Primero estuvo esto: ${lowerFirst(previousEvent.event)}. Ahora lo mas presente es que ${lowerFirst(currentEvent.event)}`;
  }

  if (currentEvent) {
    return `No fue de un dia para otro. Diria que se fue haciendo mas claro con esto: ${lowerFirst(currentEvent.event)}`;
  }

  return "No fue de un dia para otro. Creo que se fue acumulando hasta que se volvio mas dificil ignorarlo.";
}

function buildRecordTaskResponses(patientRecord) {
  const taskResponses = patientRecord?.taskResponses || {};
  return {
    concrete: normalizeRecordResponseList(taskResponses.concrete),
    followUp: normalizeRecordResponseList([
      ...(taskResponses.partial || []),
      ...(taskResponses.helpful || []),
      ...(taskResponses.notDone || [])
    ])
  };
}

function buildGameFunctionResponses(patientRecord, caseId) {
  const responses = patientRecord?.consultation?.gameFunctionResponses || [];
  if (responses.length) {
    return responses.map((text, index) =>
      response(`${caseId}-game-function-${index + 1}`, text, { topic: "videojuegos", minDisclosure: index > 2 ? "medium" : "low" })
    );
  }

  if (patientRecord?.consultation?.gameFunction) {
    return [
      response(`${caseId}-game-function-1`, patientRecord.consultation.gameFunction, { topic: "videojuegos", minDisclosure: "low" })
    ];
  }

  return [];
}

function normalizeRecordResponseList(items = []) {
  return items
    .filter((item) => item?.text)
    .map((item) => ({
      minDisclosure: "low",
      reveals: [],
      tags: [],
      ...item
    }));
}

function openingResponseForRecord(patientRecord, name) {
  const lowTrust = patientRecord?.communicationStyle?.lowTrust || patientRecord?.speakingStyle?.lowTrust;
  if (lowTrust && patientRecord?.id === "tomas") {
    return "Si, me parece bien. Me cuesta un poco hablar de mi al principio, pero puedo ir contandote.";
  }
  if (patientRecord?.personality?.initialOpenness === "baja") {
    return "Si, esta bien. Me cuesta un poco hablar de mi, pero puedo intentarlo.";
  }
  return `Si, podemos partir. Soy ${name}, y puedo contarte un poco de lo que me trae.`;
}

function resolveWorkOrStudy(facts, profile) {
  const works = String(facts.works || "").trim();
  const academic = String(facts.academic || "").trim();
  const context = String(profile?.academicOrWorkContext || "").trim();
  const hasCurrentWork = works && !/^no\b/i.test(works);

  if (hasCurrentWork) return works;
  if (academic) return academic;
  if (works) return works;
  if (context) return context;
  return "Tengo una rutina de estudio o trabajo bastante marcada.";
}
