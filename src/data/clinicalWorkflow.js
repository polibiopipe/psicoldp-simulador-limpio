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
  {
    id: "bdi_ii",
    label: "BDI-II",
    type: "psicometrica",
    area: "Sintomas depresivos",
    useCase: "Sintomas depresivos",
    ageRange: "adolescentes mayores y adultos",
    caseRelevance: ["animo bajo", "agotamiento", "culpa", "perdida de interes"],
    suggestedMoment: "Cuando la entrevista sugiere sintomatologia depresiva y se requiere dimensionar intensidad.",
    ethicalWarning: "No usar como diagnostico aislado ni reproducir items, baremos o claves de correccion.",
    reportAvailable: true
  },
  {
    id: "bai",
    label: "BAI",
    type: "psicometrica",
    area: "Sintomas ansiosos",
    useCase: "Sintomas ansiosos",
    ageRange: "adolescentes mayores y adultos",
    caseRelevance: ["ansiedad", "tension", "somatizacion", "preocupacion persistente"],
    suggestedMoment: "Cuando el malestar ansioso aparece de forma consistente en entrevista.",
    ethicalWarning: "Debe integrarse con entrevista clinica y contexto; no entrega diagnostico por si solo.",
    reportAvailable: true
  },
  {
    id: "c_ssrs",
    label: "C-SSRS",
    type: "screening",
    area: "Riesgo suicida",
    useCase: "Riesgo suicida",
    ageRange: "adolescentes y adultos",
    caseRelevance: ["ideacion suicida", "autolesion", "riesgo", "desesperanza"],
    suggestedMoment: "Cuando emerge ideacion, desesperanza intensa o riesgo de dano.",
    ethicalWarning: "No reemplaza protocolo institucional ni evaluacion profesional presencial ante riesgo.",
    reportAvailable: true
  },
  {
    id: "mmse",
    label: "MMSE / Mini Mental",
    type: "screening",
    area: "Funcionamiento cognitivo global",
    useCase: "Sospecha cognitiva",
    ageRange: "adultos y personas mayores",
    caseRelevance: ["memoria", "orientacion", "deterioro cognitivo", "funcionamiento diario"],
    suggestedMoment: "Cuando hay quejas cognitivas, cambios funcionales o dudas de orientacion.",
    ethicalWarning: "Usar solo como tamizaje narrativo-formativo; no entregar puntajes protegidos ni baremos.",
    reportAvailable: true
  },
  {
    id: "wais_iv",
    label: "WAIS-IV",
    type: "psicometrica",
    area: "Funcionamiento intelectual",
    useCase: "Funcionamiento intelectual",
    ageRange: "adultos",
    caseRelevance: ["rendimiento cognitivo", "dificultades academicas", "perfil intelectual"],
    suggestedMoment: "Solo si la pregunta clinica justifica una evaluacion cognitiva amplia.",
    ethicalWarning: "No reproducir subpruebas, items, puntajes normativos ni claves de interpretacion.",
    reportAvailable: false
  },
  {
    id: "raven",
    label: "Raven",
    type: "psicometrica",
    area: "Razonamiento no verbal",
    useCase: "Razonamiento no verbal",
    ageRange: "adolescentes mayores y adultos",
    caseRelevance: ["razonamiento", "evaluacion cognitiva", "perfil no verbal"],
    suggestedMoment: "Cuando se requiere explorar razonamiento no verbal de forma complementaria.",
    ethicalWarning: "No reproducir laminas, matrices, respuestas correctas ni criterios de correccion.",
    reportAvailable: false
  },
  {
    id: "genograma",
    label: "Genograma",
    type: "evaluacion clinica",
    area: "Dinamica familiar",
    useCase: "Dinamica familiar",
    ageRange: "adolescentes y adultos",
    caseRelevance: ["familia", "patrones relacionales", "lealtades", "red de apoyo"],
    suggestedMoment: "Cuando el problema se sostiene en relaciones familiares o roles de cuidado.",
    ethicalWarning: "Debe construirse con cuidado, consentimiento y lenguaje no culpabilizante.",
    reportAvailable: true
  },
  {
    id: "entrevista_semiestructurada",
    label: "Entrevista semiestructurada",
    type: "entrevista",
    area: "Claridad diagnostica y formulacion",
    useCase: "Claridad diagnostica",
    ageRange: "adolescentes y adultos",
    caseRelevance: ["motivo difuso", "hipotesis inicial", "antecedentes", "riesgo"],
    suggestedMoment: "Cuando faltan datos nucleares para ordenar motivo, sintomas, historia y contexto.",
    ethicalWarning: "No debe usarse como interrogatorio rigido ni sustituir alianza terapeutica.",
    reportAvailable: true
  },
  {
    id: "registro_conductual",
    label: "Registro conductual",
    type: "evaluacion clinica",
    area: "Patrones conducta-emocion",
    useCase: "Patrones conducta-emocion",
    ageRange: "adolescentes y adultos",
    caseRelevance: ["rutina", "evitacion", "habitos", "desencadenantes"],
    suggestedMoment: "Cuando se requiere observar frecuencia, contexto y consecuencias de conductas relevantes.",
    ethicalWarning: "Debe acordarse con el paciente y no convertirse en vigilancia o control.",
    reportAvailable: true
  }
];

export function getClinicalInstrumentById(instrumentId) {
  return clinicalInstrumentOptions.find((instrument) => instrument.id === instrumentId) || null;
}
