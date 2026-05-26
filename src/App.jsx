import React, { useMemo, useState } from "react";
import { cases, difficultyOptions } from "./data/cases.js";
import { createPatientResponse } from "./utils/responseEngine.js";
import { buildEducationalReport } from "./utils/scoring.js";
import { Home } from "./components/Home.jsx";
import { CaseSelector } from "./components/CaseSelector.jsx";
import { CaseBrief } from "./components/CaseBrief.jsx";
import { SimulationChat } from "./components/SimulationChat.jsx";
import { FeedbackPanel } from "./components/FeedbackPanel.jsx";
import { ResultsSummary } from "./components/ResultsSummary.jsx";
import { EthicalNotice } from "./components/EthicalNotice.jsx";

const screens = {
  home: "home",
  select: "select",
  brief: "brief",
  simulation: "simulation",
  results: "results"
};

export default function App() {
  const [screen, setScreen] = useState(screens.home);
  const [selectedCaseId, setSelectedCaseId] = useState(cases[0].id);
  const [difficulty, setDifficulty] = useState("intermedio");
  const [history, setHistory] = useState([]);

  const selectedCase = cases.find((caseItem) => caseItem.id === selectedCaseId) || cases[0];
  const report = useMemo(() => buildEducationalReport(history, selectedCase), [history, selectedCase]);

  function resetConversation(nextScreen = screens.brief) {
    setHistory([]);
    setScreen(nextScreen);
  }

  function selectCase(caseId) {
    setSelectedCaseId(caseId);
    setHistory([]);
    setScreen(screens.brief);
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

  return (
    <main className="app-shell">
      <EthicalNotice compact={screen !== screens.home} />

      {screen === screens.home && (
        <Home onStart={() => setScreen(screens.select)} />
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
          onBack={() => setScreen(screens.select)}
          onBegin={() => setScreen(screens.simulation)}
        />
      )}

      {screen === screens.simulation && (
        <SimulationChat
          caseItem={selectedCase}
          difficulty={difficulty}
          history={history}
          onAsk={handleAsk}
          onFinish={() => setScreen(screens.results)}
          onRestart={() => resetConversation(screens.simulation)}
          onChangeCase={() => setScreen(screens.select)}
        />
      )}

      {screen === screens.results && (
        <section className="results-layout screen">
          <ResultsSummary report={report} caseItem={selectedCase} history={history} />
          <FeedbackPanel
            report={report}
            caseItem={selectedCase}
            history={history}
            onRestart={() => resetConversation(screens.simulation)}
            onSelectCase={() => setScreen(screens.select)}
          />
        </section>
      )}
    </main>
  );
}
