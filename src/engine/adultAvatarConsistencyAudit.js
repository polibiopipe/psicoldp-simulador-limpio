import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { cases } from "../data/cases.js";
import { caseFacts } from "../data/caseFacts.js";
import { patientFacts } from "../data/patientFacts.js";
import { caseProfiles } from "../data/caseProfiles.js";
import { patientProfiles } from "../data/patientProfiles.js";
import { clinicalSimulationProfiles } from "../data/clinicalAvatars/clinicalSimulationProfiles.js";
import { patientMasterRecords } from "../data/patients/index.js";

const PROJECT_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const AVATAR_IDS = [
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

const MINIMUM_AGE = 18;
const failures = [];
const warnings = [];
const yearsWord = "a" + "ños";
const yearsWordAscii = "a" + "nos";

const parseAge = (value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const match = value.match(/\d+/);
    return match ? Number(match[0]) : null;
  }
  return null;
};

const fail = (message) => failures.push(message);
const warn = (message) => warnings.push(message);

function assertAdultAge(source, caseId, value) {
  const age = parseAge(value);
  if (!Number.isFinite(age)) {
    fail(`${source}.${caseId}: edad actual no definida`);
    return;
  }
  if (age < MINIMUM_AGE) {
    fail(`${source}.${caseId}: edad actual ${age} es menor a ${MINIMUM_AGE}`);
  }
}

const caseById = Object.fromEntries(cases.map((caseItem) => [caseItem.id, caseItem]));

for (const caseId of AVATAR_IDS) {
  if (!caseById[caseId]) fail(`cases: falta el caso ${caseId}`);
  if (!patientFacts[caseId]) fail(`patientFacts: falta el caso ${caseId}`);
  if (!caseFacts[caseId]) warn(`caseFacts: ${caseId} no existe en esta tabla legacy; se omite en comparacion de edad.`);
  if (!caseProfiles[caseId]) fail(`caseProfiles: falta el caso ${caseId}`);
  if (!patientProfiles[caseId]) fail(`patientProfiles: falta el caso ${caseId}`);
  if (!clinicalSimulationProfiles[caseId]) fail(`clinicalSimulationProfiles: falta el caso ${caseId}`);
  if (!patientMasterRecords[caseId]) fail(`patientMasterRecords: falta el caso ${caseId}`);

  assertAdultAge("cases", caseId, caseById[caseId]?.age);
  assertAdultAge("patientFacts", caseId, patientFacts[caseId]?.age);
  if (caseFacts[caseId]) assertAdultAge("caseFacts", caseId, caseFacts[caseId]?.age);
  assertAdultAge("caseProfiles", caseId, caseProfiles[caseId]?.age);
  assertAdultAge("patientProfiles.identity", caseId, patientProfiles[caseId]?.identity);
  assertAdultAge("clinicalSimulationProfiles", caseId, clinicalSimulationProfiles[caseId]?.age);
  assertAdultAge("patientMasterRecords.identity", caseId, patientMasterRecords[caseId]?.identity?.age);
}

const exactAdultCases = ["tomas", "nicolas"];
for (const caseId of exactAdultCases) {
  const sources = [
    ["cases", caseById[caseId]?.age],
    ["patientFacts", patientFacts[caseId]?.age],
    ["caseFacts", caseFacts[caseId]?.age],
    ["caseProfiles", caseProfiles[caseId]?.age],
    ["patientMasterRecords.identity", patientMasterRecords[caseId]?.identity?.age]
  ];

  for (const [source, value] of sources) {
    const age = parseAge(value);
    if (age !== 18) fail(`${source}.${caseId}: se esperaba edad 18 y aparece ${value}`);
  }
}

const tomasRecord = patientMasterRecords.tomas;
const tomasFamilyText = [
  tomasRecord?.identity?.livesWith,
  tomasRecord?.family?.composition,
  tomasRecord?.family?.mother?.name,
  tomasRecord?.family?.father?.name,
  ...(tomasRecord?.family?.siblings || []).map((sibling) => sibling?.name)
].filter(Boolean).join(" | ").toLowerCase();

for (const expected of ["carolina", "rodrigo", "emilia"]) {
  if (!tomasFamilyText.includes(expected)) {
    fail(`tomas.family: falta ${expected} en la version familiar unificada`);
  }
}

for (const forbidden of ["marcela", "no tengo hermanos"]) {
  if (tomasFamilyText.includes(forbidden)) {
    fail(`tomas.family: aun aparece una version familiar antigua: ${forbidden}`);
  }
}

const sourceRoot = join(PROJECT_ROOT, "src");
const forbiddenPatterns = [
  { pattern: new RegExp(`16\\s+${yearsWord}`, "i"), label: `16 ${yearsWord}` },
  { pattern: new RegExp(`16\\s+${yearsWordAscii}`, "i"), label: `16 ${yearsWordAscii}` },
  { pattern: new RegExp(`tengo\\s+${"16"}`, "i"), label: `tengo ${"16"}` },
  { pattern: new RegExp(`adolescente\\s+de\\s+${"16"}`, "i"), label: `adolescente de ${"16"}` }
];

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) files.push(...walk(fullPath));
    else if (/\.(js|jsx|ts|tsx)$/.test(entry)) files.push(fullPath);
  }
  return files;
}

for (const file of walk(sourceRoot)) {
  const content = readFileSync(file, "utf8");
  for (const { pattern, label } of forbiddenPatterns) {
    if (pattern.test(content)) {
      fail(`${relative(PROJECT_ROOT, file)}: referencia actual prohibida "${label}"`);
    }
  }
}

const timelineContent = readFileSync(join(sourceRoot, "data", "patients", "tomas", "timeline.js"), "utf8");
if (new RegExp("age:\\s*" + "16").test(timelineContent)) {
  warn("tomas.timeline: contiene un hito biografico adolescente; no se considera edad actual del avatar.");
}

if (warnings.length) {
  console.warn("[adult-avatar-audit] advertencias:");
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (failures.length) {
  console.error("[adult-avatar-audit] errores:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`[adult-avatar-audit] OK: ${AVATAR_IDS.length} avatares visibles tienen edad actual >= ${MINIMUM_AGE}.`);
