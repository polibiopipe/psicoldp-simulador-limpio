import React, { useEffect, useMemo, useRef, useState } from "react";
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
  clearClinicalAgendaEntry,
  formatAgendaDate,
  formatAvailabilityForDay,
  formatDateInput,
  getEmptyWeeklyAvailability,
  getWeekStartDate,
  hasConfiguredAvailability,
  loadStudentWeeklyAvailability,
  addDays,
  saveStudentWeeklyAvailability,
  validateAgendaSchedule,
  WEEK_DAYS
} from "../engine/clinicalAgenda.js";
import {
  buildAppointmentRecord,
  cancelSimulationAppointment,
  saveSimulationAppointment
} from "../engine/simulationAppointments.js";
import {
  ACTIVE_APPOINTMENT_STATUSES,
  SESSION_DURATION_MINUTES
} from "../engine/simulationUsagePolicy.js";
import {
  CLINICAL_TERM_OPTIONS,
  getClinicalTermCopy,
  getClinicalTermPreference,
  saveClinicalTermPreference
} from "../engine/clinicalLanguage.js";

export function ClinicalAgenda({
  cases,
  authSession = null,
  appointments = [],
  initialCaseId = "",
  initialScheduleRequest = null,
  onBackHome,
  onPrepareCase,
  onStartSession,
  onAppointmentsChange
}) {
  const availabilityRequestRef = useRef(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const agendaItems = useMemo(
    () => applyAppointmentsToAgendaItems(buildClinicalAgendaItems(cases), appointments),
    [cases, appointments, refreshKey]
  );
  const emptyAvailability = useMemo(() => getEmptyWeeklyAvailability(), []);
  const [availability, setAvailability] = useState(() => getEmptyWeeklyAvailability());
  const [availabilityState, setAvailabilityState] = useState({
    loading: true,
    saving: false,
    authoritative: false,
    configured: false,
    source: "loading",
    error: ""
  });
  const [weekStart, setWeekStart] = useState(() => getWeekStartDate());
  const [calendarView, setCalendarView] = useState("mes");
  const [suggestedSlot, setSuggestedSlot] = useState(null);
  const [languagePreference, setLanguagePreference] = useState(() => getClinicalTermPreference());
  const termCopy = getClinicalTermCopy(languagePreference);
  const [selectedCaseId, setSelectedCaseId] = useState(
    () => initialCaseId || agendaItems[0]?.caseItem.id || cases[0]?.id || ""
  );
  const [scheduleCaseId, setScheduleCaseId] = useState("");
  const [scheduleDrafts, setScheduleDrafts] = useState({});
  const [availabilityReturnCaseId, setAvailabilityReturnCaseId] = useState("");
  const [reminderCaseId, setReminderCaseId] = useState("");
  const selectedItem =
    agendaItems.find((item) => item.caseItem.id === selectedCaseId) || agendaItems[0] || null;
  const scheduleItem = agendaItems.find((item) => item.caseItem.id === scheduleCaseId) || null;
  const reminderItem = agendaItems.find((item) => item.caseItem.id === reminderCaseId) || null;
  const stats = buildAgendaStats(agendaItems);
  const scheduleAvailability = useMemo(
    () => availabilityState.authoritative ? availability : emptyAvailability,
    [availabilityState.authoritative, availability, emptyAvailability]
  );
  const weeklyAgenda = useMemo(
    () => calendarView === "mes"
      ? buildAppointmentMonthAgenda({ cases, appointments, baseDate: weekStart, availability: scheduleAvailability })
      : buildAppointmentWeeklyAgenda({ cases, appointments, weekStart, availability: scheduleAvailability }),
    [cases, appointments, weekStart, scheduleAvailability, calendarView, refreshKey]
  );
  const availableSlots = useMemo(
    () => buildAppointmentAvailableSlots({ appointments, weekStart, availability: scheduleAvailability, durationMinutes: SESSION_DURATION_MINUTES, limit: 10 }),
    [appointments, weekStart, scheduleAvailability, refreshKey]
  );

  useEffect(() => {
    let active = true;
    const requestId = availabilityRequestRef.current + 1;
    availabilityRequestRef.current = requestId;
    setAvailabilityState((current) => ({ ...current, loading: true, error: "" }));
    loadStudentWeeklyAvailability(authSession).then((result) => {
      if (!active || requestId !== availabilityRequestRef.current) return;
      setAvailability(result.availability);
      setAvailabilityState({
        loading: false,
        saving: false,
        authoritative: Boolean(result.authoritative),
        configured: Boolean(result.configured),
        source: result.source || "unknown",
        error: result.error || ""
      });
    });
    return () => {
      active = false;
    };
  }, [authSession?.user?.id]);

  useEffect(() => {
    if (initialCaseId && agendaItems.some((item) => item.caseItem.id === initialCaseId)) {
      setSelectedCaseId(initialCaseId);
    }
  }, [initialCaseId, agendaItems]);

  useEffect(() => {
    if (!initialScheduleRequest?.caseId) return;
    setSelectedCaseId(initialScheduleRequest.caseId);
    setScheduleCaseId(initialScheduleRequest.caseId);
  }, [initialScheduleRequest?.caseId, initialScheduleRequest?.sessionNumber]);

  function refreshAgenda() {
    setRefreshKey((current) => current + 1);
  }

  async function updateAvailability(nextAvailability) {
    const previousAvailability = availability;
    const previousState = availabilityState;
    const requestId = availabilityRequestRef.current + 1;
    availabilityRequestRef.current = requestId;
    setAvailabilityState((current) => ({ ...current, saving: true, error: "" }));
    const result = await saveStudentWeeklyAvailability(authSession, nextAvailability);
    let finalResult = result;
    if (result.ok) {
      const refreshed = await loadStudentWeeklyAvailability(authSession);
      finalResult = refreshed.authoritative
        ? { ...refreshed, ok: true }
        : result;
    }
    if (requestId !== availabilityRequestRef.current) return finalResult;
    if (!finalResult.ok && !finalResult.authoritative) {
      setAvailability(previousAvailability);
      setAvailabilityState({
        ...previousState,
        loading: false,
        saving: false,
        error: finalResult.error || "No pudimos guardar tu disponibilidad.",
        source: finalResult.source || "supabase_error"
      });
      return finalResult;
    }
    setAvailability(finalResult.availability);
    setAvailabilityState({
      loading: false,
      saving: false,
      authoritative: true,
      configured: Boolean(finalResult.configured),
      source: finalResult.source || "supabase",
      error: finalResult.error || ""
    });
    refreshAgenda();
    if (availabilityReturnCaseId) {
      const returnCaseId = availabilityReturnCaseId;
      setAvailabilityReturnCaseId("");
      setSelectedCaseId(returnCaseId);
      setScheduleCaseId(returnCaseId);
    }
    return finalResult;
  }

  function updateScheduleDraft(caseId, draft) {
    if (!caseId) return;
    setScheduleDrafts((current) => ({
      ...current,
      [caseId]: draft
    }));
  }

  function clearScheduleDraft(caseId) {
    if (!caseId) return;
    setScheduleDrafts((current) => {
      const next = { ...current };
      delete next[caseId];
      return next;
    });
  }

  function openAvailabilityFromScheduling(caseId, draft) {
    if (caseId && draft) updateScheduleDraft(caseId, draft);
    setAvailabilityReturnCaseId(caseId || "");
    setScheduleCaseId("");
    window.setTimeout(() => {
      document.querySelector(".availability-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
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

  async function saveAppointmentFromDraft(item, entry) {
    if (!item) return;
    const existing = appointments.find((appointment) =>
      appointment.caseId === item.caseItem.id &&
      Number(appointment.sessionNumber) === Number(entry.plannedSessionNumber || item.nextSessionNumber || 1) &&
      appointment.status !== "cancelled"
    );
    const baseAppointment = buildAppointmentRecord({
      authSession,
      caseItem: item.caseItem,
      sessionNumber: entry.plannedSessionNumber || item.nextSessionNumber || 1,
      date: entry.date,
      time: entry.time,
      durationMinutes: SESSION_DURATION_MINUTES,
      status: "scheduled",
      nextObjective: entry.nextObjective,
      reminderNote: entry.reminderNote
    });
    const appointment = existing ? { ...baseAppointment, id: existing.id } : baseAppointment;
    const result = await saveSimulationAppointment(authSession, appointment);
    const saved = result.data || appointment;
    onAppointmentsChange?.(mergeAppointmentList(appointments, saved));
    clearScheduleDraft(item.caseItem.id);
    setScheduleCaseId("");
    setSuggestedSlot(null);
    refreshAgenda();
  }

  async function clearAppointment(item) {
    const appointment = appointments.find((candidate) =>
      candidate.caseId === item.caseItem.id &&
      Number(candidate.sessionNumber) === Number(item.nextSessionNumber || item.agendaEntry?.plannedSessionNumber || 1) &&
      candidate.status === "scheduled"
    );
    if (appointment?.id) {
      const result = await cancelSimulationAppointment(authSession, appointment.id);
      const cancelled = result.data || { ...appointment, status: "cancelled", cancelledAt: new Date().toISOString() };
      onAppointmentsChange?.(mergeAppointmentList(appointments, cancelled));
    } else {
      clearClinicalAgendaEntry(item.caseItem.id);
    }
    setScheduleCaseId("");
    clearScheduleDraft(item.caseItem.id);
    setSuggestedSlot(null);
    refreshAgenda();
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
        <AvailabilityEditor
          availability={availability}
          status={availabilityState}
          onChange={updateAvailability}
        />
      </section>

      <section className="agenda-calendar-panel" aria-label="Calendario clinico semanal">
        <div className="agenda-calendar-toolbar">
          <div>
            <span className="eyebrow">Calendario clinico</span>
            <h2>{calendarView === "mes" ? formatMonthLabel(weekStart) : `Semana del ${formatWeekRange(weekStart)}`}</h2>
          </div>
          <div className="agenda-calendar-actions">
            <button
              className={calendarView === "mes" ? "selected" : ""}
              type="button"
              onClick={() => setCalendarView("mes")}
            >
              Mes
            </button>
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
              onClick={() => setWeekStart((current) => calendarView === "mes" ? addMonths(current, -1) : addDays(current, -7))}
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
              onClick={() => setWeekStart((current) => calendarView === "mes" ? addMonths(current, 1) : addDays(current, 7))}
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
          availability={scheduleAvailability}
          availabilityStatus={availabilityState}
          appointments={appointments}
          suggestedSlot={suggestedSlot}
          savedDraft={scheduleDrafts[scheduleItem.caseItem.id]}
          termCopy={termCopy}
          onDraftChange={(draft) => updateScheduleDraft(scheduleItem.caseItem.id, draft)}
          onEditAvailability={(draft) => openAvailabilityFromScheduling(scheduleItem.caseItem.id, draft)}
          onCancel={() => {
            clearScheduleDraft(scheduleItem.caseItem.id);
            setScheduleCaseId("");
          }}
          onSave={(entry) => {
            void saveAppointmentFromDraft(scheduleItem, entry);
          }}
          onClear={() => {
            void clearAppointment(scheduleItem);
          }}
        />
      )}
    </section>
  );
}

function applyAppointmentsToAgendaItems(items = [], appointments = []) {
  return items.map((item) => {
    const appointment = findRelevantAppointment(item, appointments);
    if (!appointment) return item;
    const agendaEntry = {
      date: appointment.scheduledLocalDate,
      time: appointment.scheduledTime,
      durationMinutes: appointment.durationMinutes || SESSION_DURATION_MINUTES,
      plannedSessionNumber: appointment.sessionNumber,
      status: appointment.status,
      nextObjective: appointment.nextObjective,
      reminderNote: appointment.reminderNote,
      appointmentId: appointment.id
    };
    return {
      ...item,
      agendaEntry,
      nextSessionNumber: appointment.sessionNumber || item.nextSessionNumber,
      nextSessionLabel:
        appointment.status === "closure_pending"
          ? `Sesion ${appointment.sessionNumber} con cierre pendiente`
          : `Sesion ${appointment.sessionNumber} de ${item.plannedSessions}`,
      processState: appointmentStatusLabel(appointment.status),
      nextFocus: appointment.nextObjective || item.nextFocus
    };
  });
}

function findRelevantAppointment(item, appointments = []) {
  return appointments
    .filter((appointment) =>
      appointment.caseId === item.caseItem.id &&
      appointment.status !== "cancelled" &&
      ACTIVE_APPOINTMENT_STATUSES.has(appointment.status)
    )
    .sort((a, b) => new Date(a.scheduledFor || a.createdAt).getTime() - new Date(b.scheduledFor || b.createdAt).getTime())[0] || null;
}

function buildAppointmentWeeklyAgenda({ cases = [], appointments = [], weekStart = getWeekStartDate(), availability = {} }) {
  const days = WEEK_DAYS.map((day, index) => {
    const date = addDays(weekStart, index);
    const dateKey = formatDateInput(date);
    return {
      ...day,
      key: day.key,
      date,
      dateKey,
      dateLabel: formatSlotDate(dateKey),
      availability: availability[day.key],
      sessions: []
    };
  });

  appointments
    .filter((appointment) => appointment.status !== "cancelled")
    .forEach((appointment) => {
      const day = days.find((candidate) => candidate.dateKey === appointment.scheduledLocalDate);
      if (!day) return;
      const caseItem = cases.find((candidate) => candidate.id === appointment.caseId);
      const startMinutes = timeToMinutes(appointment.scheduledTime);
      const durationMinutes = Number(appointment.durationMinutes) || SESSION_DURATION_MINUTES;
      day.sessions.push({
        caseId: appointment.caseId,
        patientName: appointment.caseName || caseItem?.name || appointment.caseId,
        date: appointment.scheduledLocalDate,
        time: appointment.scheduledTime || "09:00",
        endTime: minutesToTime(startMinutes + durationMinutes),
        durationMinutes,
        sessionNumber: appointment.sessionNumber,
        sessionLabel: `Sesion ${appointment.sessionNumber}`,
        status: appointment.status,
        focus: appointment.nextObjective || caseItem?.motive || "Entrevista inicial, encuadre y motivo de consulta.",
        appointment
      });
    });

  days.forEach((day) => day.sessions.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time)));
  return {
    weekStart: formatDateInput(weekStart),
    days,
    blocks: days.flatMap((day) => day.sessions)
  };
}

function buildAppointmentMonthAgenda({ cases = [], appointments = [], baseDate = new Date(), availability = {} }) {
  const date = new Date(baseDate);
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const monthStart = getWeekStartDate(firstDay);
  const days = Array.from({ length: 42 }, (_item, index) => {
    const current = addDays(monthStart, index);
    const dateKey = formatDateInput(current);
    const dayKey = WEEK_DAYS.find((day) => day.dayIndex === current.getDay())?.key || "monday";
    return {
      key: dateKey,
      date: current,
      dateKey,
      dateLabel: String(current.getDate()),
      shortLabel: new Intl.DateTimeFormat("es-CL", { weekday: "short" }).format(current),
      availability: availability[dayKey],
      isOutsideMonth: current.getMonth() !== date.getMonth(),
      sessions: []
    };
  });

  appointments
    .filter((appointment) => appointment.status !== "cancelled")
    .forEach((appointment) => {
      const day = days.find((candidate) => candidate.dateKey === appointment.scheduledLocalDate);
      if (!day) return;
      const caseItem = cases.find((candidate) => candidate.id === appointment.caseId);
      const startMinutes = timeToMinutes(appointment.scheduledTime);
      const durationMinutes = Number(appointment.durationMinutes) || SESSION_DURATION_MINUTES;
      day.sessions.push({
        caseId: appointment.caseId,
        patientName: appointment.caseName || caseItem?.name || appointment.caseId,
        date: appointment.scheduledLocalDate,
        time: appointment.scheduledTime || "09:00",
        endTime: minutesToTime(startMinutes + durationMinutes),
        durationMinutes,
        sessionNumber: appointment.sessionNumber,
        sessionLabel: `Sesion ${appointment.sessionNumber}`,
        status: appointment.status,
        focus: appointment.nextObjective || caseItem?.motive || "Entrevista inicial, encuadre y motivo de consulta.",
        appointment
      });
    });

  days.forEach((day) => day.sessions.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time)));
  return {
    weekStart: formatDateInput(monthStart),
    days,
    blocks: days.flatMap((day) => day.sessions)
  };
}

function buildAppointmentAvailableSlots({
  appointments = [],
  weekStart = getWeekStartDate(),
  availability = {},
  durationMinutes = SESSION_DURATION_MINUTES,
  limit = 10
}) {
  const slots = [];
  WEEK_DAYS.forEach((day, index) => {
    const dayAvailability = availability[day.key];
    if (!dayAvailability?.enabled) return;
    const date = formatDateInput(addDays(weekStart, index));
    dayAvailability.blocks.forEach((availabilityBlock) => {
      const start = timeToMinutes(availabilityBlock.start);
      const end = timeToMinutes(availabilityBlock.end);
      for (let current = start; current + durationMinutes <= end; current += durationMinutes) {
        const conflict = appointments.some((appointment) =>
          appointment.scheduledLocalDate === date &&
          appointment.status !== "cancelled" &&
          ACTIVE_APPOINTMENT_STATUSES.has(appointment.status)
        );
        if (conflict) break;
        slots.push({
          date,
          time: minutesToTime(current),
          endTime: minutesToTime(current + durationMinutes),
          durationMinutes,
          dayLabel: day.label
        });
      }
    });
  });
  return slots.slice(0, limit);
}

function validateAppointmentSchedule({ item, draft, appointments = [], availability, availabilityStatus, cases }) {
  if (availabilityStatus?.loading) {
    return {
      ok: false,
      type: "no_availability",
      message: "Estamos verificando tu disponibilidad.",
      detail: "Espera unos segundos antes de programar la sesión."
    };
  }

  if (!availabilityStatus?.authoritative) {
    return {
      ok: false,
      type: "no_availability",
      message: "Aún no has definido tu disponibilidad.",
      detail: "Configúrala para organizar tus próximas sesiones.",
      actionLabel: "Editar disponibilidad"
    };
  }

  const baseValidation = validateAgendaSchedule({
    caseId: item.caseItem.id,
    draft,
    cases,
    availability
  });
  if (!baseValidation.ok && baseValidation.type !== "conflict") return baseValidation;

  const date = String(draft.date || "").trim();
  const sessionNumber = Number(draft.plannedSessionNumber) || item.nextSessionNumber || 1;
  const sameDayConflict = appointments.find((appointment) =>
    appointment.scheduledLocalDate === date &&
    appointment.status !== "cancelled" &&
    ACTIVE_APPOINTMENT_STATUSES.has(appointment.status) &&
    !(appointment.caseId === item.caseItem.id && Number(appointment.sessionNumber) === Number(sessionNumber))
  );
  if (sameDayConflict) {
    return {
      ok: false,
      type: "daily_limit",
      message: "Ya existe una sesion programada para ese dia.",
      detail: "Cada estudiante puede tener maximo una sesion clinica simulada por dia."
    };
  }

  return {
    ok: true,
    type: "available",
    message: "Horario disponible. Puedes agendar esta sesion.",
    detail: `${draft.time} - duracion ${SESSION_DURATION_MINUTES} minutos.`
  };
}

function mergeAppointmentList(records = [], nextRecord = null) {
  if (!nextRecord?.id) return records;
  const merged = new Map(records.map((record) => [record.id, record]));
  merged.set(nextRecord.id, { ...merged.get(nextRecord.id), ...nextRecord });
  return Array.from(merged.values()).sort(
    (a, b) => new Date(a.scheduledFor || a.createdAt).getTime() - new Date(b.scheduledFor || b.createdAt).getTime()
  );
}

function appointmentStatusLabel(status = "") {
  const labels = {
    scheduled: "Agendada",
    in_progress: "En curso",
    closure_pending: "Cierre pendiente",
    completed: "Completada",
    cancelled: "Cancelada"
  };
  return labels[status] || "Agendada";
}

function timeToMinutes(time = "00:00") {
  const [hours, minutes] = String(time || "00:00").split(":").map((part) => Number.parseInt(part, 10));
  return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
}

function minutesToTime(value) {
  const safeValue = Math.max(0, Number(value) || 0);
  const hours = Math.floor(safeValue / 60);
  const minutes = safeValue % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
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
  const actionLabel = item.completedSessions ? "Iniciar próxima sesión" : "Preparar caso";

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

function AvailabilityEditor({ availability, status, onChange }) {
  const [draft, setDraft] = useState(availability);
  const [localSaving, setLocalSaving] = useState(false);

  useEffect(() => {
    setDraft(availability);
  }, [availability]);

  useEffect(() => {
    if (!status?.saving) setLocalSaving(false);
  }, [status?.saving]);

  function updateDay(dayKey, patch) {
    setDraft((current) => ({
      ...current,
      [dayKey]: {
        ...current[dayKey],
        ...patch
      }
    }));
  }

  function toggleDay(dayKey, checked) {
    const current = draft[dayKey] || {};
    updateDay(dayKey, checked
      ? {
          enabled: true,
          start: current.start || "09:00",
          end: current.end || "10:00",
          blocks: [{ start: current.start || "09:00", end: current.end || "10:00" }]
        }
      : { enabled: false, start: "", end: "", blocks: [] });
  }

  function updateTime(dayKey, patch) {
    const current = draft[dayKey] || {};
    const next = {
      ...current,
      ...patch,
      enabled: true
    };
    updateDay(dayKey, {
      ...next,
      blocks: [{ start: next.start || "09:00", end: next.end || "10:00" }]
    });
  }

  const configured = hasConfiguredAvailability(draft);

  async function handleSave() {
    if (localSaving || status?.saving) return;
    setLocalSaving(true);
    await onChange(draft);
    setLocalSaving(false);
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
      {status?.loading ? (
        <p className="availability-status">Cargando tu disponibilidad...</p>
      ) : status?.configured ? (
        <p className="availability-status">Disponibilidad definida. Puedes editarla cuando lo necesites.</p>
      ) : (
        <p className="availability-status">
          Aún no has definido tu disponibilidad. Configúrala para organizar tus próximas sesiones.
        </p>
      )}
      {status?.error && (
        <p className="availability-status warning">
          No pudimos verificar tu disponibilidad en Supabase. {status.error}
        </p>
      )}
      <div className="availability-grid">
        {WEEK_DAYS.map((day) => {
          const dayAvailability = draft[day.key] || {};
          return (
            <div className={`availability-day-row ${dayAvailability.enabled ? "enabled" : ""}`} key={day.key}>
              <label className="availability-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(dayAvailability.enabled)}
                  onChange={(event) => toggleDay(day.key, event.target.checked)}
                />
                <span>{day.shortLabel}</span>
              </label>
              <input
                type="time"
                value={dayAvailability.start || "09:00"}
                onChange={(event) => updateTime(day.key, { start: event.target.value })}
                disabled={!dayAvailability.enabled}
              />
              <span aria-hidden="true">-</span>
              <input
                type="time"
                value={dayAvailability.end || "10:00"}
                onChange={(event) => updateTime(day.key, { end: event.target.value })}
                disabled={!dayAvailability.enabled}
              />
              <button
                className="availability-clear"
                type="button"
                onClick={() => toggleDay(day.key, false)}
                disabled={!dayAvailability.enabled}
              >
                Eliminar
              </button>
              <small>{formatAvailabilityForDay(dayAvailability)}</small>
            </div>
          );
        })}
      </div>
      <button
        className="primary-action availability-save"
        type="button"
        onClick={handleSave}
        disabled={status?.saving || localSaving}
      >
        <CheckCircle2 aria-hidden="true" />
        {status?.saving || localSaving
          ? "Guardando..."
          : status?.configured ? "Editar mi disponibilidad" : "Definir mi disponibilidad"}
      </button>
      {!configured && (
        <p className="availability-status">Activa al menos un día y define un bloque horario para guardar.</p>
      )}
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
        <article
          className={`agenda-day-column ${day.dateKey === todayKey ? "today" : ""} ${day.isOutsideMonth ? "outside-month" : ""}`}
          key={day.key}
        >
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
        <p>No hay espacios libres esta semana con tu disponibilidad configurada.</p>
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
        {validation.actionLabel && validation.onAction && (
          <button className="inline-link-button" type="button" onClick={validation.onAction}>
            {validation.actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function ScheduleEditor({
  item,
  cases,
  availability,
  availabilityStatus,
  appointments = [],
  suggestedSlot,
  savedDraft,
  termCopy,
  onDraftChange,
  onEditAvailability,
  onSave,
  onCancel,
  onClear
}) {
  const [draft, setDraft] = useState(() => savedDraft || {
    date: suggestedSlot?.date || item.agendaEntry?.date || "",
    time: suggestedSlot?.time || item.agendaEntry?.time || "",
    durationMinutes: SESSION_DURATION_MINUTES,
    modality: item.agendaEntry?.modality || "simulada",
    plannedSessionNumber: item.agendaEntry?.plannedSessionNumber || item.nextSessionNumber || 1,
    status: item.agendaEntry?.status || "programada",
    nextObjective: item.agendaEntry?.nextObjective || item.nextFocus || "",
    reminderNote: item.agendaEntry?.reminderNote || item.task?.description || ""
  });

  useEffect(() => {
    if (savedDraft) setDraft(savedDraft);
  }, [savedDraft]);

  const validation = validateAppointmentSchedule({
    item,
    draft,
    appointments,
    availability,
    availabilityStatus,
    cases
  });
  const validationWithAction = validation.actionLabel
    ? { ...validation, onAction: () => onEditAvailability?.(draft) }
    : validation;

  function updateDraft(patch) {
    setDraft((current) => {
      const next = { ...current, ...patch };
      onDraftChange?.(next);
      return next;
    });
  }

  return (
    <section className="schedule-editor-panel" aria-labelledby="schedule-editor-title">
      <div className="schedule-editor-card">
        <header>
          <span className="eyebrow">Programar sesión</span>
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
            <span>Duración</span>
            <input type="text" value={`${SESSION_DURATION_MINUTES} min`} readOnly />
          </label>
          <label>
            <span>Modalidad simulada</span>
            <select
              value={draft.modality}
              onChange={(event) => updateDraft({ modality: event.target.value })}
            >
              <option value="simulada">Sesión simulada</option>
              <option value="seguimiento">Seguimiento formativo</option>
              <option value="reevaluacion">Reevaluacion</option>
              <option value="cierre">Cierre formativo</option>
            </select>
          </label>
          <label>
            <span>Sesión correspondiente</span>
            <select
              value={draft.plannedSessionNumber}
              onChange={(event) => updateDraft({ plannedSessionNumber: Number(event.target.value) })}
            >
              {Array.from({ length: item.plannedSessions }, (_, index) => index + 1).map((session) => (
                <option key={session} value={session}>
                  Sesión {session} de {item.plannedSessions}
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
            <span>Objetivo de la próxima sesión</span>
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

        <ScheduleValidationMessage validation={validationWithAction} />

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

function formatMonthLabel(value) {
  try {
    return new Intl.DateTimeFormat("es-CL", {
      month: "long",
      year: "numeric"
    }).format(new Date(value));
  } catch {
    return "Mes seleccionado";
  }
}

function addMonths(value, amount) {
  const date = new Date(value);
  date.setMonth(date.getMonth() + amount);
  return getWeekStartDate(date);
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
