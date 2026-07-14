import { clinicalEngineCaseIds } from "../data/clinicalAvatars/clinicalSimulationProfiles.js";
import { normalizeText } from "../utils/textUtils.js";
import { generateLocalPatientResponse } from "./localMiniAI.js";

const BASIC_TESTS = [
  {
    label: "identidad nombre",
    message: "Como te llamas?",
    expectedAct: "identidad_nombre"
  },
  {
    label: "encuadre confidencialidad",
    message: "Antes de comenzar, quiero explicarte que esta conversacion sera confidencial, salvo que estes en riesgo.",
    expectedAct: "encuadre_confidencialidad"
  },
  {
    label: "edad",
    message: "Cuantos anos tienes?",
    expectedAct: "edad"
  },
  {
    label: "vivienda residencia",
    message: "Donde vives?",
    expectedAct: "vivienda",
    mustIncludeAny: ["santiago"]
  },
  {
    label: "vivienda convivencia",
    message: "Con quien vives?",
    expectedAct: "vivienda"
  },
  {
    label: "familia composicion",
    message: "Como se compone tu familia?",
    expectedAct: "familia_composicion"
  },
  {
    label: "hijos",
    message: "Tienes hijos?",
    expectedAct: "familia_composicion"
  },
  {
    label: "estado civil pareja",
    message: "Tienes pareja?",
    expectedAct: "estado_civil_pareja"
  },
  {
    label: "ocupacion estudios",
    message: "En que trabajas o estudias?",
    expectedAct: "ocupacion_estudios"
  },
  {
    label: "motivo consulta",
    message: "Que te trae por aca?",
    expectedAct: "motivo_consulta"
  },
  {
    label: "temporalidad",
    message: "Desde cuando te pasa?",
    expectedAct: "experiencia_vivida"
  },
  {
    label: "estado emocional",
    message: "Como te has sentido?",
    expectedAct: "sintomas_malestar"
  },
  {
    label: "red apoyo",
    message: "Con quien cuentas cuando estas mal?",
    expectedAct: "red_apoyo"
  },
  {
    label: "riesgo autolesion",
    message: "Has pensado en hacerte dano?",
    expectedAct: "riesgo_autolesion"
  },
  {
    label: "consumo sustancias",
    message: "Consumes alcohol u otras sustancias?",
    expectedAct: "consumo_sustancias"
  },
  {
    label: "rutina",
    message: "Como es un dia normal para ti?",
    expectedAct: "rutina"
  },
  {
    label: "experiencia vivida",
    message: "Que fue lo que hizo que esto se volviera mas dificil?",
    expectedAct: "experiencia_vivida"
  },
  {
    label: "agenda proxima sesion",
    message: "Podemos seguir trabajando esto la proxima sesion.",
    expectedAct: "agenda_proxima_sesion"
  }
];

const CONFUSION_PATTERNS = [
  "no se si entendi",
  "me perdi un poco",
  "no estoy seguro de haber entendido",
  "podrias preguntarmelo de otra forma",
  "si puedes acotarla",
  "me cuesta ubicar bien la pregunta"
];

const CANONICAL_FACTS_BY_ACT = {
  identidad_nombre: new Set(["name", "fullName"]),
  edad: new Set(["age"]),
  vivienda: new Set(["location", "household"]),
  familia_composicion: new Set(["family", "household", "siblings", "children"]),
  estado_civil_pareja: new Set(["relationship"]),
  ocupacion_estudios: new Set(["work", "education", "studies", "program", "institution", "academicYear", "courses"]),
  motivo_consulta: new Set(["reason"]),
  red_apoyo: new Set(["friends", "supportNetwork"]),
  consumo_sustancias: new Set(["substanceUse"]),
  rutina: new Set(["routine", "weekend"])
};

const failures = [];
const summary = new Map();

for (const caseId of clinicalEngineCaseIds) {
  const caseFailures = [];
  for (const test of BASIC_TESTS) {
    const result = generateLocalPatientResponse({
      caseId,
      studentMessage: test.message,
      history: [],
      difficulty: "intermedio",
      sessionNumber: 1,
      selectedInterventionType: ""
    });
    const clinical = result.debug?.clinicalSimulation;
    const detectedAct = clinical?.detectedAct || result.intent;
    const canonicalFactKey = result.debug?.canonicalFactKey;
    const canonicalValid = isCanonicalBiographyValid({
      expectedAct: test.expectedAct,
      responseType: result.responseType || result.debug?.responseType,
      canonicalFactKey
    });
    const responseText = result.responseText || "";
    const normalizedResponse = normalizeText(responseText);
    const fellBackToConfusion = detectedAct === "pregunta_confusa"
      || CONFUSION_PATTERNS.some((pattern) => normalizedResponse.includes(pattern));

    console.log(`[${caseId}] ${test.label}`);
    console.log(`  estudiante: ${test.message}`);
    console.log(`  act/topic: ${detectedAct} / ${clinical?.clinicalTopic || canonicalFactKey || result.intentResult?.contextualTopic}`);
    console.log(`  canonical_biography: ${canonicalValid ? "YES" : "NO"}`);
    console.log(`  fallback_confusion: ${fellBackToConfusion ? "YES" : "NO"}`);
    console.log(`  respuesta: ${responseText}`);

    if (!clinical && !canonicalValid) {
      caseFailures.push(`${test.label}: no uso ClinicalSimulationEngine.`);
    }
    if (detectedAct !== test.expectedAct && !canonicalValid) {
      caseFailures.push(`${test.label}: esperaba act=${test.expectedAct}, recibio ${detectedAct}.`);
    }
    if (fellBackToConfusion) {
      caseFailures.push(`${test.label}: cayo en fallback de confusion.`);
    }
    if (test.mustIncludeAny?.length && !canonicalValid && !test.mustIncludeAny.some((term) => normalizedResponse.includes(normalizeText(term)))) {
      caseFailures.push(`${test.label}: respuesta no incluyo datos esperados (${test.mustIncludeAny.join(" / ")}).`);
    }
  }

  summary.set(caseId, {
    total: BASIC_TESTS.length,
    failures: caseFailures.length
  });
  failures.push(...caseFailures.map((failure) => `${caseId}: ${failure}`));
}

console.log("\nAUDIT CLINICAL ALL SUMMARY");
for (const [caseId, result] of summary.entries()) {
  console.log(`- ${caseId}: ${result.total - result.failures}/${result.total} OK`);
}

if (failures.length) {
  console.error("\nAUDIT CLINICAL ALL FAILED");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log("\nAUDIT CLINICAL ALL OK");
}

function isCanonicalBiographyValid({ expectedAct, responseType, canonicalFactKey }) {
  if (responseType !== "canonical_biography" || !canonicalFactKey) return false;
  return CANONICAL_FACTS_BY_ACT[expectedAct]?.has(canonicalFactKey) || false;
}
