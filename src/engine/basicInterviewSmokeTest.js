import { generateLocalPatientResponse } from "./localMiniAI.js";
import { normalizeText } from "../utils/textUtils.js";

const CASE_ID = "marcos";

const SMOKE_TESTS = [
  { message: "Como te llamas?", expectedAct: "identidad_nombre" },
  { message: "Que edad tienes?", expectedAct: "edad" },
  { message: "Donde vives?", expectedAct: "vivienda", mustMention: ["nunoa", "santiago", "pareja"] },
  { message: "Con quien vives?", expectedAct: "vivienda", mustMention: ["pareja"] },
  { message: "En que trabajas?", expectedAct: "ocupacion_estudios", mustMention: ["trabajo"] },
  { message: "Tienes pareja?", expectedAct: "estado_civil_pareja", mustMention: ["pareja"] },
  { message: "Tienes hijos?", expectedAct: "familia_composicion", expectedTopic: "hijos", mustMention: ["no tengo hijos"] },
  { message: "Como es tu familia?", expectedAct: "familia_composicion", mustMention: ["pareja"] },
  { message: "Que te trae a consultar?", expectedAct: "motivo_consulta", mustMention: ["cansado", "irritable"] },
  { message: "Como te has sentido?", expectedAct: "sintomas_malestar", mustMention: ["cansado"] }
];

const CONFUSION_PATTERNS = [
  "no se si entendi",
  "me perdi un poco",
  "no estoy seguro de haber entendido",
  "me cuesta ubicar bien la pregunta",
  "podrias preguntarmelo de otra forma"
];

let memory = null;
const history = [];
const failures = [];

for (const test of SMOKE_TESTS) {
  const result = generateLocalPatientResponse({
    caseId: CASE_ID,
    studentMessage: test.message,
    history,
    difficulty: "intermedio",
    sessionNumber: 1,
    selectedInterventionType: "",
    memory
  });

  const clinical = result.debug?.clinicalSimulation;
  const response = result.responseText || "";
  const normalizedResponse = normalizeText(response);
  const patientDataUsed = clinical?.patientDataUsed || {};
  const usedHandler = clinical?.responseHandler || "";
  const fellBackToConfusion = clinical?.detectedAct === "pregunta_confusa"
    || CONFUSION_PATTERNS.some((pattern) => normalizedResponse.includes(pattern));

  console.log(JSON.stringify({
    studentMessage: test.message,
    normalizedMessage: clinical?.normalizedMessage,
    detectedAct: clinical?.detectedAct,
    confidence: clinical?.confidence,
    patientId: CASE_ID,
    responseHandler: usedHandler,
    patientDataUsed,
    response
  }, null, 2));

  if (!clinical) {
    failures.push(`${test.message}: no paso por ClinicalSimulationEngine.`);
  }
  if (clinical?.detectedAct !== test.expectedAct) {
    failures.push(`${test.message}: esperaba act=${test.expectedAct}, recibio ${clinical?.detectedAct}.`);
  }
  if (test.expectedTopic && clinical?.clinicalTopic !== test.expectedTopic) {
    failures.push(`${test.message}: esperaba topic=${test.expectedTopic}, recibio ${clinical?.clinicalTopic}.`);
  }
  if (fellBackToConfusion) {
    failures.push(`${test.message}: cayo en fallback de confusion.`);
  }
  if (!usedHandler.startsWith("marcos_basic.")) {
    failures.push(`${test.message}: no uso handler explicito de Marcos (${usedHandler || "sin handler"}).`);
  }
  if (!Object.keys(patientDataUsed).length) {
    failures.push(`${test.message}: no registro patientDataUsed.`);
  }
  if (test.mustMention?.length && !test.mustMention.every((term) => normalizedResponse.includes(normalizeText(term)))) {
    failures.push(`${test.message}: respuesta no contiene datos esperados (${test.mustMention.join(", ")}).`);
  }

  memory = result.memoryUpdate;
  history.push(
    { role: "student", content: test.message, text: test.message },
    { role: "patient", content: response, text: response }
  );
}

if (failures.length) {
  console.error("\nBASIC INTERVIEW SMOKE TEST FAILED");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log("\nBASIC INTERVIEW SMOKE TEST OK: Marcos paso la cadena conversacional basica.");
}
