import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ClipboardCheck,
  FileText,
  Flag,
  Play,
  Settings2,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Target,
  UserRoundCheck
} from "lucide-react";
import {
  buildAgendaReminder,
  buildClinicalAgendaItems,
  buildAvailableSlots,
  buildWeeklyAgenda,
  clearClinicalAgendaEntry,
  formatAgendaDate,
  getWeekStartDate,
  getWeeklyAvailability,
  addDays,
  saveClinicalAgendaEntry,
  saveWeeklyAvailability,
  SESSION_DURATION_OPTIONS,
  validateAgendaSchedule,
  WEEK_DAYS
} from "../engine/clinicalAgenda.js";
import {
  CLINICAL_TERM_OPTIONS,
  getClinicalTermCopy,
  getClinicalTermPreference,
  saveClinicalTermPreference
} from "../engine/clinicalLanguage.js";

export function ClinicalAgenda({ cases, onBackHome, onPrepareCase, onStartSession }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const agendaItems = useMemo(() => buildClinicalAgendaItems(cases), [cases, refreshKey]);
  const [availability, setAvailability] = useState(() => getWeeklyAvailability());
  const [weekStart, setWeekStart] = useState(() => getWeekStartDate());
  const [calendarView, setCalendarView] = useState("semana");
  const [suggestedSlot, setSuggestedSlot] = useState(null);
  const [languagePreference, setLanguagePreference] = useState(() => getClinicalTermPreference());
  const termCopy = getClinicalTermCopy(languagePreference);
  const [selectedCaseId, setSelectedCaseId] = useState(() => agendaItems[0]?.caseItem.id || cases[0]?.id || "");
  const [scheduleCaseId, setScheduleCaseId] = useState("");
  const [reminderCaseId, setReminderCaseId] = useState("");
  const selectedItem =
    agendaItems.find((item) => item.caseItem.id === selectedCaseId) || agendaItems[0] || null;
  const scheduleItem = agendaItems.find((item) => item.caseItem.id === scheduleCaseId) || null;
  const reminderItem = agendaItems.find((item) => item.caseItem.id === reminderCaseId) || null;
  const stats = buildAgendaStats(agendaItems);
  const weeklyAgenda = useMemo(
    () => buildWeeklyAgenda({ cases, weekStart, availability }),
    [cases, weekStart, availability, refreshKey]
  );
  const availableSlots = useMemo(
    () => buildAvailableSlots({ cases, weekStart, availability, durationMinutes: 45, limit: 10 }),
    [cases, weekStart, availability, refreshKey]
  );

  function refreshAgenda() {
    setRefreshKey((current) => current + 1);
  }

  function updateAvailability(nextAvailability) {
    const normalized = saveWeeklyAvailability(nextAvailability);
    setAvailability(normalized);
    refreshAgenda();
  }

  function updateLanguagePreference(patch) {
    const next = saveClinicalTermPreference({
      ...languagePreference,
      ...patch,
      saveAsDefault: true
    });
    setLanguagePreference(next);
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
            Organiza {termCopy.plural}, sesiones, tareas, riesgos y decisiones para sostener
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
            Antes de agendar una nueva sesion, revisa tus horarios disponibles,
            pendientes clinicos y posibles conflictos. La agenda tambien sostiene
            continuidad del proceso.
          </p>
        </div>
      </article>

      <section className="agenda-control-grid">
        <ClinicalLanguagePanel
          preference={languagePreference}
          termCopy={termCopy}
          onChange={updateLanguagePreference}
        />
        <AvailabilityEditor availability={availability} onChange={updateAvailability} />
      </section>

      <section className="agenda-calendar-panel" aria-label="Calendario clinico semanal">
        <div className="agenda-calendar-toolbar">
          <div>
            <span className="eyebrow">Calendario clinico</span>
            <h2>Semana del {formatWeekRange(weekStart)}</h2>
          </div>
          <div className="agenda-calendar-actions">
            <button
              className={calendarView === "dia" ? "selected" : ""}
              type="button"
              onClick={() => setCalendarView("dia")}
            >
              Dia
            </button>
            <button
              className={calendarView === "semana" ? "selected" : ""}
              type="button"
              onClick={() => setCalendarView("semana")}
            >
              Semana
            </button>
            <button
              className="secondary-action compact"
              type="button"
              onClick={() => setWeekStart((current) => addDays(current, -7))}
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <button
              className="secondary-action compact"
              type="button"
              onClick={() => setWeekStart(getWeekStartDate())}
            >
              Hoy
            </button>
            <button
              className="secondary-action compact"
              type="button"
              onClick={() => setWeekStart((current) => addDays(current, 7))}
            >
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
        </div>

        <AgendaCalendar
          agenda={weeklyAgenda}
          view={calendarView}
          termCopy={termCopy}
          onOpenCase={(caseId) => {
            setSelectedCaseId(caseId);
            setScheduleCaseId(caseId);
          }}
        />

        <AvailableSlots
          slots={availableSlots}
          selectedItem={selectedItem}
          onUseSlot={(slot) => {
            if (!selectedItem) return;
            setSuggestedSlot(slot);
            setScheduleCaseId(selectedItem.caseItem.id);
          }}
        />
      </section>

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
                setSuggestedSlot(null);
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
                  <span>{selectedItem.nextSessionLabel} con {termCopy.article}</span>
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
                  <p>Aun no hay sesiones guardadas para {termCopy.article}.</p>
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
          cases={cases}
          availability={availability}
          suggestedSlot={suggestedSlot}
          termCopy={termCopy}
          onCancel={() => setScheduleCaseId("")}
          onSave={(entry) => {
            saveClinicalAgendaEntry(scheduleItem.caseItem.id, entry);
            setScheduleCaseId("");
            setSuggestedSlot(null);
            refreshAgenda();
          }}
          onClear={() => {
            clearClinicalAgendaEntry(scheduleItem.caseItem.id);
            setScheduleCaseId("");
            setSuggestedSlot(null);
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

function ClinicalLanguagePanel({ preference, termCopy, onChange }) {
  return (
    <article className="clinical-language-panel">
      <div className="agenda-panel-heading">
        <Settings2 aria-hidden="true" />
        <div>
          <span className="eyebrow">Lenguaje clinico</span>
          <h2>Como nombraras a la persona</h2>
        </div>
      </div>
      <p>
        Nombrar tambien es parte del encuadre. Usa un termino respetuoso y coherente
        con tu enfoque durante el proceso.
      </p>
      <label className="language-selector">
        <span>Usare el termino</span>
        <select
          value={preference.term}
          onChange={(event) => onChange({ term: event.target.value })}
        >
          {CLINICAL_TERM_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {preference.term === "otro" && (
        <label className="language-selector">
          <span>Termino personalizado</span>
          <input
            type="text"
            value={preference.customTerm}
            onChange={(event) => onChange({ customTerm: event.target.value })}
            placeholder="Ej.: persona consultante"
          />
        </label>
      )}
      <div className="language-preview">
        <strong>Ejemplo</strong>
        <span>Antes de iniciar la entrevista {termCopy.prep}, revisa acuerdos y pendientes.</span>
      </div>
    </article>
  );
}

function AvailabilityEditor({ availability, onChange }) {
  function updateDay(dayKey, patch) {
    onChange({
      ...availability,
      [dayKey]: {
        ...availability[dayKey],
        ...patch
      }
    });
  }

  return (
    <article className="availability-editor">
      <div className="agenda-panel-heading">
        <CalendarDays aria-hidden="true" />
        <div>
          <span className="eyebrow">Mi disponibilidad</span>
          <h2>Horarios semanales</h2>
        </div>
      </div>
      <div className="availability-grid">
        {WEEK_DAYS.map((day) => {
          const dayAvailability = availability[day.key] || {};
          return (
            <div className={`availability-day-row ${dayAvailability.enabled ? "enabled" : ""}`} key={day.key}>
              <label className="availability-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(dayAvailability.enabled)}
                  onChange={(event) => updateDay(day.key, { enabled: event.target.checked })}
                />
                <span>{day.shortLabel}</span>
              </label>
              <input
                type="time"
                value={dayAvailability.start || "09:00"}
                onChange={(event) => updateDay(day.key, { start: event.target.value })}
                disabled={!dayAvailability.enabled}
              />
              <span aria-hidden="true">-</span>
              <input
                type="time"
                value={dayAvailability.end || "10:00"}
                onChange={(event) => updateDay(day.key, { end: event.target.value })}
                disabled={!dayAvailability.enabled}
              />
            </div>
          );
        })}
      </div>
    </article>
  );
}

function AgendaCalendar({ agenda, view, termCopy, onOpenCase }) {
  const todayKey = getLocalDateKey(new Date());
  const visibleDays = view === "dia"
    ? [agenda.days.find((day) => day.dateKey === todayKey) || agenda.days[0]].filter(Boolean)
    : agenda.days;

  return (
    <div className={`agenda-calendar-grid view-${view}`}>
      {visibleDays.map((day) => (
        <article className="agenda-day-column" key={day.key}>
          <header className="agenda-day-header">
            <div>
              <span>{day.shortLabel}</span>
              <strong>{day.dateLabel}</strong>
            </div>
            <small>
              {day.availability?.enabled
                ? `${day.availability.start} - ${day.availability.end}`
                : "Sin disponibilidad"}
            </small>
          </header>

          <div className="agenda-day-body">
            {day.sessions.length ? (
              day.sessions.map((session) => (
                <button
                  className={`agenda-session-block state-${stateClass(session.status)}`}
                  key={`${session.caseId}-${session.date}-${session.time}`}
                  type="button"
                  onClick={() => onOpenCase(session.caseId)}
                >
                  <span>
                    <Clock aria-hidden="true" />
                    {session.time} - {session.endTime}
                  </span>
                  <strong>{session.patientName}</strong>
                  <small>{session.sessionLabel}</small>
                  <em>{session.focus}</em>
                </button>
              ))
            ) : (
              <div className="agenda-empty-day">
                <span>{day.availability?.enabled ? "Libre" : "Sin agenda"}</span>
                <small>
                  {day.availability?.enabled
                    ? `Disponible para sesiones ${termCopy.prep}.`
                    : "Activa disponibilidad si quieres agendar aqui."}
                </small>
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function AvailableSlots({ slots, selectedItem, onUseSlot }) {
  return (
    <aside className="agenda-available-slots">
      <div>
        <span className="eyebrow">Espacios disponibles</span>
        <h3>Esta semana</h3>
      </div>
      {slots.length ? (
        <div className="available-slot-list">
          {slots.map((slot) => (
            <button
              key={`${slot.date}-${slot.time}`}
              type="button"
              onClick={() => onUseSlot(slot)}
              disabled={!selectedItem}
            >
              <span>{formatSlotDate(slot.date)}</span>
              <strong>{slot.time} - {slot.endTime}</strong>
              <small>{slot.dayLabel}</small>
            </button>
          ))}
        </div>
      ) : (
        <p>No hay espacios libres en esta semana con la disponibilidad definida.</p>
      )}
      {!selectedItem && <p>Selecciona un caso para usar un horario libre.</p>}
    </aside>
  );
}

function ScheduleValidationMessage({ validation }) {
  const Icon = validation.ok ? CheckCircle2 : AlertTriangle;
  return (
    <div className={`schedule-validation ${validation.type}`}>
      <Icon aria-hidden="true" />
      <div>
        <strong>{validation.message}</strong>
        {validation.detail && <span>{validation.detail}</span>}
      </div>
    </div>
  );
}

function ScheduleEditor({
  item,
  cases,
  availability,
  suggestedSlot,
  termCopy,
  onSave,
  onCancel,
  onClear
}) {
  const [draft, setDraft] = useState(() => ({
    date: suggestedSlot?.date || item.agendaEntry?.date || "",
    time: suggestedSlot?.time || item.agendaEntry?.time || "",
    durationMinutes: suggestedSlot?.durationMinutes || item.agendaEntry?.durationMinutes || 45,
    modality: item.agendaEntry?.modality || "simulada",
    plannedSessionNumber: item.agendaEntry?.plannedSessionNumber || item.nextSessionNumber || 1,
    status: item.agendaEntry?.status || "programada",
    nextObjective: item.agendaEntry?.nextObjective || item.nextFocus || "",
    reminderNote: item.agendaEntry?.reminderNote || item.task?.description || ""
  }));
  const validation = validateAgendaSchedule({
    caseId: item.caseItem.id,
    draft,
    cases,
    availability
  });

  function updateDraft(patch) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  return (
    <section className="schedule-editor-panel" aria-labelledby="schedule-editor-title">
      <div className="schedule-editor-card">
        <header>
          <span className="eyebrow">Programar sesion</span>
          <h2 id="schedule-editor-title">{item.caseItem.name}</h2>
          <p>{item.nextSessionLabel} {termCopy.prep}</p>
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
              {SESSION_DURATION_OPTIONS.map((minutes) => (
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
          <label>
            <span>Estado en agenda</span>
            <select
              value={draft.status}
              onChange={(event) => updateDraft({ status: event.target.value })}
            >
              <option value="programada">Programada</option>
              <option value="en_curso">En curso</option>
              <option value="realizada">Realizada</option>
              <option value="nota_clinica_pendiente">Nota clinica pendiente</option>
              <option value="pendiente_cierre">Pendiente de cierre</option>
              <option value="reprogramada">Reprogramada</option>
              <option value="cancelada">Cancelada</option>
              <option value="riesgo_abierto">Riesgo abierto</option>
              <option value="seguimiento_pendiente">Seguimiento pendiente</option>
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

        <ScheduleValidationMessage validation={validation} />

        <div className="schedule-actions">
          <button
            className="primary-action"
            type="button"
            onClick={() => onSave(draft)}
            disabled={!validation.ok}
          >
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

function formatWeekRange(weekStart) {
  const start = new Date(weekStart);
  const end = addDays(start, 6);
  try {
    const formatter = new Intl.DateTimeFormat("es-CL", {
      day: "numeric",
      month: "short"
    });
    return `${formatter.format(start)} al ${formatter.format(end)}`;
  } catch {
    return "la semana seleccionada";
  }
}

function formatSlotDate(value) {
  if (!value) return "Fecha pendiente";
  try {
    return new Intl.DateTimeFormat("es-CL", {
      weekday: "short",
      day: "numeric",
      month: "short"
    }).format(new Date(`${value}T12:00:00`));
  } catch {
    return value;
  }
}

function getLocalDateKey(date) {
  const value = new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
