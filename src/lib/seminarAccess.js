const SEMINAR_ACCESS_EMAILS = new Set([
  "polibio.solis@nucleovivo.net",
  "leyla.llanos@nucleovivo.net",
  "daniel.toledo@nucleovivo.net"
]);

export function canAccessSeminarRoute(email) {
  return SEMINAR_ACCESS_EMAILS.has(String(email || "").trim().toLowerCase());
}
