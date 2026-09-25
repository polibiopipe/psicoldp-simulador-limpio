export const TEAM_KEY = 'seia-grupo4';
export const REVIEW_CHECKS = [
  'Leí el desarrollo y puedo explicar la decisión que propone.',
  'Contrasté las afirmaciones con las fuentes o con la consigna aplicable.',
  'Revisé la coherencia con el problema y las decisiones vigentes.',
  'Abrí el enlace y comprobé que corresponde a la evidencia revisada.'
];

// These are learning prompts, not an automated assessment of scientific validity.
export const TEAM_ACTIVITIES = {
  aporte: {
    label: 'Desarrollo de una tarea',
    purpose: 'Proponer, contrastar y reconstruir una tarea con otra persona. El borrador no equivale a un cierre.',
    fields: [
      ['development', '¿Qué proponemos?', 'Desarrolla la tarea; distingue lo realizado de lo que todavía se proyecta.'],
      ['reason', '¿Por qué lo proponemos?', 'Indica la consigna, el antecedente o el argumento que sostiene la propuesta.'],
      ['learning', '¿Qué comprendimos o qué sigue abierto?', 'Distingue una corrección de forma de un cambio de comprensión. No inventes un aprendizaje para completar el campo.']
    ]
  },
  antecedente: {
    label: 'Consolidar antecedentes',
    purpose: 'Una ficha no termina en el resumen: vinculen la fuente con una afirmación y comparen su aporte con otros antecedentes.',
    fields: [
      ['reference', 'Referencia y fuente consultada', 'Registra la referencia verificable. No completes datos bibliográficos por suposición.'],
      ['reading', 'Estado real de la lectura', 'Localizada / resumen consultado / lectura parcial / texto completo leído. Especifica qué se revisó.'],
      ['passage', 'Pasaje de respaldo y ubicación', 'Anota página, sección o tabla y una paráfrasis fiel; usa citas textuales breves solo cuando sean necesarias.'],
      ['supports', '¿Qué afirmación permite sostener?', 'Explica el vínculo entre el resultado del estudio y nuestra afirmación.'],
      ['limits', '¿Qué NO permite afirmar?', 'Delimita población, diseño, medición, contexto y alcance de las inferencias.'],
      ['comparison', 'Comparación e integración', '¿En qué coincide o difiere de otros antecedentes? ¿Qué se conoce y qué continúa abierto? Identifica las otras fuentes.']
    ]
  },
  coherencia: {
    label: 'Revisar la coherencia',
    purpose: 'Comprueben que los antecedentes, el vacío, la pregunta y los objetivos describen la misma investigación. No se calcula una nota de coherencia.',
    fields: [
      ['phenomenon', 'Fenómeno, población y contexto', '¿Qué buscamos comprender y en quiénes? Separa fenómeno y herramienta.'],
      ['gap', 'Vacío provisional y antecedentes que lo sostienen', 'No confundas no haber encontrado un estudio con la ausencia de investigación.'],
      ['question', 'Pregunta actual', 'Incluye su versión o fecha. Justifica PICO o SPIDER por su función, sin imponer un método.'],
      ['objectives', 'Objetivo general y específicos', 'Expresa qué conocimiento se busca producir, no una lista de trámites o instrumentos.'],
      ['tensions', 'Tensiones detectadas y reconstrucción propuesta', '¿Aparecen conceptos sin fundamento? ¿Cambiamos de fenómeno entre la pregunta y el objetivo?'],
      ['open', 'Decisiones que todavía no podemos cerrar', 'Conserva las dudas, las dependencias y las ideas que se posponen.']
    ]
  },
  posicionamiento: {
    label: 'Desde dónde investigamos',
    purpose: 'Construyan una posición argumentada. Usar varios autores o considerar un enfoque mixto no asigna automáticamente un paradigma.',
    fields: [
      ['ontology', '¿Qué suponemos sobre el fenómeno?', '¿Cómo entendemos aquello que queremos estudiar? Explicita sus condiciones y carácter situado.'],
      ['epistemology', '¿Qué consideraríamos conocimiento y evidencia?', '¿Qué permiten conocer los registros de actuación y qué requiere la perspectiva de los participantes?'],
      ['method', '¿Por qué estos procedimientos?', 'Argumenta su relación con la pregunta y los supuestos; diferencia alternativa de decisión justificada.'],
      ['dialogue', 'Autores, coincidencias y tensiones', 'Identifica las fuentes que realmente se leyeron. No resuelvas una tensión solo reuniendo apellidos.'],
      ['position', 'Posición provisional del equipo', 'Explica qué se acuerda, qué no y qué lectura o discusión falta antes de cerrar.']
    ]
  },
  decision: {
    label: 'Decisión y acuerdo del equipo',
    purpose: 'Cada integrante registra su propia posición. El consenso no se presume por silencio ni se sustituye por una mayoría.',
    fields: [
      ['before', '¿Qué pensábamos antes?', 'Conserva la formulación y su momento; no reescribas el pasado como si ya conociéramos la conclusión.'],
      ['evidence', '¿Qué evidencia u observación apareció?', 'Identifica la fuente, la observación docente o la objeción del equipo.'],
      ['proposal', '¿Qué proponemos mantener, cambiar o posponer?', 'Una propuesta aún no es un acuerdo. Explica sus alternativas.'],
      ['reason', 'Fundamento y alcance de la decisión', 'Distingue intuición, propuesta provisional y decisión justificada para esta etapa.'],
      ['learning', '¿Qué cambió en nuestra comprensión?', 'También puede conservarse una decisión si resistió la revisión; explica por qué.'],
      ['consequence', '¿Qué debemos revisar a continuación?', 'Identifica documentos, preguntas u objetivos afectados y qué permanece abierto.']
    ]
  },
  caso: {
    label: 'Simular una decisión investigativa',
    purpose: 'Caso ficticio: aparece un artículo muy próximo a su pregunta cuando la entrega está cerca. Parte del equipo quiere mantener la afirmación de originalidad; otra persona propone abandonar el tema. Ensayen una decisión sin atribuir esta situación a participantes reales.',
    fields: [
      ['perspectives', 'Posiciones iniciales de los integrantes', 'Cada persona aporta su interpretación mediante los comentarios; aquí se integra sin atribuir acuerdos no confirmados.'],
      ['decision', '¿Qué decisión proponemos?', 'Considera mantener, delimitar o reformular la pregunta. No hay una opción correcta por su nombre.'],
      ['foundation', '¿Qué evidencia y razones utilizamos?', '¿Qué se revisó y qué falta saber? ¿Qué afirmación de originalidad sigue siendo defendible?'],
      ['consequences', 'Consecuencias y revisión', '¿Qué partes del proyecto habría que modificar? ¿Qué podría hacernos cambiar nuevamente?'],
      ['transfer', 'Conexión con nuestro trabajo real', '¿Existe una afirmación semejante en nuestro proyecto? Distingue la práctica ficticia de una decisión real.']
    ]
  }
};

export function safeEvidenceUrl(value) {
  if (!value) return '';
  try { const url = new URL(String(value).trim()); return url.protocol === 'https:' && url.hostname ? url.href : ''; }
  catch { return ''; }
}

export function editableItem(item) {
  return {
    id: item.id || null, revision: Number(item.revision) || 0, team_key: TEAM_KEY,
    kind: TEAM_ACTIVITIES[item.kind] ? item.kind : 'aporte', title: item.title || '',
    stage_key: item.stage_key || '', content: { ...(item.content || {}) },
    evidence_url: item.evidence_url || '', owner_id: item.owner_id || '', reviewer_id: item.reviewer_id || ''
  };
}

export function blankItem(kind, userId, members) {
  return editableItem({ kind, owner_id: userId, reviewer_id: members.find(m => m.user_id !== userId)?.user_id || '' });
}

export function validateItem(item) {
  if (!TEAM_ACTIVITIES[item.kind]) return 'Selecciona una actividad válida.';
  if (item.title.trim().length < 3 || item.title.trim().length > 180) return 'El título debe tener entre 3 y 180 caracteres.';
  if (!item.owner_id || !item.reviewer_id || item.owner_id === item.reviewer_id) return 'Asigna responsable y revisor distintos.';
  if (item.evidence_url && !safeEvidenceUrl(item.evidence_url)) return 'Revisa el enlace HTTPS de la evidencia.';
  if (JSON.stringify(item).length > 90000) return 'El aporte es demasiado extenso. Divide el desarrollo en incrementos más pequeños.';
  return '';
}

export function reviewState(item, events, members) {
  if (!item) return { reviewed: false, agreed: false, votes: [], agreementCount: 0, label: 'Sin aporte seleccionado' };
  const active = members.filter(m => m.active !== false);
  const current = events.filter(e => e.item_id === item.id && e.item_revision === item.revision)
    .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
  const reviews = current.filter(e => ['review_approved', 'review_changes'].includes(e.event_type)
    && e.actor_id === item.reviewer_id && e.actor_id !== item.owner_id && e.actor_id !== item.updated_by);
  const reviewed = reviews.at(-1)?.event_type === 'review_approved';
  const votes = active.map(member => ({ member, event: current.filter(e => e.actor_id === member.user_id && ['agree', 'object'].includes(e.event_type)).at(-1) }));
  const agreementCount = votes.filter(v => v.event?.event_type === 'agree').length;
  const agreed = active.length > 1 && agreementCount === active.length;
  let label = reviewed ? 'Revisión en pares registrada' : reviews.at(-1)?.event_type === 'review_changes' ? 'Requiere ajustes' : 'Pendiente de revisión en pares';
  if (item.kind === 'decision') label = reviewed && agreed ? 'Revisión y acuerdo del equipo registrados' : reviewed ? 'Revisada · falta acuerdo del equipo' : label;
  return { reviewed, agreed, votes, agreementCount, label };
}

export function canReview(item, userId) {
  return !!item && item.reviewer_id === userId && item.owner_id !== userId && item.updated_by !== userId;
}

export function readableTeamError(error) {
  const text = String(error?.message || '');
  if (error?.code === '40001' || text.includes('VERSION_CONFLICT')) return 'Otra persona guardó una versión nueva. Tu borrador se conserva: compara ambas versiones antes de integrar.';
  if (error?.code === '42501') return text || 'Tu cuenta no tiene permiso para realizar esta acción.';
  if (/fetch|network|timeout/i.test(text)) return 'No se pudo conectar. Tu borrador local se conserva; todavía no está compartido.';
  return text || 'No se pudo completar la operación. No se ha confirmado ningún cambio.';
}
