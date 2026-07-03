const ignoredWords = new Set([
  "a", "aca", "ahi", "al", "algo", "ante", "asi", "aunque", "cada", "como", "con", "cuando",
  "de", "del", "desde", "el", "ella", "ellos", "en", "entre", "era", "es", "esa", "ese", "eso",
  "esta", "estaba", "esto", "fue", "ha", "hasta", "hay", "la", "las", "le", "les", "lo", "los",
  "mas", "me", "mi", "mis", "mucho", "muy", "no", "o", "para", "pero", "por", "porque", "que",
  "se", "si", "sin", "sobre", "su", "sus", "tambien", "te", "tengo", "tiene", "todo", "un", "una",
  "uno", "unos", "ya", "yo", "creo", "siento", "decir", "digo", "forma", "cosa", "cosas"
]);

export function normalizeComparableText(text = "") {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function extractIdeaTokens(text = "") {
  return Array.from(new Set(
    normalizeComparableText(text)
      .split(/\s+/)
      .filter((word) => word.length >= 3 && !ignoredWords.has(word))
  ));
}

export function buildIdeaSignature(text = "") {
  return extractIdeaTokens(text).sort().join("|");
}

export function responseSimilarity(first = "", second = "") {
  const normalizedFirst = normalizeComparableText(first);
  const normalizedSecond = normalizeComparableText(second);
  if (!normalizedFirst || !normalizedSecond) return 0;
  if (normalizedFirst === normalizedSecond) return 1;

  const firstTokens = extractIdeaTokens(first);
  const secondTokens = extractIdeaTokens(second);
  if (!firstTokens.length || !secondTokens.length) return 0;

  const secondSet = new Set(secondTokens);
  const shared = firstTokens.filter((token) => secondSet.has(token)).length;
  const unionSize = new Set([...firstTokens, ...secondTokens]).size;
  const jaccard = unionSize ? shared / unionSize : 0;
  const containment = shared / Math.min(firstTokens.length, secondTokens.length);
  const phraseContainment = normalizedFirst.includes(normalizedSecond) || normalizedSecond.includes(normalizedFirst)
    ? 0.94
    : 0;

  return Math.max(jaccard, containment * 0.88, phraseContainment);
}

export function isSemanticallyRepeated(candidate, previousResponses = [], threshold = 0.68) {
  if (!candidate) return false;
  return previousResponses
    .filter(Boolean)
    .some((previous) => responseSimilarity(candidate, previous) >= threshold);
}

export function selectLeastSimilarCandidate(candidates = [], previousResponses = []) {
  if (!candidates.length) return null;

  return candidates
    .map((candidate) => ({
      candidate,
      score: previousResponses.length
        ? Math.max(...previousResponses.map((previous) => responseSimilarity(candidate.text || candidate, previous)))
        : 0
    }))
    .sort((a, b) => a.score - b.score)[0]?.candidate || null;
}
