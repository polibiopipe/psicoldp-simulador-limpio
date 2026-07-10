import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarClock, Eye, FileText, Trash2 } from "lucide-react";
import {
  clearAllSessionHistory,
  deleteSessionHistory,
  getSessionHistoryForUser
} from "../engine/sessionHistory.js";
import { isSupabaseConfigured } from "../lib/supabaseClient.js";

export function SavedSessions({ authSession, onBackHome }) {
  const [sessions, setSessions] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteRequest, setDeleteRequest] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState("");
  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedId) || null,
    [sessions, selectedId]
  );

  useEffect(() => {
    loadSessions();
  }, [authSession?.user?.id]);

  async function loadSessions() {
    setIsLoading(true);
    const nextSessions = await getSessionHistoryForUser(authSession);
    setSessions(nextSessions);
    setIsLoading(false);
  }

  async function removeSession(sessionId) {
    await deleteSessionHistory(sessionId, authSession);
    await loadSessions();
    if (selectedId === sessionId) setSelectedId("");
  }

  async function removeAllSessions() {
    await clearAllSessionHistory(authSession);
    setSessions([]);
    setSelectedId("");
  }

  function requestDeleteSession(session) {
    setDeleteNotice("");
    setDeleteRequest({ type: "single", session });
  }

  function requestDeleteAll() {
    setDeleteNotice("");
    setDeleteRequest({ type: "all", count: sessions.length });
  }

  function cancelDeleteRequest() {
    if (isDeleting) return;
    setDeleteRequest(null);
  }

  async function confirmDeleteRequest() {
    if (!deleteRequest || isDeleting) return;
    setIsDeleting(true);
    if (deleteRequest.type === "single") {
      await removeSession(deleteRequest.session.id);
      setDeleteNotice("Sesion eliminada correctamente.");
    } else {
      await removeAllSessions();
      setDeleteNotice("Todas las sesiones fueron eliminadas.");
    }
    setIsDeleting(false);
    setDeleteRequest(null);
  }

  return (
    <section className="screen saved-sessions-screen">
      <header className="saved-sessions-header">
        <button className="secondary-action" type="button" onClick={onBackHome}>
          <ArrowLeft aria-hidden="true" />
          Volver al inicio
        </button>
        <div>
          <span className="eyebrow">{isSupabaseConfigured && authSession ? "Historial en la nube" : "Historial local"}</span>
          <h1>Mis sesiones guardadas</h1>
          <p>
            Registros ficticios de entrevistas simuladas. Solo se deben usar casos
            educativos; no ingreses informacion sensible de pacientes reales.
          </p>
        </div>
      </header>

      {isLoading ? (
        <section className="saved-empty-state">
          <FileText aria-hidden="true" />
          <h2>Cargando sesiones</h2>
          <p>Estamos revisando el historial asociado a tu cuenta.</p>
        </section>
      ) : sessions.length === 0 ? (
        <section className="saved-empty-state">
          <FileText aria-hidden="true" />
          <h2>Aun no hay sesiones guardadas</h2>
          <p>
            Finaliza una entrevista simulada para guardar automaticamente su resumen
            local y poder revisarlo despues.
          </p>
        </section>
      ) : (
        <>
          <div className="saved-sessions-toolbar">
            <span>{sessions.length} sesion(es) guardada(s)</span>
            {deleteNotice && <strong className="delete-notice">{deleteNotice}</strong>}
            <button className="danger-action" type="button" onClick={requestDeleteAll}>
              <Trash2 aria-hidden="true" />
              Eliminar todo
            </button>
          </div>

          <div className="saved-sessions-layout">
            <div className="saved-sessions-list" aria-label="Sesiones guardadas">
              {sessions.map((session) => (
                <article className="saved-session-card" key={session.id}>
                  <div className="saved-session-card-header">
                    <div>
                      <span className="eyebrow">Sesion {session.sessionNumber}</span>
                      <h2>{session.caseName}</h2>
                    </div>
                    <CalendarClock aria-hidden="true" />
                  </div>
                  <div className="saved-session-meta">
                    <span>{formatDate(session.createdAt)}</span>
                    <span>{session.conversationHistory?.length || 0} turnos</span>
                    <span>{getSessionStatusLabel(session.status)}</span>
                    <span>Nivel {getSessionFeedback(session).levelLabel}</span>
                    {getClinicalPlanEvaluation(session) && (
                      <span>{getClinicalPlanEvaluation(session).decisionLabel}</span>
                    )}
                  </div>
                  <p>{getSessionFeedback(session).briefSummary || session.summary?.brief || session.summary?.closure}</p>
                  <div className="saved-session-actions">
                    <button
                      className="secondary-action"
                      type="button"
                      onClick={() => setSelectedId(session.id)}
                    >
                      <Eye aria-hidden="true" />
                      Ver detalle
                    </button>
                    <button
                      className="danger-action"
                      type="button"
                      onClick={() => requestDeleteSession(session)}
                    >
                      <Trash2 aria-hidden="true" />
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <aside className="saved-session-detail">
              {selectedSession ? (
                <>
                  <span className="eyebrow">Detalle local</span>
                  <h2>{selectedSession.caseName} - Sesion {selectedSession.sessionNumber}</h2>
                  <p>{getSessionFeedback(selectedSession).briefSummary || selectedSession.summary?.closure}</p>
                  <p>
                    Nivel formativo: <strong>{getSessionFeedback(selectedSession).levelLabel}</strong>
                  </p>

                  <section>
                    <h3>Fortalezas observadas</h3>
                    <ul>
                      {getSessionFeedback(selectedSession).strengths.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <h3>Aspecto a mejorar</h3>
                    <ul>
                      {getSessionFeedback(selectedSession).improvements.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <h3>Proximo paso sugerido</h3>
                    <p>{getSessionFeedback(selectedSession).nextStep}</p>
                  </section>

                  {getPreSessionEvaluation(selectedSession) && (
                    <section>
                      <h3>Preparacion antes de la sesion</h3>
                      <p>{getPreSessionEvaluation(selectedSession).summary}</p>
                      <ul>
                        {(getPreSessionEvaluation(selectedSession).gaps || []).slice(0, 3).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {getClinicalPlanEvaluation(selectedSession) && (
                    <section>
                      <h3>Decision sobre continuidad del proceso</h3>
                      <p>
                        <strong>{getClinicalPlanEvaluation(selectedSession).decisionLabel}: </strong>
                        {getClinicalPlanEvaluation(selectedSession).levelLabel}
                      </p>
                      <p>{getClinicalPlanEvaluation(selectedSession).summary}</p>
                      <ul>
                        {(getClinicalPlanEvaluation(selectedSession).strengths || []).slice(0, 3).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {getClinicalArtifactsEvaluation(selectedSession) && (
                    <section>
                      <h3>Formulacion, instrumentos y nota clinica</h3>
                      <p>
                        <strong>{getClinicalArtifactsEvaluation(selectedSession).levelLabel}: </strong>
                        {getClinicalArtifactsEvaluation(selectedSession).summary}
                      </p>
                      <ul>
                        {(getClinicalArtifactsEvaluation(selectedSession).gaps || []).slice(0, 3).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  )}

                  <details className="history-details feedback-detail-toggle">
                    <summary>Ver detalle formativo</summary>
                    <section>
                      <h3>Criterios formativos</h3>
                      <ul>
                        {getSessionFeedback(selectedSession).formativeCriteria.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>
                    <section>
                      <h3>Referencias usadas</h3>
                      <ul>
                        {getSessionFeedback(selectedSession).referencesUsed.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  </details>

                  {selectedSession.feedback?.objectiveEvaluation?.length > 0 && (
                    <section>
                      <h3>Objetivos del caso</h3>
                      <ul>
                        {selectedSession.feedback.objectiveEvaluation.slice(0, 6).map((item) => (
                          <li key={item.objective}>
                            {item.objective}: {item.levelLabel || item.status}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {selectedSession.feedback?.reformulationSuggestions?.length > 0 && (
                    <section>
                      <h3>Reformulaciones sugeridas</h3>
                      <ul>
                        {selectedSession.feedback.reformulationSuggestions.slice(0, 3).map((item) => (
                          <li key={`${item.insteadOf}-${item.tryThis}`}>
                            Podrías decir: “{item.tryThis}”
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  <section>
                    <h3>Conversacion resumida</h3>
                    <ol>
                      {(selectedSession.conversationHistory || []).slice(0, 8).map((turn) => (
                        <li key={turn.id}>
                          <strong>Estudiante:</strong> {turn.question}
                          <br />
                          <strong>{selectedSession.caseName}:</strong> {turn.answer}
                        </li>
                      ))}
                    </ol>
                  </section>
                </>
              ) : (
                <div className="saved-detail-placeholder">
                  <Eye aria-hidden="true" />
                  <h2>Selecciona una sesion</h2>
                  <p>Usa Ver detalle para revisar el resumen, feedback y conversacion.</p>
                </div>
              )}
            </aside>
          </div>
          {deleteRequest && (
            <div className="modal-backdrop" role="presentation">
              <section
                className="confirmation-modal delete-session-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-session-title"
              >
                <span className="eyebrow">Confirmar eliminacion</span>
                <h2 id="delete-session-title">
                  {deleteRequest.type === "single" ? "Eliminar sesion guardada" : "Eliminar todas las sesiones"}
                </h2>
                {deleteRequest.type === "single" ? (
                  <p>
                    Se eliminara el registro de {deleteRequest.session.caseName}, sesion {deleteRequest.session.sessionNumber},
                    guardado el {formatDate(deleteRequest.session.createdAt)}.
                  </p>
                ) : (
                  <p>
                    Se eliminaran {deleteRequest.count} sesiones guardadas. Esta accion quitara los registros
                    visibles del historial de este usuario.
                  </p>
                )}
                <div className="modal-actions">
                  <button className="secondary-action" type="button" onClick={cancelDeleteRequest} disabled={isDeleting}>
                    Cancelar
                  </button>
                  <button className="danger-action" type="button" onClick={confirmDeleteRequest} disabled={isDeleting}>
                    <Trash2 aria-hidden="true" />
                    {isDeleting
                      ? "Eliminando..."
                      : deleteRequest.type === "single"
                        ? "Eliminar sesion"
                        : "Eliminar todas"}
                  </button>
                </div>
              </section>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function formatDate(value) {
  if (!value) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function getClinicalPlanEvaluation(session) {
  return (
    session?.feedback?.clinicalPlanEvaluation ||
    session?.sessionSummary?.clinicalPlanEvaluation ||
    session?.summary?.clinicalPlanEvaluation ||
    null
  );
}

function getPreSessionEvaluation(session) {
  return (
    session?.feedback?.preSessionEvaluation ||
    session?.sessionSummary?.preSessionEvaluation ||
    session?.summary?.preSessionEvaluation ||
    null
  );
}

function getClinicalArtifactsEvaluation(session) {
  return (
    session?.feedback?.clinicalArtifactsEvaluation ||
    session?.sessionSummary?.clinicalArtifactsEvaluation ||
    session?.summary?.clinicalArtifactsEvaluation ||
    null
  );
}

function getSessionFeedback(session) {
  const feedback = session?.feedback?.sessionFeedback;
  if (feedback) {
    return {
      levelLabel: feedback.levelLabel || "En desarrollo",
      briefSummary: feedback.briefSummary || session?.summary?.brief || "",
      strengths: ensureList(feedback.strengths, ["Se sostuvo una entrevista formativa."]),
      improvements: ensureList(feedback.improvements, ["Profundizar el foco clinico en la siguiente revision."]),
      nextStep: feedback.nextStep || "Revisar el motivo de consulta y definir un siguiente paso formativo.",
      formativeCriteria: ensureList(feedback.formativeCriteria, ["Alianza", "Motivo de consulta", "Cierre"]),
      referencesUsed: ensureList(feedback.referencesUsed, ["Apuntes formativos UNIACC"])
    };
  }

  return {
    levelLabel: resolveSavedLevel(session?.feedback?.generalScore ?? session?.patientOpenness?.final),
    briefSummary: session?.summary?.brief || session?.summary?.closure || "Sesion guardada para revision formativa.",
    strengths: ensureList((session?.feedback?.strengths || []).slice(0, 3), ["Se sostuvo una entrevista formativa."]),
    improvements: ensureList(
      (session?.feedback?.improvements || session?.feedback?.nextSuggestions || []).slice(0, 2),
      ["Profundizar el foco clinico en la siguiente revision."]
    ),
    nextStep: (session?.feedback?.nextSuggestions || [])[0] || "Definir continuidad, cierre o derivacion segun lo observado.",
    formativeCriteria: ["Alianza", "Motivo de consulta", "Decision clinica"],
    referencesUsed: ["Apuntes formativos UNIACC"]
  };
}

function ensureList(value, fallback) {
  return Array.isArray(value) && value.length ? value : fallback;
}

function resolveSavedLevel(score) {
  const numericScore = Number(score);
  if (!Number.isFinite(numericScore)) return "En desarrollo";
  if (numericScore >= 85) return "Destacado";
  if (numericScore >= 65) return "Logrado";
  if (numericScore >= 40) return "En desarrollo";
  return "Inicial";
}

function getSessionStatusLabel(status) {
  if (status === "closure_pending") return "Cierre pendiente";
  if (status === "in_progress") return "Sesion por retomar";
  return "Sesion completada";
}
