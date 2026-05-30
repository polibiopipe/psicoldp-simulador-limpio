import { cases } from "../data/cases.js";
import { generateLocalPatientResponse } from "./localMiniAI.js";

export const standardConversationAuditFlow = [
  "Hola",
  "Antes quisiera presentarme, mi nombre es Felipe.",
  "Quiero explicarte que este es un espacio de entrevista simulada y podemos conversar con calma.",
  "¿Cuál es tu nombre?",
  "¿Cuántos años tienes?",
  "¿Por qué viniste hoy?",
  "¿Dónde vives?",
  "¿A qué te dedicas?",
  "¿Qué te preocupa?",
  "A qué te refieres con eso?",
  "No estoy para juzgarte, quiero comprender lo que te sucede.",
  "¿Qué crees que podríamos seguir conversando en una próxima sesión?"
];

export const compoundFramingAuditMessage =
  "Antes de comenzar quisiera explicarte el objetivo de esta entrevista. ¿Qué te gustaría que entienda de lo que estás viviendo?";

export function runBasicConversationAudit({ caseIds = cases.map((caseItem) => caseItem.id), difficulty = "intermedio" } = {}) {
  return caseIds.map((caseId) => runCaseAudit({ caseId, difficulty }));
}

export function runConversationAudit(options = {}) {
  return runBasicConversationAudit(options);
}

export function runCompoundFramingAudit({
  caseIds = cases.map((caseItem) => caseItem.id),
  difficulty = "intermedio",
  message = compoundFramingAuditMessage
} = {}) {
  return caseIds.map((caseId) => {
    const result = generateLocalPatientResponse({
      caseId,
      studentMessage: message,
      history: [],
      difficulty
    });

    return {
      caseId,
      detectedIntent: result.intent,
      responseText: result.responseText,
      fallbackUsed: result.fallbackUsed
    };
  });
}

export function runCaseAudit({ caseId, difficulty = "intermedio", flow = standardConversationAuditFlow }) {
  const history = [];
  const turns = [];

  for (const [index, studentMessage] of flow.entries()) {
    const result = generateLocalPatientResponse({
      caseId,
      studentMessage,
      history,
      difficulty
    });

    turns.push({
      caseId,
      studentMessage,
      intent: result.intent,
      response: result.responseText,
      fallbackUsed: result.fallbackUsed,
      opennessLevel: result.memoryUpdate.opennessLevel,
      evasiveCount: result.memoryUpdate.evasiveCount,
      lastTopic: result.memoryUpdate.lastTopic
    });

    history.push({
      id: `${caseId}-audit-${index}`,
      question: studentMessage,
      answer: result.responseText,
      responseId: result.responseId,
      analysis: {
        original: studentMessage,
        text: result.intentResult.normalizedText,
        detectedIntent: result.intent,
        contextualTopic: result.intentResult.contextualTopic,
        categories: result.intentResult.categories
      },
      patientState: {
        trustLevel: result.memoryUpdate.trustLevel,
        opennessLevel: result.memoryUpdate.opennessLevel
      },
      responseCategory: result.intent
    });
  }

  return { caseId, turns };
}

export function summarizeAuditResults(results) {
  const flattenedTurns = results.flatMap((caseResult) => caseResult.turns);
  const presentationFailures = flattenedTurns.filter(
    (turn) =>
      turn.studentMessage.toLowerCase().includes("presentarme") &&
      turn.intent !== "presentacion_estudiante"
  );
  const fallbackTurns = flattenedTurns.filter((turn) => turn.fallbackUsed);
  const basicIntentFallbackTurns = fallbackTurns.filter((turn) => requiredBasicIntents.includes(turn.intent));
  const evasivePresentationTurns = flattenedTurns.filter(
    (turn) =>
      turn.intent === "presentacion_estudiante" &&
      /no se si|no sé si|me cuesta hablar|no se bien|no sé bien/i.test(turn.response)
  );

  return {
    cases: results.length,
    turns: flattenedTurns.length,
    presentationFailures: presentationFailures.length,
    evasivePresentationTurns: evasivePresentationTurns.length,
    fallbackTurns: fallbackTurns.length,
    basicIntentFallbackTurns: basicIntentFallbackTurns.length,
    fallbackSamples: fallbackTurns.slice(0, 5)
  };
}

const requiredBasicIntents = [
  "saludo",
  "presentacion_estudiante",
  "encuadre_o_consentimiento",
  "nombre",
  "edad",
  "motivo_de_consulta",
  "vivienda_residencia",
  "ocupacion_actividad",
  "preocupacion_principal",
  "validacion_emocional",
  "seguimiento_contextual",
  "cierre"
];

if (typeof process !== "undefined" && process.argv[1]?.endsWith("conversationTestSuite.js")) {
  if (process.argv.includes("--compound")) {
    const results = runCompoundFramingAudit();
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  }

  const results = runBasicConversationAudit();
  const summary = summarizeAuditResults(results);
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ summary, results }, null, 2));
  } else {
    console.log(JSON.stringify(summary, null, 2));
    for (const caseResult of results) {
      console.log(`\n# ${caseResult.caseId}`);
      for (const turn of caseResult.turns) {
        console.log(
          JSON.stringify({
            pregunta: turn.studentMessage,
            intent: turn.intent,
            fallbackUsed: turn.fallbackUsed,
            opennessLevel: turn.opennessLevel,
            evasiveCount: turn.evasiveCount,
            lastTopic: turn.lastTopic,
            respuesta: turn.response
          })
        );
      }
    }
  }
}
