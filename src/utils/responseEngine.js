import { generateLocalPatientResponse } from "../engine/localMiniAI.js";
import { MAX_CONTEXT_TURNS } from "../engine/simulationUsagePolicy.js";

const INVALID_FINAL_WORDS = new Set([
  "a",
  "al",
  "de",
  "del",
  "en",
  "con",
  "por",
  "para",
  "un",
  "una",
  "el",
  "la",
  "los",
  "las",
  "lo",
  "que",
  "como",
  "cuando",
  "porque",
  "pero",
  "aunque",
  "desde",
  "hacia",
  "sobre",
  "entre",
  "unos",
  "unas"
]);

export async function createPatientResponse({
  caseItem,
  difficulty,
  question,
  history,
  sessionNumber = 1,
  authSession = null,
  sessionRecordId = "",
  appointmentId = "",
  interventionId = "",
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
    authSession,
    sessionRecordId,
    appointmentId,
    interventionId,
    selectedInterventionType,
    previousSessionSummary,
    conversationStage
  });

  if (geminiResponse?.recoverableError) {
    const error = new Error(
      geminiResponse.userMessage ||
        geminiResponse.fallbackReason ||
        "No pudimos obtener la respuesta del paciente. Tu intervención está guardada."
    );
    error.code = "PATIENT_RESPONSE_RETRYABLE";
    error.errorType = geminiResponse.errorType || "unknown";
    error.retryAvailable = geminiResponse.retryAvailable !== false;
    throw error;
  }

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
      console.info(`[responseEngine] source: gemini length: ${geminiResponse.text.length}`, {
        model: geminiResponse.model || "gemini",
        length: geminiResponse.text.length
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
  authSession,
  sessionRecordId,
  appointmentId,
  interventionId,
  selectedInterventionType,
  previousSessionSummary,
  conversationStage
}) {
  if (typeof fetch !== "function") return null;

  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), 18000);

  try {
    const headers = { "Content-Type": "application/json" };
    if (authSession?.access_token) headers.Authorization = `Bearer ${authSession.access_token}`;

    const response = await fetch("/api/gemini-patient-response", {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        caseId: caseItem.id,
        sessionRecordId,
        appointmentId,
        interventionId,
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
      if (data?.code || data?.errorType) {
        return {
          source: "error",
          text: "",
          fallbackReason: data?.message || data?.fallbackReason || data?.code || `Function HTTP ${response.status}`,
          userMessage: data?.message || "",
          errorType: data?.code || data?.errorType || "server_validation",
          recoverableError: true,
          retryAvailable: data?.retryable !== false
        };
      }
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

    if (data?.source === "gemini" && isIncompleteGeminiText(text, data?.finishReason)) {
      return {
        source: "local",
        text: "",
        fallbackReason: "incomplete gemini response"
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
      source: "error",
      text: "",
      fallbackReason,
      errorType: error?.name === "AbortError" ? "timeout" : "network",
      recoverableError: true
    };
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

function isIncompleteGeminiText(text, finishReason) {
  const normalizedReason = String(finishReason || "").toUpperCase();
  if (normalizedReason === "MAX_TOKENS") return true;

  const trimmed = normalizeTerminalText(text);
  if (!trimmed || trimmed.length < 16) return true;

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < 5) return true;

  const hasCompletePunctuation = /(?:[.!?]|\.{3}|…)$/.test(trimmed);
  const finalWord = getFinalWord(trimmed);
  const endsWithInvalidWord = INVALID_FINAL_WORDS.has(finalWord);

  if (!hasCompletePunctuation && endsWithInvalidWord) return true;
  if (!hasCompletePunctuation && words.length < 12) return true;
  if (!hasCompletePunctuation && trimmed.length < 80) return true;

  return false;
}

function normalizeTerminalText(text) {
  return String(text || "")
    .trim()
    .replace(/[)"'”’»\]]+$/g, "")
    .trim();
}

function getFinalWord(text) {
  const match = normalizeTerminalText(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .match(/[a-zñáéíóúü]+$/i);
  return match ? match[0] : "";
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
    .slice(-MAX_CONTEXT_TURNS)
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
