const CLINICAL_DRAFT_PREFIX = "escucha-viva:draft:clinical-flow";
const CLINICAL_SCROLL_PREFIX = "escucha-viva:scroll:clinical-flow";
const CLINICAL_DRAFT_VERSION = 1;

export function buildClinicalDraftKey({
  userId = "",
  userEmail = "",
  caseId = "",
  sessionId = "",
  sessionNumber = 1,
  step = "general"
} = {}) {
  const userPart = sanitizeDraftKeyPart(userId || userEmail || "local-user");
  const casePart = sanitizeDraftKeyPart(caseId || "case");
  const sessionPart = sanitizeDraftKeyPart(sessionId || `session-${sessionNumber || 1}`);
  const stepPart = sanitizeDraftKeyPart(step || "general");
  return `${CLINICAL_DRAFT_PREFIX}:${userPart}:${casePart}:${sessionPart}:${stepPart}`;
}

export function saveClinicalDraft(key, data) {
  const storage = getDraftStorage();
  if (!storage || !key) return { ok: false, savedAt: "", error: "storage_unavailable" };

  try {
    const savedAt = new Date().toISOString();
    storage.setItem(
      key,
      JSON.stringify({
        version: CLINICAL_DRAFT_VERSION,
        savedAt,
        data
      })
    );
    return { ok: true, savedAt };
  } catch (error) {
    return { ok: false, savedAt: "", error };
  }
}

export function loadClinicalDraft(key) {
  return loadClinicalDraftRecord(key)?.data || null;
}

export function loadClinicalDraftRecord(key) {
  const storage = getDraftStorage();
  if (!storage || !key) return null;

  try {
    const rawValue = storage.getItem(key);
    if (!rawValue) return null;
    const parsed = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== "object") return null;
    if ("data" in parsed) {
      return {
        data: parsed.data,
        savedAt: parsed.savedAt || "",
        version: parsed.version || 0
      };
    }
    return {
      data: parsed,
      savedAt: "",
      version: 0
    };
  } catch {
    return null;
  }
}

export function clearClinicalDraft(key) {
  const storage = getDraftStorage();
  if (!storage || !key) return false;

  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function buildClinicalScrollKey({
  userId = "",
  userEmail = "",
  caseId = "",
  sessionId = "",
  sessionNumber = 1,
  step = "general"
} = {}) {
  const userPart = sanitizeDraftKeyPart(userId || userEmail || "local-user");
  const casePart = sanitizeDraftKeyPart(caseId || "case");
  const sessionPart = sanitizeDraftKeyPart(sessionId || `session-${sessionNumber || 1}`);
  const stepPart = sanitizeDraftKeyPart(step || "general");
  return `${CLINICAL_SCROLL_PREFIX}:${userPart}:${casePart}:${sessionPart}:${stepPart}`;
}

export function saveClinicalScrollPosition(key, y) {
  const storage = getDraftStorage();
  const nextY = Number(y);
  if (!storage || !key || !Number.isFinite(nextY)) return false;

  try {
    storage.setItem(
      key,
      JSON.stringify({
        y: Math.max(0, Math.round(nextY)),
        savedAt: new Date().toISOString()
      })
    );
    return true;
  } catch {
    return false;
  }
}

export function loadClinicalScrollPosition(key) {
  const storage = getDraftStorage();
  if (!storage || !key) return 0;

  try {
    const rawValue = storage.getItem(key);
    if (!rawValue) return 0;
    const parsed = JSON.parse(rawValue);
    const y = Number(parsed?.y);
    return Number.isFinite(y) && y > 0 ? y : 0;
  } catch {
    return 0;
  }
}

export function clearClinicalScrollPosition(key) {
  const storage = getDraftStorage();
  if (!storage || !key) return false;

  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function getDraftStorage() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function sanitizeDraftKeyPart(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "unknown";
}
