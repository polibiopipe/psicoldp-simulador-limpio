import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  SESSION_DURATION_MINUTES,
  getRemainingSessionTime,
  isSessionTimeExpired,
  isSessionUsableForPractice,
  startSessionUsageWindow
} from "../src/engine/simulationUsagePolicy.js";

const now = new Date("2026-07-19T14:00:00.000Z");
const baseAppointment = {
  id: "appointment-1",
  caseId: "claudio",
  caseName: "Claudio",
  sessionNumber: 1,
  scheduledFor: "2026-07-19T09:00:00",
  scheduledLocalDate: "2026-07-19",
  scheduledTime: "09:00",
  durationMinutes: SESSION_DURATION_MINUTES,
  status: "scheduled",
  startedAt: "",
  endsAt: "",
  createdAt: "2026-07-19T13:00:00.000Z",
  updatedAt: "2026-07-19T13:00:00.000Z"
};

const started = startSessionUsageWindow(baseAppointment, now);
assert.equal(started.status, "in_progress", "una sesión nueva queda en progreso");
assert.equal(started.startedAt, now.toISOString(), "una sesión nueva comienza con startedAt actual");
assert.equal(
  getRemainingSessionTime(started, now),
  SESSION_DURATION_MINUTES * 60 * 1000,
  "una sesión nueva comienza con duración completa"
);

const liveStartedAt = new Date(now.getTime() - 11 * 60 * 1000).toISOString();
const liveAppointment = {
  ...baseAppointment,
  id: "appointment-live",
  status: "in_progress",
  startedAt: liveStartedAt,
  endsAt: new Date(new Date(liveStartedAt).getTime() + SESSION_DURATION_MINUTES * 60 * 1000).toISOString()
};
const liveRecovered = startSessionUsageWindow(liveAppointment, new Date(now.getTime() + 60 * 1000));
assert.equal(liveRecovered.startedAt, liveStartedAt, "recuperar una sesión vigente no reinicia el reloj");
assert.ok(getRemainingSessionTime(liveRecovered, now) < SESSION_DURATION_MINUTES * 60 * 1000, "una sesión vigente conserva tiempo consumido");
assert.ok(isSessionUsableForPractice(liveAppointment, now), "una cita vigente sigue siendo reutilizable");

const expiredStartedAt = new Date(now.getTime() - (SESSION_DURATION_MINUTES + 1) * 60 * 1000).toISOString();
const expiredAppointment = {
  ...baseAppointment,
  id: "appointment-expired",
  status: "in_progress",
  startedAt: expiredStartedAt,
  endsAt: new Date(new Date(expiredStartedAt).getTime() + SESSION_DURATION_MINUTES * 60 * 1000).toISOString()
};
assert.equal(isSessionTimeExpired(expiredAppointment, now), true, "una cita vencida se detecta como expirada");
assert.equal(isSessionUsableForPractice(expiredAppointment, now), false, "una cita vencida no es reutilizable");
assert.equal(startSessionUsageWindow(expiredAppointment, now), null, "una nueva práctica no reutiliza startedAt vencido");

const simulationChatSource = readFileSync(resolve(process.cwd(), "src/components/SimulationChat.jsx"), "utf8");
const appointmentsSource = readFileSync(resolve(process.cwd(), "src/engine/simulationAppointments.js"), "utf8");
assert.match(appointmentsSource, /findReusableAppointmentForSession[\s\S]+isAppointmentReusableForPractice/, "ensure no recupera citas no reutilizables");
assert.match(appointmentsSource, /findActiveAppointmentForCase[\s\S]+isAppointmentReusableForPractice/, "el chat no trata citas vencidas como activas");
assert.match(simulationChatSource, /Quedan 10 minutos\./, "existe advertencia persistente de 10 minutos");
assert.match(simulationChatSource, /Quedan 5 minutos\./, "existe advertencia persistente de 5 minutos");
assert.match(simulationChatSource, /Queda 1 minuto\./, "existe advertencia persistente de 1 minuto");
assert.match(simulationChatSource, /La sesión finalizó por tiempo\./, "existe estado explícito de sesión finalizada por tiempo");
assert.match(simulationChatSource, /Continuar al cierre/, "la sesión expirada permite continuar al cierre");
assert.match(simulationChatSource, /Iniciar una nueva práctica/, "la sesión expirada permite iniciar nueva práctica");

console.log("audit:session-expiration ok - recuperación de sesiones expiradas verificada.");
