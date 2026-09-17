const AUTHORIZED_EMAILS = new Set([
  "polibio.solis@nucleovivo.net",
  "leyla.llanos@nucleovivo.net",
  "daniel.toledo@nucleovivo.net"
]);

export function isAuthorizedSeminarEmail(email) {
  return AUTHORIZED_EMAILS.has(String(email || "").trim().toLowerCase());
}
