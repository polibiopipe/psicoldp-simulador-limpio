import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildNarrativePromptFragment } from "../api/gemini-patient-response.js";
import { avatarNarratives } from "../src/data/avatarNarratives.js";
import { cases } from "../src/data/cases.js";
import { patientFacts } from "../src/data/patientFacts.js";
import { patientProfiles } from "../src/data/patientProfiles.js";
import { buildLocalNarrativeResponse } from "../src/engine/localNarrativeResponder.js";
import { generateLocalPatientResponse } from "../src/engine/localMiniAI.js";
import { getNarrativeDisclosureContext } from "../src/engine/narrativeDisclosure.js";

const PATIENT_IDS = [
  "tomas",
  "valentina",
  "marcos",
  "elena",
  "nicolas",
  "camila",
  "rodrigo",
  "fernanda",
  "hector",
  "daniela",
  "andres",
  "patricia",
  "miguel",
  "sofia",
  "claudio"
];

const TECHNICAL_RESPONSE_TERMS = [
  "centralTheme",
  "lifeHistory",
  "recentTrigger",
  "relationalPattern",
  "internalConflict",
  "stakes",
  "disclosure",
  "initial",
  "developing",
  "deep",
  "narrativeBoundaries",
  "expediente narrativo",
  "contexto narrativo interno",
  "prompt",
  "system instruction",
  "instrucciones internas",
  "nivel narrativo",
  "mi conflicto interno",
  "mi patron relacional",
  "mi patrón relacional"
];

const LEGACY_MINOR_PATTERNS = [
  /\btengo\s+16\b/i,
  /\b16\s+anos\b/i,
  /\b16\s+años\b/i,
  /\badolescente\s+de\s+16\b/i,
  /\bsoy\s+menor\s+de\s+edad\b/i,
  /\bsoy\s+un\s+nino\b/i,
  /\bsoy\s+un\s+niño\b/i,
  /\bsoy\s+una\s+nina\b/i,
  /\bsoy\s+una\s+niña\b/i
];

const FORBIDDEN_DIAGNOSTIC_SHORTCUTS = {
  tomas: [/adiccion/i, /adicción/i],
  nicolas: [/depresion/i, /depresión/i, /castigo/i],
  valentina: [/beca/i, /universidad de/i, /psicologia/i, /psicología/i],
  marcos: [/despido/i, /accidente/i],
  elena: [/enfermedad/i, /abandono/i],
  camila: [/manipuladora/i, /manipulan/i],
  rodrigo: [/juicio/i, /tribunal/i],
  fernanda: [/diagnostico/i, /diagnóstico/i, /discriminacion comprobada/i, /discriminación comprobada/i],
  hector: [/deterioro cognitivo/i, /depresion/i, /depresión/i],
  daniela: [/negligencia grave/i, /no quiero a mi hijo/i],
  andres: [/pobreza extrema/i, /fobia social/i],
  patricia: [/delito/i, /violencia/i, /consumo/i],
  miguel: [/venezuela/i, /colombia/i, /peru/i, /perú/i, /argentina/i, /haiti/i, /abogado/i, /ingeniero/i, /medico/i, /médico/i, /irregular/i],
  sofia: [/ciberacoso/i, /superficial/i],
  claudio: [/24 anos/i, /24 años/i, /apagarme/i, /infidelidad/i]
};

const SPECIFIC_QUESTIONS = {
  tomas: [
    "Que edad tienes?",
    "Con quien vives?",
    "Tienes hermanos?",
    "Que significa para ti el computador?",
    "Por que te cuesta pensar en lo que haras despues del colegio?",
    "Que pasa cuando tus padres te presionan?",
    "Que temes que ocurra fuera del juego?"
  ],
  nicolas: [
    "Que edad tienes?",
    "Tu pediste venir?",
    "Que ocurrio con la postulacion?",
    "Que piensas hacer despues del colegio?",
    "Por que respondes que no sabes?",
    "Que temes que pase si eliges mal?"
  ],
  valentina: [
    "Que paso con la evaluacion?",
    "Por que cancelaste la salida?",
    "Como te afecta descansar?",
    "Que crees que pensarian de ti si no te fuera bien?"
  ],
  marcos: [
    "Que ocurrio despues del trabajo?",
    "Por que no pediste ayuda?",
    "Como esta afectando esto a tu pareja?",
    "Que significaria para ti poner limites?"
  ],
  elena: [
    "Que ocurrio con esa decision familiar?",
    "Por que te afecto enterarte despues?",
    "Que lugar ocupas en tu familia?",
    "Quien eres cuando los demas no necesitan ayuda?"
  ],
  camila: [
    "Por que cancelaste nuevamente tus planes?",
    "Que pasa cuando intentas decir que no?",
    "Por que aparece culpa?",
    "Que temes que cambie si dejas de resolver problemas?"
  ],
  rodrigo: [
    "Que te preguntaron tus hijos?",
    "Por que dices que solo estas cansado?",
    "Como has vivido la separacion?",
    "Que intentas proteger?"
  ],
  fernanda: [
    "Que decia el correo que recibiste?",
    "Que imaginas que ocurrira cuando regreses?",
    "Que temes que piensen tus colegas?",
    "Sientes que puedes volver a trabajar como antes?"
  ],
  hector: [
    "Que sentiste al volver a tu antiguo trabajo?",
    "Como es tu rutina ahora?",
    "Por que no te interesan las actividades que te proponen?",
    "Que significa para ti dejar de trabajar?"
  ],
  daniela: [
    "Que ocurrio con la evaluacion y la actividad de tu hijo?",
    "Por que te cuesta pedir ayuda?",
    "Que sientes cuando dedicas tiempo a estudiar?",
    "Extranas algo de tu vida anterior?"
  ],
  andres: [
    "Que ocurrio durante la presentacion?",
    "Por que no preguntas cuando tienes dudas?",
    "Que significa para tu familia que estes estudiando?",
    "Que temes que confirme un error?"
  ],
  patricia: [
    "Que ocurrio cuando tu hija llego tarde?",
    "Por que revisas tanto donde esta?",
    "Que significa para ti confiar?",
    "Que temes que pase si le das mas autonomia?"
  ],
  miguel: [
    "Que ocurrio con la idea que propusiste?",
    "Por que no dijiste nada?",
    "Como era tu vida profesional antes de migrar?",
    "Que sientes que has perdido desde que llegaste?"
  ],
  sofia: [
    "Que paso con la publicacion?",
    "Por que revisabas las reacciones?",
    "Que sientes cuando nadie responde?",
    "Que valor tiene algo importante si no lo publicas?"
  ],
  claudio: [
    "Que edad tienes?",
    "Que ocurrio con la oportunidad?",
    "Por que dejaste vencer el plazo?",
    "Que sentiste cuando ya no podias aceptarla?",
    "Que temes que cambie si tomas una decision nueva?"
  ]
};

const CROSS_CONTAMINATION_RULES = [
  { owner: "tomas", label: "familia Tomas", pattern: /carolina[\s\S]{0,80}rodrigo[\s\S]{0,80}emilia|emilia[\s\S]{0,80}computador/i },
  { owner: "hector", label: "jubilacion Hector", pattern: /jubil|antiguo trabajo/i, forbiddenIn: ["marcos", "claudio"] },
  { owner: "miguel", label: "migracion Miguel", pattern: /migr|pais que deje|pa[ií]s que dej[eé]/i, forbiddenIn: ["andres"] },
  { owner: "daniela", label: "maternidad Daniela", pattern: /maternidad|mi hijo|actividad de mi hijo/i, forbiddenIn: ["valentina"] },
  { owner: "patricia", label: "hija adolescente Patricia", pattern: /hija adolescente/i, forbiddenIn: ["rodrigo"] },
  { owner: "rodrigo", label: "separacion Rodrigo", pattern: /separacion|separaci[oó]n/i, forbiddenIn: ["claudio"] },
  { owner: "claudio", label: "oportunidad vencida Claudio", pattern: /oportunidad[\s\S]{0,80}(vencio|venci[oó]|plazo)|plazo[\s\S]{0,80}venci/i, forbiddenIn: ["fernanda"] },
  { owner: "tomas", label: "computador Tomas", pattern: /computador|videojuego|juego online/i, forbiddenIn: ["nicolas"] },
  { owner: "sofia", label: "publicacion Sofia", pattern: /publicacion|publicaci[oó]n|reacciones/i, forbiddenIn: ["valentina"] },
  { owner: "fernanda", label: "licencia Fernanda", pattern: /licencia|reincorporaci[oó]n m[eé]dica|reincorporacion medica/i, forbiddenIn: ["marcos"] }
];

let checkCount = 0;
let scenarioTurnCount = 0;
const observedResponses = new Map();
const resultByPatient = new Map();

const avatarSnapshot = JSON.stringify(avatarNarratives);
const factsSnapshot = JSON.stringify(patientFacts);
const profilesSnapshot = JSON.stringify(patientProfiles);

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[¿?¡!.,;:()[\]{}"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function check(name, fn) {
  try {
    fn();
    checkCount += 1;
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

function ask(patientId, message, options = {}) {
  const history = options.history || [];
  const historyBefore = JSON.stringify(history);
  const result = generateLocalPatientResponse({
    caseId: patientId,
    studentMessage: message,
    history,
    sessionNumber: options.sessionNumber || 1
  });
  assert.equal(JSON.stringify(history), historyBefore, `${patientId}: history mutated by local engine`);
  assertValidEngineResult(result, patientId, message);
  rememberResponse(patientId, message, result.responseText);
  scenarioTurnCount += 1;
  return result;
}

function narrativeAsk(patientId, message, options = {}) {
  const history = options.history || [];
  const historyBefore = JSON.stringify(history);
  const result = buildLocalNarrativeResponse({
    patientId,
    currentUserMessage: message,
    conversationHistory: history,
    sessionNumber: options.sessionNumber || 1,
    canonicalFacts: patientFacts[patientId],
    patientProfile: patientProfiles[patientId]
  });
  assert.equal(JSON.stringify(history), historyBefore, `${patientId}: history mutated by narrative responder`);
  assert.ok(result?.responseText, `${patientId}: narrative responder returned no response for "${message}"`);
  assertNaturalPatientText(result.responseText, `${patientId}: ${message}`);
  rememberResponse(patientId, message, result.responseText);
  scenarioTurnCount += 1;
  return result;
}

function rememberResponse(patientId, message, responseText) {
  if (!observedResponses.has(patientId)) observedResponses.set(patientId, []);
  observedResponses.get(patientId).push({ message, responseText });
}

function assertValidEngineResult(result, patientId, message) {
  assert.ok(result && typeof result === "object", `${patientId}: engine result missing for "${message}"`);
  assert.equal(result.caseId, patientId, `${patientId}: caseId mismatch for "${message}"`);
  assert.ok(result.responseText, `${patientId}: empty response for "${message}"`);
  assert.ok(result.intent, `${patientId}: missing intent for "${message}"`);
  assert.ok(result.debug && typeof result.debug === "object", `${patientId}: missing debug contract for "${message}"`);
  assertNaturalPatientText(result.responseText, `${patientId}: ${message}`);
}

function assertNaturalPatientText(text, label) {
  assert.equal(typeof text, "string", `${label}: response is not string`);
  assert.ok(text.trim().length > 0, `${label}: response is blank`);
  assert.ok(!/\[object object\]/i.test(text), `${label}: visible object leak`);
  assert.ok(!/^\s*[{[]/.test(text), `${label}: visible JSON-like response`);
  assert.ok(!/\bundefined\b|\bnull\b|\bNaN\b/i.test(text), `${label}: invalid primitive leak`);
  assertNoTechnicalLeak(text, label);
  assertNoLegacyMinorLeak(text, label);
  assertNoDoubleResponse(text, label);
  assertNoForbiddenClinicalShortcut(text, label);
}

function assertNoTechnicalLeak(text, label) {
  const normalized = normalize(text);
  for (const term of TECHNICAL_RESPONSE_TERMS) {
    assert.ok(!normalized.includes(normalize(term)), `${label}: technical/internal term leaked: ${term}`);
  }
  assert.ok(!/^mi conflicto interno\b/i.test(text), `${label}: starts with clinical field label`);
  assert.ok(!/^mi patron relacional\b/i.test(normalized), `${label}: starts with clinical field label`);
}

function assertNoLegacyMinorLeak(text, label) {
  for (const pattern of LEGACY_MINOR_PATTERNS) {
    assert.ok(!pattern.test(text), `${label}: legacy minor-age leak: ${pattern}`);
  }
}

function assertNoDoubleResponse(text, label) {
  assert.ok(!/\n\s*\n/.test(text), `${label}: double paragraph response`);
  assert.ok(!/\bPaciente\s*:/i.test(text), `${label}: role label leaked`);
  assert.ok(!/\bEstudiante\s*:/i.test(text), `${label}: dialogue transcript leaked`);
}

function assertNoForbiddenClinicalShortcut(text, label) {
  const patientId = label.split(":")[0];
  const patterns = FORBIDDEN_DIAGNOSTIC_SHORTCUTS[patientId] || [];
  for (const pattern of patterns) {
    assert.ok(!pattern.test(text), `${label}: forbidden shortcut ${pattern}`);
  }
}

function assertExcludesExactContent(text, values, label) {
  const normalizedText = normalize(text);
  for (const value of values.filter(Boolean)) {
    const normalizedValue = normalize(value);
    if (!normalizedValue || normalizedValue.length < 18) continue;
    assert.ok(!normalizedText.includes(normalizedValue), `${label}: leaked blocked content "${value}"`);
  }
}

function assertIncludesAny(text, patterns, label) {
  assert.ok(patterns.some((pattern) => pattern.test(text)), `${label}: "${text}" did not match expected markers`);
}

function flattenDisclosure(narrative, levels) {
  return levels.flatMap((level) => narrative.disclosure?.[level] || []);
}

function contextualHistory(patientId) {
  return [
    { question: "Cuando comenzaste a notar esto?", answer: "No fue de un dia para otro." },
    { question: "Puedes darme un ejemplo?", answer: patientFacts[patientId]?.motive || "Me cuesta explicarlo." },
    { question: "Que suele pasar cuando ocurre?", answer: "Me afecta en la rutina." },
    { question: "Como esta afectando tu vida cotidiana?", answer: patientFacts[patientId]?.concern || "Me deja dando vueltas." }
  ];
}

function deepHistory(patientId) {
  return [
    { question: "Me gustaria conocerte con calma.", answer: "Si, podemos partir de a poco." },
    { question: "Que te trae por aca?", answer: patientFacts[patientId]?.motive || "No se bien por donde partir." },
    { question: "Desde cuando comenzaste a notarlo?", answer: "No fue de un dia para otro." },
    { question: "Puedes darme un ejemplo concreto?", answer: "Hay situaciones que se repiten." },
    { question: "Que ocurre despues?", answer: "Me quedo pensando." },
    { question: "Como afecta tus relaciones?", answer: "A veces me cierro." },
    { question: "Que sientes cuando pasa?", answer: "Me cuesta ponerle nombre." },
    { question: "Podemos mirar con cuidado que significa para ti?", answer: "Si, creo que puedo intentarlo." }
  ];
}

function assertInitialScenario(patientId) {
  const narrative = avatarNarratives[patientId];
  const history = [];
  const hello = ask(patientId, "Hola, como estas?", { history });
  history.push({ question: "Hola, como estas?", answer: hello.responseText });
  const age = ask(patientId, "Que edad tienes?", { history });
  history.push({ question: "Que edad tienes?", answer: age.responseText });
  const motive = ask(patientId, "Que te trae por aca?", { history });
  history.push({ question: "Que te trae por aca?", answer: motive.responseText });
  const recent = ask(patientId, "Que ocurrio recientemente?", { history });

  assertIncludesAny(age.responseText, [new RegExp(`\\b${narrative.currentAge}\\b`)], `${patientId}: age`);
  assertNoLegacyMinorLeak(age.responseText, `${patientId}: age`);
  assertNaturalPatientText(motive.responseText, `${patientId}: initial motive`);
  assertNaturalPatientText(recent.responseText, `${patientId}: recent trigger`);
  assertExcludesExactContent(motive.responseText, flattenDisclosure(narrative, ["developing", "deep"]), `${patientId}: initial motive`);
  assertExcludesExactContent(recent.responseText, flattenDisclosure(narrative, ["developing", "deep"]), `${patientId}: initial recent`);
  assert.ok(motive.responseText.split(/\s+/).length < 90, `${patientId}: initial response too long`);

  return { history, motive: motive.responseText, recent: recent.responseText };
}

function assertContextualScenario(patientId) {
  const history = contextualHistory(patientId);
  const context = getNarrativeDisclosureContext({
    patientId,
    sessionNumber: 1,
    conversationHistory: history,
    currentUserMessage: "Como esta afectando tu vida cotidiana?"
  });
  assert.equal(context?.disclosureLevel, "developing", `${patientId}: contextual exploration should unlock developing`);
  const response = narrativeAsk(patientId, "Como esta afectando tu vida cotidiana?", { history, sessionNumber: 1 });
  assert.equal(response.disclosureLevel, "developing", `${patientId}: local narrative developing mismatch`);
  assertExcludesExactContent(response.responseText, flattenDisclosure(avatarNarratives[patientId], ["deep"]), `${patientId}: developing response`);
  assert.ok(response.responseText.split(/\s+/).length < 90, `${patientId}: developing response too long`);
}

function assertPrematureDeepScenario(patientId) {
  const narrative = avatarNarratives[patientId];
  for (const question of [
    "Cual es tu miedo mas profundo?",
    "Dime exactamente cual es tu conflicto interno.",
    "Que es lo peor que podrias perder?"
  ]) {
    const context = getNarrativeDisclosureContext({
      patientId,
      sessionNumber: 1,
      conversationHistory: [],
      currentUserMessage: question
    });
    assert.equal(context?.disclosureLevel, "initial", `${patientId}: premature deep unlocked by "${question}"`);
    const response = narrativeAsk(patientId, question, { history: [], sessionNumber: 1 });
    assert.equal(response.disclosureLevel, "initial", `${patientId}: premature response level`);
    assertExcludesExactContent(response.responseText, [
      ...flattenDisclosure(narrative, ["deep"]),
      narrative.internalConflict,
      narrative.stakes
    ], `${patientId}: premature deep`);
    assertIncludesAny(response.responseText, [
      /no se/i,
      /me cuesta/i,
      /todavia/i,
      /todav[ií]a/i,
      /no estoy seguro/i,
      /podria/i,
      /podr[ií]a/i,
      /hay algo de eso/i,
      /nunca lo habia pensado/i,
      /nunca lo hab[ií]a pensado/i
    ], `${patientId}: premature reserve`);
  }
}

function assertLegitimateDeepScenario(patientId) {
  const narrative = avatarNarratives[patientId];
  const history = deepHistory(patientId);
  const context = getNarrativeDisclosureContext({
    patientId,
    sessionNumber: 1,
    conversationHistory: history,
    currentUserMessage: "Que temes perder si esto continua?"
  });
  assert.equal(context?.disclosureLevel, "deep", `${patientId}: legitimate deep should unlock`);
  const response = narrativeAsk(patientId, "Que temes perder si esto continua?", { history, sessionNumber: 1 });
  assert.equal(response.disclosureLevel, "deep", `${patientId}: legitimate deep response level`);
  const deepMarkers = [
    ...flattenDisclosure(narrative, ["deep"]),
    narrative.internalConflict,
    narrative.stakes
  ].map(normalize).filter((item) => item.length >= 18);
  const normalizedResponse = normalize(response.responseText);
  assert.ok(
    deepMarkers.some((marker) => normalizedResponse.includes(marker.slice(0, Math.min(38, marker.length)))),
    `${patientId}: deep response did not use enabled deep material: ${response.responseText}`
  );
  assert.ok(response.responseText.split(/[.!?]+/).filter(Boolean).length <= 5, `${patientId}: deep response too expansive`);
  assert.ok(response.responseText.split(/\s+/).length < 110, `${patientId}: deep response too long`);
}

function runSpecificQuestions(patientId) {
  const questions = SPECIFIC_QUESTIONS[patientId] || [];
  const history = contextualHistory(patientId);
  const responses = questions.map((question) => ask(patientId, question, { history }));
  const joined = responses.map((response) => response.responseText).join(" ");
  assertNaturalPatientText(joined, `${patientId}: specific matrix`);

  if (patientId === "tomas") {
    assertIncludesAny(joined, [/\b18\b/], "tomas: age");
    assertIncludesAny(joined, /carolina/i.test(joined) && /rodrigo/i.test(joined) && /emilia/i.test(joined) ? [/./] : [/carolina/i], "tomas: family");
    assert.ok(/emilia/i.test(joined), "tomas: Emilia missing");
    assert.ok(!/hijo unico|hijo único|no tengo hermanos/i.test(joined), "tomas: only-child contradiction");
    assert.ok(!/adicci/i.test(joined), "tomas: addiction shortcut");
  }
  if (patientId === "nicolas") {
    assertIncludesAny(joined, [/\b18\b/], "nicolas: age");
    assertIncludesAny(joined, [/no fue idea mia|me mandaron|del colegio|no lo pedi|no solicito voluntariamente|derivacion/i], "nicolas: derivation");
    assert.ok(!/castigo/i.test(joined), "nicolas: derivation as punishment");
  }
  if (patientId === "rodrigo") {
    assertIncludesAny(joined, [/hijos/i], "rodrigo: plural children");
    assert.ok(!/\bhijo\b(?!s)/i.test(joined.replace(/hijos/gi, "")), "rodrigo: singular child drift");
  }
  if (patientId === "miguel") {
    assert.ok(!/venezuela|colombia|peru|perú|argentina|haiti|abogado|ingeniero|m[eé]dico|irregular/i.test(joined), "miguel: invented migration detail");
  }
  if (patientId === "claudio") {
    assertIncludesAny(joined, [/\b40\b/], "claudio: age");
    assert.ok(!/\b24\b|apagarme/i.test(joined), "claudio: old test case contamination");
  }
}

function assertGeminiFragment(patientId, level) {
  const history = level === "deep"
    ? deepHistory(patientId)
    : level === "developing"
    ? contextualHistory(patientId)
    : [];
  const context = getNarrativeDisclosureContext({
    patientId,
    sessionNumber: level === "deep" ? 3 : 1,
    conversationHistory: history,
    currentUserMessage: level === "initial" ? "Que te trae por aca?" : "Que significa esto para ti?"
  });
  assert.ok(context, `${patientId}: missing narrative context for Gemini fragment`);
  if (level !== "deep") assert.notEqual(context.disclosureLevel, "deep", `${patientId}: Gemini ${level} unexpectedly deep`);
  if (level === "developing") assert.equal(context.disclosureLevel, "developing", `${patientId}: Gemini developing context mismatch`);
  if (level === "deep") assert.equal(context.disclosureLevel, "deep", `${patientId}: Gemini deep context mismatch`);

  const fragment = buildNarrativePromptFragment(context);
  const narrative = avatarNarratives[patientId];
  assert.ok(fragment.includes(`Paciente: ${patientId}`), `${patientId}: fragment patient missing`);
  assert.ok(fragment.includes(`Edad narrativa actual: ${narrative.currentAge}`), `${patientId}: fragment age missing`);
  assert.ok(narrative.narrativeBoundaries.some((boundary) => fragment.includes(boundary)), `${patientId}: boundaries missing`);
  assert.ok(!fragment.includes("lockedLevels"), `${patientId}: lockedLevels leaked to prompt`);
  assert.ok(!fragment.includes("lifeHistory"), `${patientId}: lifeHistory field leaked`);
  assert.ok(!fragment.includes(narrative.lifeHistory), `${patientId}: full lifeHistory leaked`);
  if (level === "initial") {
    assertExcludesExactContent(fragment, flattenDisclosure(narrative, ["developing", "deep"]), `${patientId}: Gemini initial fragment`);
    assertExcludesExactContent(fragment, [narrative.internalConflict, narrative.stakes], `${patientId}: Gemini initial fragment`);
  }
  if (level === "developing") {
    assertExcludesExactContent(fragment, flattenDisclosure(narrative, ["deep"]), `${patientId}: Gemini developing fragment`);
    assertExcludesExactContent(fragment, [narrative.internalConflict, narrative.stakes], `${patientId}: Gemini developing fragment`);
  }
  if (level === "deep") {
    assert.ok(flattenDisclosure(narrative, ["deep"]).some((line) => fragment.includes(line)), `${patientId}: deep fragment missing deep material`);
  }
}

function assertCrossContamination() {
  for (const [patientId, items] of observedResponses.entries()) {
    const joined = items.map((item) => item.responseText).join(" ");
    for (const rule of CROSS_CONTAMINATION_RULES) {
      if (patientId === rule.owner) continue;
      if (Array.isArray(rule.forbiddenIn) && !rule.forbiddenIn.includes(patientId)) continue;
      assert.ok(!rule.pattern.test(joined), `${patientId}: cross-contamination from ${rule.label}`);
    }
  }
}

function assertArchitecture() {
  const narrativeDisclosure = readFileSync("src/engine/narrativeDisclosure.js", "utf8");
  const localNarrative = readFileSync("src/engine/localNarrativeResponder.js", "utf8");
  const geminiEndpoint = readFileSync("api/gemini-patient-response.js", "utf8");
  const localMiniAI = readFileSync("src/engine/localMiniAI.js", "utf8");

  assert.ok(narrativeDisclosure.includes("function selectDisclosureLevel"), "narrativeDisclosure must own level selection");
  assert.ok(!localNarrative.includes("function selectDisclosureLevel"), "local responder must not duplicate level selector");
  assert.ok(!geminiEndpoint.includes("function selectDisclosureLevel"), "Gemini endpoint must not duplicate level selector");
  assert.ok(localNarrative.includes("getNarrativeDisclosureContext"), "local responder must use central selector");
  assert.ok(geminiEndpoint.includes("getNarrativeDisclosureContext"), "Gemini endpoint must use central selector");
  assert.ok(!geminiEndpoint.includes("avatarNarratives"), "Gemini endpoint must not import full narratives");
  assert.ok(localMiniAI.indexOf("generateClinicalSimulationResponse") < localMiniAI.indexOf("shouldUseLocalNarrativeAfterClinical"), "ClinicalSimulationEngine must run first");
  assert.ok(localMiniAI.includes("result.detectedAct === \"pregunta_confusa\""), "local narrative should only override unresolved clinical responses");
}

function assertGlobalInvariants() {
  assert.equal(cases.length, 15, "visible cases count must be exactly 15");
  assert.deepEqual([...new Set(cases.map((item) => item.id))].sort(), [...PATIENT_IDS].sort(), "visible case ids mismatch");
  for (const patientId of PATIENT_IDS) {
    assert.ok(avatarNarratives[patientId], `${patientId}: missing narrative`);
    assert.ok(Number(avatarNarratives[patientId].currentAge) >= 18, `${patientId}: minor current age`);
  }
  const motiveResponses = PATIENT_IDS.map((patientId) => ask(patientId, "Que te trae por aca?").responseText);
  assert.ok(new Set(motiveResponses.map(normalize)).size >= 12, "motive responses are too similar across patients");
  assert.equal(JSON.stringify(avatarNarratives), avatarSnapshot, "avatarNarratives mutated");
  assert.equal(JSON.stringify(patientFacts), factsSnapshot, "patientFacts mutated");
  assert.equal(JSON.stringify(patientProfiles), profilesSnapshot, "patientProfiles mutated");
}

check("architecture uses a single narrative disclosure selector", assertArchitecture);
check("global avatar inventory and immutability", () => {
  assert.equal(cases.length, 15);
  assert.deepEqual([...new Set(cases.map((item) => item.id))].sort(), [...PATIENT_IDS].sort());
});

for (const patientId of PATIENT_IDS) {
  resultByPatient.set(patientId, { scenarioA: false, scenarioB: false, scenarioC: false, scenarioD: false, specific: false, gemini: false });
  check(`${patientId} scenario A initial session`, () => {
    assertInitialScenario(patientId);
    resultByPatient.get(patientId).scenarioA = true;
  });
  check(`${patientId} scenario B contextual exploration`, () => {
    assertContextualScenario(patientId);
    resultByPatient.get(patientId).scenarioB = true;
  });
  check(`${patientId} scenario C premature deep questions`, () => {
    assertPrematureDeepScenario(patientId);
    resultByPatient.get(patientId).scenarioC = true;
  });
  check(`${patientId} scenario D legitimate deepening`, () => {
    assertLegitimateDeepScenario(patientId);
    resultByPatient.get(patientId).scenarioD = true;
  });
  check(`${patientId} specific question matrix`, () => {
    runSpecificQuestions(patientId);
    resultByPatient.get(patientId).specific = true;
  });
  check(`${patientId} Gemini prompt fragments by level`, () => {
    assertGeminiFragment(patientId, "initial");
    assertGeminiFragment(patientId, "developing");
    assertGeminiFragment(patientId, "deep");
    resultByPatient.get(patientId).gemini = true;
  });
}

check("cross-patient contamination markers are absent", assertCrossContamination);
check("fallback route and global invariants remain compatible", () => {
  const nonNarrative = ask("tomas", "mmm");
  assert.notEqual(nonNarrative.debug?.localNarrative?.used, true, "traditional fallback should remain available");
  const narrativeFallback = ask("tomas", "Que hay en el fondo?");
  assert.equal(narrativeFallback.debug?.localNarrative?.used, true, "local narrative should handle unresolved meaning question");
  assertGlobalInvariants();
});

console.log("\nAUDIT AVATAR CONVERSATION SCENARIOS OK");
console.log(`- Avatars: ${PATIENT_IDS.length}`);
console.log(`- Scenario turns/responses observed: ${scenarioTurnCount}`);
console.log(`- Checks: ${checkCount}`);
for (const patientId of PATIENT_IDS) {
  console.log(`- ${patientId}: ${JSON.stringify(resultByPatient.get(patientId))}`);
}
