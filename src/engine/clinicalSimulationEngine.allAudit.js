import { clinicalEngineCaseIds } from "../data/clinicalAvatars/clinicalSimulationProfiles.js";
import { normalizeText } from "../utils/textUtils.js";
import { generateLocalPatientResponse } from "./localMiniAI.js";

const BASIC_TESTS = [
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
    label: "vivienda",
    message: "Con quien vives?",
    expectedAct: "vivienda"
  },
  {
    label: "familia composicion",
    message: "Como se compone tu familia?",
    expectedAct: "familia_composicion"
  },
  {
    label: "estado civil pareja",
    message: "Tienes pareja?",
    expectedAct: "estado_civil_pareja"
  },
  {
    label: "ocupacion estudios",
    message: "A que te dedicas?",
    expectedAct: "ocupacion_estudios"
  },
  {
    label: "motivo consulta",
    message: "Que te trae por aca?",
    expectedAct: "motivo_consulta"
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
    const responseText = result.responseText || "";
    const normalizedResponse = normalizeText(responseText);
    const fellBackToConfusion = detectedAct === "pregunta_confusa"
      || CONFUSION_PATTERNS.some((pattern) => normalizedResponse.includes(pattern));

    console.log(`[${caseId}] ${test.label}`);
    console.log(`  estudiante: ${test.message}`);
    console.log(`  act/topic: ${detectedAct} / ${clinical?.clinicalTopic || result.intentResult?.contextualTopic}`);
    console.log(`  fallback_confusion: ${fellBackToConfusion ? "YES" : "NO"}`);
    console.log(`  respuesta: ${responseText}`);

    if (!clinical) {
      caseFailures.push(`${test.label}: no uso ClinicalSimulationEngine.`);
    }
    if (detectedAct !== test.expectedAct) {
      caseFailures.push(`${test.label}: esperaba act=${test.expectedAct}, recibio ${detectedAct}.`);
    }
    if (fellBackToConfusion) {
      caseFailures.push(`${test.label}: cayo en fallback de confusion.`);
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
