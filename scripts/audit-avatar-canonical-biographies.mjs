import {
  avatarCanonicalBiographies,
  buildCanonicalBiographyPromptContext,
  getAvatarCanonicalBiography,
  getAvatarCanonicalFact,
  resolveCanonicalFactKey,
  selectCanonicalDirectResponse
} from "../src/data/avatarCanonicalBiographies.js";
import { generateLocalPatientResponse } from "../src/engine/localMiniAI.js";

const EXPECTED_IDS = [
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

const EVASIVE_BASIC_PATTERNS = [
  /prefiero no decir/i,
  /no importa el nombre/i,
  /eso no cambia nada/i,
  /no quiero hablar de eso/i,
  /es una carrera exigente/i,
  /es una universidad/i,
  /de esas carreras/i,
  /no se como explicarlo/i,
  /no creo que sea relevante/i
];

const DAILY_QUESTIONS = [
  "Como te llamas completo?",
  "Cuantos anos tienes?",
  "Cuando naciste?",
  "Donde vives?",
  "Con quien vives?",
  "Estudias o trabajas?",
  "Que estudias?",
  "Donde estudias?",
  "En que ano vas?",
  "Que ramos tienes?",
  "Trabajas?",
  "En que trabajas?",
  "Como llegas?",
  "Tienes pareja?",
  "Tienes hijos?",
  "Tienes hermanos?",
  "Como es tu familia?",
  "Que haces los fines de semana?",
  "Cuanto duermes?",
  "Que te gusta hacer?",
  "Has ido antes a psicologo?",
  "Tomas medicamentos?",
  "Consumes alcohol?",
  "Que esperas de esta conversacion?"
];

const failures = [];
const ok = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
  else ok.push(message);
}

const ids = Object.keys(avatarCanonicalBiographies);
assert(ids.length === 15, `existen 15 biografias canonicas (${ids.length})`);
assert(EXPECTED_IDS.every((id) => ids.includes(id)), "estan los 15 identificadores esperados");
assert(getAvatarCanonicalBiography("desconocido") === null, "paciente desconocido devuelve null");
assert(getAvatarCanonicalFact("desconocido", "age") === null, "fact desconocido devuelve null");

for (const id of EXPECTED_IDS) {
  const biography = getAvatarCanonicalBiography(id);
  assert(Boolean(biography), `${id}: tiene biografia`);
  if (!biography) continue;

  assert(Boolean(biography.identity.fullName), `${id}: nombre completo definido`);
  assert(Number(biography.identity.age) >= 18, `${id}: edad adulta`);
  assert(Boolean(biography.identity.city), `${id}: ciudad definida`);
  assert(Array.isArray(biography.identity.livingWith) && biography.identity.livingWith.length > 0, `${id}: hogar definido`);
  assert(Boolean(biography.education.status || biography.employment.status), `${id}: educacion o trabajo definido`);

  const isUniversityStudent = /universitaria|universitario|universidad/i.test([
    biography.education.status,
    biography.education.institution,
    biography.education.year
  ].join(" "));
  if (isUniversityStudent) {
    assert(Boolean(biography.education.program), `${id}: estudiante universitario con carrera`);
  }

  const works = /trabaja|jubilado|retorno|actualmente/i.test(biography.employment.status || "");
  if (works) {
    assert(Boolean(biography.employment.role), `${id}: trabajador con cargo definido`);
  }

  if (biography.education.institution) {
    assert(typeof biography.education.institutionIsFictional === "boolean", `${id}: institucion marcada internamente`);
  }
  if (biography.employment.employer) {
    assert(typeof biography.employment.employerIsFictional === "boolean", `${id}: empleador marcado internamente`);
  }

  assert(Boolean(biography.directAnswers?.age?.length), `${id}: respuestas directas no dependen de nivel narrativo`);
  assert(Boolean(biography.disclosure?.initial?.length), `${id}: disclosure initial definido`);
  assert(Boolean(biography.disclosure?.developing?.length), `${id}: disclosure developing definido`);
  assert(Boolean(biography.disclosure?.deep?.length), `${id}: disclosure deep definido`);

  const snapshot = JSON.stringify(biography);
  const cloned = getAvatarCanonicalBiography(id);
  cloned.identity.age = 1;
  assert(JSON.stringify(getAvatarCanonicalBiography(id)) === snapshot, `${id}: objetos originales no se modifican`);

  for (const question of DAILY_QUESTIONS) {
    const factKey = resolveCanonicalFactKey(question, biography);
    assert(Boolean(factKey), `${id}: pregunta cotidiana reconocida: ${question}`);
    const direct = selectCanonicalDirectResponse({ patientId: id, studentMessage: question });
    assert(Boolean(direct?.responseText), `${id}: respuesta canonica para: ${question}`);
    if (!direct?.responseText) continue;

    assert(!EVASIVE_BASIC_PATTERNS.some((pattern) => pattern.test(direct.responseText)), `${id}: sin evasion injustificada: ${question}`);
    assert(!revealsDeepMaterial(direct.responseText, biography), `${id}: dato cotidiano no revela material profundo: ${question}`);
    assert(direct.responseText.split(/\s+/).length <= 80, `${id}: respuesta cotidiana acotada: ${question}`);

    const local = generateLocalPatientResponse({
      caseId: id,
      studentMessage: question,
      history: [],
      sessionNumber: 1
    });
    assert(
      (local.responseType || local.debug?.responseType) === "canonical_biography",
      `${id}: local marca responseType canonico: ${question}`
    );
    assert(local.debug?.canonicalBiographyUsed === true, `${id}: local declara biografia canonica usada: ${question}`);
    assert(local.debug?.canonicalFactKey === factKey, `${id}: local conserva canonicalFactKey=${factKey}: ${question}`);
    assert(local.responseText === direct.responseText, `${id}: local usa mismo dato canonico: ${question}`);
  }
}

const valentina = getAvatarCanonicalBiography("valentina");
assert(valentina.education.program === "Psicologia", "Valentina estudia Psicologia");
assert(valentina.education.institution === "Universidad Horizonte del Maule", "Valentina estudia en Universidad Horizonte del Maule");
assert(valentina.education.year === "tercer ano", "Valentina esta en tercer ano");
assert(valentina.education.semester === "quinto semestre", "Valentina esta en quinto semestre");
assert(selectCanonicalDirectResponse({ patientId: "valentina", studentMessage: "Que nota te sacaste?" })?.responseText.includes("4,7"), "Valentina responde 4,7 ante la nota detonante");
assert(selectCanonicalDirectResponse({ patientId: "valentina", studentMessage: "Que estudias?" })?.responseText === "Estudio Psicologia.", "Valentina no evita carrera");
assert(selectCanonicalDirectResponse({ patientId: "valentina", studentMessage: "En que universidad?" })?.responseText.includes("Universidad Horizonte del Maule"), "Valentina no evita universidad");

const geminiContext = buildCanonicalBiographyPromptContext("valentina");
assert(geminiContext.education.program === "Psicologia", "Gemini recibe carrera canonica de Valentina");
assert(geminiContext.education.institution === "Universidad Horizonte del Maule", "Gemini recibe universidad canonica de Valentina");
assert(!("institutionIsFictional" in geminiContext.education), "Gemini no recibe bandera interna de institucion ficticia");

const localValentina = generateLocalPatientResponse({ caseId: "valentina", studentMessage: "Que carrera?", history: [] });
assert(localValentina.responseText === "Estudio Psicologia.", "misma pregunta obtiene mismo dato local para Valentina");

const tomasText = JSON.stringify(getAvatarCanonicalBiography("tomas"));
const nicolasText = JSON.stringify(getAvatarCanonicalBiography("nicolas"));
assert(!/16 a[nñ]os/i.test(tomasText), "Tomas no queda asociado a 16 anos actuales");
assert(!/16 a[nñ]os/i.test(nicolasText), "Nicolas no queda asociado a 16 anos actuales");
assert(!/Universidad Horizonte del Maule[^]*Andres/i.test(JSON.stringify(getAvatarCanonicalBiography("andres"))), "no aparecen universidades de otro paciente en Andres");

if (failures.length) {
  console.error("AUDIT AVATAR CANONICAL BIOGRAPHIES FAILED");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("AUDIT AVATAR CANONICAL BIOGRAPHIES OK");
console.log(`- Avatares: ${EXPECTED_IDS.length}`);
console.log(`- Preguntas cotidianas por avatar: ${DAILY_QUESTIONS.length}`);
console.log(`- Checks: ${ok.length}`);

function revealsDeepMaterial(responseText, biography) {
  const normalizedResponse = normalize(responseText);
  return (biography.disclosure.deep || [])
    .map(normalize)
    .filter((line) => line.split(/\s+/).length >= 6)
    .some((line) => normalizedResponse.includes(line));
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
