import { cases } from "../src/data/cases.js";
import { avatarNarratives, getAvatarNarrative } from "../src/data/avatarNarratives.js";

const REQUIRED_FIELDS = [
  "lifeHistory",
  "recentTrigger",
  "relationalPattern",
  "internalConflict",
  "stakes"
];

const EXPECTED_COUNT = 15;
const MIN_AGE = 18;
const failures = [];

const fail = (message) => failures.push(message);
const visibleIds = cases.map((caseItem) => caseItem.id);
const visibleIdSet = new Set(visibleIds);
const narrativeIds = Object.keys(avatarNarratives);
const narrativeIdSet = new Set(narrativeIds);

if (narrativeIds.length !== EXPECTED_COUNT) {
  fail(`Se esperaban ${EXPECTED_COUNT} expedientes y existen ${narrativeIds.length}.`);
}

if (narrativeIdSet.size !== narrativeIds.length) {
  fail("Existen expedientes narrativos duplicados.");
}

for (const caseId of visibleIds) {
  if (!narrativeIdSet.has(caseId)) fail(`Falta expediente narrativo para ${caseId}.`);
}

for (const narrativeId of narrativeIds) {
  if (!visibleIdSet.has(narrativeId)) fail(`El expediente ${narrativeId} no corresponde a un caso visible.`);
}

for (const [caseId, narrative] of Object.entries(avatarNarratives)) {
  if (!Number.isFinite(narrative.age)) {
    fail(`${caseId}: age debe ser numerico.`);
  } else if (narrative.age < MIN_AGE) {
    fail(`${caseId}: age ${narrative.age} es menor a ${MIN_AGE}.`);
  }

  for (const field of REQUIRED_FIELDS) {
    if (typeof narrative[field] !== "string" || !narrative[field].trim()) {
      fail(`${caseId}: falta ${field}.`);
    }
  }

  if (!Array.isArray(narrative.timeline) || narrative.timeline.length < 3) {
    fail(`${caseId}: timeline debe tener al menos 3 hitos.`);
  } else {
    narrative.timeline.forEach((item, index) => {
      for (const field of ["event"]) {
        if (typeof (typeof item === "string" ? item : item[field]) !== "string" || !(typeof item === "string" ? item : item[field]).trim()) {
          fail(`${caseId}: timeline[${index}].${field} esta vacio.`);
        }
      }
    });
  }

  for (const level of ["initial", "developing", "deep"]) {
    const entries = narrative.disclosure?.[level];
    if (!Array.isArray(entries)) {
      fail(`${caseId}: disclosure.${level} debe ser un arreglo.`);
    } else if (entries.length < 1) {
      fail(`${caseId}: disclosure.${level} debe tener al menos un elemento.`);
    }
  }

  if (!Array.isArray(narrative.privacyBoundaries) || narrative.privacyBoundaries.length === 0) {
    fail(`${caseId}: privacyBoundaries debe existir y tener elementos.`);
  }
}

const tomasText = JSON.stringify(avatarNarratives.tomas || {}).toLowerCase();
for (const expected of ["emilia"]) {
  if (!tomasText.includes(expected)) fail(`tomas: falta ${expected} en el expediente narrativo.`);
}

if (avatarNarratives.nicolas?.age !== 18) {
  fail("nicolas: age debe ser 18.");
}

if (avatarNarratives.claudio?.age !== 40) {
  fail("claudio: age debe ser 40.");
}

const claudioText = JSON.stringify(avatarNarratives.claudio || {}).toLowerCase();
for (const forbidden of ["24 anos", "24 años", "apagarme un rato"]) {
  if (claudioText.includes(forbidden)) {
    fail(`claudio: posible mezcla con otro caso homonimo (${forbidden}).`);
  }
}

if (JSON.stringify(getAvatarNarrative("claudio")) !== JSON.stringify(avatarNarratives.claudio)) {
  fail("getAvatarNarrative no devuelve el expediente esperado para claudio.");
}

if (getAvatarNarrative("caso-inexistente") !== null) {
  fail("getAvatarNarrative debe devolver null para una clave desconocida.");
}

if (failures.length) {
  console.error("[audit-avatar-narratives] errores:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`[audit-avatar-narratives] OK: ${EXPECTED_COUNT} expedientes narrativos validados.`);
