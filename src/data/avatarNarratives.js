import { patientConversationLines } from "./patientConversationLines.js";
import { avatarCanonicalBiographies, getAvatarCanonicalBiography } from "./avatarCanonicalBiographies.js";

export const avatarNarratives = deepFreeze(
  Object.fromEntries(
    Object.keys(avatarCanonicalBiographies).map((patientId) => {
      const biography = getAvatarCanonicalBiography(patientId);
      const voice = patientConversationLines[patientId];
      return [
        patientId,
        {
          age: biography.identity.age,
          currentAge: biography.identity.age,
          centralTheme: voice.openingReason,
          narrativeBoundaries: biography.privacyBoundaries,
          lifeHistory: biography.lifeHistory,
          recentTrigger: voice.openingReason,
          relationalPattern: voice.relationalPattern,
          internalConflict: voice.internalConflict,
          stakes: voice.stakes,
          timeline: [...new Set([biography.consultation.recentEvent, ...biography.timeline])]
            .filter((event) => event && ![biography.lifeHistory, biography.internalConflict, biography.stakes].includes(event))
            .map((event, index) => ({
              period: event === biography.consultation.recentEvent ? "Consulta reciente" : `Antecedente ${index}`,
              event,
              disclosureLevel: "developing"
            })),
          disclosure: {
            initial: [...biography.disclosure.initial, biography.directAnswers.household[0]],
            developing: [voice.reason, ...biography.disclosure.developing],
            deep: [...biography.disclosure.deep, voice.stakes]
          }
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
