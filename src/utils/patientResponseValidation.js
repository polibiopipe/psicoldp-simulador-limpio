// Brevity and hesitation are valid patient responses. Retry only on evidence
// of truncation, not a minimum number of words.
const DANGLING_WORDS = new Set(["porque", "aunque", "pero", "para", "con", "de", "del", "que", "y", "o", "un", "una", "el", "la", "los", "las"]);

export function isIncompletePatientResponse(text, finishReason) {
  if (String(finishReason || "").toUpperCase() === "MAX_TOKENS") return true;
  const trimmed = String(text || "").trim().replace(/[)"'”’»\]]+$/g, "").trim();
  if (!trimmed || !/[\p{L}\p{N}]/u.test(trimmed)) return true;
  if (/[.!?…]$/.test(trimmed)) return false;
  if (/[,;:]$/.test(trimmed)) return true;
  const lastWord = trimmed.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/[a-z]+$/)?.[0];
  return DANGLING_WORDS.has(lastWord);
}
