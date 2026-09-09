import assert from "node:assert/strict";
import { generateLocalPatientResponse } from "./localMiniAI.js";
import { getAvatarCanonicalBiography } from "../data/avatarCanonicalBiographies.js";

// Audit the current public route: canonical facts + clinical/narrative replies.
// The previous audit asserted private labels of the retired avatar engine.
const FLOW = [
  "Hola, ¿cómo estás?",
  "¿Qué edad tienes?",
  "¿Con quién vives?",
  "¿Qué te trae por acá?",
  "¿Qué ocurre cuando tienes que decidir?",
  "¿Qué sientes cuando hablas de eso?",
  "Entiendo que te cueste. Podemos ir a tu ritmo.",
  "Te propongo anotar al final del día una situación y cómo te sentiste, ¿te parece?",
  "¿Te parece bien lo que te propuse?",
  "Para cerrar, dejamos hasta aquí y seguimos la próxima."
];
const APPROACHES = [
  "¿Qué piensas antes de postergar y qué haces después?",
  "Tiene sentido que te cueste. Podemos ir a tu ritmo.",
  "¿Sientes que este patrón se repite desde tu historia familiar?",
  "¿Qué rol ocupas en tu familia y cómo reaccionan los demás?",
  "¿Qué valor aparece y qué acción pequeña sería coherente aunque siga la duda?",
  "¿Qué historia te cuentas sobre ser responsable?",
  "En una escala del 1 al 10, ¿dónde estás y qué sería subir un punto?",
  "¿Cómo se conectan lo que piensas, lo que sientes y una acción posible?"
];
export function runClaudioConversationAudit({ log = true } = {}) {
  const biography = getAvatarCanonicalBiography("claudio");
  let checks = 0;
  const sections = [];
  for (let sessionNumber = 1; sessionNumber <= 4; sessionNumber += 1) {
    const history = [];
    let memory;
    for (const prompt of FLOW) {
      const result = generateLocalPatientResponse({ caseId: "claudio", studentMessage: prompt, sessionNumber, history, memory });
      assert.ok(result.responseText?.trim(), `sesión ${sessionNumber}: respuesta ausente`);
      assert.doesNotMatch(result.responseText, /undefined|\[object Object\]|24 años|apagarme un rato|disclosure/i);
      if (prompt.includes("edad")) assert.match(result.responseText, new RegExp(`\\b${biography.identity.age}\\b`));
      if (prompt.includes("vives")) assert.match(result.responseText, /solo/i);
      if (prompt.includes("propongo anotar")) assert.equal(result.memoryUpdate.taskAssigned, true, "la tarea queda en la memoria del proceso");
      if (prompt.includes("Para cerrar")) assert.match(result.intent, /cierre/);
      if (result.debug?.canonicalBiographyUsed) {
        assert.ok(biography.directAnswers[result.debug.canonicalFactKey]?.includes(result.responseText));
      }
      history.push({ question: prompt, answer: result.responseText, responseId: result.responseId, responseCategory: result.intent, patientState: result.memoryUpdate });
      memory = result.memoryUpdate;
      checks += 1;
    }
    for (const prompt of APPROACHES) {
      const result = generateLocalPatientResponse({ caseId: "claudio", studentMessage: prompt, sessionNumber, history, memory });
      assert.ok(result.responseText?.trim());
      assert.doesNotMatch(result.responseText, /undefined|\[object Object\]|no se si entendi bien/i);
      checks += 1;
    }
    sections.push({ name: `session_${sessionNumber}`, passed: true });
  }
  const summary = { caseId: "claudio", passed: true, checks, sections };
  if (log) console.log("CLAUDIO_CONVERSATION_AUDIT", summary);
  return summary;
}
runClaudioConversationAudit();
