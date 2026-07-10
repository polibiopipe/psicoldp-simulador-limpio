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
  sessionRecords = [],
  userEmail,
  onOpenCases,
  onOpenAgenda,
  onViewHistory,
  onPrepareCase,
  onStartSession
}) {
  const agendaItems = useMemo(() => buildClinicalAgendaItems(cases), [cases]);
  const draftSessionItems = useMemo(
    () => buildDraftSessionItems({ sessionRecords, cases, agendaItems }),
    [sessionRecords, cases, agendaItems]
  );
  const agendaActiveItems = agendaItems.filter((item) => item.completedSessions > 0 || item.agendaEntry);
  const activeItems = [
    ...draftSessionItems,
    ...agendaActiveItems.filter((item) => !draftSessionItems.some((draft) => draft.caseItem.id === item.caseItem.id))
  ];
  const pendingNotes = agendaItems.filter((item) => item.noteStatus.status === "pending");
  const pendingTasks = agendaItems.filter((item) => item.task?.description);
  const riskItems = agendaItems.filter((item) => item.risk.status === "open");
  const resumableSessions = [
    ...draftSessionItems,
    ...agendaItems.filter((item) => !draftSessionItems.some((draft) => draft.caseItem.id === item.caseItem.id) && isResumableSession(item))
  ];
  const nextItem =
    draftSessionItems[0] ||
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
        <DashboardMetric
          icon={UsersRound}
          label="Pacientes activos"
          value={activeItems.length}
          actionLabel="Ver agenda"
          onClick={activeItems.length ? () => onOpenAgenda?.() : null}
        />
        <DashboardMetric
          icon={CalendarClock}
          label="Sesiones por retomar"
          value={resumableSessions.length}
          actionLabel="Ver sesiones"
          onClick={
            resumableSessions.length
              ? () => openItemSession({ item: resumableSessions[0], onPrepareCase, onStartSession })
              : null
          }
        />
        <DashboardMetric
          icon={ClipboardCheck}
          label="Notas pendientes"
          value={pendingNotes.length}
          actionLabel="Ver notas"
          onClick={pendingNotes.length ? () => onOpenAgenda?.(pendingNotes[0].caseItem.id) : null}
        />
        <DashboardMetric
          icon={ShieldAlert}
          label="Riesgos por revisar"
          value={riskItems.length}
          actionLabel="Revisar"
          onClick={riskItems.length ? () => onOpenAgenda?.(riskItems[0].caseItem.id) : null}
        />
      </section>

      <div className="dashboard-grid">
        <article className="dashboard-panel next-session-panel">
          <div className="dashboard-panel-heading">
            <div>
              <span className="eyebrow">Próxima acción</span>
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
                  onClick={() => openItemSession({ item: nextItem, onPrepareCase, onStartSession })}
                >
                  <Play aria-hidden="true" />
                  {nextItem.draftRecord?.status === "closure_pending"
                    ? "Registrar cierre"
                    : nextItem.draftRecord || nextItem.completedSessions > 0
                      ? "Retomar sesion"
                      : "Preparar caso"}
                </button>
                <button className="secondary-action" type="button" onClick={() => onOpenAgenda?.(nextItem.caseItem.id)}>
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
            <PendingGroup
              title="Sesiones por retomar"
              items={resumableSessions}
              emptyText="Sin sesiones por retomar"
              renderItem={(item) => (
                <PendingActionItem
                  key={`${item.caseItem.id}-session`}
                  item={item}
                  tone="session"
                  typeLabel="Sesion por retomar"
                  detail={item.nextFocus}
                  actionLabel={item.draftRecord?.status === "closure_pending"
                    ? "Registrar cierre"
                    : item.draftRecord || item.completedSessions > 0
                      ? "Retomar sesion"
                      : "Preparar caso"}
                  onAction={() => openItemSession({ item, onPrepareCase, onStartSession })}
                  onOpenRecord={() => onOpenAgenda?.(item.caseItem.id)}
                />
              )}
            />
            <PendingGroup
              title="Notas clinicas"
              items={pendingNotes}
              emptyText="Sin notas pendientes"
              renderItem={(item) => (
                <PendingActionItem
                  key={`${item.caseItem.id}-note`}
                  item={item}
                  tone="warning"
                  typeLabel="Nota clinica pendiente"
                  detail={item.noteStatus.label}
                  actionLabel="Ver registro"
                  onAction={() => onOpenAgenda?.(item.caseItem.id)}
                  onOpenRecord={() => onOpenAgenda?.(item.caseItem.id)}
                />
              )}
            />
            <PendingGroup
              title="Tareas asignadas"
              items={pendingTasks}
              emptyText="Sin tareas abiertas"
              renderItem={(item) => (
                <PendingActionItem
                  key={`${item.caseItem.id}-task`}
                  item={item}
                  tone="warning"
                  typeLabel="Tarea por revisar"
                  detail={item.task?.description}
                  actionLabel="Retomar sesion"
                  onAction={() => openItemSession({ item, onPrepareCase, onStartSession })}
                  onOpenRecord={() => onOpenAgenda?.(item.caseItem.id)}
                />
              )}
            />
            <PendingGroup
              title="Riesgo"
              items={riskItems}
              emptyText="Sin alertas abiertas"
              renderItem={(item) => (
                <PendingActionItem
                  key={`${item.caseItem.id}-risk`}
                  item={item}
                  tone="risk"
                  typeLabel="Riesgo por revisar"
                  detail={item.risk?.details || item.risk?.label}
                  actionLabel="Revisar riesgo"
                  onAction={() => openItemSession({ item, onPrepareCase, onStartSession })}
                  onOpenRecord={() => onOpenAgenda?.(item.caseItem.id)}
                />
              )}
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

function DashboardMetric({ icon: Icon, label, value, actionLabel, onClick }) {
  const content = (
    <>
      <Icon aria-hidden="true" />
      <strong>{value}</strong>
      <span>{label}</span>
      {onClick && <small>{actionLabel}</small>}
    </>
  );

  return onClick ? (
    <button className="dashboard-metric-card" type="button" onClick={onClick}>
      {content}
    </button>
  ) : (
    <article className="dashboard-metric-card">
      {content}
    </article>
  );
}

function PendingGroup({ title, items, emptyText, renderItem }) {
  return (
    <section className="pending-group" aria-label={title}>
      <div className="pending-group-heading">
        <span>{title}</span>
        <strong>{items.length}</strong>
      </div>
      {items.length ? (
        <div className="pending-action-list">
          {items.map(renderItem)}
        </div>
      ) : (
        <p className="pending-empty">{emptyText}</p>
      )}
    </section>
  );
}

function PendingActionItem({ item, tone, typeLabel, detail, actionLabel, onAction, onOpenRecord }) {
  return (
    <article className={`pending-action-item ${tone}`}>
      <div>
        <strong>{item.caseItem.name} - {getRelevantSessionLabel(item)}</strong>
        <span>{typeLabel}</span>
        {detail && <p>{detail}</p>}
      </div>
      <div className="pending-action-buttons">
        <button type="button" onClick={onAction}>
          {actionLabel}
        </button>
        <button type="button" onClick={onOpenRecord}>
          Registro
        </button>
      </div>
    </article>
  );
}

function getFriendlyUserName(email = "") {
  const name = String(email).split("@")[0] || "";
  return name ? name.replace(/[._-]+/g, " ").split(" ")[0] : "";
}

function isResumableSession(item) {
  return Boolean(item.nextSessionNumber && (item.completedSessions > 0 || item.agendaEntry));
}

function openItemSession({ item, onPrepareCase, onStartSession }) {
  if (item.draftRecord) {
    onStartSession?.(item.caseItem.id, item.nextSessionNumber || item.draftRecord.sessionNumber || 1);
    return;
  }
  const targetSession = item.nextSessionNumber || item.latestSummary?.sessionNumber || 1;
  if (item.completedSessions > 0 && item.nextSessionNumber) {
    onStartSession?.(item.caseItem.id, targetSession);
    return;
  }
  onPrepareCase?.(item.caseItem.id, targetSession);
}

function getRelevantSessionLabel(item) {
  const session = item.latestSummary?.sessionNumber || item.nextSessionNumber || item.completedSessions || 1;
  return `Sesion ${session}`;
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

function buildDraftSessionItems({ sessionRecords = [], cases = [], agendaItems = [] }) {
  const latestDrafts = new Map();
  for (const record of sessionRecords) {
    if (!isDraftSessionRecord(record)) continue;
    const key = `${record.caseId}:${record.sessionNumber || 1}`;
    const current = latestDrafts.get(key);
    const currentTime = current ? new Date(current.updatedAt || current.createdAt).getTime() : 0;
    const nextTime = new Date(record.updatedAt || record.createdAt).getTime();
    if (!current || nextTime >= currentTime) latestDrafts.set(key, record);
  }

  return Array.from(latestDrafts.values())
    .map((record) => {
      const caseItem = cases.find((candidate) => candidate.id === record.caseId);
      if (!caseItem) return null;
      const agendaItem = agendaItems.find((item) => item.caseItem.id === record.caseId);
      const sessionNumber = Number(record.sessionNumber) || 1;

      return {
        ...(agendaItem || {}),
        caseItem,
        draftRecord: record,
        latestSummary: record.sessionSummary || agendaItem?.latestSummary || null,
        completedSessions: agendaItem?.completedSessions || 0,
        plannedSessions: agendaItem?.plannedSessions || 4,
        nextSessionNumber: sessionNumber,
        nextSessionLabel: record.status === "closure_pending" ? `Sesion ${sessionNumber} con cierre pendiente` : `Sesion ${sessionNumber} en curso`,
        processState: record.status === "closure_pending" ? "Cierre pendiente" : "Sesion por retomar",
        noteStatus: agendaItem?.noteStatus || { status: "ok", label: "Sin nota pendiente" },
        task: agendaItem?.task || null,
        risk: agendaItem?.risk || { status: "closed", label: "Sin alertas abiertas" },
        nextFocus: record.status === "closure_pending"
          ? "Registrar decision clinica de cierre"
          : record.summary?.brief || "Continuar conversacion guardada",
        agendaEntry: agendaItem?.agendaEntry || null
      };
    })
    .filter(Boolean);
}

function isDraftSessionRecord(record) {
  return (
    ["in_progress", "closure_pending"].includes(record?.status) &&
    record.caseId &&
    Number(record.sessionNumber) >= 1 &&
    Array.isArray(record.conversationHistory) &&
    record.conversationHistory.length > 0
  );
}
