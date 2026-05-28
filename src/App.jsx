import React, { useMemo, useState } from "react";
import { cases, difficultyOptions } from "./data/cases.js";
import { createPatientResponse } from "./utils/responseEngine.js";
import { buildEducationalReport } from "./utils/scoring.js";
import {
  getLatestSessionSummary,
  getSessionSummariesForCase,
  mergeSessionSummaryList
} from "./engine/sessionMemory.js";
import { buildSessionHistoryRecord, saveSessionHistory } from "./engine/sessionHistory.js";
import { getNextSessionNumber, getSessionOpening } from "./data/sessionPrompts.js";
import { Home } from "./components/Home.jsx";
import { CaseSelector } from "./components/CaseSelector.jsx";
import { CaseBrief } from "./components/CaseBrief.jsx";
import { SimulationChat } from "./components/SimulationChat.jsx";
import { FeedbackPanel } from "./components/FeedbackPanel.jsx";
import { ResultsSummary } from "./components/ResultsSummary.jsx";
import { EthicalNotice } from "./components/EthicalNotice.jsx";
import { SessionClosure } from "./components/SessionClosure.jsx";
import { SavedSessions } from "./components/SavedSessions.jsx";

const screens = {
  home: "home",
  select: "select",
  brief: "brief",
  simulation: "simulation",
  results: "results",
  savedSessions: "savedSessions"
};

export default function App() {
  const [screen, setScreen] = useState(screens.home);
  const [selectedCaseId, setSelectedCaseId] = useState(cases[0].id);
  const [difficulty, setDifficulty] = useState("intermedio");
  const [history, setHistory] = useState([]);
  const [sessionNumber, setSessionNumber] = useState(1);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [sessionSummaries, setSessionSummaries] = useState(() => getSessionSummariesForCase(cases[0].id));

  const selectedCase = cases.find((caseItem) => caseItem.id === selectedCaseId) || cases[0];
  const report = useMemo(() => buildEducationalReport(history, selectedCase), [history, selectedCase]);
  const availableSessions = useMemo(() => getAvailableSessions(sessionSummaries), [sessionSummaries]);

  function resetConversation(nextScreen = screens.brief) {
    setHistory(sessionNumber > 1 ? [createSessionPrelude(selectedCase, sessionNumber, sessionSummary)] : []);
    setScreen(nextScreen);
  }

  function selectCase(caseId) {
    const summaries = getSessionSummariesForCase(caseId);
    setSelectedCaseId(caseId);
    setSessionNumber(1);
    setSessionSummaries(summaries);
    setSessionSummary(null);
    setHistory([]);
    setScreen(screens.brief);
  }

  function startSession(session) {
    const summary = getPreviousSessionSummary({
      caseId: selectedCase.id,
      sessionNumber: session,
      sessionSummaries
    });
    setSessionNumber(session);
    setSessionSummary(summary);
    setHistory(session > 1 ? [createSessionPrelude(selectedCase, session, summary)] : []);
    setScreen(screens.simulation);
  }

  function chooseSessionForBrief(session) {
    const summary = getPreviousSessionSummary({
      caseId: selectedCase.id,
      sessionNumber: session,
      sessionSummaries
    });
    setSessionNumber(session);
    setSessionSummary(summary);
  }

  function advanceToNextSession(summary) {
    const mergedSummaries = mergeSessionSummaryList(sessionSummaries, summary);
    const nextSession = getNextSessionNumber(summary.sessionNumber);
    setSessionSummaries(mergedSummaries);

    if (!nextSession) {
      setScreen(screens.results);
      return;
    }

    setSessionNumber(nextSession);
    setSessionSummary(summary);
    setHistory([createSessionPrelude(selectedCase, nextSession, summary)]);
    setScreen(screens.simulation);
  }

  function goHome() {
    setHistory([]);
    setSessionNumber(1);
    setSessionSummary(null);
    setSessionSummaries(getSessionSummariesForCase(selectedCase.id));
    setScreen(screens.home);
  }

  function handleAsk(question) {
    const response = createPatientResponse({
      caseItem: selectedCase,
      difficulty,
      question,
      history
    });

    setHistory((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        question,
        answer: response.text,
        responseId: response.responseId,
        analysis: response.analysis,
        patientState: response.patientState,
        responseCategory: response.responseCategory,
        createdAt: new Date().toISOString()
      }
    ]);
  }

  function finishSession() {
    const sessionRecord = buildSessionHistoryRecord({
      caseItem: selectedCase,
      history,
      report,
      sessionNumber
    });
    saveSessionHistory(sessionRecord);
    setScreen(screens.results);
  }

  return (
    <main className={`app-shell ${screen === screens.simulation ? "simulation-mode" : ""}`}>
      <EthicalNotice compact={screen !== screens.home} />

      {screen === screens.home && (
        <Home
          onStart={() => setScreen(screens.select)}
          onViewHistory={() => setScreen(screens.savedSessions)}
        />
      )}

      {screen === screens.savedSessions && (
        <SavedSessions onBackHome={goHome} />
      )}

      {screen === screens.select && (
        <CaseSelector
          cases={cases}
          difficulty={difficulty}
          difficultyOptions={difficultyOptions}
          selectedCaseId={selectedCaseId}
          onDifficultyChange={setDifficulty}
          onSelectCase={selectCase}
        />
      )}

      {screen === screens.brief && (
        <CaseBrief
          caseItem={selectedCase}
          difficulty={difficulty}
          sessionNumber={sessionNumber}
          sessionSummary={sessionSummary}
          availableSessions={availableSessions}
          onBack={() => setScreen(screens.select)}
          onBegin={() => startSession(sessionNumber)}
          onSelectSession={chooseSessionForBrief}
        />
      )}

      {screen === screens.simulation && (
        <SimulationChat
          caseItem={selectedCase}
          difficulty={difficulty}
          sessionNumber={sessionNumber}
          sessionSummary={sessionSummary}
          history={history}
          onAsk={handleAsk}
          onFinish={finishSession}
          onRestart={() => resetConversation(screens.simulation)}
          onChangeCase={() => setScreen(screens.select)}
        />
      )}

      {screen === screens.results && (
        <section className="results-layout screen">
          <ResultsSummary report={report} caseItem={selectedCase} history={history} sessionNumber={sessionNumber} />
          <FeedbackPanel
            report={report}
            caseItem={selectedCase}
            history={history}
            sessionNumber={sessionNumber}
            onRestart={() => resetConversation(screens.simulation)}
            onSelectCase={() => setScreen(screens.select)}
          />
          <SessionClosure
            caseItem={selectedCase}
            history={history}
            report={report}
            sessionNumber={sessionNumber}
            previousSessionSummaries={sessionSummaries}
            onContinueSession={advanceToNextSession}
            onBackHome={goHome}
          />
        </section>
      )}
    </main>
  );
}

function getAvailableSessions(sessionSummaries) {
  const completed = new Set(sessionSummaries.map((summary) => summary.sessionNumber));
  const maxCompleted = Math.max(0, ...completed);
  const maxAvailable = Math.min(4, Math.max(1, maxCompleted + 1));
  return Array.from({ length: maxAvailable }, (_, index) => index + 1);
}

function getPreviousSessionSummary({ caseId, sessionNumber, sessionSummaries }) {
  if (sessionNumber <= 1) return null;
  return (
    sessionSummaries.find((summary) => summary.sessionNumber === sessionNumber - 1) ||
    getLatestSessionSummary(caseId, sessionNumber - 1) ||
    null
  );
}

function createSessionPrelude(caseItem, sessionNumber, summary) {
  const answer = getSessionOpening(caseItem.id, sessionNumber, summary);
  return {
    id: crypto.randomUUID(),
    question: `Inicio de Sesión ${sessionNumber}`,
    answer,
    responseId: `${caseItem.id}-session-${sessionNumber}-prelude`,
    analysis: {
      original: `Inicio de Sesión ${sessionNumber}`,
      text: `inicio sesion ${sessionNumber}`,
      detectedIntent: "inicio_sesion",
      contextualTopic: "continuidad",
      categories: {
        framing: true,
        paceRespect: true,
        openQuestion: false,
        closedQuestion: false,
        validation: false,
        judgment: false,
        rushedAdvice: false,
        closure: false,
        followUp: false
      },
      categoryList: ["framing", "paceRespect"]
    },
    patientState: {
      trustLevel: summary?.trustFinal || 45,
      trustStage: "cautious",
      opennessLevel: summary?.nivelApertura || "apertura_media",
      repeatedQuestion: false
    },
    responseCategory: "inicio_sesion",
    isSessionPrelude: true,
    createdAt: new Date().toISOString()
  };
}
