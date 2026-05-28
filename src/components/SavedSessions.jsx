import React, { useMemo, useState } from "react";
import { ArrowLeft, CalendarClock, Eye, FileText, Trash2 } from "lucide-react";
import {
  clearAllSessionHistory,
  deleteSessionHistory,
  getSessionHistory
} from "../engine/sessionHistory.js";

export function SavedSessions({ onBackHome }) {
  const [sessions, setSessions] = useState(() => getSessionHistory());
  const [selectedId, setSelectedId] = useState("");
  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedId) || null,
    [sessions, selectedId]
  );

  function removeSession(sessionId) {
    deleteSessionHistory(sessionId);
    setSessions(getSessionHistory());
    if (selectedId === sessionId) setSelectedId("");
  }

  function removeAllSessions() {
    clearAllSessionHistory();
    setSessions([]);
    setSelectedId("");
  }

  return (
    <section className="screen saved-sessions-screen">
      <header className="saved-sessions-header">
        <button className="secondary-action" type="button" onClick={onBackHome}>
          <ArrowLeft aria-hidden="true" />
          Volver al inicio
        </button>
        <div>
          <span className="eyebrow">Historial local</span>
          <h1>Mis sesiones guardadas</h1>
          <p>
            Registros ficticios guardados solo en este navegador. En esta etapa no hay
            usuarios reales ni sincronizacion en la nube.
          </p>
        </div>
      </header>

      {sessions.length === 0 ? (
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
            <button className="danger-action" type="button" onClick={removeAllSessions}>
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
                    <span>Apertura {session.patientOpenness?.final ?? "N/O"}/100</span>
                  </div>
                  <p>{session.summary?.brief || session.summary?.closure}</p>
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
                      onClick={() => removeSession(session.id)}
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
                  <p>{selectedSession.summary?.closure}</p>

                  <section>
                    <h3>Aspectos logrados</h3>
                    <ul>
                      {selectedSession.feedback?.strengths?.slice(0, 4).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <h3>Aspectos por mejorar</h3>
                    <ul>
                      {selectedSession.feedback?.improvements?.slice(0, 4).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>

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
