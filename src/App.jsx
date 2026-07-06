import React, { useEffect, useMemo, useState } from "react";
import { cases, difficultyOptions } from "./data/cases.js";
import { createPatientResponse } from "./utils/responseEngine.js";
import { buildEducationalReport } from "./utils/scoring.js";
import {
  getLatestSessionSummary,
  getSessionSummariesForCase,
  mergeSessionSummaryList
} from "./engine/sessionMemory.js";
import { buildSessionHistoryRecord, saveSessionHistory } from "./engine/sessionHistory.js";
import {
  SESSION_COUNT_LIMITS,
  buildInitialPreSessionPlan,
  normalizePreSessionPlan
} from "./engine/clinicalPreparation.js";
import { getNextSessionNumber, getSessionOpening } from "./data/sessionPrompts.js";
import {
  getAvailableSessionNumbers,
  getCompletedSessionCount,
  getProcessSessionTotal
} from "./engine/sessionPlanUtils.js";
import { CaseSelector } from "./components/CaseSelector.jsx";
import { CaseBrief } from "./components/CaseBrief.jsx";
import { SimulationChat } from "./components/SimulationChat.jsx";
import { FeedbackPanel } from "./components/FeedbackPanel.jsx";
import { ResultsSummary } from "./components/ResultsSummary.jsx";
import { EthicalNotice } from "./components/EthicalNotice.jsx";
import { SessionClosure } from "./components/SessionClosure.jsx";
import { SavedSessions } from "./components/SavedSessions.jsx";
import { AuthScreen } from "./components/AuthScreen.jsx";
import { IntroVideo } from "./components/IntroVideo.jsx";
import { PendingApprovalScreen } from "./components/PendingApprovalScreen.jsx";
import { TrustCenter } from "./components/TrustCenter.jsx";
import { AppFooter } from "./components/AppFooter.jsx";
import { ClinicalAgenda } from "./components/ClinicalAgenda.jsx";
import { AuthenticatedLayout } from "./components/AuthenticatedLayout.jsx";
import { ClinicalDashboard } from "./components/ClinicalDashboard.jsx";
import { isSupabaseConfigured, supabase } from "./lib/supabaseClient.js";
import { getOrCreateUserApproval } from "./lib/userApproval.js";

const screens = {
  home: "home",
  select: "select",
  brief: "brief",
  simulation: "simulation",
  results: "results",
  savedSessions: "savedSessions",
  clinicalAgenda: "clinicalAgenda",
  trustCenter: "trustCenter"
};

export default function App() {
  const [screen, setScreen] = useState(screens.home);
  const [selectedCaseId, setSelectedCaseId] = useState(cases[0].id);
  const [difficulty, setDifficulty] = useState("intermedio");
  const [history, setHistory] = useState([]);
  const [sessionNumber, setSessionNumber] = useState(1);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [sessionSummaries, setSessionSummaries] = useState(() => getSessionSummariesForCase(cases[0].id));
  const [preSessionPlan, setPreSessionPlan] = useState(() =>
    buildInitialPreSessionPlan({ caseItem: cases[0], sessionNumber: 1 })
  );
  const [authSession, setAuthSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  const [approvalState, setApprovalState] = useState({
    status: isSupabaseConfigured ? "checking" : "approved",
    profile: null,
    error: null
  });
  const [saveStatus, setSaveStatus] = useState(null);
  const [agendaFocusCaseId, setAgendaFocusCaseId] = useState("");

  const selectedCase = cases.find((caseItem) => caseItem.id === selectedCaseId) || cases[0];
  const report = useMemo(() => buildEducationalReport(history, selectedCase), [history, selectedCase]);
  const sessionTotal = useMemo(
    () => getProcessSessionTotal(preSessionPlan, sessionSummaries),
    [preSessionPlan, sessionSummaries]
  );
  const availableSessions = useMemo(
    () => getAvailableSessionNumbers(sessionSummaries, sessionTotal),
    [sessionSummaries, sessionTotal]
  );

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthLoading(false);
      return undefined;
    }

    let isMounted = true;
    let approvalRequestId = 0;

    async function applyAuthSession(nextSession) {
      const requestId = ++approvalRequestId;
      if (!isMounted) return;

      setAuthSession(nextSession);
      if (!nextSession?.user) {
        setApprovalState({ status: "signed_out", profile: null, error: null });
        setAuthLoading(false);
        return;
      }

      setAuthLoading(true);
      setApprovalState({ status: "checking", profile: null, error: null });
      const nextApprovalState = await getOrCreateUserApproval(nextSession.user);
      if (!isMounted || requestId !== approvalRequestId) return;
      setApprovalState(nextApprovalState);
      setAuthLoading(false);
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.error("AUTH_SESSION_ERROR", error);
      void applyAuthSession(data?.session || null);
    });

    let authChangeTimeoutId = null;
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (authChangeTimeoutId) globalThis.clearTimeout(authChangeTimeoutId);
      authChangeTimeoutId = globalThis.setTimeout(() => {
        void applyAuthSession(nextSession);
      }, 0);
    });

    return () => {
      isMounted = false;
      if (authChangeTimeoutId) globalThis.clearTimeout(authChangeTimeoutId);
      subscription.unsubscribe();
    };
  }, []);

  function resetConversation(nextScreen = screens.brief) {
    setHistory(sessionNumber > 1 ? [createSessionPrelude(selectedCase, sessionNumber, sessionSummary, sessionTotal)] : []);
    setScreen(nextScreen);
  }

  function selectCase(caseId) {
    const summaries = getSessionSummariesForCase(caseId);
    const nextCase = cases.find((caseItem) => caseItem.id === caseId) || cases[0];
    const latestSummary = summaries.at(-1);
    const basePlan = latestSummary
      ? {
          ...(latestSummary.preSessionPlan || {}),
          proposedSessionCount:
            latestSummary.clinicalDecision?.proposedSessions || latestSummary.preSessionPlan?.proposedSessionCount
        }
      : null;
    setSelectedCaseId(caseId);
    setSessionNumber(1);
    setSessionSummaries(summaries);
    setSessionSummary(null);
    setPreSessionPlan(buildInitialPreSessionPlan({ caseItem: nextCase, sessionNumber: 1, basePlan }));
    setHistory([]);
    setScreen(screens.brief);
  }

  function openCaseFromAgenda(caseId, targetSession = 1, nextScreen = screens.brief) {
    const summaries = getSessionSummariesForCase(caseId);
    const nextCase = cases.find((caseItem) => caseItem.id === caseId) || cases[0];
    const safeSession = Math.max(1, Number(targetSession) || 1);
    const previousSummary = getPreviousSessionSummary({
      caseId,
      sessionNumber: safeSession,
      sessionSummaries: summaries
    });
    const latestSummary = summaries.at(-1);
    const basePlan = buildBasePlanFromSummary(previousSummary || latestSummary);
    const nextPlan = buildInitialPreSessionPlan({
      caseItem: nextCase,
      sessionNumber: safeSession,
      basePlan
    });
    const processTotal = getProcessSessionTotal(nextPlan, summaries);

    setSelectedCaseId(caseId);
    setSessionNumber(safeSession);
    setSessionSummaries(summaries);
    setSessionSummary(previousSummary);
    setPreSessionPlan(nextPlan);
    setSaveStatus(null);
    setHistory(
      nextScreen === screens.simulation && safeSession > 1
        ? [createSessionPrelude(nextCase, safeSession, previousSummary, processTotal)]
        : []
    );
    setScreen(nextScreen);
  }

  function startSession(session, planOverride = null) {
    const summary = getPreviousSessionSummary({
      caseId: selectedCase.id,
      sessionNumber: session,
      sessionSummaries
    });
    const normalizedPlan = normalizePreSessionPlan(planOverride || preSessionPlan, {
      caseItem: selectedCase,
      sessionNumber: session
    });
    setSessionNumber(session);
    setSessionSummary(summary);
    setPreSessionPlan(normalizedPlan);
    setHistory(session > 1 ? [createSessionPrelude(selectedCase, session, summary, sessionTotal)] : []);
    setSaveStatus(null);
    setScreen(screens.simulation);
  }

  function beginSessionFromPreparation(session, preparationState = {}) {
    const nextPlan = normalizePreSessionPlan(
      {
        ...preSessionPlan,
        ...preparationState
      },
      { caseItem: selectedCase, sessionNumber: session }
    );
    startSession(session, nextPlan);
  }

  function chooseSessionForBrief(session) {
    const summary = getPreviousSessionSummary({
      caseId: selectedCase.id,
      sessionNumber: session,
      sessionSummaries
    });
    setSessionNumber(session);
    setSessionSummary(summary);
    setPreSessionPlan(
      buildInitialPreSessionPlan({
        caseItem: selectedCase,
        sessionNumber: session,
        basePlan: summary?.preSessionPlan || preSessionPlan
      })
    );
  }

  function advanceToNextSession(summary) {
    const mergedSummaries = mergeSessionSummaryList(sessionSummaries, summary);
    const decidedPlan = {
      ...(summary.preSessionPlan || {}),
      proposedSessionCount: summary.clinicalDecision?.proposedSessions || summary.preSessionPlan?.proposedSessionCount
    };
    const processTotal = getProcessSessionTotal(decidedPlan, mergedSummaries);
    const nextSession = getNextSessionNumber(summary.sessionNumber, processTotal);
    setSessionSummaries(mergedSummaries);

    if (!nextSession) {
      setScreen(screens.results);
      return;
    }

    setSessionNumber(nextSession);
    setSessionSummary(summary);
    setPreSessionPlan(
      buildInitialPreSessionPlan({
        caseItem: selectedCase,
        sessionNumber: nextSession,
        basePlan: decidedPlan
      })
    );
    setHistory([createSessionPrelude(selectedCase, nextSession, summary, processTotal)]);
    setScreen(screens.simulation);
  }

  function goHome() {
    const summaries = getSessionSummariesForCase(selectedCase.id);
    const latestSummary = summaries.at(-1);
    const basePlan = latestSummary
      ? {
          ...(latestSummary.preSessionPlan || {}),
          proposedSessionCount:
            latestSummary.clinicalDecision?.proposedSessions || latestSummary.preSessionPlan?.proposedSessionCount
        }
      : null;
    setHistory([]);
    setSessionNumber(1);
    setSessionSummary(null);
    setSessionSummaries(summaries);
    setPreSessionPlan(buildInitialPreSessionPlan({ caseItem: selectedCase, sessionNumber: 1, basePlan }));
    setSaveStatus(null);
    setScreen(screens.home);
  }

  async function handleAsk(question, selectedInterventionType = "", conversationContext = {}) {
    const response = await createPatientResponse({
      caseItem: selectedCase,
      difficulty,
      question,
      history,
      sessionNumber,
      selectedInterventionType,
      previousSessionSummary: sessionSummary,
      conversationStage: conversationContext.conversationStage || null
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
        interventionType: selectedInterventionType,
        guidedIntervention: response.guidedIntervention,
        conversationStage: response.guidedIntervention
          ? {
              sessionNumber,
              stageName: response.guidedIntervention.stageName,
              stageLabel: response.guidedIntervention.stageLabel
            }
          : null,
        createdAt: new Date().toISOString()
      }
    ]);

    return response.text;
  }

  async function finishSession() {
    setSaveStatus(null);
    setScreen(screens.results);
  }

  async function saveCompletedSession({
    clinicalDecision = null,
    clinicalPlanEvaluation = null,
    clinicalArtifacts = null
  } = {}) {
    setSaveStatus({
      type: "saving",
      message: "Guardando sesion..."
    });
    const sessionRecord = buildSessionHistoryRecord({
      caseItem: selectedCase,
      history,
      report,
      sessionNumber,
      preSessionPlan: normalizePreSessionPlan(preSessionPlan, { caseItem: selectedCase, sessionNumber }),
      clinicalArtifacts,
      clinicalDecision,
      clinicalPlanEvaluation
    });
    const saveResult = await saveSessionHistory(sessionRecord);
    if (saveResult.cloudSaved) {
      setSaveStatus({
        type: "success",
        message: "Sesion guardada correctamente."
      });
    } else if (saveResult.error) {
      setSaveStatus({
        type: "error",
        message:
          typeof saveResult.error === "string"
            ? saveResult.error
            : saveResult.error.message || "No se pudo guardar la sesion en Supabase."
      });
    } else {
      setSaveStatus({
        type: "local",
        message: "Modo local: Supabase no esta configurado. El historial no se guardara en la nube."
      });
    }
    return saveResult;
  }

  async function handleSignOut() {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setHistory([]);
    setSessionNumber(1);
    setSessionSummary(null);
    setAuthSession(null);
    setApprovalState({ status: "signed_out", profile: null, error: null });
    setAuthLoading(false);
    setScreen(screens.home);
  }

  async function refreshApproval() {
    if (!authSession?.user) return;
    setAuthLoading(true);
    setApprovalState({ status: "checking", profile: null, error: null });
    const nextApprovalState = await getOrCreateUserApproval(authSession.user);
    setApprovalState(nextApprovalState);
    setAuthLoading(false);
  }

  function openTrustCenter() {
    setScreen(screens.trustCenter);
  }

  function closeTrustCenter() {
    setScreen(screens.home);
  }

  function openClinicalAgenda(caseId = "") {
    setAgendaFocusCaseId(typeof caseId === "string" ? caseId : "");
    setScreen(screens.clinicalAgenda);
  }

  function navigateWorkspace(targetScreen) {
    if (targetScreen === "progress") {
      setScreen(screens.savedSessions);
      return;
    }
    if (targetScreen === screens.results && history.length === 0) {
      setScreen(screens.savedSessions);
      return;
    }
    if (screens[targetScreen]) {
      if (targetScreen === screens.home) {
        goHome();
        return;
      }
      if (targetScreen === screens.clinicalAgenda) {
        openClinicalAgenda();
        return;
      }
      setScreen(targetScreen);
    }
  }

  if (authLoading) {
    return (
      <main className="app-shell">
        <EthicalNotice compact />
        <section className="screen auth-screen">
          <div className="auth-card">
            <span className="eyebrow">Cargando acceso</span>
            <h1>Preparando tu sesion</h1>
            <p>Estamos verificando si ya tienes una sesion activa.</p>
          </div>
        </section>
      </main>
    );
  }

  if (isSupabaseConfigured && !authSession) {
    if (screen === screens.trustCenter) {
      return (
        <main className="app-shell">
          <EthicalNotice compact />
          <TrustCenter onBack={closeTrustCenter} />
          <AppFooter onOpenTrust={openTrustCenter} />
        </main>
      );
    }

    return (
      <IntroVideo>
        <main className="app-shell">
          <EthicalNotice compact />
          <AuthScreen onOpenTrust={openTrustCenter} />
          <AppFooter onOpenTrust={openTrustCenter} />
        </main>
      </IntroVideo>
    );
  }

  if (isSupabaseConfigured && authSession && approvalState.status !== "approved") {
    return (
      <main className="app-shell">
        <EthicalNotice compact />
        <PendingApprovalScreen
          email={authSession.user.email}
          error={approvalState.error}
          onRetry={refreshApproval}
          onSignOut={handleSignOut}
        />
        <AppFooter onOpenTrust={openTrustCenter} />
      </main>
    );
  }

  const userEmail = isSupabaseConfigured && authSession ? authSession.user.email : "";

  return (
    <main className={`app-shell authenticated-shell ${screen === screens.simulation ? "simulation-mode" : ""}`}>
      <EthicalNotice compact={screen !== screens.home} />
      <AuthenticatedLayout
        currentScreen={screen}
        userEmail={userEmail}
        isLocalMode={!isSupabaseConfigured}
        hasEvaluation={history.length > 0}
        onNavigate={navigateWorkspace}
        onSignOut={handleSignOut}
      >

      {screen === screens.home && (
        <ClinicalDashboard
          cases={cases}
          userEmail={userEmail}
          onOpenCases={() => setScreen(screens.select)}
          onOpenAgenda={openClinicalAgenda}
          onViewHistory={() => setScreen(screens.savedSessions)}
          onPrepareCase={(caseId, targetSession) => openCaseFromAgenda(caseId, targetSession, screens.brief)}
          onStartSession={(caseId, targetSession) => openCaseFromAgenda(caseId, targetSession, screens.simulation)}
        />
      )}

      {screen === screens.trustCenter && (
        <TrustCenter onBack={goHome} />
      )}

      {screen === screens.savedSessions && (
        <SavedSessions authSession={authSession} onBackHome={goHome} />
      )}

      {screen === screens.clinicalAgenda && (
        <ClinicalAgenda
          cases={cases}
          initialCaseId={agendaFocusCaseId}
          onBackHome={goHome}
          onPrepareCase={(caseId, targetSession) => openCaseFromAgenda(caseId, targetSession, screens.brief)}
          onStartSession={(caseId, targetSession) => openCaseFromAgenda(caseId, targetSession, screens.simulation)}
        />
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
          totalSessions={sessionTotal}
          completedSessionCount={getCompletedSessionCount(sessionSummaries)}
          preSessionPlan={preSessionPlan}
          onBack={() => setScreen(screens.select)}
          onBegin={(preparationState) => beginSessionFromPreparation(sessionNumber, preparationState)}
          onSelectSession={chooseSessionForBrief}
          onPreSessionPlanChange={(nextPlan) =>
            setPreSessionPlan(normalizePreSessionPlan(nextPlan, { caseItem: selectedCase, sessionNumber }))
          }
        />
      )}

      {screen === screens.simulation && (
        <SimulationChat
          caseItem={selectedCase}
          difficulty={difficulty}
          sessionNumber={sessionNumber}
          totalSessions={sessionTotal}
          sessionSummary={sessionSummary}
          history={history}
          onAsk={handleAsk}
          onFinish={finishSession}
          onRestart={() => resetConversation(screens.simulation)}
          onChangeCase={() => setScreen(screens.select)}
          onOpenTrust={openTrustCenter}
        />
      )}

      {screen === screens.results && (
        <section className="results-layout screen">
          {saveStatus && (
            <div className={`save-status ${saveStatus.type}`}>
              {saveStatus.message}
              {saveStatus.type === "success" && (
                <button className="secondary-action" type="button" onClick={() => setScreen(screens.savedSessions)}>
                  Ver Mis sesiones
                </button>
              )}
            </div>
          )}
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
            totalSessions={sessionTotal}
            previousSessionSummaries={sessionSummaries}
            preSessionPlan={normalizePreSessionPlan(preSessionPlan, { caseItem: selectedCase, sessionNumber })}
            onContinueSession={advanceToNextSession}
            onBackHome={goHome}
            onSaveSessionRecord={saveCompletedSession}
          />
        </section>
      )}

      </AuthenticatedLayout>
    </main>
  );
}

function getPreviousSessionSummary({ caseId, sessionNumber, sessionSummaries }) {
  if (sessionNumber <= 1) return null;
  return (
    sessionSummaries.find((summary) => summary.sessionNumber === sessionNumber - 1) ||
    getLatestSessionSummary(caseId, sessionNumber - 1) ||
    null
  );
}

function buildBasePlanFromSummary(summary) {
  if (!summary) return null;
  return {
    ...(summary.preSessionPlan || {}),
    proposedSessionCount:
      summary.clinicalDecision?.proposedSessions || summary.preSessionPlan?.proposedSessionCount
  };
}

function createSessionPrelude(caseItem, sessionNumber, summary, totalSessions = SESSION_COUNT_LIMITS.defaultValue) {
  const answer = getSessionOpening(caseItem.id, sessionNumber, summary);
  const preludeLabel = `Inicio de Sesion ${sessionNumber} de ${totalSessions}`;
  return {
    id: crypto.randomUUID(),
    question: preludeLabel,
    answer,
    responseId: `${caseItem.id}-session-${sessionNumber}-prelude`,
    analysis: {
      original: preludeLabel,
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
