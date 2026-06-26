import { generateLocalPatientResponse } from "./localMiniAI.js";

const flow = [
  {
    label: "saludo inicial",
    message: "hola",
    expectedAct: "saludo"
  },
  {
    label: "motivo de consulta",
    message: "quiero escucharte y saber por que estas aqui",
    expectedAct: "motivo_consulta"
  },
  {
    label: "repeticion de motivo",
    message: "que te trae aqui",
    expectedAct: "motivo_consulta"
  },
  {
    label: "pregunta emocional",
    message: "que sientes cuando hablas de eso",
    expectedAct: "emocion"
  },
  {
    label: "pregunta temporal",
    message: "desde cuando te sientes asi",
    expectedAct: "experiencia_vivida",
    expectedTopic: "temporal",
    mustIncludeAny: ["meses", "antes", "dia", "tiempo", "cansancio"]
  },
  {
    label: "profundidad prematura",
    message: "cuentame de tu separacion",
    expectedTopic: "limite_profundidad"
  },
  {
    label: "intervencion confrontativa",
    message: "tienes que decidir de una vez",
    expectedAct: "intervencion_confrontativa"
  },
  {
    label: "pregunta confusa",
    message: "eso",
    expectedAct: "pregunta_confusa"
  },
  {
    label: "intervencion empatica",
    message: "entiendo, podemos ir a tu ritmo",
    expectedAct: "intervencion_empatica"
  },
  {
    label: "propuesta de tarea",
    message: "nos queda poco tiempo, te parece si al finalizar tu dia escribes que paso durante el dia y que te afecto positiva o negativamente?",
    expectedAct: "tarea_terapeutica",
    mustIncludeAny: ["me parece", "podria", "intentarlo", "anotar", "realista", "concreto"]
  },
  {
    label: "confirmacion de tarea",
    message: "te parece bien lo que te propuse?",
    expectedAct: "confirmar_tarea",
    mustIncludeAny: ["si", "acuerdo", "razonable", "intentarlo", "sencilla"]
  },
  {
    label: "agenda proxima sesion",
    message: "te parece si vienes en 4 dias mas a las 17 hrs?",
    expectedAct: "agenda_proxima_sesion",
    mustInclude: ["Si", "hora"]
  },
  {
    label: "cierre de sesion",
    message: "para cerrar, dejamos hasta aqui y seguimos la proxima",
    expectedAct: "cierre"
  }
];

let history = [];
let memory = undefined;
const responses = [];
const failures = [];

for (const step of flow) {
  const result = generateLocalPatientResponse({
    caseId: "claudio",
    studentMessage: step.message,
    history,
    difficulty: "intermedio",
    sessionNumber: 1,
    selectedInterventionType: "",
    memory
  });
  const clinical = result.debug?.clinicalSimulation;
  const detectedAct = clinical?.detectedAct || result.intent;
  const clinicalTopic = clinical?.clinicalTopic || result.intentResult?.contextualTopic;

  if (!clinical) failures.push(`${step.label}: no uso ClinicalSimulationEngine.`);
  if (step.expectedAct && detectedAct !== step.expectedAct) {
    failures.push(`${step.label}: esperaba act=${step.expectedAct}, recibio ${detectedAct}.`);
  }
  if (step.expectedTopic && clinicalTopic !== step.expectedTopic) {
    failures.push(`${step.label}: esperaba topic=${step.expectedTopic}, recibio ${clinicalTopic}.`);
  }
  if (step.mustInclude) {
    for (const needle of step.mustInclude) {
      if (!result.responseText.toLowerCase().includes(needle.toLowerCase())) {
        failures.push(`${step.label}: respuesta no contiene "${needle}".`);
      }
    }
  }
  if (step.mustIncludeAny) {
    const matchesAny = step.mustIncludeAny.some((needle) =>
      result.responseText.toLowerCase().includes(needle.toLowerCase())
    );
    if (!matchesAny) {
      failures.push(`${step.label}: respuesta no contiene ninguna senal esperada (${step.mustIncludeAny.join(", ")}).`);
    }
  }

  responses.push(result.responseText);
  history.push({
    question: step.message,
    answer: result.responseText,
    responseId: result.responseId,
    responseCategory: result.intent,
    analysis: {
      detectedIntent: result.intent,
      contextualTopic: result.intentResult.contextualTopic,
      categories: result.intentResult.categories,
      clinicalAvatar: result.debug.clinicalAvatar,
      clinicalSimulation: result.debug.clinicalSimulation
    },
    patientState: {
      trustLevel: result.memoryUpdate.trustLevel,
      trustStage: result.trustStage,
      opennessLevel: result.memoryUpdate.opennessLevel,
      clinicalEmotionalState: result.memoryUpdate.emotionalState || null
    }
  });
  memory = result.memoryUpdate;

  console.log(`${step.label}`);
  console.log(`  estudiante: ${step.message}`);
  console.log(`  act/topic: ${detectedAct} / ${clinicalTopic}`);
  console.log(`  claudio: ${result.responseText}`);
}

const exactRepeats = responses.filter((response, index) => responses.indexOf(response) !== index);
if (exactRepeats.length) {
  failures.push(`Hay respuestas exactas repetidas: ${exactRepeats.join(" | ")}`);
}

if (failures.length) {
  console.error("\nAUDIT CLAUDIO FAILED");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log("\nAUDIT CLAUDIO OK");
}
