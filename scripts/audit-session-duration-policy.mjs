import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  MAX_STUDENT_TURNS,
  SESSION_DURATION_MINUTES,
  SESSION_END_REASONS,
  buildSessionUsageMetrics,
  getRemainingSessionTime,
  getRemainingTurns,
  getSessionTimingState,
  resolveSessionEndReason
} from "../src/engine/simulationUsagePolicy.js";

const startedAt = "2026-08-01T10:00:00.000Z";
const appointment = {
  id: "duration-policy-appointment",
  status: "in_progress",
  startedAt,
  durationMinutes: SESSION_DURATION_MINUTES
};

function atElapsed(minutes, seconds = 0) {
  return new Date(new Date(startedAt).getTime() + (minutes * 60 + seconds) * 1000);
}

function createHistory(turnCount) {
  return Array.from({ length: turnCount }, (_, index) => ({
    id: `turn-${index + 1}`,
    question: `Pregunta ${index + 1}`,
    answer: `Respuesta ${index + 1}`
  }));
}

assert.equal(MAX_STUDENT_TURNS, 60, "el tope técnico debe ser de 60 intervenciones");
assert.equal(getRemainingTurns(createHistory(24)), 36, "24 intervenciones no deben cerrar la sesión");
assert.equal(getRemainingTurns(createHistory(59)), 1, "la intervención 60 todavía debe poder realizarse");
assert.equal(getRemainingTurns(createHistory(60)), 0, "el bloqueo técnico comienza después de 60 intervenciones completas");

const beforeClosing = getSessionTimingState(appointment, atElapsed(34, 59));
assert.equal(beforeClosing.canContinueInterview, true, "antes del minuto 35 se puede continuar");
assert.equal(beforeClosing.closureSuggested, false, "antes del minuto 35 no se fuerza la sugerencia de cierre");

const closingSuggested = getSessionTimingState(appointment, atElapsed(35));
assert.equal(closingSuggested.canContinueInterview, true, "desde el minuto 35 todavía se puede intervenir");
assert.equal(closingSuggested.closureSuggested, true, "desde el minuto 35 se sugiere el cierre");
assert.equal(closingSuggested.closureUrgent, false, "a los 35 minutos el cierre aún no es urgente");

const closingUrgent = getSessionTimingState(appointment, atElapsed(40));
assert.equal(closingUrgent.canContinueInterview, true, "a los 40 minutos todavía se permite una intervención final");
assert.equal(closingUrgent.closureUrgent, true, "a los 40 minutos se debe advertir el inicio del cierre");

const finalMinute = getSessionTimingState(appointment, atElapsed(44));
assert.equal(finalMinute.canContinueInterview, true, "la escritura no se bloquea antes del minuto 45");

const expired = getSessionTimingState(appointment, atElapsed(45));
assert.equal(expired.canContinueInterview, false, "a los 45 minutos se bloquean nuevas intervenciones");
assert.equal(expired.timeExpired, true, "a los 45 minutos la sesión queda expirada");

const resumedAt = atElapsed(22, 42);
assert.equal(
  getRemainingSessionTime(appointment, resumedAt),
  (22 * 60 + 18) * 1000,
  "una sesión retomada conserva el tiempo consumido"
);
assert.equal(
  getSessionTimingState(appointment, resumedAt).canContinueInterview,
  true,
  "una sesión retomada vigente puede continuar"
);

assert.equal(
  resolveSessionEndReason({ sessionOrAppointment: appointment, history: createHistory(24), now: resumedAt }),
  SESSION_END_REASONS.VOLUNTARY,
  "terminar con 24 intervenciones y tiempo disponible se registra como cierre voluntario"
);
assert.equal(
  resolveSessionEndReason({ sessionOrAppointment: appointment, history: createHistory(24), now: atElapsed(45) }),
  SESSION_END_REASONS.MAXIMUM_TIME,
  "llegar a 45 minutos se registra como tiempo máximo"
);
assert.equal(
  resolveSessionEndReason({ sessionOrAppointment: appointment, history: createHistory(60), now: resumedAt }),
  SESSION_END_REASONS.TECHNICAL_TURN_LIMIT,
  "alcanzar 60 intervenciones se registra como límite técnico"
);

const voluntaryMetrics = buildSessionUsageMetrics({
  startedAt,
  endedAt: resumedAt.toISOString(),
  durationMinutes: SESSION_DURATION_MINUTES,
  history: createHistory(24),
  endReason: SESSION_END_REASONS.VOLUNTARY
});
assert.equal(voluntaryMetrics.elapsedSeconds, 22 * 60 + 42, "se registra la duración real del cierre voluntario");
assert.equal(voluntaryMetrics.studentTurnCount, 24, "se registra el número real de intervenciones");
assert.equal(voluntaryMetrics.endReason, SESSION_END_REASONS.VOLUNTARY, "se registra el motivo de término");

const timeMetrics = buildSessionUsageMetrics({
  startedAt,
  endedAt: atElapsed(48).toISOString(),
  durationMinutes: SESSION_DURATION_MINUTES,
  history: createHistory(24),
  endReason: SESSION_END_REASONS.MAXIMUM_TIME
});
assert.equal(timeMetrics.elapsedSeconds, 45 * 60, "el tiempo máximo se registra en 45 minutos aunque el cierre se confirme después");

const simulationChatSource = readFileSync(resolve(process.cwd(), "src/components/SimulationChat.jsx"), "utf8");
const avatarViewSource = readFileSync(resolve(process.cwd(), "src/components/AvatarSessionView.jsx"), "utf8");
const endpointSource = readFileSync(resolve(process.cwd(), "api/gemini-patient-response.js"), "utf8");
const appSource = readFileSync(resolve(process.cwd(), "src/App.jsx"), "utf8");
const sessionHistorySource = readFileSync(resolve(process.cwd(), "src/engine/sessionHistory.js"), "utf8");

assert.match(simulationChatSource, /usageBlocked = timeExpired \|\| technicalTurnLimitReached/, "el chat solo bloquea por tiempo o límite técnico");
assert.match(simulationChatSource, /Puedes continuar mientras quede tiempo/, "24 turnos generan una orientación no bloqueante");
assert.match(simulationChatSource, /Quedan 10 minutos\./, "se conserva la advertencia del minuto 35");
assert.match(simulationChatSource, /Quedan 5 minutos\./, "se conserva la advertencia del minuto 40");
assert.match(simulationChatSource, /Queda 1 minuto\./, "se conserva la advertencia del minuto 44");
assert.match(avatarViewSource, /sessionStartedAt/, "el reloj visual usa el inicio persistido al retomar");
assert.match(endpointSource, /countCompletedStudentTurns\(sessionRecord\.conversation \|\| \[\]\) >= MAX_STUDENT_TURNS/, "el endpoint respeta el tope técnico de 60");
assert.match(appSource, /endReason/, "App conserva el motivo de término hasta guardar la sesión");
assert.match(appSource, /endedAt/, "App conserva la hora real de término hasta guardar la sesión");
assert.match(sessionHistorySource, /buildSessionUsageMetrics/, "el historial calcula métricas de uso al guardar");
assert.match(sessionHistorySource, /sessionMetrics: record\.sessionMetrics/, "las métricas se persisten en el JSON de feedback existente");

console.log("audit:session-duration-policy ok - tiempo principal, 24 turnos no bloqueantes y cierre trazable verificados.");
