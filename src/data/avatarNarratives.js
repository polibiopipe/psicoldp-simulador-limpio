import { avatarCanonicalBiographies, getAvatarCanonicalBiography } from "./avatarCanonicalBiographies.js";

export const avatarNarratives = deepFreeze(
  Object.fromEntries(
    Object.keys(avatarCanonicalBiographies).map((patientId) => {
      const biography = getAvatarCanonicalBiography(patientId);
      return [
        patientId,
        {
          age: biography.identity.age,
          lifeHistory: biography.lifeHistory,
          recentTrigger: biography.recentTrigger,
          relationalPattern: biography.relationalPattern,
          internalConflict: biography.internalConflict,
          stakes: biography.stakes,
          timeline: biography.timeline,
          disclosure: biography.disclosure
        }
      ];
    })
  )
);

export function getAvatarNarrative(patientId) {
  const narrative = avatarNarratives[String(patientId || "").trim().toLowerCase()];
  return narrative ? clone(narrative) : null;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) {
    deepFreeze(child);
  }
  return value;
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

