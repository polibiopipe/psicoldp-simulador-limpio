import React, { useMemo } from "react";
import {
  ArrowRight,
  CalendarClock,
  ClipboardCheck,
  FileText,
  Play,
  ShieldAlert,
  Target,
  UsersRound
} from "lucide-react";
import { buildClinicalAgendaItems, formatAgendaDate } from "../engine/clinicalAgenda.js";

export function ClinicalDashboard({
  cases,
  userEmail,
  onOpenCases,
  onOpenAgenda,
  onViewHistory,
  onPrepareCase,
  onStartSession
}) {
  const agendaItems = useMemo(() => buildClinicalAgendaItems(cases), [cases]);
  const activeItems = agendaItems.filter((item) => item.completedSessions > 0 || item.agendaEntry);
  const pendingNotes = agendaItems.filter((item) => item.noteStatus.status === "pending");
  const pendingTasks = agendaItems.filter((item) => item.task?.description);
  const riskItems = agendaItems.filter((item) => item.risk.status === "open");
  const nextItem =
    agendaItems.find((item) => item.nextSessionNumber && (item.completedSessions > 0 || item.agendaEntry)) ||
    agendaItems.find((item) => item.caseItem.id === "claudio") ||
    agendaItems[0];
  const featuredCases = orderFeaturedCases(cases).slice(0, 4);
  const firstName = getFriendlyUserName(userEmail);

  return (
    <section className="screen clinical-dashboard">
      <header className="dashboard-hero">
        <div>
          <span className="eyebrow">Panel clinico formativo</span>
          <h1>{firstName ? `Hola, ${firstName}` : "Inicio"}</h1>
          <p>
            Revisa continuidad, pacientes y pendientes antes de iniciar una nueva
            entrevista simulada.
          </p>
        </div>
        <div className="dashboard-hero-actions">
          <button className="primary-action" type="button" onClick={onOpenCases}>
            <UsersRound aria-hidden="true" />
            Ver pacientes
          </button>
          <button className="secondary-action" type="button" onClick={onOpenAgenda}>
            <CalendarClock aria-hidden="true" />
            Abrir agenda
          </button>
        </div>
      </header>

      <section className="dashboard-metrics" aria-label="Resumen del dia">
        <DashboardMetric icon={UsersRound} label="Pacientes activos" value={activeItems.length} />
        <DashboardMetric icon={CalendarClock} label="Sesiones por retomar" value={countNextSessions(agendaItems)} />
        <DashboardMetric icon={ClipboardCheck} label="Notas pendientes" value={pendingNotes.length} />
        <DashboardMetric icon={ShieldAlert} label="Riesgos por revisar" value={riskItems.length} />
      </section>

      <div className="dashboard-grid">
        <article className="dashboard-panel next-session-panel">
          <div className="dashboard-panel-heading">
            <div>
              <span className="eyebrow">Proxima accion</span>
              <h2>{nextItem ? nextItem.caseItem.name : "Selecciona un paciente"}</h2>
            </div>
            <CalendarClock aria-hidden="true" />
          </div>

          {nextItem ? (
            <>
              <div className="dashboard-patient-strip">
                <img src={nextItem.caseItem.image} alt={`Retrato ficticio de ${nextItem.caseItem.name}`} />
                <div>
                  <strong>{nextItem.nextSessionLabel}</strong>
                  <span>{formatAgendaDate(nextItem.agendaEntry)}</span>
                </div>
              </div>
              <dl className="dashboard-clinical-summary">
                <div>
                  <dt>Estado</dt>
                  <dd>{nextItem.processState}</dd>
                </div>
                <div>
                  <dt>Foco sugerido</dt>
                  <dd>{nextItem.nextFocus}</dd>
                </div>
                <div>
                  <dt>Pendiente</dt>
                  <dd>{nextItem.task?.description || nextItem.noteStatus.label}</dd>
                </div>
              </dl>
              <div className="dashboard-panel-actions">
                <button
                  className="primary-action"
                  type="button"
                  onClick={() =>
                    nextItem.completedSessions > 0
                      ? onStartSession(nextItem.caseItem.id, nextItem.nextSessionNumber || 1)
                      : onPrepareCase(nextItem.caseItem.id, nextItem.nextSessionNumber || 1)
                  }
                >
                  <Play aria-hidden="true" />
                  {nextItem.completedSessions > 0 ? "Retomar sesion" : "Preparar caso"}
                </button>
                <button className="secondary-action" type="button" onClick={onOpenAgenda}>
                  Ver registro
                </button>
              </div>
            </>
          ) : (
            <p>No hay pacientes disponibles.</p>
          )}
        </article>

        <article className="dashboard-panel pending-panel">
          <div className="dashboard-panel-heading">
            <div>
              <span className="eyebrow">Actividad pendiente</span>
              <h2>Trabajo clinico</h2>
            </div>
            <Target aria-hidden="true" />
          </div>
          <div className="pending-list">
            <PendingItem
              label="Notas clinicas"
              value={pendingNotes.length ? `${pendingNotes.length} por completar` : "Sin pendientes"}
              tone={pendingNotes.length ? "warning" : "ok"}
            />
            <PendingItem
              label="Tareas asignadas"
              value={pendingTasks.length ? `${pendingTasks.length} por revisar` : "Sin tareas abiertas"}
              tone={pendingTasks.length ? "warning" : "ok"}
            />
            <PendingItem
              label="Riesgo"
              value={riskItems.length ? `${riskItems.length} caso(s) a revisar` : "Sin alertas abiertas"}
              tone={riskItems.length ? "risk" : "ok"}
            />
          </div>
        </article>

        <article className="dashboard-panel patients-panel">
          <div className="dashboard-panel-heading">
            <div>
              <span className="eyebrow">Pacientes simulados</span>
              <h2>Casos para practicar</h2>
            </div>
            <UsersRound aria-hidden="true" />
          </div>
          <div className="dashboard-patient-list">
            {featuredCases.map((caseItem) => (
              <button key={caseItem.id} type="button" onClick={() => onPrepareCase(caseItem.id, 1)}>
                <img src={caseItem.image} alt={`Retrato ficticio de ${caseItem.name}`} />
                <span>
                  <strong>{caseItem.name}</strong>
                  <small>{caseItem.shortTitle}</small>
                </span>
                <ArrowRight aria-hidden="true" />
              </button>
            ))}
          </div>
          <button className="secondary-action dashboard-wide-action" type="button" onClick={onOpenCases}>
            Ver todos los pacientes
          </button>
        </article>

        <article className="dashboard-panel progress-panel">
          <div className="dashboard-panel-heading">
            <div>
              <span className="eyebrow">Continuidad</span>
              <h2>Sesiones y evaluacion</h2>
            </div>
            <FileText aria-hidden="true" />
          </div>
          <p>
            Revisa sesiones guardadas, retroalimentacion y decisiones sobre continuidad
            del proceso.
          </p>
          <button className="secondary-action" type="button" onClick={onViewHistory}>
            Abrir sesiones guardadas
            <ArrowRight aria-hidden="true" />
          </button>
        </article>
      </div>
    </section>
  );
}

function DashboardMetric({ icon: Icon, label, value }) {
  return (
    <article>
      <Icon aria-hidden="true" />
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function PendingItem({ label, value, tone }) {
  return (
    <div className={`pending-item ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getFriendlyUserName(email = "") {
  const name = String(email).split("@")[0] || "";
  return name ? name.replace(/[._-]+/g, " ").split(" ")[0] : "";
}

function countNextSessions(items) {
  return items.filter((item) => item.nextSessionNumber && (item.completedSessions > 0 || item.agendaEntry)).length;
}

function orderFeaturedCases(cases) {
  const preferred = ["claudio", "marcos", "camila", "tomas"];
  return [...cases].sort((a, b) => {
    const aIndex = preferred.indexOf(a.id);
    const bIndex = preferred.indexOf(b.id);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
}
