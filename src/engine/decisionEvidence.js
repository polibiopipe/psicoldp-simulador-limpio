export const EVIDENCE_VERSION = 'decision-evidence-v1';
export const stages = { initial: 'Decisión inicial', monitoring: 'Monitoreo', revision: 'Revisión fundamentada', transfer: 'Aplicación a caso nuevo' };
export function createDecisionEvidence(input, { history = [], now = new Date().toISOString(), id = crypto.randomUUID() } = {}) {
  if (!Object.hasOwn(stages, input.stage)) throw new Error('Selecciona un momento válido.');
  const fields = ['decision', 'rationale', 'uncertainty', 'alternative', 'trigger'];
  const values = Object.fromEntries(fields.map(key => [key, String(input[key] || '').trim()]));
  if (!values.decision || !values.rationale) throw new Error('Registra la decisión y su fundamento.');
  if (fields.some(key => values[key].length > 6000)) throw new Error('Cada campo admite hasta 6.000 caracteres.');
  const turns = history.filter(entry => !entry.isSessionPrelude && !entry.isPendingResponse && entry.question && entry.answer);
  return { id, version: EVIDENCE_VERSION, createdAt: now, stage: input.stage, ...values,
    source: 'structured_prompt', assistance: input.assistance === 'received' ? 'received' : 'none_declared',
    turnCount: turns.length, evidenceTurnIds: turns.map(entry => entry.id).filter(Boolean),
    interpretation: 'self_report_not_validated_score' };
}
export function evidenceRows(records) {
  return records.flatMap(record => (record.feedback?.decisionEvidence || []).map(event => ({
    sessionId: record.id, caseId: record.caseId, caseName: record.caseName, sessionNumber: record.sessionNumber,
    status: record.status, ...event
  })));
}
export function evidenceCounts(rows) {
  return Object.keys(stages).map(stage => ({ stage, label: stages[stage], count: rows.filter(row => row.stage === stage).length }));
}
