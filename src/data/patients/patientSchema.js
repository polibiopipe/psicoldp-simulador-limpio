export const REQUIRED_PATIENT_SECTIONS = [
  {
    key: "identity",
    alternatives: ["profile"],
    label: "identity/profile"
  },
  { key: "biography", alternatives: ["biographyNarrative"] },
  { key: "personality" },
  { key: "relationships", alternatives: ["relationshipMap"] },
  { key: "consultation" },
  { key: "symptoms", alternatives: ["symptomHistory"] },
  { key: "functioning" },
  { key: "risk", alternatives: ["riskMap"] },
  { key: "protectiveFactors" },
  { key: "communicationStyle", alternatives: ["speakingStyle"] },
  { key: "sensitiveInfo" },
  { key: "disclosureRules", alternatives: ["disclosureMatrix"] },
  { key: "interventionResponses" },
  { key: "taskResponses" },
  { key: "sessionEvolution", alternatives: ["sessionPlan", "clinicalPlan"] },
  { key: "evaluationCriteria", alternatives: ["evaluationRubric", "pedagogy"] }
];

const REQUIRED_IDENTITY_FIELDS = [
  "name",
  "age",
  "city",
  "occupation",
  "civilStatus",
  "livesWith",
  "dailyRoutine",
  "supportNetwork"
];

export function validatePatientRecord(record) {
  const missingSections = [];
  const missingIdentityFields = [];

  if (!record || typeof record !== "object") {
    return {
      ok: false,
      missingSections: REQUIRED_PATIENT_SECTIONS.map((section) => section.label || section.key),
      missingIdentityFields: REQUIRED_IDENTITY_FIELDS
    };
  }

  for (const section of REQUIRED_PATIENT_SECTIONS) {
    if (!hasAnySection(record, section)) {
      missingSections.push(section.label || section.key);
    }
  }

  const identity = record.identity || record.profile || {};
  for (const field of REQUIRED_IDENTITY_FIELDS) {
    if (isEmptyValue(identity[field])) missingIdentityFields.push(field);
  }

  return {
    ok: missingSections.length === 0 && missingIdentityFields.length === 0,
    missingSections,
    missingIdentityFields
  };
}

export function validatePatientRegistry(records = {}) {
  return Object.fromEntries(
    Object.entries(records).map(([patientId, record]) => [
      patientId,
      validatePatientRecord(record)
    ])
  );
}

export function warnIncompletePatientRecords(records = {}) {
  if (!isDevRuntime()) return;

  const report = validatePatientRegistry(records);
  const incomplete = Object.entries(report).filter(([, result]) => !result.ok);
  if (!incomplete.length) return;

  console.warn("[Escucha Viva] Expedientes de pacientes incompletos detectados en desarrollo:");
  for (const [patientId, result] of incomplete) {
    console.warn({
      patientId,
      missingSections: result.missingSections,
      missingIdentityFields: result.missingIdentityFields
    });
  }
}

function hasAnySection(record, section) {
  const keys = [section.key, ...(section.alternatives || [])];
  return keys.some((key) => !isEmptyValue(record[key]));
}

function isEmptyValue(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return !value.trim() || value === "No esta definido en el expediente inicial.";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

function isDevRuntime() {
  if (typeof import.meta !== "undefined" && import.meta.env?.DEV) return true;
  return false;
}
