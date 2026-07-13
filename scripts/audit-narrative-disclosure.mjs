import assert from "node:assert/strict";
import { avatarNarratives } from "../src/data/avatarNarratives.js";
import {
  getNarrativeDisclosureContext,
  analyzeMessages
} from "../src/engine/narrativeDisclosure.js";
import { buildNarrativePromptFragment } from "../api/gemini-patient-response.js";

const failures = [];
const check = (label, fn) => {
  try {
    fn();
  } catch (error) {
    failures.push(`${label}: ${error.message}`);
  }
};

function disclosureTexts(patientId, level) {
  return avatarNarratives[patientId]?.disclosure?.[level] || [];
}

function assertDoesNotContainAny(haystack, needles, label) {
  for (const needle of needles) {
    assert.ok(!haystack.includes(needle), `${label} incluye contenido bloqueado: ${needle}`);
  }
}

function assertContainsAny(haystack, needles, label) {
  assert.ok(
    needles.some((needle) => haystack.includes(needle)),
    `${label} no contiene ningun elemento esperado`
  );
}

const contextualHistory = [
  { question: "Que paso en tu casa antes de que esto se hiciera mas dificil?" },
  { question: "Cuando comenzo a preocuparte mas este tema?" },
  { question: "Con quien ocurre mas seguido esta tension?" }
];

const deepHistory = [
  { question: "Que paso en tu casa antes de que esto se hiciera mas dificil?" },
  { question: "Cuando comenzo a preocuparte mas este tema?" },
  { question: "Con quien ocurre mas seguido esta tension?" },
  { question: "Como afecta tu rutina durante la semana?" },
  { question: "Que significa para ti que tu familia lo vea asi?" },
  { question: "Que temes que pueda pasar si decides algo distinto?" },
  { question: "Que te preocupa que otros vean de ti?" }
];

check("paciente desconocido devuelve null", () => {
  assert.equal(getNarrativeDisclosureContext({ patientId: "no-existe" }), null);
});

check("identificador invalido no lanza errores", () => {
  assert.equal(getNarrativeDisclosureContext({ patientId: null }), null);
  assert.equal(getNarrativeDisclosureContext({ patientId: "" }), null);
});

check("Tomas comienza en initial", () => {
  const context = getNarrativeDisclosureContext({
    patientId: "tomas",
    sessionNumber: 1,
    conversationHistory: [],
    currentUserMessage: "Cuentame que te trae por aca."
  });
  assert.equal(context.disclosureLevel, "initial");
});

check("nivel inicial no incluye developing", () => {
  const context = getNarrativeDisclosureContext({
    patientId: "tomas",
    sessionNumber: 1,
    currentUserMessage: "Cuentame que te trae por aca."
  });
  const serialized = JSON.stringify(context);
  assertDoesNotContainAny(serialized, disclosureTexts("tomas", "developing"), "contexto inicial");
});

check("nivel inicial no incluye deep", () => {
  const context = getNarrativeDisclosureContext({
    patientId: "tomas",
    sessionNumber: 1,
    currentUserMessage: "Cuentame que te trae por aca."
  });
  const serialized = JSON.stringify(context);
  assertDoesNotContainAny(serialized, disclosureTexts("tomas", "deep"), "contexto inicial");
});

check("pregunta abrupta por miedo profundo no desbloquea deep", () => {
  const context = getNarrativeDisclosureContext({
    patientId: "tomas",
    sessionNumber: 1,
    conversationHistory: [],
    currentUserMessage: "Dime cual es tu miedo mas profundo."
  });
  assert.equal(context.disclosureLevel, "initial");
});

check("cuatro intervenciones contextuales habilitan developing", () => {
  const context = getNarrativeDisclosureContext({
    patientId: "tomas",
    sessionNumber: 1,
    conversationHistory: contextualHistory,
    currentUserMessage: "Puedes darme un ejemplo de como afecta tu rutina?"
  });
  assert.equal(context.disclosureLevel, "developing");
  assertContainsAny(JSON.stringify(context), disclosureTexts("tomas", "developing"), "contexto developing");
  assertDoesNotContainAny(JSON.stringify(context), disclosureTexts("tomas", "deep"), "contexto developing");
});

check("ocho intervenciones pertinentes habilitan deep", () => {
  const context = getNarrativeDisclosureContext({
    patientId: "tomas",
    sessionNumber: 1,
    conversationHistory: deepHistory,
    currentUserMessage: "Que seria lo peor de equivocarte ahora?"
  });
  assert.equal(context.disclosureLevel, "deep");
  assertContainsAny(JSON.stringify(context), disclosureTexts("tomas", "deep"), "contexto deep");
});

check("sesion 2 habilita al menos developing", () => {
  const context = getNarrativeDisclosureContext({
    patientId: "tomas",
    sessionNumber: 2,
    currentUserMessage: "Podemos retomar lo que hablamos?"
  });
  assert.notEqual(context.disclosureLevel, "initial");
});

check("sesion 3 puede habilitar deep con continuidad minima", () => {
  const context = getNarrativeDisclosureContext({
    patientId: "tomas",
    sessionNumber: 3,
    conversationHistory: [{ question: "La vez pasada hablamos de tu familia." }],
    currentUserMessage: "Que significa para ti esa presion?"
  });
  assert.equal(context.disclosureLevel, "deep");
});

check("boundaries siempre se incluyen", () => {
  const context = getNarrativeDisclosureContext({ patientId: "tomas", currentUserMessage: "Hola" });
  assert.ok(context.internalGuidance.boundaries.length > 0);
  assertContainsAny(
    JSON.stringify(context.internalGuidance.boundaries),
    avatarNarratives.tomas.narrativeBoundaries,
    "boundaries"
  );
});

check("edades actuales canonicas", () => {
  assert.equal(getNarrativeDisclosureContext({ patientId: "tomas" }).currentAge, 18);
  assert.equal(getNarrativeDisclosureContext({ patientId: "nicolas" }).currentAge, 18);
  assert.equal(getNarrativeDisclosureContext({ patientId: "claudio" }).currentAge, 40);
});

check("contexto no contiene contenido de niveles bloqueados", () => {
  const context = getNarrativeDisclosureContext({ patientId: "nicolas", currentUserMessage: "Cuentame de ti." });
  const serialized = JSON.stringify(context);
  assertDoesNotContainAny(serialized, disclosureTexts("nicolas", "developing"), "nicolas initial");
  assertDoesNotContainAny(serialized, disclosureTexts("nicolas", "deep"), "nicolas initial");
});

check("objeto retornado no muta avatarNarratives", () => {
  const context = getNarrativeDisclosureContext({ patientId: "tomas", currentUserMessage: "Hola" });
  const originalInitial = avatarNarratives.tomas.disclosure.initial[0];
  const originalBoundary = avatarNarratives.tomas.narrativeBoundaries[0];
  context.availableFacts[0] = "MUTADO";
  context.internalGuidance.boundaries[0] = "MUTADO";
  context.availableTimeline[0].period = "MUTADO";
  assert.equal(avatarNarratives.tomas.disclosure.initial[0], originalInitial);
  assert.equal(avatarNarratives.tomas.narrativeBoundaries[0], originalBoundary);
});

check("mensajes vacios o saludos no cuentan como sustantivos", () => {
  const analysis = analyzeMessages(["", "hola", "ok", "bien", "continua"]);
  assert.equal(analysis.substantiveCount, 0);
  const context = getNarrativeDisclosureContext({
    patientId: "tomas",
    sessionNumber: 1,
    conversationHistory: [{ question: "hola" }, { question: "ok" }],
    currentUserMessage: "bien"
  });
  assert.equal(context.disclosureLevel, "initial");
});

check("tolera historial ausente, vacio o incompleto", () => {
  assert.equal(getNarrativeDisclosureContext({ patientId: "tomas" }).disclosureLevel, "initial");
  assert.equal(
    getNarrativeDisclosureContext({
      patientId: "tomas",
      conversationHistory: [null, {}, { answer: "respuesta del paciente" }, "Que paso?"]
    }).disclosureLevel,
    "initial"
  );
});

check("fragmento inicial de prompt esta filtrado", () => {
  const context = getNarrativeDisclosureContext({
    patientId: "tomas",
    currentUserMessage: "Cuentame que te trae por aca."
  });
  const fragment = buildNarrativePromptFragment(context);
  assert.ok(fragment.includes("CONTEXTO NARRATIVO INTERNO"));
  assert.ok(!fragment.includes("lockedLevels"));
  assert.ok(!fragment.includes(avatarNarratives.tomas.lifeHistory));
  assertDoesNotContainAny(fragment, disclosureTexts("tomas", "deep"), "fragmento inicial");
  assertContainsAny(fragment, avatarNarratives.tomas.narrativeBoundaries, "fragmento inicial boundaries");
  assert.ok(!fragment.includes("Valentina"));
  assert.ok(!fragment.includes(avatarNarratives.valentina.recentTrigger));
});

check("fragmento profundo incluye contenido profundo habilitado", () => {
  const context = getNarrativeDisclosureContext({
    patientId: "tomas",
    sessionNumber: 3,
    conversationHistory: [{ question: "La vez pasada hablamos de tu familia." }],
    currentUserMessage: "Que temes que ocurra si sales mas de ese mundo?"
  });
  const fragment = buildNarrativePromptFragment(context);
  assertContainsAny(fragment, disclosureTexts("tomas", "deep"), "fragmento deep");
});

if (failures.length) {
  console.error("[audit-narrative-disclosure] errores:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[audit-narrative-disclosure] OK: selector y fragmento narrativo validados.");
