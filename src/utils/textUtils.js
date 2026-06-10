export function normalizeText(text = "") {
  const normalized = String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:()[\]{}"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalizeInformalSpanish(normalized);
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

function normalizeInformalSpanish(text) {
  const replacements = {
    pq: ["por", "que"],
    xq: ["por", "que"],
    q: ["que"],
    k: ["que"],
    incomdo: ["incomodo"],
    incomoda: ["incomoda"],
    incomodo: ["incomodo"],
    asi: ["asi"]
  };

  return text
    .split(/\s+/)
    .flatMap((word) => replacements[word] || [word])
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
