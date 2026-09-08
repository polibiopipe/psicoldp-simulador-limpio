import { createRequire } from "node:module";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { build } from "esbuild";
import { cases } from "../src/data/cases.js";
import { getAvatarCanonicalBiography, buildCanonicalBiographyPromptContext } from "../src/data/avatarCanonicalBiographies.js";
import { getNarrativeDisclosureContext } from "../src/engine/narrativeDisclosure.js";
import { buildUserPrompt } from "../api/gemini-patient-response.js";
import { isIncompletePatientResponse } from "../src/utils/patientResponseValidation.js";

for (const text of ["Sí.", "No.", "No sé.", "No sé", "Me cuesta hablar.", "No sé…", '"Sí."', "No estoy seguro", "Tal vez", "A veces"]) {
  assert.equal(isIncompletePatientResponse(text, "STOP"), false, `Respuesta válida rechazada: ${text}`);
}
for (const text of ["", " ", "…", "Me cuesta hablar de", "Lo pienso porque", "A veces,", "Creo que"]) {
  assert.equal(isIncompletePatientResponse(text, "STOP"), true, `Truncamiento aceptado: ${text}`);
}
assert.equal(isIncompletePatientResponse("Tengo algo que decir.", "MAX_TOKENS"), true);

for (const item of cases) {
  const biography = getAvatarCanonicalBiography(item.id);
  assert.ok(existsSync(new URL(`../public${item.image}`, import.meta.url)), `Retrato ausente: ${item.id}`);
  assert.ok(!biography.directAnswers.household[0].includes("Vivo con vive"));
  assert.ok(!biography.directAnswers.substanceUse[0].includes("Alcohol:"));
  const initial = getNarrativeDisclosureContext({ patientId: item.id, sessionNumber: 1, currentUserMessage: "Hola" });
  const deep = getNarrativeDisclosureContext({ patientId: item.id, sessionNumber: 4, currentUserMessage: "¿Qué necesitas?" });
  assert.equal(initial.currentAge, biography.identity.age);
  assert.equal(initial.disclosureLevel, "initial");
  assert.equal(deep.disclosureLevel, "deep");
  assert.ok(deep.availableFacts.length > initial.availableFacts.length);
  assert.ok(deep.availableTimeline.every((event) => event.event && event.period));
  const canonicalBiography = buildCanonicalBiographyPromptContext(item.id);
  const context = {
    caseId: item.id, canonicalBiography,
    masterRecord: { sensitiveInfo: "PRIVATE_MASTER_SENTINEL" },
    patientFacts: { concern: "PRIVATE_LEGACY_SENTINEL" },
    minimumClinicalProfile: { name: biography.identity.preferredName, whatThePatientAvoids: "PRIVATE_AVOIDANCE_SENTINEL" }
  };
  const prompt = buildUserPrompt({ caseContext: context, narrativeContext: initial, recentHistory: [], sessionContext: { sessionNumber: 1 }, studentMessage: "Hola" });
  assert.ok(!/PRIVATE_\w+_SENTINEL/.test(prompt), `${item.id}: filtración desde expediente legacy`);
  assert.ok(!prompt.includes('"concerns"'), `${item.id}: preocupación profunda anticipada`);
  assert.ok(!prompt.includes('"recentEvent"'), `${item.id}: evento contextual anticipado`);
  assert.ok(prompt.includes(biography.identity.fullName), `${item.id}: identidad perdida`);
  assert.equal(prompt.split('"directAnswers"').length - 1, 1, "Biografía duplicada en prompt");
}

assert.match(getAvatarCanonicalBiography("hector").directAnswers.work[0], /Estoy jubilado/);
for (const id of ["nicolas", "daniela", "andres"]) {
  assert.match(getAvatarCanonicalBiography(id).directAnswers.work[0], /No tengo empleo formal/);
}
assert.match(getAvatarCanonicalBiography("patricia").directAnswers.children[0], /una hija/);
const patientOnly = getNarrativeDisclosureContext({ patientId: "tomas", sessionNumber: 1,
  conversationHistory: Array.from({ length: 8 }, () => ({ role: "patient", content: "¿Qué pasó en tu casa y qué significa para ti?" })), currentUserMessage: "Hola" });
assert.equal(patientOnly.disclosureLevel, "initial", "las respuestas del paciente no equivalen a exploración del estudiante");

// Render the actual components without browser credentials or live API calls.
const result = await build({
  stdin: {
    contents: `import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { ProgressBar } from "./src/components/ProgressBar.jsx";
      import { AvatarSessionView } from "./src/components/AvatarSessionView.jsx";
      import { AuthenticatedLayout } from "./src/components/AuthenticatedLayout.jsx";
      export const progress = renderToStaticMarkup(<ProgressBar turnCount={10} remainingMs={1350000} durationMinutes={45} />);
      export const portrait = renderToStaticMarkup(<AvatarSessionView caseItem={{ id:"tomas", name:"Tomás", age:"18 años", image:"/avatar/tomas.webp" }} />);
      export const busyNavigation = renderToStaticMarkup(<AuthenticatedLayout isBusy hasEvaluation userEmail="test@example.test" currentScreen="simulation" />);`,
    resolveDir: new URL("..", import.meta.url).pathname,
    loader: "jsx"
  }, bundle: true, write: false, platform: "node", format: "cjs", packages: "external"
});
const compiled = { exports: {} };
new Function("require", "module", "exports", result.outputFiles[0].text)(createRequire(import.meta.url), compiled, compiled.exports);
const { progress, portrait, busyNavigation } = compiled.exports;
assert.match(progress, /aria-valuenow="50"/);
assert.match(progress, /10 intervenciones/);
assert.ok(!progress.includes("Progreso formativo"));
assert.ok(!/<button|<video|<audio/.test(portrait));
assert.match(portrait, /Entrevista por texto/);
assert.ok([...busyNavigation.matchAll(/<button\b[^>]*>/g)].every(([tag]) => tag.includes('disabled=""')));
console.log("Coherence audit passed: short answers, 15 narratives, prompt boundaries, portraits, time indicator and navigation lock.");
