// Scope browser caches to the authenticated owner. Never adopt an old anonymous cache.
let currentOwner = "local";
const memory = new Map();
export function setClinicalStorageOwner(userId) { currentOwner = userId || ""; }
export function getClinicalStorageOwner() { return currentOwner; }
export function clinicalStorageKey(base, owner = currentOwner) { return owner ? `${base}:${owner}` : ""; }
export function readClinicalCache(base, fallback, owner = currentOwner) {
  const key = clinicalStorageKey(base, owner);
  if (!key) return fallback;
  if (memory.has(key)) return memory.get(key);
  try { return JSON.parse(globalThis.localStorage?.getItem(key) || "null") ?? fallback; } catch { return fallback; }
}
export function writeClinicalCache(base, value, owner = currentOwner) {
  const key = clinicalStorageKey(base, owner);
  if (!key) return false;
  memory.set(key, value);
  try {
    if (!globalThis.localStorage) return false;
    globalThis.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch { return false; }
}
