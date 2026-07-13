import assert from "node:assert/strict";
import { avatarNarratives } from "../src/data/avatarNarratives.js";
import { cases } from "../src/data/cases.js";
import { patientFacts } from "../src/data/patientFacts.js";
import { buildLocalNarrativeResponse, classifyNarrativeIntent } from "../src/engine/localNarrativeResponder.js";
import { generateLocalPatientResponse } from "../src/engine/localMiniAI.js";

const caseIds = cases.map((caseItem) => caseItem.id);
const narrativeIds = Object.keys(avatarNarratives);

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function textFor(patientId, message, options = {}) {
  const result = buildLocalNarrativeResponse({
    patientId,
    currentUserMessage: message,
    conversationHistory: options.history || [],
    sessionNumber: options.sessionNumber || 1,
    canonicalFacts: patientFacts[patientId]
  });
  return result;
}

function localFor(patientId, message, options = {}) {
  return generateLocalPatientResponse({
    caseId: patientId,
    studentMessage: message,
    history: options.history || [],
    sessionNumber: options.sessionNumber || 1
  });
}

function assertIncludes(text, expected, label) {
  assert.ok(normalize(text).includes(normalize(expected)), `${label}: expected "${text}" to include "${expected}"`);
}

function assertExcludes(text, forbidden, label) {
  assert.ok(!normalize(text).includes(normalize(forbidden)), `${label}: expected "${text}" to exclude "${forbidden}"`);
}

function assertExcludesAny(text, forbiddenValues, label) {
  for (const forbidden of forbiddenValues.filter(Boolean)) {
    assertExcludes(text, forbidden, label);
  }
}

function assertNoLegacyMinorAge(text, label) {
  const legacyMinorAge = "1" + "6";
  assert.ok(!/\b16\b/.test(String(text || "")), `${label}: should not mention 16`);
  assertExcludes(text, `adolescente de ${legacyMinorAge}`, label);
  assertExcludes(text, `tengo ${legacyMinorAge}`, label);
}

function flattenDisclosure(narrative, levels) {
  return levels.flatMap((level) => narrative.disclosure?.[level] || []);
}

const contextualHistory = [
  { question: "Me gustaria conocerte, te parece?", answer: "Si, me parece." },
  { question: "Que te trae aca?", answer: "Mis papas estan preocupados por el computador." },
  { question: "Desde cuando pasa?", answer: "Desde el cierre del colegio." },
  { question: "Como afecta en tu casa?", answer: "Discutimos mas." },
  { question: "Con quien vives?", answer: "Con mi familia." }
];

const deepHistory = [
  ...contextualHistory,
  { question: "Que pasa cuando te preguntan mucho?", answer: "Me cierro." },
  { question: "Que sientes cuando te presionan?", answer: "Me cuesta." },
  { question: "Que seria lo peor para ti?", answer: "No se bien." }
];

const checks = [];
function check(name, fn) {
  checks.push({ name, fn });
}

check("classification ignores trivial messages", () => {
  assert.equal(classifyNarrativeIntent("mmm"), "unknown");
});

check("Tomas local age is 18", () => {
  const response = textFor("tomas", "Que edad tienes?");
  assertIncludes(response.responseText, "18", "Tomas age");
  assertNoLegacyMinorAge(response.responseText, "Tomas age");
});

check("Nicolas local age is 18", () => {
  const response = textFor("nicolas", "Cuantos anos tienes?");
  assertIncludes(response.responseText, "18", "Nicolas age");
  assertNoLegacyMinorAge(response.responseText, "Nicolas age");
});

check("Claudio local age remains 40", () => {
  const response = textFor("claudio", "Que edad tienes?");
  assertIncludes(response.responseText, "40", "Claudio age");
  assertExcludes(response.responseText, "24", "Claudio age");
});

check("Tomas sibling answer is coherent", () => {
  const response = textFor("tomas", "Tienes hermanos?");
  assertIncludes(response.responseText, "Emilia", "Tomas sibling");
  assertIncludes(response.responseText, "hermana", "Tomas sibling");
});

check("Tomas is not treated as only child", () => {
  const response = textFor("tomas", "Como es tu familia?");
  assertExcludes(response.responseText, "hijo unico", "Tomas family");
  assertExcludes(response.responseText, "no tengo hermanos", "Tomas family");
});

check("Nicolas does not mention 16", () => {
  const response = textFor("nicolas", "Cuentame de ti");
  assertNoLegacyMinorAge(response.responseText, "Nicolas motive");
});

check("Initial general question does not reveal developing material", () => {
  const narrative = avatarNarratives.tomas;
  const response = textFor("tomas", "Cuentame de ti");
  assertExcludesAny(response.responseText, flattenDisclosure(narrative, ["developing"]), "Initial developing guard");
});

check("Initial general question does not reveal deep material", () => {
  const narrative = avatarNarratives.tomas;
  const response = textFor("tomas", "Cuentame de ti");
  assertExcludesAny(response.responseText, flattenDisclosure(narrative, ["deep"]), "Initial deep guard");
});

check("Premature deep question stays reserved", () => {
  const narrative = avatarNarratives.tomas;
  const response = textFor("tomas", "Que es lo que mas temes?");
  assertExcludesAny(response.responseText, flattenDisclosure(narrative, ["deep"]), "Premature deep guard");
});

check("Contextual follow-up can open developing level", () => {
  const response = textFor("tomas", "Que pasa cuando te preguntan mucho?", { history: contextualHistory });
  assert.equal(response.disclosureLevel, "developing");
});

check("Developing level can use relational material", () => {
  const response = textFor("tomas", "Que pasa cuando te preguntan mucho?", { history: contextualHistory });
  assert.ok(
    /preguntan|reglas|afuera|presion/i.test(response.responseText),
    `Developing response was too generic: ${response.responseText}`
  );
});

check("Session 2 starts at developing level", () => {
  const response = textFor("nicolas", "Que pasa cuando te preguntan por el futuro?", { sessionNumber: 2 });
  assert.equal(response.disclosureLevel, "developing");
});

check("Later session can open deep level", () => {
  const response = textFor("tomas", "Que seria lo peor para ti?", { sessionNumber: 3, history: contextualHistory });
  assert.equal(response.disclosureLevel, "deep");
});

check("Deep material can appear after enough validation", () => {
  const narrative = avatarNarratives.tomas;
  const response = textFor("tomas", "Que seria lo peor para ti?", { sessionNumber: 1, history: deepHistory });
  const allowedDeep = [...flattenDisclosure(narrative, ["deep"]), narrative.internalConflict, narrative.stakes];
  assert.ok(
    allowedDeep.some((item) => normalize(response.responseText).includes(normalize(item).slice(0, 22))),
    `Expected deep material after validation, got: ${response.responseText}`
  );
});

check("Local narrative responses do not expose technical labels", () => {
  const samples = [
    textFor("tomas", "Que te trae aca?"),
    textFor("marcos", "Que paso ultimamente?"),
    textFor("camila", "Que sientes cuando ayudas tanto?"),
    textFor("claudio", "Que significa para ti estar estable?", { sessionNumber: 3, history: contextualHistory })
  ].map((item) => item.responseText);
  const technicalTerms = [
    "tema central",
    "patron relacional",
    "conflicto interno",
    "disclosure",
    "nivel developing",
    "nivel deep",
    "desencadenante reciente"
  ];
  for (const sample of samples) assertExcludesAny(sample, technicalTerms, "Technical term guard");
});

check("Narrative source is not mutated", () => {
  const before = JSON.stringify(avatarNarratives.tomas);
  textFor("tomas", "Que te trae aca?");
  assert.equal(JSON.stringify(avatarNarratives.tomas), before);
});

check("Conversation history is not mutated", () => {
  const history = structuredClone(contextualHistory);
  const before = JSON.stringify(history);
  textFor("tomas", "Que pasa cuando te preguntan mucho?", { history });
  assert.equal(JSON.stringify(history), before);
});

check("Same input is deterministic", () => {
  const first = textFor("camila", "Que te trae aca?");
  const second = textFor("camila", "Que te trae aca?");
  assert.equal(first.responseText, second.responseText);
});

check("Empty message returns null", () => {
  assert.equal(textFor("tomas", ""), null);
});

check("Incomplete history entries do not throw", () => {
  const response = textFor("tomas", "Que te trae aca?", {
    history: [null, {}, { question: null }, { studentMessage: "hola" }]
  });
  assert.ok(response.responseText);
});

check("Every visible avatar can answer motive from narrative/facts", () => {
  for (const caseId of caseIds) {
    const response = textFor(caseId, "Por que estas aca?");
    assert.ok(response?.responseText, `${caseId} should answer motive`);
    assertNoLegacyMinorAge(response.responseText, `${caseId} motive`);
  }
});

check("Every narrative has adult current age", () => {
  for (const caseId of narrativeIds) {
    assert.ok(Number(avatarNarratives[caseId].currentAge) >= 18, `${caseId} must be adult`);
  }
});

check("Every visible case has a narrative", () => {
  for (const caseId of caseIds) {
    assert.ok(avatarNarratives[caseId], `${caseId} missing narrative`);
  }
});

check("Tomas response does not borrow Valentina's story", () => {
  const response = textFor("tomas", "Que te trae aca?");
  assertExcludes(response.responseText, "universidad", "Tomas cross-case");
  assertExcludes(response.responseText, "nota menor", "Tomas cross-case");
});

check("Valentina response does not borrow Tomas family details", () => {
  const response = textFor("valentina", "Que te trae aca?");
  assertExcludes(response.responseText, "Emilia", "Valentina cross-case");
  assertExcludes(response.responseText, "computador", "Valentina cross-case");
});

check("Claudio response does not borrow old test Claudio details", () => {
  const response = textFor("claudio", "Que te trae aca?");
  assertExcludes(response.responseText, "apagarme", "Claudio cross-case");
  assertExcludes(response.responseText, "24", "Claudio cross-case");
});

check("Non-narrative fallback still reaches traditional local path", () => {
  const response = localFor("tomas", "mmm");
  assert.notEqual(response.debug?.localNarrative?.used, true);
  assert.ok(response.responseText);
});

check("Full local route uses narrative when clinical engine cannot resolve meaning", () => {
  const response = localFor("tomas", "Que hay en el fondo?");
  assert.equal(response.debug?.localNarrative?.used, true);
  assert.equal(response.debug?.localNarrative?.intent, "meaning");
  assertNoLegacyMinorAge(response.responseText, "Full route narrative fallback");
});

check("Local narrative response is compact and single patient voice", () => {
  const response = textFor("marcos", "Que te trae aca?");
  assert.ok(response.responseText.split(/\s+/).length <= 70, response.responseText);
  assertExcludes(response.responseText, "como terapeuta", "Patient voice");
  assertExcludes(response.responseText, "como IA", "Patient voice");
});

check("Initial response object does not carry locked disclosure content", () => {
  const narrative = avatarNarratives.tomas;
  const response = textFor("tomas", "Cuentame de ti");
  const serialized = JSON.stringify(response);
  assertExcludesAny(serialized, [...flattenDisclosure(narrative, ["developing", "deep"])], "Locked payload guard");
});

check("Rodrigo family response stays tied to children", () => {
  const response = textFor("rodrigo", "Cuentame de tu familia");
  assert.ok(/hij/i.test(response.responseText), response.responseText);
});

check("Fernanda work response avoids unsupported diagnosis", () => {
  const response = textFor("fernanda", "Que ocurrio con la licencia?");
  assertExcludes(response.responseText, "diagnostico", "Fernanda diagnosis guard");
  assertExcludes(response.responseText, "trastorno", "Fernanda diagnosis guard");
});

check("Miguel work response avoids invented country or profession", () => {
  const response = textFor("miguel", "De que pais vienes y cual era tu profesion?");
  const forbidden = ["venezuela", "colombia", "peru", "argentina", "haiti", "abogado", "ingeniero", "medico"];
  assertExcludesAny(response.responseText, forbidden, "Miguel invented detail guard");
});

check("Full local route keeps Camila coherent for motive", () => {
  const response = localFor("camila", "Que te trae aca?");
  assert.ok(
    /disponible|limite|culpa|famil/i.test(response.responseText),
    `Camila local route should stay on her case: ${response.responseText}`
  );
});

let passed = 0;
for (const { name, fn } of checks) {
  try {
    fn();
    passed += 1;
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

console.log(`Local narrative integration audit passed (${passed} checks).`);
