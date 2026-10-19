export const STUDY_ROUTE = '/tesis-tomas';
export const STUDY_CAPACITY = 50;
export const STUDY_CASE_ID = 'tomas';
export const STUDY_SESSIONS = 4;
export const STUDY_ENGINE_VERSION = 'tomas-local-clinical-v1';
export function participantCodes() { return Array.from({ length: STUDY_CAPACITY }, (_, i) => `EVT-${String(i + 1).padStart(3, '0')}`); }
export function validateStudyCommand(body = {}) {
  if (!['status','enroll','start','turn','event','close'].includes(body.action)) throw new Error('INVALID_ACTION');
  if (body.caseId && body.caseId !== STUDY_CASE_ID) throw new Error('CASE_NOT_ALLOWED');
  if (JSON.stringify(body).length > 45000) throw new Error('REQUEST_TOO_LARGE');
  if (['turn','event','close'].includes(body.action) && (!/^[\da-f-]{36}$/i.test(body.sessionId || '') || !Number.isInteger(body.version) || body.version < 0)) throw new Error('INVALID_SESSION');
  return body;
}
export function toEvidenceRecord(session) {
  return { id: session.id, caseId: 'tomas', caseName: 'Tomás', sessionNumber: session.session_number, status: session.status, feedback: { decisionEvidence: session.events || [] } };
}
export const studyMessages = {
 STUDY_NOT_OPEN: 'La recogida de datos todavía no está habilitada. Puedes explorar el ensayo técnico sin guardar datos del estudio.',
 RESEARCH_CONSENT_REQUIRED: 'Debes revisar y aceptar el consentimiento vigente del estudio antes de participar.',
 STUDY_FULL: 'Los 50 cupos están asignados. Contacta al equipo del estudio.',
 PROCESS_COMPLETE: 'Completaste las cuatro sesiones del recorrido.',
 VERSION_CONFLICT: 'La sesión cambió en otra ventana. Actualiza antes de continuar; tu texto se conserva.',
 SESSION_LIMIT: 'Finalizó el tiempo o el límite de intervenciones. Registra tu razonamiento y completa el cierre.',
 ACCESS_PENDING: 'Tu cuenta todavía no está habilitada. El equipo debe revisar tu acceso.',
 SESSION_CLOSED: 'Esta sesión ya está cerrada.',
 SESSION_NOT_FOUND: 'No pudimos encontrar esta sesión en tu cuenta.'
};
