import React, { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { loadResearchContext, loadStatistics, setResearchConsent } from "../lib/researchData.js";
import { filterStatistics, median, statisticsCsv, STATUS_LABELS, summarizeStatistics } from "../engine/researchStatistics.js";
import "./statistics.css";

const blankFilters = { from: "", to: "", caseId: "", participant: "", sessionNumber: "", status: "" };
const display = (value, digits = 1) => value === null || value === undefined
  ? "Sin registro" : new Intl.NumberFormat("es-CL", { maximumFractionDigits: digits }).format(value);

export function StatisticsDashboard({ authSession, cases = [] }) {
  const [scope, setScope] = useState("own");
  const [rows, setRows] = useState([]);
  const [context, setContext] = useState(null);
  const [contextError, setContextError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [filters, setFilters] = useState(blankFilters);
  const [page, setPage] = useState(0);
  const [consentChecked, setConsentChecked] = useState(false);
  const [savingConsent, setSavingConsent] = useState(false);
  const [consentMessage, setConsentMessage] = useState("");
  const userId = authSession?.user?.id;

  useEffect(() => {
    const controller = new AbortController();
    setContext(null);
    setContextError("");
    loadResearchContext(controller.signal).then((data) => {
      if (!controller.signal.aborted) setContext(data);
    }).catch((failure) => {
      if (!controller.signal.aborted) setContextError(failure.message);
    });
    return () => controller.abort();
  }, [userId, revision]);

  useEffect(() => {
    const controller = new AbortController();
    setRows([]);
    setError("");
    setLoading(true);
    loadStatistics({ userId, scope, signal: controller.signal }).then((data) => {
      if (!controller.signal.aborted) setRows(data);
    }).catch((failure) => {
      if (!controller.signal.aborted) setError(failure.message);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [userId, scope, revision]);

  const invalidDates = filters.from && filters.to && filters.from > filters.to;
  const filtered = useMemo(() => invalidDates ? [] : filterStatistics(rows, filters), [rows, filters, invalidDates]);
  const summary = useMemo(() => summarizeStatistics(filtered), [filtered]);
  const orderedRows = useMemo(() => [...summary.rows].sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id)), [summary.rows]);
  const bySession = useMemo(() => [...new Set(summary.rows.map((row) => row.sessionNumber))]
    .sort((a, b) => (a ?? Infinity) - (b ?? Infinity))
    .map((number) => {
      const group = summary.rows.filter((row) => row.sessionNumber === number);
      const measured = group.filter((row) => row.status === "completed" && row.automatedScore !== null);
      return { number, total: group.length, complete: group.filter((row) => row.status === "completed").length,
        participants: new Set(group.map((row) => row.participant)).size,
        scoreN: measured.length, score: median(measured.map((row) => row.automatedScore)) };
    }), [summary.rows]);

  function changeFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
    setPage(0);
  }
  function changeScope(next) {
    setRows([]);
    setLoading(true);
    setScope(next);
    setFilters(blankFilters);
    setPage(0);
  }
  function refresh() {
    setRows([]);
    setLoading(true);
    setPage(0);
    setRevision((value) => value + 1);
  }
  function downloadCsv() {
    const url = URL.createObjectURL(new Blob([statisticsCsv(orderedRows)], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `escucha-viva-${scope === "study" ? "estudio" : "mis-sesiones"}-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function saveConsent(accepted) {
    setSavingConsent(true);
    setConsentMessage("");
    try {
      const next = await setResearchConsent(accepted, context.protocolVersion);
      setContext(next);
      setConsentChecked(false);
      setConsentMessage(accepted ? "Decisión guardada. Se incluirán las nuevas sesiones que inicies desde ahora."
        : "Retiro registrado. Tus registros dejan de estar disponibles en el panel del estudio.");
      if (scope === "study") refresh();
    } catch (failure) { setConsentMessage(failure.message); }
    finally { setSavingConsent(false); }
  }
  const caseName = (id) => cases.find((item) => item.id === id)?.name || id || "Sin caso";
  const pageCount = Math.max(1, Math.ceil(orderedRows.length / 25));

  return (
    <section className="screen research-dashboard" aria-labelledby="statistics-heading">
      <header className="research-heading">
        <div><span className="eyebrow">Seguimiento de sesiones</span><h1 id="statistics-heading">Estadísticas</h1>
          <p>{scope === "study" ? "Registros del estudio identificados por códigos de participante." : "Revisa tus sesiones guardadas y descarga los registros para analizarlos."}</p></div>
        <div className="research-actions">
          <button className="secondary-action" type="button" onClick={refresh} disabled={loading}><RefreshCw aria-hidden="true" />Actualizar</button>
          <button className="primary-action" type="button" onClick={downloadCsv} disabled={loading || Boolean(error) || !orderedRows.length || Boolean(invalidDates)}><Download aria-hidden="true" />Descargar CSV · Excel</button>
        </div>
      </header>

      {(context?.canReview || scope === "study") && <div className="research-scopes" aria-label="Origen de las estadísticas">
        <button type="button" aria-pressed={scope === "own"} onClick={() => changeScope("own")}>Mis sesiones</button>
        {context?.canReview && <button type="button" aria-pressed={scope === "study"} onClick={() => changeScope("study")}>Estudio · equipo investigador</button>}
      </div>}
      {scope === "study" && !context?.enabled && context && <p className="research-notice">El registro para investigación está desactivado. No se incorporan participantes ni sesiones al estudio.</p>}

      <form className="research-filters" onSubmit={(event) => event.preventDefault()}>
        <label>Desde<input type="date" value={filters.from} onChange={(event) => changeFilter("from", event.target.value)} /></label>
        <label>Hasta<input type="date" value={filters.to} onChange={(event) => changeFilter("to", event.target.value)} /></label>
        <label>Caso<select value={filters.caseId} onChange={(event) => changeFilter("caseId", event.target.value)}><option value="">Todos los casos</option>{[...new Set(rows.map((row) => row.caseId))].sort().map((id) => <option key={id} value={id}>{caseName(id)}</option>)}</select></label>
        <label>Sesión<select value={filters.sessionNumber} onChange={(event) => changeFilter("sessionNumber", event.target.value)}><option value="">Todas</option>{[...new Set(rows.map((row) => row.sessionNumber))].filter((value) => value !== null).sort((a, b) => a - b).map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <label>Estado<select value={filters.status} onChange={(event) => changeFilter("status", event.target.value)}><option value="">Todos</option>{Object.entries(STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        {scope === "study" && <label>Participante<select value={filters.participant} onChange={(event) => changeFilter("participant", event.target.value)}><option value="">Todos los códigos</option>{[...new Set(rows.map((row) => row.participant))].sort().map((value) => <option key={value} value={value}>{value}</option>)}</select></label>}
        <button className="text-action" type="button" onClick={() => { setFilters(blankFilters); setPage(0); }}>Limpiar filtros</button>
      </form>
      <p className="research-caption">Fechas de Chile continental · la descarga incluye todos los registros filtrados.</p>
      {invalidDates && <p role="alert" className="research-notice">La fecha inicial debe ser anterior o igual a la final.</p>}
      {loading && <p role="status" className="research-empty">Cargando registros…</p>}
      {error && <p role="alert" className="research-notice">{error}</p>}
      {!loading && !error && !invalidDates && <>
        <div className="research-metrics">
          <Metric label="Sesiones registradas" value={summary.total} note={scope === "study" ? `${summary.participants} participantes con sesiones` : "Registros únicos de tu cuenta"} />
          <Metric label="Completadas" value={summary.completed} note={summary.total ? `${display(summary.completionPercent)} % de los registros filtrados` : "Sin sesiones en este período"} />
          <Metric label="Cierre pendiente" value={summary.pending} note={`${summary.inProgress} sesiones en curso`} />
          <Metric label="Duración mediana" value={summary.medianDurationMinutes === null ? "—" : `${display(summary.medianDurationMinutes)} min`} note={`${summary.durationN} de ${summary.total} registros con duración de entrevista cerrada`} />
        </div>
        {!orderedRows.length ? <div className="research-empty"><h2>Aún no hay registros para esta selección</h2><p>{scope === "study" ? "Aquí aparecerán las sesiones nuevas de quienes acepten participar cuando el estudio esté habilitado." : "Ajusta los filtros o vuelve después de guardar una sesión en tu cuenta."}</p></div> : <>
          <div className="research-table-wrap" tabIndex={0} role="region" aria-label="Resumen por número de sesión">
            <table><caption>Seguimiento por número de sesión</caption><thead><tr><th>Sesión</th><th>Registros</th><th>Participantes</th><th>Completadas</th><th>Puntaje automático · mediana</th><th>Con puntaje</th></tr></thead>
              <tbody>{bySession.map((group) => <tr key={group.number ?? "missing"}><th>{group.number ?? "Sin registro"}</th><td>{group.total}</td><td>{group.participants}</td><td>{group.complete}</td><td>{display(group.score)}</td><td>{group.scoreN}</td></tr>)}</tbody></table>
          </div>
          <p className="research-caption">Cada sesión puede incluir participantes o casos diferentes. Esta tabla es descriptiva y no calcula una mejora pre/post.</p>
          <div className="research-table-wrap" tabIndex={0} role="region" aria-label="Detalle de sesiones">
            <table><caption>Registros filtrados · {orderedRows.length}</caption><thead><tr>{scope === "study" && <th>Código de participante</th>}<th>Fecha</th><th>Caso</th><th>Sesión</th><th>Estado</th><th>Minutos</th><th>Turnos</th></tr></thead>
              <tbody>{orderedRows.slice(page * 25, page * 25 + 25).map((row) => <tr key={row.id}>{scope === "study" && <td className="research-code">{row.participant}</td>}<td>{row.date || "Sin registro"}</td><td>{caseName(row.caseId)}</td><td>{row.sessionNumber ?? "Sin registro"}</td><td>{STATUS_LABELS[row.status] || "Sin registro"}</td><td>{display(row.durationSeconds === null ? null : row.durationSeconds / 60)}</td><td>{display(row.turns, 0)}</td></tr>)}</tbody></table>
          </div>
          <div className="research-pagination"><button className="secondary-action" type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>Anterior</button><span>Página {page + 1} de {pageCount}</span><button className="secondary-action" type="button" disabled={page + 1 >= pageCount} onClick={() => setPage((value) => value + 1)}>Siguiente</button></div>
        </>}
        <aside className="research-method"><h2>Qué permiten observar estos datos</h2>
          <p>La duración es tiempo transcurrido dentro de la ventana de entrevista; no mide atención activa. Los turnos cuentan intercambios completos. Una sesión en curso o sin cierre no equivale a abandono.</p>
          <p>El puntaje automático y la apertura del personaje son indicadores exploratorios del simulador. Para estudiar razonamiento profesional, metacognición y transferencia deben complementarse con tareas, rúbricas e instrumentos definidos para la tesis.</p>
          <p>Los valores faltantes se exportan vacíos. {summary.missingTurns} registros sin dato de turnos; {summary.legacy} registros anteriores al versionado de mediciones. El CSV excluye nombres, correos y conversaciones.</p>
        </aside>
      </>}
      {contextError && <p className="research-caption" role="status">{contextError}</p>}
      {context && (context.enabled || context.hasConsent) && <section className="research-participation" aria-labelledby="participation-heading">
        <h2 id="participation-heading">Participación en el estudio</h2>
        {context.enabled && <><p>Versión del consentimiento: {context.protocolVersion}</p><div className="research-information">{context.information}</div></>}
        {context.currentConsent ? <p>Tu aceptación está registrada. Las nuevas sesiones elegibles se vinculan a un código de participante.</p>
          : context.hasConsent ? <p>El protocolo cambió. Tu aceptación anterior no habilita el registro bajo la nueva versión.</p> : null}
        {context.enabled && !context.currentConsent && <><label className="research-check"><input type="checkbox" checked={consentChecked} onChange={(event) => setConsentChecked(event.target.checked)} />He leído la información y acepto participar voluntariamente.</label><button className="primary-action" type="button" disabled={!consentChecked || savingConsent} onClick={() => saveConsent(true)}>Guardar mi decisión</button></>}
        {context.hasConsent && <button className="secondary-action" type="button" disabled={savingConsent} onClick={() => saveConsent(false)}>Retirar mi participación</button>}
        <p className="research-caption">Puedes seguir practicando si no participas. El retiro excluye tus registros de futuras consultas y descargas del panel; el equipo debe gestionar las copias ya descargadas según el protocolo.</p>
        {consentMessage && <p role="status">{consentMessage}</p>}
      </section>}
    </section>
  );
}

function Metric({ label, value, note }) {
  return <article><h2>{label}</h2><strong>{value}</strong><p>{note}</p></article>;
}
