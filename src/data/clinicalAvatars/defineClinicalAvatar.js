const SESSION_NUMBERS = [1, 2, 3, 4];

export function defineClinicalAvatar(profile) {
  if (!profile?.identity?.id) throw new Error("Clinical avatar requires identity.id");
  if (!profile?.identity?.name) throw new Error("Clinical avatar requires identity.name");

  for (const sessionNumber of SESSION_NUMBERS) {
    if (!profile.sessionProgression?.[sessionNumber]) {
      throw new Error(`Clinical avatar ${profile.identity.id} requires session ${sessionNumber}`);
    }
  }

  return {
    schemaVersion: 1,
    ...profile,
    sessionProgression: { ...profile.sessionProgression },
    intentResponses: { ...(profile.intentResponses || {}) },
    contextualFallbacks: { ...(profile.contextualFallbacks || {}) },
    fallbackSynthesis: { ...(profile.fallbackSynthesis || {}) },
    approachResponses: { ...(profile.approachResponses || {}) },
    taskResponses: { ...(profile.taskResponses || {}) },
    goodInterventions: { ...(profile.goodInterventions || {}) },
    poorInterventions: { ...(profile.poorInterventions || {}) }
  };
}

export function clinicalResponse(id, text, options = {}) {
  return {
    id,
    text,
    topic: options.topic || null,
    minSession: options.minSession || 1,
    maxSession: options.maxSession || 4,
    minOpenness: options.minOpenness || "low",
    reveals: options.reveals || [],
    tags: options.tags || []
  };
}
