export function normalizeText(text = "") {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:()[\]{}"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function includesAny(text, terms) {
  const normalized = normalizeText(text);
  return terms.some((term) => normalized.includes(normalizeText(term)));
}

export function hasWord(text, word) {
  return new RegExp(`\\b${normalizeText(word)}\\b`).test(normalizeText(text));
}

export function opennessLevel(trustLevel = 40) {
  if (trustLevel <= 35) return "apertura_baja";
  if (trustLevel <= 70) return "apertura_media";
  return "apertura_alta";
}

export function getTrustStage(trustLevel = 40) {
  if (trustLevel <= 25) return "closed";
  if (trustLevel <= 50) return "cautious";
  if (trustLevel <= 75) return "open";
  return "reflective";
}

export function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}
