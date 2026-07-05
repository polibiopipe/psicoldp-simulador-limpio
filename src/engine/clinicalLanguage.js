const LANGUAGE_STORAGE_KEY = "escuchaViva.clinicalLanguage.v1";

export const CLINICAL_TERM_OPTIONS = [
  { value: "paciente", label: "Paciente" },
  { value: "cliente", label: "Cliente" },
  { value: "consultante", label: "Consultante" },
  { value: "usuario", label: "Usuario" },
  { value: "persona_atendida", label: "Persona atendida" },
  { value: "participante", label: "Participante" },
  { value: "otro", label: "Otro termino" }
];

const TERM_COPY = {
  paciente: {
    singular: "paciente",
    plural: "pacientes",
    article: "el paciente",
    thisSingular: "este paciente",
    prep: "con el paciente"
  },
  cliente: {
    singular: "cliente",
    plural: "clientes",
    article: "el cliente",
    thisSingular: "este cliente",
    prep: "con el cliente"
  },
  consultante: {
    singular: "consultante",
    plural: "consultantes",
    article: "el consultante",
    thisSingular: "este consultante",
    prep: "con el consultante"
  },
  usuario: {
    singular: "usuario",
    plural: "usuarios",
    article: "el usuario",
    thisSingular: "este usuario",
    prep: "con el usuario"
  },
  persona_atendida: {
    singular: "persona atendida",
    plural: "personas atendidas",
    article: "la persona atendida",
    thisSingular: "esta persona atendida",
    prep: "con la persona atendida"
  },
  participante: {
    singular: "participante",
    plural: "participantes",
    article: "el participante",
    thisSingular: "este participante",
    prep: "con el participante"
  }
};

export function getClinicalTermPreference(caseId = "") {
  const stored = readLanguagePreferences();
  const casePreference = caseId ? stored.caseTerms?.[caseId] : null;
  return normalizePreference(casePreference || stored.defaultPreference || {});
}

export function saveClinicalTermPreference({
  caseId = "",
  term = "paciente",
  customTerm = "",
  saveAsDefault = false
} = {}) {
  if (!canUseStorage()) {
    return normalizePreference({ term, customTerm });
  }

  const current = readLanguagePreferences();
  const normalized = normalizePreference({ term, customTerm });
  const next = {
    ...current,
    defaultPreference: saveAsDefault ? normalized : current.defaultPreference || normalized,
    caseTerms: {
      ...(current.caseTerms || {}),
      ...(caseId ? { [caseId]: normalized } : {})
    },
    updatedAt: new Date().toISOString()
  };

  if (!caseId && saveAsDefault) {
    next.defaultPreference = normalized;
  }

  localStorage.setItem(LANGUAGE_STORAGE_KEY, JSON.stringify(next));
  return normalized;
}

export function getClinicalTermCopy(preference = {}) {
  const normalized = normalizePreference(preference);
  if (normalized.term === "otro" && normalized.customTerm) {
    const custom = normalized.customTerm.toLowerCase();
    return {
      singular: custom,
      plural: `${custom}s`,
      article: `la persona (${custom})`,
      thisSingular: `esta persona (${custom})`,
      prep: `con la persona (${custom})`
    };
  }
  return TERM_COPY[normalized.term] || TERM_COPY.paciente;
}

function readLanguagePreferences() {
  if (!canUseStorage()) {
    return {
      defaultPreference: { term: "paciente", customTerm: "" },
      caseTerms: {}
    };
  }

  try {
    const parsed = JSON.parse(localStorage.getItem(LANGUAGE_STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object"
      ? {
          defaultPreference: normalizePreference(parsed.defaultPreference || {}),
          caseTerms: parsed.caseTerms && typeof parsed.caseTerms === "object" ? parsed.caseTerms : {}
        }
      : { defaultPreference: { term: "paciente", customTerm: "" }, caseTerms: {} };
  } catch {
    return {
      defaultPreference: { term: "paciente", customTerm: "" },
      caseTerms: {}
    };
  }
}

function normalizePreference(preference = {}) {
  const allowed = new Set(CLINICAL_TERM_OPTIONS.map((option) => option.value));
  const term = allowed.has(preference.term) ? preference.term : "paciente";
  return {
    term,
    customTerm: String(preference.customTerm || "").trim()
  };
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}
