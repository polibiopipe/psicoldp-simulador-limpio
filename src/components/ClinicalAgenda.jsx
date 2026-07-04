import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Flag,
  Play,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Target,
  UserRoundCheck
} from "lucide-react";
import {
  buildAgendaReminder,
  buildClinicalAgendaItems,
  clearClinicalAgendaEntry,
  formatAgendaDate,
  saveClinicalAgendaEntry
} from "../engine/clinicalAgenda.js";

export function ClinicalAgenda({ cases, onBackHome, onPrepareCase, onStartSession }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const agendaItems = useMemo(() => buildClinicalAgendaItems(cases), [cases, refreshKey]);
  const [selectedCaseId, setSelectedCaseId] = useState(() => agendaItems[0]?.caseItem.id || cases[0]?.id || "");
  const [scheduleCaseId, setScheduleCaseId] = useState("");
  const [reminderCaseId, setReminderCaseId] = useState("");
  const selectedItem =
    agendaItems.find((item) => item.caseItem.id === selectedCaseId) || agendaItems[0] || null;
  const scheduleItem = agendaItems.find((item) => item.caseItem.id === scheduleCaseId) || null;
  const reminderItem = agendaItems.find((item) => item.caseItem.id === reminderCaseId) || null;
  const stats = buildAgendaStats(agendaItems);

  function refreshAgenda() {
    setRefreshKey((current) => current + 1);
  }

  function openReminder(item) {
    if (!item) return;
    setReminderCaseId(item.caseItem.id);
    setSelectedCaseId(item.caseItem.id);
  }

  function enterFromReminder(item) {
    if (!item) return;
    const nextSession = item.nextSessionNumber || 1;
    setReminderCaseId("");
    if (item.completedSessions === 0) {
      onPrepareCase?.(item.caseItem.id, nextSession);
      return;
    }
    onStartSession?.(item.caseItem.id, nextSession);
  }

  return (
    <section className="screen clinical-agenda-screen">
      <header className="clinical-agenda-header">
        <button className="secondary-action" type="button" onClick={onBackHome}>
          <ArrowLeft aria-hidden="true" />
          Volver al inicio
        </button>
        <div>
          <span className="eyebrow">Escucha Viva - continuidad clinica simulada</span>
          <h1>Agenda clinica formativa</h1>
          <p>
            Organiza pacientes, sesiones, tareas, riesgos y decisiones para sostener
            procesos simulados en el tiempo.
          </p>
        </div>
      </header>

      <section className="agenda-overview" aria-label="Resumen de agenda">
        <AgendaMetric icon={UserRoundCheck} label="Casos con proceso" value={stats.activeCases} />
        <AgendaMetric icon={ClipboardCheck} label="Notas pendientes" value={stats.pendingNotes} />
        <AgendaMetric icon={Target} label="Tareas por revisar" value={stats.pendingTasks} />
        <AgendaMetric icon={ShieldAlert} label="Riesgos abiertos" value={stats.openRisks} />
      </section>

      <article className="agenda-guide-card">
        <div className="agenda-guide-orb" aria-hidden="true">
          <Sparkles />
        </div>
        <div>
          <span>Guia Vivo</span>
          <p>
            Antes de iniciar una nueva sesion, revisa que quedo pendiente, que tarea
            debes preguntar y si existe riesgo o nota clinica por completar.
          </p>
        </div>
      </article>

      {reminderItem && (
        <AgendaReminder
          item={reminderItem}
          onCancel={() => setReminderCaseId("")}
          onEnter={() => enterFromReminder(reminderItem)}
        />
      )}

      <div className="clinical-agenda-layout">
        <div className="agenda-patient-list" aria-label="Pacientes en agenda">
          {agendaItems.map((item) => (
            <AgendaPatientCard
              key={item.caseItem.id}
              item={item}
              selected={selectedItem?.caseItem.id === item.caseItem.id}
              scheduleOpen={scheduleCaseId === item.caseItem.id}
              onSelect={() => setSelectedCaseId(item.caseItem.id)}
              onSchedule={() => {
                setScheduleCaseId((current) => current === item.caseItem.id ? "" : item.caseItem.id);
                setSelectedCaseId(item.caseItem.id);
              }}
              onPrepare={() => onPrepareCase?.(item.caseItem.id, item.nextSessionNumber || 1)}
              onOpenReminder={() => openReminder(item)}
            />
          ))}
        </div>

        <aside className="clinical-registry-panel" aria-label="Registro clinico por paciente">
          {selectedItem ? (
            <>
              <div className="registry-heading">
                <div>
                  <span className="eyebrow">Registro por paciente</span>
                  <h2>{selectedItem.caseItem.name}</h2>
                </div>
                <span className={`agenda-state-pill state-${stateClass(selectedItem.processState)}`}>
                  {selectedItem.processState}
                </span>
              </div>

              <div className="registry-next-card">
                <CalendarClock aria-hidden="true" />
                <div>
                  <strong>{formatAgendaDate(selectedItem.agendaEntry)}</strong>
                  <span>{selectedItem.nextSessionLabel}</span>
                </div>
              </div>

              <div className="registry-summary-grid">
                <div>
                  <span>Ultimo tema</span>
                  <strong>{selectedItem.lastTopic || "Sin sesion registrada"}</strong>
                </div>
                <div>
                  <span>Proximo foco</span>
                  <strong>{selectedItem.nextFocus}</strong>
                </div>
                <div>
                  <span>Nota clinica</span>
                  <strong>{selectedItem.noteStatus.label}</strong>
                </div>
                <div>
                  <span>Riesgo</span>
                  <strong>{selectedItem.risk.label}</strong>
                </div>
              </div>

              <section className="registry-alerts">
                <h3>Alertas formativas</h3>
                {selectedItem.alerts.length ? (
                  selectedItem.alerts.map((alert) => (
                    <div className={`agenda-alert ${alert.type}`} key={`${selectedItem.caseItem.id}-${alert.label}`}>
                      <Flag aria-hidden="true" />
                      <div>
                        <strong>{alert.label}</strong>
                        <span>{alert.text}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No hay alertas criticas. Mantener continuidad y cierre claro.</p>
                )}
              </section>

              <section className="registry-session-list">
                <h3>Sesiones registradas</h3>
                {selectedItem.registry.length ? (
                  selectedItem.registry.map((entry) => (
                    <details key={entry.id} className="registry-session-item">
                      <summary>
                        <span>Sesion {entry.sessionNumber}</span>
                        <strong>{formatRegistryDate(entry.date)}</strong>
                      </summary>
                      <dl>
                        <div>
                          <dt>Objetivo</dt>
                          <dd>{entry.objective || "No registrado"}</dd>
                        </div>
                        <div>
                          <dt>Resumen</dt>
                          <dd>{entry.summary || "No registrado"}</dd>
                        </div>
                        <div>
                          <dt>Hipotesis</dt>
                          <dd>{entry.hypothesis || "Pendiente"}</dd>
                        </div>
                        <div>
                          <dt>Riesgo</dt>
                          <dd>{entry.risk || "No registrado"}</dd>
                        </div>
                        <div>
                          <dt>Instrumentos</dt>
                          <dd>{entry.instruments.length ? entry.instruments.join(", ") : "No seleccionados"}</dd>
                        </div>
                        <div>
                          <dt>Tecnicas o enfoque</dt>
                          <dd>{entry.techniques.length ? entry.techniques.join(", ") : "No registrado"}</dd>
                        </div>
                        <div>
                          <dt>Tarea</dt>
                          <dd>{entry.task || "Sin tarea registrada"}</dd>
                        </div>
                        <div>
                          <dt>Decision</dt>
                          <dd>{entry.decision}</dd>
                        </div>
                        <div>
                          <dt>Nota clinica</dt>
                          <dd>{entry.clinicalNote || "Pendiente"}</dd>
                        </div>
                        <div>
                          <dt>Evaluacion formativa</dt>
                          <dd>{entry.formativeEvaluation || "No registrada"}</dd>
                        </div>
                      </dl>
                    </details>
                  ))
                ) : (
                  <p>Aun no hay sesiones guardadas para este paciente.</p>
                )}
              </section>
            </>
          ) : (
            <div className="agenda-empty-registry">
              <FileText aria-hidden="true" />
              <h2>Selecciona un caso</h2>
              <p>El registro clinico formativo aparecera aqui.</p>
            </div>
          )}
        </aside>
      </div>

      {scheduleItem && (
        <ScheduleEditor
          key={scheduleItem.caseItem.id}
          item={scheduleItem}
          onCancel={() => setScheduleCaseId("")}
          onSave={(entry) => {
            saveClinicalAgendaEntry(scheduleItem.caseItem.id, entry);
            setScheduleCaseId("");
            refreshAgenda();
          }}
          onClear={() => {
            clearClinicalAgendaEntry(scheduleItem.caseItem.id);
            setScheduleCaseId("");
            refreshAgenda();
          }}
        />
      )}
    </section>
  );
}

function AgendaMetric({ icon: Icon, label, value }) {
  return (
    <article>
      <Icon aria-hidden="true" />
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function AgendaPatientCard({
  item,
  selected,
  scheduleOpen,
  onSelect,
  onSchedule,
  onPrepare,
  onOpenReminder
}) {
  const canStart = item.nextSessionNumber && item.completedSessions > 0;
  const actionLabel = item.completedSessions ? "Iniciar proxima sesion" : "Preparar caso";

  return (
    <article
      className={`agenda-patient-card ${selected ? "selected" : ""}`}
      style={{ "--accent": item.caseItem.accent }}
    >
      <button className="agenda-card-main" type="button" onClick={onSelect}>
        <img src={item.caseItem.image} alt={`Retrato ficticio de ${item.caseItem.name}`} />
        <div>
          <span className="eyebrow">{item.caseItem.shortTitle}</span>
          <h2>{item.caseItem.name}</h2>
          <p>{item.caseItem.age}</p>
        </div>
      </button>

      <div className="agenda-card-progress">
        <div>
          <span>{item.currentSessionLabel}</span>
          <strong>{item.nextSessionLabel}</strong>
        </div>
        <span className={`agenda-state-pill state-${stateClass(item.processState)}`}>
          {item.processState}
        </span>
      </div>

      <div className="agenda-card-facts">
        <div>
          <span>Motivo</span>
          <p>{item.caseItem.motive}</p>
        </div>
        <div>
          <span>Ultimo tema</span>
          <p>{item.lastTopic || "Sin entrevista registrada"}</p>
        </div>
        <div>
          <span>Proximo foco</span>
          <p>{item.nextFocus}</p>
        </div>
      </div>

      <div className="agenda-card-badges">
        <span className={item.noteStatus.completed ? "ok" : "warning"}>
          <ClipboardCheck aria-hidden="true" />
          {item.noteStatus.label}
        </span>
        <span className={item.task?.description ? "warning" : "neutral"}>
          <Target aria-hidden="true" />
          {item.task?.description ? "Tarea pendiente" : "Sin tarea pendiente"}
        </span>
        <span className={item.risk.status === "open" ? "risk" : "neutral"}>
          <ShieldAlert aria-hidden="true" />
          {item.risk.label}
        </span>
      </div>

      <div className="agenda-card-actions">
        {canStart ? (
          <button className="primary-action" type="button" onClick={onOpenReminder}>
            <Play aria-hidden="true" />
            {actionLabel}
          </button>
        ) : (
          <button
            className="primary-action"
            type="button"
            onClick={item.completedSessions ? onOpenReminder : onPrepare}
            disabled={item.completedSessions > 0 && !item.nextSessionNumber}
          >
            <Play aria-hidden="true" />
            {item.nextSessionNumber ? actionLabel : "Proceso cerrado"}
          </button>
        )}
        <button className="secondary-action" type="button" onClick={onSchedule}>
          <CalendarClock aria-hidden="true" />
          {scheduleOpen ? "Ocultar programacion" : "Programar"}
        </button>
      </div>
    </article>
  );
}

function AgendaReminder({ item, onCancel, onEnter }) {
  const reminders = buildAgendaReminder(item);

  return (
    <section className="agenda-reminder-panel" aria-labelledby="agenda-reminder-title">
      <div className="agenda-reminder-heading">
        <Stethoscope aria-hidden="true" />
        <div>
          <span className="eyebrow">Antes de iniciar esta sesion</span>
          <h2 id="agenda-reminder-title">{item.caseItem.name} - {item.nextSessionLabel}</h2>
        </div>
      </div>
      <div className="agenda-reminder-grid">
        {reminders.map((reminder) => (
          <div key={reminder.label}>
            <span>{reminder.label}</span>
            <strong>{reminder.value || "Pendiente"}</strong>
          </div>
        ))}
      </div>
      <div className="agenda-reminder-actions">
        <button className="primary-action" type="button" onClick={onEnter}>
          <Play aria-hidden="true" />
          Entrar a la sesion
        </button>
        <button className="secondary-action" type="button" onClick={onCancel}>
          Volver a la agenda
        </button>
      </div>
    </section>
  );
}

function ScheduleEditor({ item, onSave, onCancel, onClear }) {
  const [draft, setDraft] = useState(() => ({
    date: item.agendaEntry?.date || "",
    time: item.agendaEntry?.time || "",
    durationMinutes: item.agendaEntry?.durationMinutes || 50,
    modality: item.agendaEntry?.modality || "simulada",
    plannedSessionNumber: item.agendaEntry?.plannedSessionNumber || item.nextSessionNumber || 1,
    nextObjective: item.agendaEntry?.nextObjective || item.nextFocus || "",
    reminderNote: item.agendaEntry?.reminderNote || item.task?.description || ""
  }));

  function updateDraft(patch) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  return (
    <section className="schedule-editor-panel" aria-labelledby="schedule-editor-title">
      <div className="schedule-editor-card">
        <header>
          <span className="eyebrow">Programar sesion</span>
          <h2 id="schedule-editor-title">{item.caseItem.name}</h2>
          <p>{item.nextSessionLabel}</p>
        </header>

        <div className="schedule-form-grid">
          <label>
            <span>Fecha</span>
            <input
              type="date"
              value={draft.date}
              onChange={(event) => updateDraft({ date: event.target.value })}
            />
          </label>
          <label>
            <span>Hora</span>
            <input
              type="time"
              value={draft.time}
              onChange={(event) => updateDraft({ time: event.target.value })}
            />
          </label>
          <label>
            <span>Duracion estimada</span>
            <select
              value={draft.durationMinutes}
              onChange={(event) => updateDraft({ durationMinutes: Number(event.target.value) })}
            >
              {[30, 45, 50, 60, 75, 90].map((minutes) => (
                <option key={minutes} value={minutes}>{minutes} min</option>
              ))}
            </select>
          </label>
          <label>
            <span>Modalidad simulada</span>
            <select
              value={draft.modality}
              onChange={(event) => updateDraft({ modality: event.target.value })}
            >
              <option value="simulada">Sesion simulada</option>
              <option value="seguimiento">Seguimiento formativo</option>
              <option value="reevaluacion">Reevaluacion</option>
              <option value="cierre">Cierre formativo</option>
            </select>
          </label>
          <label>
            <span>Sesion correspondiente</span>
            <select
              value={draft.plannedSessionNumber}
              onChange={(event) => updateDraft({ plannedSessionNumber: Number(event.target.value) })}
            >
              {Array.from({ length: item.plannedSessions }, (_, index) => index + 1).map((session) => (
                <option key={session} value={session}>
                  Sesion {session} de {item.plannedSessions}
                </option>
              ))}
            </select>
          </label>
          <label className="wide">
            <span>Objetivo de la proxima sesion</span>
            <textarea
              value={draft.nextObjective}
              onChange={(event) => updateDraft({ nextObjective: event.target.value })}
              rows={3}
              placeholder="Ej.: retomar tarea, evaluar riesgo y profundizar red de apoyo."
            />
          </label>
          <label className="wide">
            <span>Recordatorio o nota personal</span>
            <textarea
              value={draft.reminderNote}
              onChange={(event) => updateDraft({ reminderNote: event.target.value })}
              rows={3}
              placeholder="Ej.: preguntar como llego despues de la sesion anterior."
            />
          </label>
        </div>

        <div className="schedule-actions">
          <button className="primary-action" type="button" onClick={() => onSave(draft)}>
            <CheckCircle2 aria-hidden="true" />
            Guardar programacion
          </button>
          <button className="secondary-action" type="button" onClick={onClear}>
            Limpiar
          </button>
          <button className="secondary-action" type="button" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>
    </section>
  );
}

function buildAgendaStats(items) {
  return {
    activeCases: items.filter((item) => item.completedSessions > 0 || item.agendaEntry).length,
    pendingNotes: items.filter((item) => item.noteStatus.status === "pending").length,
    pendingTasks: items.filter((item) => item.task?.description).length,
    openRisks: items.filter((item) => item.risk.status === "open").length
  };
}

function stateClass(state = "") {
  return state
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatRegistryDate(value) {
  if (!value) return "Fecha no registrada";
  try {
    return new Intl.DateTimeFormat("es-CL", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return "Fecha no registrada";
  }
}
