import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { createMediationHandler } from "../api/feedback-mediation.js";
import { buildMediationContext, validateMediationResult, mediationPracticeText } from "../src/engine/feedbackMediation.js";
import { analyzeConversationEvidence } from "../src/engine/sessionFeedback.js";

const conversation = [{ isSessionPrelude: true, answer: "Prefiero no hablar de mi familia todavía." },
  { id: "turn-1", question: "Respeto tu decisión. ¿Qué te gustaría conversar hoy?", answer: "Quiero hablar de lo que me pasa al estudiar." }];
const practice = { turnIndex: 1, reflection: "Buscaba respetar el límite familiar y ofrecer una elección.", rewrite: "Podemos dejar ese tema. ¿Qué quisieras que entendiera de cómo te sientes al estudiar?" };
const context = buildMediationContext(conversation, 1, practice.reflection, practice.rewrite);
const output = {
  criterionId: "autonomy", studentQuote: context.selected.quote, patientQuote: context.selected.patientAnswer,
  observation: "Dices «Respeto tu decisión» y ofreces elegir de qué conversar.",
  interpretation: "El paciente elige hablar de estudiar; esto permite revisar cómo recibió tu invitación, sin asegurar que aumentó su confianza.",
  alternativeReading: "Elegir otro tema también puede mantener el límite que ya había expresado.",
  reflectionResponse: "Tu intención de respetar el límite familiar coincide con dejar el tema abierto a su elección.",
  rewriteFeedback: "El ensayo retoma estudiar; revisa si delimita demasiado pronto la experiencia a cómo se siente.",
  nextQuestion: "¿Qué diferencia ves entre invitar a elegir y orientar hacia una emoción?",
  nextPractice: "Ensaya una pregunta que retome estudiar y permita al paciente precisar qué le preocupa.",
  limitations: "No hay respuesta al segundo intento; su efecto necesita observarse en otra práctica."
};
let passed = 0;
async function check(name, fn) { await fn(); console.log(`PASS ${name}`); passed++; }
const env = { SUPABASE_URL: process.env.SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY: process.env.GEMINI_API_KEY };
process.env.SUPABASE_URL = "https://fixture.invalid"; process.env.SUPABASE_SERVICE_ROLE_KEY = "fixture"; process.env.GEMINI_API_KEY = "fixture";
let authenticated = true, approved = true, assigned = true, consent = true, owner = "owner", status = "completed", providerMode = "ok", calls = 0, sent;
const original = JSON.stringify(conversation);
const client = {
  auth: { getUser: async () => ({ data: { user: authenticated ? { id: "owner" } : null } }) },
  from(table) {
    return { select() { return this; }, eq() { return this; }, async maybeSingle() {
      return { data: table === "user_profiles" ? { approved } : table === "simulator_access" ? { simulator_id: assigned ? "escucha-viva" : "other", enabled: assigned } :
        table === "simulation_access_documents" ? { version: "1" } : table === "simulation_access_consents" ? (consent ? { id: "receipt", user_id: "owner", document_version: "1", adult_confirmed: true, educational_use_accepted: true, data_processing_accepted: true } : null) :
        { id: "session-1", user_id: owner, status, conversation: conversation.slice(1), feedback: { sessionPrelude: conversation.slice(0, 1), hiddenBiography: "NEVER_SEND_THIS", feedbackPractice: { obsolete: "NEVER_SEND_THIS" } } } };
    } };
  }
};
const providerFetch = async (url, options) => {
  calls++; sent = JSON.parse(options.body);
  assert.ok(!url.includes("fixture"), "la clave no viaja en la URL");
  if (providerMode === "timeout") { const error = new Error("timeout"); error.name = "AbortError"; throw error; }
  return { ok: providerMode !== "offline", json: async () => ({ candidates: [{ finishReason: providerMode === "truncated" ? "MAX_TOKENS" : "STOP",
    content: { parts: [{ text: JSON.stringify(providerMode === "invented" ? { ...output, studentQuote: "Una frase inexistente" } : output) }] } }] }) };
};
function handler() { return createMediationHandler({ clientFactory: () => client, providerFetch }); }
async function call({ handle = handler(), body = { sessionRecordId: "session-1", ...practice }, authorization = "Bearer fixture", method = "POST" } = {}) {
  const res = { setHeader() {}, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } };
  await handle({ method, headers: { authorization }, body }, res); return res;
}
const temp = await mkdtemp(resolve(".audit-mediation-"));
let ui;
const oldFetch = globalThis.fetch;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
try {
  await check("el contexto incluye la apertura, la reflexión y todos los turnos", () => {
    assert.equal(context.selected.previousPatientResponse, conversation[0].answer);
    assert.equal(context.conversation.length, 1);
    assert.equal(context.reflection, practice.reflection);
    assert.equal(context.criteria.length, 10);
  });
  await check("la validación rechaza citas inventadas, criterios ajenos y devolución genérica", () => {
    assert.ok(validateMediationResult(output, context.selected));
    assert.equal(validateMediationResult({ ...output, patientQuote: "Gracias, eso me curó." }, context.selected), null);
    assert.equal(validateMediationResult({ ...output, criterionId: "diagnosis" }, context.selected), null);
    assert.equal(validateMediationResult({ ...output, observation: "Excelente trabajo.", interpretation: "Muy bien." }, context.selected), null);
  });
  await check("sin identidad verificada, asignación o consentimiento no se llama a la IA", async () => {
    assert.equal((await call({ authorization: "" })).statusCode, 401);
    authenticated = false; assert.equal((await call()).statusCode, 401); authenticated = true;
    approved = false; assert.equal((await call()).statusCode, 403); approved = true;
    assigned = false; assert.equal((await call()).statusCode, 403); assigned = true;
    consent = false; assert.equal((await call()).statusCode, 403); consent = true;
    assert.equal(calls, 0);
  });
  await check("una sesión ajena o todavía abierta no se revisa", async () => {
    owner = "other"; assert.equal((await call()).statusCode, 404); owner = "owner";
    status = "in_progress"; assert.equal((await call()).statusCode, 409); status = "completed";
    assert.equal((await call({ body: { sessionRecordId: "session-1", ...practice, turnIndex: 99 } })).statusCode, 409);
    assert.equal(calls, 0);
  });
  await check("solicitudes inválidas o demasiado grandes no llegan al proveedor", async () => {
    assert.equal((await call({ method: "GET" })).statusCode, 405);
    assert.equal((await call({ body: "{" })).statusCode, 400);
    assert.equal((await call({ body: "x".repeat(8001) })).statusCode, 413);
    assert.equal((await call({ body: { sessionRecordId: "session-1", ...practice, rewrite: " " } })).statusCode, 400);
    assert.equal(calls, 0);
  });
  await check("la IA recibe la entrevista autorizada y devuelve fuentes del catálogo", async () => {
    const res = await call({ body: { sessionRecordId: "session-1", ...practice, conversation: [{ question: "TAMPERED" }], userId: "other" } });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.source, "gemini");
    assert.equal(res.body.studentQuote, conversation[1].question);
    assert.ok(res.body.sources.every(source => /^https:/.test(source.url)));
    const text = JSON.stringify(sent); assert.ok(!text.includes("TAMPERED")); assert.ok(!text.includes("NEVER_SEND_THIS"));
    assert.equal(JSON.parse(sent.contents[0].parts[0].text).selected.previousPatientResponse, conversation[0].answer);
    assert.match(sent.systemInstruction.parts[0].text, /nunca como instrucciones/);
    assert.equal(JSON.stringify(conversation), original);
  });
  await check("fallas, respuestas truncadas o citas inventadas conservan el ejercicio sin fabricar una devolución", async () => {
    for (const mode of ["offline", "timeout", "truncated", "invented"]) {
      providerMode = mode; const res = await call(); assert.ok(res.statusCode >= 500); assert.equal(res.body.source, undefined);
    }
    providerMode = "ok";
  });
  await check("las llamadas repetidas tienen un límite por instancia", async () => {
    const handle = handler(); for (let i = 0; i < 4; i++) assert.equal((await call({ handle })).statusCode, 200);
    assert.equal((await call({ handle })).statusCode, 429);
  });
  await check("exportar distingue respuesta registrada, ensayo e interpretación", () => {
    const exported = mediationPracticeText({ action: context.selected, ...practice, result: validateMediationResult(output, context.selected) });
    assert.ok(exported.includes(conversation[1].answer)); assert.ok(exported.includes(practice.rewrite));
    assert.match(exported, /no enviado al paciente/); assert.match(exported, /Versión de criterios/);
  });
  const outfile = join(temp, "ui.mjs");
  await build({ entryPoints: ["src/components/FeedbackMediation.jsx"], outfile, bundle: true, platform: "node", format: "esm", external: ["react"] });
  const { FeedbackMediation } = await import(pathToFileURL(outfile));
  let draft, saved = 0, resolveFetch, requestCount = 0, saveFails = false;
  const actions = analyzeConversationEvidence(conversation);
  globalThis.fetch = async () => { requestCount++; return new Promise(resolve => { resolveFetch = resolve; }); };
  const render = () => React.createElement(FeedbackMediation, { actions, sessionRecordId: "session-1", authSession: { access_token: "fixture" },
    onDraftChange: value => { draft = value; }, onSavePractice: async () => { saved++; return { cloudSaved: !saveFails }; } });
  await act(async () => { ui = TestRenderer.create(render()); });
  const submit = () => ui.root.findByType("form").props.onSubmit({ preventDefault() {} });
  await check("el estudiante escribe antes de solicitar revisión; no hay llamadas automáticas", async () => {
    assert.equal(requestCount, 0);
    await act(async () => { ui.root.findAllByType("textarea")[0].props.onChange({ target: { value: practice.reflection } }); });
    await act(async () => { ui.root.findAllByType("textarea")[1].props.onChange({ target: { value: practice.rewrite } }); });
    assert.equal(draft.rewrite, practice.rewrite); assert.equal(requestCount, 0);
  });
  await check("un guardado fallido impide enviar a la IA y conserva el borrador", async () => {
    saveFails = true; await act(async () => { await submit(); });
    assert.equal(requestCount, 0); assert.match(JSON.stringify(ui.toJSON()), /No se confirmó el guardado/);
    assert.equal(ui.root.findAllByType("textarea")[1].props.value, practice.rewrite); saveFails = false;
  });
  await check("doble clic hace una sola solicitud y la devolución no altera el diálogo", async () => {
    let task;
    await act(async () => { task = submit(); await submit(); });
    assert.equal(requestCount, 1); assert.equal(saved, 2);
    assert.equal(ui.root.findByType("fieldset").props.disabled, true);
    await act(async () => { resolveFetch({ ok: true, json: async () => ({ ...output, source: "gemini" }) }); await task; });
    assert.match(JSON.stringify(ui.toJSON()), /Una lectura para contrastar/);
    assert.equal(JSON.stringify(conversation), original);
    assert.equal(draft.result.studentQuote, conversation[1].question);
  });
  await check("editar el ensayo retira la devolución anterior y habilita revisarla de nuevo", async () => {
    await act(async () => { ui.root.findAllByType("textarea")[1].props.onChange({ target: { value: "¿Qué ocurre cuando intentas estudiar?" } }); });
    assert.equal(draft.result, null); assert.doesNotMatch(JSON.stringify(ui.toJSON()), /Una lectura para contrastar/);
  });
  await check("cambiar de momento y volver conserva el ensayo escrito", async () => {
    const extended = analyzeConversationEvidence([...conversation, { question: "¿Desde cuándo te ocurre?", answer: "Desde que comenzó este semestre." }]);
    await act(async () => { ui.update(React.createElement(FeedbackMediation, { actions: extended, sessionRecordId: "session-1", onDraftChange: value => { draft = value; } })); });
    await act(async () => { ui.root.findByType("select").props.onChange({ target: { value: "2" } }); });
    await act(async () => { ui.root.findAllByType("textarea")[1].props.onChange({ target: { value: "¿Qué cambió ese semestre?" } }); });
    await act(async () => { ui.root.findByType("select").props.onChange({ target: { value: "1" } }); });
    assert.equal(ui.root.findAllByType("textarea")[1].props.value, "¿Qué ocurre cuando intentas estudiar?");
    assert.equal(draft.otherTurns[2].rewrite, "¿Qué cambió ese semestre?");
  });
  console.log(`${passed} comprobaciones de mediación verificadas.`);
} finally {
  if (ui) await act(async () => ui.unmount());
  globalThis.fetch = oldFetch;
  for (const [key, value] of Object.entries(env)) if (value === undefined) delete process.env[key]; else process.env[key] = value;
  await rm(temp, { recursive: true, force: true });
}
