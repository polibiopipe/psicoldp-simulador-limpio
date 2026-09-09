export const SIMULATORS = [
  { id: "escucha-viva", name: "Escucha Viva · Psicología", url: "https://psicoldp-simulador-limpio.vercel.app/" },
  { id: "umbral-primera-infancia", name: "Umbral Docente · Primera Infancia", url: "https://psicoldp.org/umbral/" }
];
const PENDING_KEY = "psicoldp:registration-choice";
let memoryChoice = null;
const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
export const isSimulator = (id) => SIMULATORS.some((item) => item.id === id);

export function registrationSimulator() {
  const id = new URLSearchParams(globalThis.location?.search || "").get("registro");
  return isSimulator(id) ? id : null;
}

// A form preference, never an access grant. The database accepts only one
// first enrollment for a verified student and preserves existing assignments.
export function rememberSimulatorChoice(email, simulatorId) {
  if (!isSimulator(simulatorId)) throw new Error("Elige un simulador válido.");
  memoryChoice = { email: normalizeEmail(email), simulatorId, expiresAt: Date.now() + 7 * 86400000 };
  try { globalThis.localStorage?.setItem(PENDING_KEY, JSON.stringify(memoryChoice)); } catch { /* memory fallback */ }
}

export function pendingSimulatorChoice(email) {
  let saved = memoryChoice;
  try { saved = JSON.parse(globalThis.localStorage?.getItem(PENDING_KEY) || "null") || saved; } catch { /* memory fallback */ }
  return saved?.email === normalizeEmail(email) && saved.expiresAt > Date.now() && isSimulator(saved.simulatorId)
    ? saved.simulatorId : null;
}

export function clearSimulatorChoice(email) {
  if (!pendingSimulatorChoice(email)) return;
  memoryChoice = null;
  try { globalThis.localStorage?.removeItem(PENDING_KEY); } catch { /* memory fallback */ }
}

export async function enrollInSimulator(client, user, simulatorId) {
  if (!user?.id || !isSimulator(simulatorId)) throw new Error("Elige un simulador para continuar.");
  const { data, error } = await client.rpc("enroll_in_simulator", { requested_simulator: simulatorId, expected_user_id: user.id });
  if (error) throw new Error(error.code === "42501"
    ? "Confirma tu correo antes de activar el acceso. Si tu cuenta está suspendida, contacta al equipo."
    : "No pudimos guardar tu elección. Revisa la conexión e inténtalo nuevamente.");
  if (data?.user_id !== user.id || !isSimulator(data.simulator_id) || typeof data.enabled !== "boolean") {
    throw new Error("No pudimos verificar el simulador asignado.");
  }
  clearSimulatorChoice(user.email);
  return data;
}

export async function resolveSimulatorAssignment(client, user) {
  const { data, error } = await client.from("simulator_access")
    .select("user_id,simulator_id,enabled").eq("user_id", user.id).maybeSingle();
  if (error) throw error;
  if (data) {
    if (data.user_id !== user.id || !isSimulator(data.simulator_id)) throw new Error("Asignación inválida.");
    clearSimulatorChoice(user.email);
    return data;
  }
  const choice = pendingSimulatorChoice(user.email);
  return choice && user.email_confirmed_at ? enrollInSimulator(client, user, choice) : null;
}
