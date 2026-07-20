import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  SESSION_DURATION_MINUTES,
  getRemainingSessionTime,
  startSessionUsageWindow
} from "../src/engine/simulationUsagePolicy.js";

const now = new Date("2026-07-19T16:00:00.000Z");
const startedAt = new Date(now.getTime() - 12 * 60 * 1000).toISOString();
const resumedAppointment = {
  id: "appointment-resume-auth",
  userId: "user-1",
  caseId: "nicolas",
  caseName: "Nicolas",
  sessionNumber: 1,
  status: "in_progress",
  startedAt,
  endsAt: new Date(new Date(startedAt).getTime() + SESSION_DURATION_MINUTES * 60 * 1000).toISOString(),
  durationMinutes: SESSION_DURATION_MINUTES
};

const remainingAfterReload = getRemainingSessionTime(resumedAppointment, now);
assert.ok(
  remainingAfterReload <= 33 * 60 * 1000 && remainingAfterReload > 32 * 60 * 1000,
  "una sesion vigente con 12 minutos consumidos debe reanudar cerca de 33 minutos, no 45"
);

const hydrated = startSessionUsageWindow(resumedAppointment, now);
assert.equal(hydrated.startedAt, startedAt, "reanudar una sesion vigente conserva el startedAt original");
assert.equal(
  getRemainingSessionTime(hydrated, now),
  remainingAfterReload,
  "hidratar una sesion vigente no reinicia el reloj"
);

const appSource = readFileSync(resolve(process.cwd(), "src/App.jsx"), "utf8");
const appointmentsSource = readFileSync(resolve(process.cwd(), "src/engine/simulationAppointments.js"), "utf8");
const apiSource = readFileSync(resolve(process.cwd(), "api/gemini-patient-response.js"), "utf8");
const responseEngineSource = readFileSync(resolve(process.cwd(), "src/utils/responseEngine.js"), "utf8");

assert.match(appSource, /getFreshAuthSessionForSimulation/, "App valida la sesion Supabase antes de usar el chat");
assert.match(appSource, /resolveResumeAppointmentForRecord/, "App valida appointmentId antes de mostrar una sesion retomada");
assert.match(appSource, /activeAppointmentSnapshot/, "App conserva una cita hidratada antes de que React actualice el arreglo");
assert.match(appSource, /getSimulationAppointmentById/, "App puede recuperar una cita concreta desde Supabase al reanudar");
assert.match(appSource, /authSession:\s*currentAuthSession/, "la respuesta del avatar usa una sesion Supabase fresca");
assert.match(appointmentsSource, /getSimulationAppointmentById/, "existe carga segura de cita por id y usuario");

assert.match(apiSource, /APPOINTMENT_REQUIRED/, "el endpoint exige cita vinculada");
assert.match(apiSource, /APPOINTMENT_NOT_FOUND/, "el endpoint valida propiedad de la cita");
assert.match(apiSource, /APPOINTMENT_CASE_MISMATCH/, "el endpoint valida caso de la cita");
assert.match(apiSource, /APPOINTMENT_SESSION_MISMATCH/, "el endpoint valida numero de sesion");
assert.match(apiSource, /APPOINTMENT_NOT_STARTED/, "el endpoint rechaza citas sin started_at persistido");
assert.match(apiSource, /SESSION_TIME_EXPIRED/, "el endpoint rechaza entrevistas cuyo tiempo expiro");
assert.match(apiSource, /getRemainingSessionTime/, "el endpoint calcula tiempo restante desde started_at persistido");
assert.match(responseEngineSource, /\[responseEngine\] api validation failed/, "el frontend registra causa segura de rechazo API");

console.log("audit:session-resume-auth ok - reanudacion autenticada de sesiones vigentes verificada.");
