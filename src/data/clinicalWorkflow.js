export const clinicalProcessPhases = [
  { id: "preparacion", label: "Preparacion", description: "Plan previo de evaluacion y cuidados eticos." },
  { id: "encuadre", label: "Ingreso y encuadre", description: "Inicio de entrevista, limites y seguridad." },
  { id: "evaluacion", label: "Evaluacion inicial", description: "Exploracion clinica y anamnesis." },
  { id: "hipotesis", label: "Hipotesis clinica", description: "Formulacion inicial y datos faltantes." },
  { id: "instrumentos", label: "Instrumentos", description: "Seleccion justificada de tecnicas o escalas." },
  { id: "devolucion", label: "Devolucion inicial", description: "Sintesis comprensible y no patologizante." },
  { id: "plan", label: "Plan de intervencion", description: "Objetivos, continuidad, cierre o derivacion." },
  { id: "intervencion", label: "Intervencion breve", description: "Aplicacion cuidadosa de tecnica en sesion." },
  { id: "seguimiento", label: "Seguimiento", description: "Monitoreo, reingreso o continuidad externa." }
];

export const interviewTypeOptions = [
  { value: "abierta", label: "Abierta" },
  { value: "semiestructurada", label: "Semiestructurada" },
  { value: "estructurada", label: "Estructurada" }
];

export const clinicalExplorationAreas = [
  { id: "motivo_consulta", label: "Motivo de consulta" },
  { id: "historia_problema", label: "Historia del problema" },
  { id: "anamnesis", label: "Anamnesis" },
  { id: "estado_emocional", label: "Estado emocional" },
  { id: "examen_mental", label: "Examen mental" },
  { id: "funcionamiento_diario", label: "Funcionamiento diario" },
  { id: "familia", label: "Familia" },
  { id: "red_apoyo", label: "Red de apoyo" },
  { id: "riesgo", label: "Riesgo" },
  { id: "consumo", label: "Consumo" },
  { id: "antecedentes_medicos", label: "Antecedentes medicos" },
  { id: "antecedentes_salud_mental", label: "Antecedentes psicologicos/psiquiatricos" },
  { id: "contexto_sociocultural", label: "Contexto sociocultural" },
  { id: "factores_protectores", label: "Factores protectores" }
];

export const clinicalInstrumentOptions = [
  { id: "bdi_ii", label: "BDI-II", useCase: "Sintomas depresivos" },
  { id: "bai", label: "BAI", useCase: "Sintomas ansiosos" },
  { id: "c_ssrs", label: "C-SSRS", useCase: "Riesgo suicida" },
  { id: "mmse", label: "MMSE / Mini Mental", useCase: "Sospecha cognitiva" },
  { id: "wais_iv", label: "WAIS-IV", useCase: "Funcionamiento intelectual" },
  { id: "raven", label: "Raven", useCase: "Razonamiento no verbal" },
  { id: "genograma", label: "Genograma", useCase: "Dinamica familiar" },
  { id: "entrevista_semiestructurada", label: "Entrevista semiestructurada", useCase: "Claridad diagnostica" },
  { id: "registro_conductual", label: "Registro conductual", useCase: "Patrones conducta-emocion" }
];
