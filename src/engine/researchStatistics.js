// Operational measurements. Automated feedback is not a validated learning measure.
export const STATISTICS_VERSION = "usage-v1";
export const STATUS_LABELS = {
  completed: "Completada",
  closure_pending: "Cierre pendiente",
  in_progress: "En curso"
};
const validEndReasons = new Set(["voluntary_closure", "maximum_time", "technical_turn_limit"]);

export function numberOrMissing(value, maximum = Infinity) {
  if ((typeof value !== "number" && typeof value !== "string") || String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= maximum ? number : null;
}

export function normalizeStatisticsRow(row) {
  const metrics = row.metrics || {};
  const closed = ["completed", "closure_pending"].includes(row.status);
  const hasStart = Boolean(row.started_at) && Number.isFinite(Date.parse(row.started_at));
  const endReason = validEndReasons.has(metrics.endReason) ? metrics.endReason : "";
  return {
    id: row.id,
    participant: row.participant_code || "MI-REGISTRO",
    caseId: String(row.case_id || ""),
    sessionNumber: numberOrMissing(row.session_number),
    date: chileDateKey(row.started_at || row.created_at),
    status: STATUS_LABELS[row.status] ? row.status : "unknown",
    durationSeconds: closed && hasStart && endReason
      ? numberOrMissing(metrics.elapsedSeconds, 24 * 60 * 60) : null,
    turns: numberOrMissing(metrics.studentTurnCount, 10000),
    automatedScore: row.status === "completed" ? numberOrMissing(row.general_score, 100) : null,
    simulatedOpenness: row.status === "completed" ? numberOrMissing(row.openness, 100) : null,
    endReason,
    measurementVersion: row.measurement_version || "legacy",
    consentVersion: row.consent_version || ""
  };
}

export function chileDateKey(value) {
  if (!value || !Number.isFinite(Date.parse(value))) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(new Date(value));
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function filterStatistics(rows, filters = {}) {
  return rows.filter((row) =>
    (!filters.from || (row.date && row.date >= filters.from)) &&
    (!filters.to || (row.date && row.date <= filters.to)) &&
    (!filters.caseId || row.caseId === filters.caseId) &&
    (!filters.participant || row.participant === filters.participant) &&
    (!filters.sessionNumber || String(row.sessionNumber) === filters.sessionNumber) &&
    (!filters.status || row.status === filters.status)
  );
}

export function median(values) {
  const sorted = values.filter((value) => typeof value === "number" && Number.isFinite(value)).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function summarizeStatistics(rows) {
  // Re-saves of the same session never create additional observations.
  const unique = [...new Map(rows.map((row) => [row.id, row])).values()];
  const completed = unique.filter((row) => row.status === "completed");
  const durations = unique.map((row) => row.durationSeconds).filter((value) => value !== null);
  const scores = completed.map((row) => row.automatedScore).filter((value) => value !== null);
  return {
    rows: unique,
    total: unique.length,
    participants: new Set(unique.map((row) => row.participant)).size,
    completed: completed.length,
    pending: unique.filter((row) => row.status === "closure_pending").length,
    inProgress: unique.filter((row) => row.status === "in_progress").length,
    completionPercent: unique.length ? 100 * completed.length / unique.length : null,
    medianDurationMinutes: durations.length ? median(durations) / 60 : null,
    durationN: durations.length,
    medianAutomatedScore: median(scores),
    scoreN: scores.length,
    missingTurns: unique.filter((row) => row.turns === null).length,
    legacy: unique.filter((row) => row.measurementVersion === "legacy").length
  };
}

const csvFields = [
  ["codigo_participante", "participant"], ["codigo_registro", "id"],
  ["caso", "caseId"], ["numero_sesion", "sessionNumber"],
  ["fecha_chile", "date"], ["estado", "status"],
  ["duracion_transcurrida_segundos", "durationSeconds"], ["turnos_completados", "turns"],
  ["puntaje_automatico_exploratorio", "automatedScore"],
  ["apertura_simulada_exploratoria", "simulatedOpenness"], ["motivo_cierre", "endReason"],
  ["version_medicion", "measurementVersion"], ["version_consentimiento", "consentVersion"]
];

export function statisticsCsv(rows) {
  const cell = (value) => {
    let safe = value === null || value === undefined ? "" : String(value);
    // CSV quoting alone does not prevent spreadsheet formula execution.
    if (/^[\s\u0000-\u001f]*[=+@-]/.test(safe)) safe = `'${safe}`;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  return "\uFEFF" + [csvFields.map(([label]) => cell(label)).join(";"),
    ...rows.map((row) => csvFields.map(([, key]) => cell(row[key])).join(";"))
  ].join("\r\n");
}
