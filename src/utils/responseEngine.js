import { generateLocalPatientResponse } from "../engine/localMiniAI.js";

export async function createPatientResponse({
  caseItem,
  difficulty,
  question,
  history,
  sessionNumber = 1,
  selectedInterventionType = "",
  previousSessionSummary = null,
  conversationStage = null
}) {
  const geminiResponse = await requestGeminiPatientResponse({
    caseItem,
    difficulty,
    question,
    history,
    sessionNumber,
    selectedInterventionType,
    previousSessionSummary,
    conversationStage
  });

  if (geminiResponse?.text) {
    const localMetadata = createLocalPatientResponse({
      caseItem,
      difficulty,
      question,
      history,
      sessionNumber,
      selectedInterventionType,
      previousSessionSummary
    });

    if (geminiResponse.source === "gemini") {
      console.info("[responseEngine] source: gemini", {
        model: geminiResponse.model || "gemini"
      });
    } else {
      console.warn("[responseEngine] source: local fallback:", geminiResponse.fallbackReason || "Gemini unavailable");
    }

    return {
      ...localMetadata,
      text: geminiResponse.text,
      directAnswer: geminiResponse.text,
      responseId: geminiResponse.source === "gemini"
        ? `gemini-${caseItem.id}-${Date.now()}`
        : localMetadata.responseId,
      responseCategory: localMetadata.responseCategory,
      analysis: {
        ...localMetadata.analysis,
        gemini: {
          used: geminiResponse.source === "gemini",
          source: geminiResponse.source,
          fallbackReason: geminiResponse.fallbackReason || "",
          provider: geminiResponse.provider || "",
          model: geminiResponse.model || ""
        }
      }
    };
  }

  const fallbackReason = geminiResponse?.fallbackReason || "Function unavailable or empty response";
  console.warn("[responseEngine] source: local fallback:", fallbackReason);
  const localResponse = createLocalPatientResponse({
    caseItem,
    difficulty,
    question,
    history,
    sessionNumber,
    selectedInterventionType,
    previousSessionSummary
  });

  return {
    ...localResponse,
    analysis: {
      ...localResponse.analysis,
      gemini: {
        used: false,
        source: "local",
        fallbackReason,
        provider: "",
        model: ""
      }
    }
  };
}

function createLocalPatientResponse({
  caseItem,
  difficulty,
  question,
  history,
  sessionNumber = 1,
  selectedInterventionType = "",
  previousSessionSummary = null
}) {
  const result = generateLocalPatientResponse({
    caseId: caseItem.id,
    studentMessage: question,
    history,
    difficulty,
    sessionNumber,
    selectedInterventionType,
    previousSessionSummary
  });

  return {
    text: result.responseText,
    directAnswer: result.responseText,
    emotionalTone: null,
    usedFallback: result.fallbackUsed,
    repeatedResponse: false,
    responseId: result.responseId,
    analysis: {
      original: question,
      text: result.intentResult.normalizedText,
      detectedIntent: result.intent,
      contextualTopic: result.intentResult.contextualTopic,
      confidence: result.confidence,
      categories: result.intentResult.categories,
      categoryList: Object.entries(result.intentResult.categories)
        .filter(([, value]) => value)
        .map(([key]) => key),
      guidedIntervention: result.debug.guided,
      clinicalAvatar: result.debug.clinicalAvatar,
      clinicalSimulation: result.debug.clinicalSimulation
    },
    patientState: {
      trustLevel: result.memoryUpdate.trustLevel,
      trustStage: result.trustStage,
      opennessLevel: result.memoryUpdate.opennessLevel,
      clinicalEmotionalState: result.memoryUpdate.emotionalState || null,
      repeatedQuestion: false
    },
    responseCategory: result.intent,
    guidedIntervention: result.debug.guided,
    clinicalAvatar: result.debug.clinicalAvatar,
    clinicalSimulation: result.debug.clinicalSimulation
  };
}

async function requestGeminiPatientResponse({
  caseItem,
  difficulty,
  question,
  history,
  sessionNumber,
  selectedInterventionType,
  previousSessionSummary,
  conversationStage
}) {
  if (typeof fetch !== "function") return null;

  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), 9000);

  try {
    const response = await fetch("/api/gemini-patient-response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        caseId: caseItem.id,
        caseData: buildCasePayload(caseItem),
        studentMessage: question,
        conversationHistory: buildConversationPayload(history),
        difficulty,
        sessionNumber,
        selectedInterventionType,
        sessionStage: conversationStage?.stageName || conversationStage?.stageLabel || "",
        interviewStage: conversationStage?.stageLabel || "",
        previousSessionSummary: summarizePreviousSession(previousSessionSummary)
      })
    });

    const data = await readResponseJson(response);
    if (!response.ok) {
      return {
        source: "local",
        text: "",
        fallbackReason: data?.fallbackReason || data?.reason || `Function HTTP ${response.status}`
      };
    }

    const text = typeof data?.text === "string" && data.text.trim()
      ? data.text.trim()
      : typeof data?.responseText === "string"
      ? data.responseText.trim()
      : "";

    if (!text) {
      return {
        source: "local",
        text: "",
        fallbackReason: data?.fallbackReason || "Function returned empty text"
      };
    }

    return {
      ...data,
      text,
      responseText: text,
      source: data?.source === "gemini" ? "gemini" : "local",
      fallbackReason: data?.fallbackReason || ""
    };
  } catch (error) {
    const fallbackReason = error?.name === "AbortError"
      ? "Function request timed out"
      : error?.message || "Function request failed";
    return {
      source: "local",
      text: "",
      fallbackReason
    };
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

async function readResponseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function buildCasePayload(caseItem) {
  return {
    id: caseItem.id,
    name: caseItem.name,
    age: caseItem.age,
    shortTitle: caseItem.shortTitle,
    motive: caseItem.motive,
    background: caseItem.background,
    context: caseItem.context,
    communicationStyle: caseItem.communicationStyle,
    expectedResponses: caseItem.expectedResponses,
    openingLine: caseItem.openingLine,
    learningObjectives: caseItem.learningObjectives,
    sensitiveTopics: caseItem.sensitiveTopics,
    basicFacts: caseItem.basicFacts
  };
}

function buildConversationPayload(history = []) {
  return history
    .filter((entry) => entry && !entry.isSessionPrelude)
    .slice(-8)
    .map((entry) => ({
      question: entry.question || "",
      answer: entry.answer || "",
      responseCategory: entry.responseCategory || "",
      conversationStage: entry.conversationStage || null
    }));
}

function summarizePreviousSession(summary) {
  if (!summary) return "";
  if (typeof summary === "string") return summary;
  return [
    summary.patientName ? `Paciente: ${summary.patientName}` : "",
    summary.sessionNumber ? `Sesion previa: ${summary.sessionNumber}` : "",
    summary.summary || summary.clinicalSummary || "",
    Array.isArray(summary.keyTopics) ? `Temas: ${summary.keyTopics.join(", ")}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}
