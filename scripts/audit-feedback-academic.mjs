import assert from "node:assert/strict";
import { buildSessionFeedback, analyzeConversationEvidence } from "../src/engine/sessionFeedback.js";
import { analyzeStudentInput, summarizeConversationMemory } from "../src/utils/analyzeStudentInput.js";
import { buildEducationalReport } from "../src/utils/scoring.js";
import { evaluateExternalReportIntegration, evaluateInterventionDesign } from "../src/engine/clinicalComplementaryEvaluation.js";
import { feedbackSources, feedbackCompetencies } from "../src/data/feedbackAcademicBasis.js";
import { buildResultsText } from "../src/utils/exportResults.js";
import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

let passed = 0;
const check = (name, fn) => { fn(); passed++; console.log(`PASS ${name}`); };
const turn = (question, answer = "No sé cómo explicarlo.") => ({ question, answer });
const one = (question, previous = "") => analyzeConversationEvidence([{ isSessionPrelude: true, answer: previous }, turn(question)])[0];
const caseItem = { id: "test", name: "Paciente de prueba", age: 25, learningObjectives: ["Explorar red de apoyo", "Evaluar riesgo", "Contrastar hipótesis alternativa"] };
const repeat = Array.from({ length: 8 }, () => turn("Hola"));

check("El juicio no se convierte en validación al anteponer entiendo", () => {
  const a = one("Entiendo, pero exageras y es tu culpa.");
  assert.equal(a.validation, false); assert.equal(a.judgment, true); assert.equal(a.mixedMessage, true);
  assert.match(a.recognizedSkill, /juzgador/);
  assert.equal(analyzeStudentInput(a.quote).categories.validation, false);
});
check("Decir entiendo sin contenido no acredita validación", () => {
  assert.equal(one("Entiendo.").validation, false);
});
check("Negaciones y discurso referido no atribuyen culpa al estudiante", () => {
  for (const text of ["No es tu culpa. ¿Cómo te sientes?", "Tampoco eres flojo.", "Me dijiste que te dijeron que es tu culpa.", "Te dijeron: “es tu culpa”. ¿Cómo fue escucharlo?"]) assert.equal(one(text).judgment, false, text);
});
check("Respetar autonomía no es consejo apresurado", () => {
  const a = one("No tienes que contarlo; podemos dejar ese tema.", "No quiero hablar de mi hermano.");
  assert.equal(a.autonomyRespect, true); assert.equal(a.rushedAdvice, false); assert.equal(a.boundaryPressure, false);
});
check("La cortesía no oculta una insistencia posterior", () => {
  const a = one("Si te parece, pero dime ahora lo que pasó.", "No quiero hablar de eso.");
  assert.equal(a.boundaryPressure, true); assert.equal(a.autonomyRespect, false);
});
check("El límite del preludio participa del análisis y de la memoria", () => {
  const conversation = [{ isSessionPrelude: true, answer: "No quiero hablar de mi hermano." }, turn("Dime qué pasó con él.")];
  assert.equal(buildSessionFeedback({ conversation }).observedActions[0].boundaryPressure, true);
  assert.equal(summarizeConversationMemory(conversation).boundaryPressure, 1);
});
check("No se inventa una carrera al reformular un límite familiar", () => {
  const a = one("Dime qué pasó con él.", "No quiero hablar de mi hermano.");
  assert.doesNotMatch(a.reformulation, /carrera|nombre/);
});
check("La respuesta posterior cambia la lectura de recepción", () => {
  const accepted = analyzeConversationEvidence([turn("Entiendo que ha sido difícil.", "Gracias por escuchar, me siento comprendida.")])[0];
  const rejected = analyzeConversationEvidence([turn("Entiendo que ha sido difícil.", "No me entiendes. Prefiero no hablar.")])[0];
  assert.notEqual(accepted.possibleEffect, rejected.possibleEffect);
  assert.match(accepted.possibleEffect, /aceptación/); assert.match(rejected.possibleEffect, /reserva o desacuerdo/);
});
check("La falta de respuesta obliga a abstenerse sobre el efecto", () => assert.match(analyzeConversationEvidence([turn("¿Qué te preocupa?", "")])[0].possibleEffect, /no se puede valorar/));
check("Repetir saludos no produce evidencia suficiente ni objetivos logrados", () => {
  const f = buildSessionFeedback({ conversation: repeat });
  assert.equal(f.evidenceLevel.meaningfulCount, 0); assert.equal(f.level, "very_preliminary");
  const r = buildEducationalReport(repeat, caseItem);
  assert.equal(r.generalScore, null); assert.ok(r.objectiveEvaluation.every(o => o.score === 0));
});
check("Una conversación breve no recibe porcentaje ni evaluación completa", () => {
  const r = buildEducationalReport([turn("Hola"), turn("¿Cómo fue la sesión de ayer?")], caseItem);
  assert.equal(r.evaluationStatus, "limited"); assert.equal(r.generalScore, null);
  assert.equal(r.criteria.find(c => c.id === "encuadre").score, 0);
  assert.equal(r.criteria.find(c => c.id === "eticaRiesgo").score, 0);
});
check("Suicidarte se detecta como tema, sin acreditar evaluación completa", () => {
  const q = "¿Has pensado en suicidarte?";
  assert.equal(one(q).risk, true);
  assert.equal(buildEducationalReport([turn(q)], caseItem).criteria.find(c => c.id === "eticaRiesgo").level, "partial");
});
check("La sesión cuatro no se describe como un cierre observado", () => {
  const f = buildSessionFeedback({ sessionNumber: 4, conversation: repeat });
  assert.doesNotMatch(f.sessionSummary, /centrada en|se observó.*cierre/i);
  assert.match(f.sessionSummary, /Foco previsto/);
});
check("No se reintroducen categorías antiguas que contradicen el texto", () => {
  const q = "No es tu culpa.";
  const m = summarizeConversationMemory([{ ...turn(q), analysis: { categories: { judgment: true } } }]);
  assert.equal(m.judgment, 0);
});
check("Los turnos pendientes no se evalúan", () => {
  const history = [{ ...turn("Es tu culpa"), isPendingResponse: true }];
  assert.equal(buildSessionFeedback({ conversation: history }).observedActions.length, 0);
  assert.equal(buildEducationalReport(history, caseItem).evaluationStatus, "not_evaluable");
});
check("No se incorporan fortalezas genéricas de un informe heredado", () => {
  const f = buildSessionFeedback({ conversation: repeat, report: { strengths: ["Excelente psicoterapeuta"] } });
  assert.doesNotMatch(f.strengths.join(" "), /Excelente/);
});
check("Textos irrelevantes extensos no acreditan integración ni diseño", () => {
  const nonsense = "La bicicleta azul gira junto a la ventana. ".repeat(20);
  const integration = evaluateExternalReportIntegration(Object.fromEntries(["newInformation", "hypothesisImpact", "interventionUse", "ethicalRisks", "limitations"].map(key => [key, nonsense])));
  const design = evaluateInterventionDesign(Object.fromEntries(["caseUnderstanding", "clinicalFormulation", "objectives", "treatmentPlan", "strategies", "processEvaluation", "ethics", "reflexivity", "contextualIntegration", "continuityDecision"].map(key => [key, nonsense])));
  for (const r of [integration, design]) { assert.equal(r.level, "needsReview"); assert.equal(r.assessmentKind, "structure_only"); assert.ok(r.repeatedFields.length > 0); assert.doesNotMatch(r.levelLabel, /lograda|consistente/i); }
});
check("Un campo breve con contenido se registra sin premiar la longitud", () => {
  const r = evaluateExternalReportIntegration({ limitations: "Falta contraste." });
  assert.ok(r.completedFields.includes("limitations")); assert.ok(!r.missingFields.includes("limitations"));
});
check("Todas las observaciones tienen citas intactas, criterio, reflexión y fuentes resolubles", () => {
  const f = buildSessionFeedback({ conversation: [turn("Entiendo que debe ser pesado. Cuando dices que te absorbe, ¿a qué te refieres?")] });
  const a = f.observedActions[0]; assert.ok(a.validation && a.followUp && a.facilitativeOpenQuestion);
  assert.ok(f.strengths[0].includes(`“${a.quote}”`));
  assert.ok(a.reflectionQuestion && a.criterionId && a.basisVersion);
  for (const c of Object.values(feedbackCompetencies)) for (const id of c.sourceIds) assert.ok(feedbackSources.some(s => s.id === id && s.url.startsWith("https://")));
  assert.equal(new Set(feedbackSources.map(s => s.id)).size, feedbackSources.length);
});

const history = [...repeat, turn("Es tu culpa que nadie te quiera.", "Me siento juzgada.")];
const report = buildEducationalReport(history, caseItem);
check("El incidente tardío aparece como prioridad y en la exportación", () => {
  const f = buildSessionFeedback({ conversation: history });
  assert.equal(f.priorityActions[0].index, 9);
  assert.ok(buildResultsText({ history, report, caseItem }).includes(history[8].question));
  const exported = buildResultsText({ history: [{ isSessionPrelude: true, answer: "No quiero hablar de mi familia." }, ...history], report, caseItem });
  assert.ok(exported.includes("Contexto anterior: No quiero hablar de mi familia."));
  assert.ok(exported.includes("Para reflexionar: Turno 9:"));
  assert.doesNotMatch(exported, /Estudiante: undefined/);
});
const temp = await mkdtemp(resolve(".audit-academic-"));
try {
  const outfile = join(temp, "feedback.mjs");
  await build({ entryPoints: ["src/components/FeedbackPanel.jsx"], outfile, bundle: true, platform: "node", format: "esm", external: ["react", "react-dom", "lucide-react"] });
  const { FeedbackPanel } = await import(pathToFileURL(outfile));
  const html = renderToStaticMarkup(React.createElement(FeedbackPanel, { history, report, caseItem }));
  check("El detalle renderizado incluye el turno nueve, la respuesta y los enlaces", () => {
    assert.ok(html.includes(history[8].question)); assert.ok(html.includes(history[8].answer));
    assert.ok(html.includes("Para reflexionar")); assert.ok(html.includes("https://doi.org/10.3389/fpsyg.2019.03087"));
    assert.equal((html.match(/<blockquote>/g) || []).length, 9);
  });
} finally { await rm(temp, { recursive: true, force: true }); }
console.log(`${passed} regresiones académicas y de especificidad verificadas.`);
