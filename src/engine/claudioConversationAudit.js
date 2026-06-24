import assert from "node:assert/strict";
import { generateLocalPatientResponse } from "./localMiniAI.js";

const APPROACH_CASES = [
  ["cognitivo_conductual", "¿Qué piensas antes de postergar y qué haces después?"],
  ["humanista", "Tiene sentido que te cueste. Podemos ir a tu ritmo."],
  ["psicodinamico", "¿Sientes que este patrón se repite desde tu historia familiar?"],
  ["sistemico", "¿Qué rol ocupas en tu familia y cómo reaccionan los demás?"],
  ["tercera_generacion", "¿Qué valor aparece y qué acción pequeña sería coherente aunque siga la duda?"],
  ["narrativo", "¿Qué historia te cuentas sobre ser responsable y qué otra historia sería posible?"],
  ["solucion_breve", "En una escala del 1 al 10, ¿dónde estás y qué sería subir un punto?"],
  ["integrativo", "¿Cómo se conectan lo que piensas, lo que sientes, tu historia y una acción posible?"]
];

export function runClaudioConversationAudit({ log = true } = {}) {
  const results = [];

  results.push(auditSessionOne(log));
  results.push(auditSessionTwo(log));
  results.push(auditSessionThree(log));
  results.push(auditSessionFour(log));
  results.push(auditApproaches(log));
  results.push(auditTasksAndInterventionQuality(log));

  const summary = {
    caseId: "claudio",
    passed: results.every((result) => result.passed),
    checks: results.reduce((total, result) => total + result.checks, 0),
    sections: results
  };

  if (log) {
    console.log("\nCLAUDIO_CONVERSATION_AUDIT", summary);
  }

  return summary;
}

function auditSessionOne(log) {
  const conversation = runConversation({
    sessionNumber: 1,
    prompts: [
      "Hola, ¿cómo estás?",
      "¿Qué te trae por acá?",
      "¿Cómo es tu rutina diaria?",
      "Tiene sentido que te sientas desgastado. Podemos ir a tu ritmo.",
      "Para cerrar, podemos retomar esto en la próxima sesión."
    ],
    log
  });

  assert.equal(conversation[1].clinical.source, "session_motivo");
  assert.equal(conversation[2].clinical.source, "session_rutina");
  assert.equal(conversation[3].clinical.goodIntervention, "validation");
  assert.equal(conversation[4].clinical.source, "closure");
  assert.ok(conversation.every(({ text }) => !/separaci[oó]n|expareja/i.test(text)));
  assertUniqueResponses(conversation);

  const earlySeparation = ask({
    sessionNumber: 1,
    studentMessage: "¿Qué pasó con tu separación?"
  });
  assert.equal(earlySeparation.clinical.source, "session_boundary");
  assert.match(earlySeparation.text, /no sé si quiero entrar|preferiría partir/i);

  return section("session_1", 7);
}

function auditSessionTwo(log) {
  const conversation = runConversation({
    sessionNumber: 2,
    history: [sessionPrelude(2, 58, "La vez pasada hablamos de la rutina y de cuánto hago por deber.")],
    prompts: [
      "¿Qué quieres decir con hacer lo que corresponde?",
      "¿Qué cambió después de tu separación?",
      "¿Qué miedo aparece cuando tienes que decidir?",
      "Si entiendo bien, mantienes todo ordenado para reducir el riesgo de equivocarte.",
      "Dejémoslo hasta aquí por hoy; podemos seguir la próxima vez."
    ],
    log
  });

  assert.match(conversation[0].text, /correspond|correcto|responsab/i);
  assert.match(conversation[1].text, /separaci[oó]n/i);
  assert.match(conversation[2].text, /miedo|equivoc|decisi|riesgo|esperando/i);
  assert.ok(["reflection", "validation"].includes(conversation[3].clinical.goodIntervention));
  assert.equal(conversation[4].clinical.source, "closure");
  assertUniqueResponses(conversation);

  return section("session_2", 6);
}

function auditSessionThree(log) {
  const previousSessionSummary = {
    sessionNumber: 2,
    trustFinal: 64,
    nivelApertura: "apertura_media",
    tareaAcordada: "Anotar al final del día una decisión que hayas postergado y qué pensaste en ese momento."
  };
  const conversation = runConversation({
    sessionNumber: 3,
    history: [sessionPrelude(3, 64, "Me quedé pensando en la rutina y en probar algo pequeño.")],
    previousSessionSummary,
    prompts: [
      "¿Cómo te fue con la tarea que habíamos acordado?",
      "¿Qué recurso te ayuda cuando logras moverte con menos vueltas?",
      "Te propongo registrar una decisión pequeña y una emoción al final del día.",
      "¿Qué valor te gustaría cuidar con ese paso?",
      "Terminemos por hoy y revisamos cómo te fue la próxima sesión."
    ],
    log
  });

  assert.equal(conversation[0].clinical.source, "task_followUp");
  assert.equal(conversation[0].clinical.previousTask, previousSessionSummary.tareaAcordada);
  assert.match(conversation[1].text, /ayuda|amigo|recurso|sost|constante|capacidad/i);
  assert.equal(conversation[2].clinical.source, "task_concrete");
  assert.match(conversation[3].text, /valor|importa|inter[eé]s|estabilidad/i);
  assert.equal(conversation[4].clinical.source, "closure");
  assertUniqueResponses(conversation);

  return section("session_3", 6);
}

function auditSessionFour(log) {
  const conversation = runConversation({
    sessionNumber: 4,
    history: [sessionPrelude(4, 74, "No lo tengo resuelto, pero entiendo mejor por qué me he quedado quieto.")],
    prompts: [
      "Mirando estas sesiones, ¿qué entiendes ahora de tu forma de decidir?",
      "¿Qué cambio pequeño te parece posible sostener?",
      "Para cerrar, ¿con qué te vas de este proceso?",
      "Gracias por el trabajo. Dejamos la sesión hasta aquí."
    ],
    log
  });

  assert.match(conversation[0].text, /entiendo|clar|quiet|decisi|certeza/i);
  assert.match(conversation[1].text, /pequeñ|sostener|semana|paso/i);
  assert.equal(conversation[2].clinical.source, "closure");
  assert.equal(conversation[3].clinical.source, "closure");
  assert.ok(conversation.slice(2).every(({ text }) => !/ya est[aá] resuelto|todo cambi[oó]|problema resuelto/i.test(text)));
  assertUniqueResponses(conversation);

  return section("session_4", 6);
}

function auditApproaches(log) {
  for (const [expectedApproach, studentMessage] of APPROACH_CASES) {
    const result = ask({
      sessionNumber: 3,
      history: [sessionPrelude(3, 68, "He empezado a notar cuánto espero tener certeza antes de moverme.")],
      studentMessage
    });
    assert.equal(result.clinical.approach, expectedApproach, studentMessage);
    assert.ok(result.text.length > 20);
    if (log) logTurn(3, studentMessage, result);
  }

  return section("approaches", APPROACH_CASES.length * 2);
}

function auditTasksAndInterventionQuality(log) {
  const concrete = ask({
    sessionNumber: 3,
    history: [sessionPrelude(3, 65, "Quisiera probar algo pequeño.")],
    studentMessage: "Te propongo anotar una decisión pequeña al final del día."
  });
  assert.equal(concrete.clinical.taskKind, "concrete");
  assert.equal(concrete.clinical.source, "task_concrete");

  const broad = ask({
    sessionNumber: 3,
    history: [sessionPrelude(3, 65, "Quisiera probar algo pequeño.")],
    studentMessage: "Como tarea, deberías cambiar toda tu vida y renunciar esta semana."
  });
  assert.equal(broad.clinical.taskKind, "tooBroad");
  assert.match(broad.text, /grande|paralizo|demasiadas/i);

  const premature = ask({
    sessionNumber: 2,
    history: [sessionPrelude(2, 55, "Todavía me cuesta entrar en algunos temas.")],
    studentMessage: "Te propongo que le escribas una carta a tu ex y le cuentes todo."
  });
  assert.equal(premature.clinical.taskKind, "emotionallyPremature");
  assert.match(premature.text, /no sé si estoy listo|preferiría/i);

  const advice = ask({
    sessionNumber: 2,
    history: [sessionPrelude(2, 55, "Me cuesta decidir.")],
    studentMessage: "Deberías dejar de pensar y tomar la decisión de una vez."
  });
  assert.equal(advice.clinical.poorIntervention, "pressure");
  assert.match(advice.text, /cerrarme|decidir rápido|resuelto/i);

  if (log) {
    logTurn(3, "Tarea concreta", concrete);
    logTurn(3, "Tarea amplia", broad);
    logTurn(2, "Tarea prematura", premature);
    logTurn(2, "Presión", advice);
  }

  return section("tasks_and_quality", 8);
}

function runConversation({ sessionNumber, prompts, history = [], previousSessionSummary = null, log }) {
  const turns = [];
  const workingHistory = [...history];

  for (const studentMessage of prompts) {
    const result = ask({
      sessionNumber,
      history: workingHistory,
      studentMessage,
      previousSessionSummary
    });
    turns.push(result);
    workingHistory.push(toHistoryEntry(studentMessage, result));
    if (log) logTurn(sessionNumber, studentMessage, result);
  }

  return turns;
}

function ask({ sessionNumber, studentMessage, history = [], previousSessionSummary = null }) {
  const result = generateLocalPatientResponse({
    caseId: "claudio",
    studentMessage,
    history,
    difficulty: "intermedio",
    sessionNumber,
    previousSessionSummary
  });

  assert.equal(result.debug.clinicalAvatarUsed, true);
  assert.equal(result.debug.clinicalAvatar.avatarId, "claudio");

  return {
    text: result.responseText,
    responseId: result.responseId,
    intent: result.intent,
    intentResult: result.intentResult,
    memoryUpdate: result.memoryUpdate,
    clinical: result.debug.clinicalAvatar
  };
}

function toHistoryEntry(studentMessage, result) {
  return {
    question: studentMessage,
    answer: result.text,
    responseId: result.responseId,
    responseCategory: result.intent,
    analysis: {
      detectedIntent: result.intent,
      contextualTopic: result.clinical.detectedTopic,
      categories: result.intentResult.categories,
      clinicalAvatar: result.clinical
    },
    patientState: {
      trustLevel: result.memoryUpdate.trustLevel,
      opennessLevel: result.memoryUpdate.opennessLevel
    }
  };
}

function sessionPrelude(sessionNumber, trustLevel, answer) {
  return {
    question: `Inicio de Sesión ${sessionNumber}`,
    answer,
    responseId: `claudio-session-${sessionNumber}-prelude`,
    responseCategory: "inicio_sesion",
    analysis: {
      detectedIntent: "inicio_sesion",
      contextualTopic: "continuidad",
      categories: { framing: true }
    },
    patientState: {
      trustLevel,
      opennessLevel: trustLevel > 70 ? "apertura_alta" : "apertura_media"
    },
    isSessionPrelude: true
  };
}

function assertUniqueResponses(conversation) {
  assert.equal(new Set(conversation.map(({ responseId }) => responseId)).size, conversation.length);
  assert.equal(new Set(conversation.map(({ text }) => text)).size, conversation.length);
}

function logTurn(sessionNumber, studentMessage, result) {
  console.log(`\n[Sesión ${sessionNumber}] Estudiante: ${studentMessage}`);
  console.log(`Claudio: ${result.text}`);
  console.log({
    source: result.clinical.source,
    topic: result.clinical.detectedTopic,
    approach: result.clinical.approach,
    taskKind: result.clinical.taskKind,
    openness: result.clinical.opennessLevel,
    responseId: result.clinical.selectedResponseId
  });
}

function section(name, checks) {
  return { name, checks, passed: true };
}

if (typeof process !== "undefined" && process.argv[1]?.endsWith("claudioConversationAudit.js")) {
  runClaudioConversationAudit();
}
