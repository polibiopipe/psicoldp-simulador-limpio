import React, { useEffect, useMemo, useRef, useState } from "react";
import { cases, difficultyOptions } from "./data/cases.js";
import { createPatientResponse } from "./utils/responseEngine.js";
import { buildEducationalReport } from "./utils/scoring.js";
import {
  getLatestSessionSummary,
  getSessionSummariesForCase,
  mergeSessionSummaryList
} from "./engine/sessionMemory.js";
import {
  buildSessionHistoryRecord,
  getLatestInProgressSessionForCase,
  getSessionHistoryForUser,
  saveSessionHistory
} from "./engine/sessionHistory.js";
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
import { isAccessGateRequired, isSupabaseConfigured, supabase } from "./lib/supabaseClient.js";
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
    status: isSupabaseConfigured ? "checking" : isAccessGateRequired ? "configuration_error" : "approved",
    profile: null,
    error: null
  });
  const [saveStatus, setSaveStatus] = useState(null);
  const [agendaFocusCaseId, setAgendaFocusCaseId] = useState("");
  const [sessionRecords, setSessionRecords] = useState([]);
  const [activeSessionRecordId, setActiveSessionRecordId] = useState("");
  const activeSessionRecordIdRef = useRef("");

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

  function updateActiveSessionRecordId(nextId = "") {
    activeSessionRecordIdRef.current = nextId;
    setActiveSessionRecordId(nextId);
  }

  function getOrCreateActiveSessionRecordId() {
    if (activeSessionRecordIdRef.current) return activeSessionRecordIdRef.current;
    const nextId = crypto.randomUUID();
    updateActiveSessionRecordId(nextId);
    return nextId;
  }

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

  useEffect(() => {
    if (approvalState.status !== "approved" || !authSession?.user) {
      setSessionRecords([]);
      return;
    }

    let cancelled = false;
    getSessionHistoryForUser(authSession).then((records) => {
      if (cancelled) return;
      setSessionRecords(records);
    });

    return () => {
      cancelled = true;
    };
  }, [approvalState.status, authSession?.user?.id]);

  function resetConversation(nextScreen = screens.brief) {
    setHistory(sessionNumber > 1 ? [createSessionPrelude(selectedCase, sessionNumber, sessionSummary, sessionTotal)] : []);
    updateActiveSessionRecordId("");
    setScreen(nextScreen);
  }

  async function selectCase(caseId) {
    const summaries = getSessionSummariesForCase(caseId);
    const nextCase = cases.find((caseItem) => caseItem.id === caseId) || cases[0];
    const resumeRecord =
      await getLatestInProgressSessionForCase(authSession, caseId) ||
      findLatestResumableSessionRecord(sessionRecords, caseId);
    if (resumeRecord) {
      openResumeRecord({
        caseId,
        nextCase,
        summaries,
        resumeRecord
      });
      return;
    }

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
    updateActiveSessionRecordId("");
    setScreen(screens.brief);
  }

  async function openCaseFromAgenda(caseId, targetSession = 1, nextScreen = screens.brief) {
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
    const resumeRecord =
      await getLatestInProgressSessionForCase(authSession, caseId, safeSession) ||
      findResumableSessionRecord(sessionRecords, caseId, safeSession);
    if (resumeRecord) {
      openResumeRecord({
        caseId,
        nextCase,
        summaries,
        resumeRecord
      });
      return;
    }

    setSelectedCaseId(caseId);
    setSessionNumber(safeSession);
    setSessionSummaries(summaries);
    setSessionSummary(previousSummary);
    setPreSessionPlan(nextPlan);
    setSaveStatus(null);
    updateActiveSessionRecordId(nextScreen === screens.simulation && resumeRecord ? resumeRecord.id : "");
    setHistory(resolveInitialHistoryForSession({
      nextScreen,
      safeSession,
      nextCase,
      previousSummary,
      processTotal,
      resumeRecord
    }));
    setScreen(nextScreen);
  }

  async function startSession(session, planOverride = null) {
    const summary = getPreviousSessionSummary({
      caseId: selectedCase.id,
      sessionNumber: session,
      sessionSummaries
    });
    const normalizedPlan = normalizePreSessionPlan(planOverride || preSessionPlan, {
      caseItem: selectedCase,
      sessionNumber: session
    });
    const resumeRecord =
      await getLatestInProgressSessionForCase(authSession, selectedCase.id, session) ||
      findResumableSessionRecord(sessionRecords, selectedCase.id, session);
    if (resumeRecord) {
      openResumeRecord({
        caseId: selectedCase.id,
        nextCase: selectedCase,
        summaries: sessionSummaries,
        resumeRecord,
        preSessionPlanOverride: normalizedPlan
      });
      return;
    }
    setSessionNumber(session);
    setSessionSummary(summary);
    setPreSessionPlan(normalizedPlan);
    updateActiveSessionRecordId(resumeRecord?.id || "");
    setHistory(
      resumeRecord?.conversationHistory?.length
        ? resumeRecord.conversationHistory
        : session > 1
          ? [createSessionPrelude(selectedCase, session, summary, sessionTotal)]
          : []
    );
    setSaveStatus(null);
    setScreen(screens.simulation);
  }

  function openResumeRecord({
    caseId,
    nextCase,
    summaries,
    resumeRecord,
    preSessionPlanOverride = null
  }) {
    const resumeSession = Number(resumeRecord.sessionNumber) || 1;
    const previousSummary = getPreviousSessionSummary({
      caseId,
      sessionNumber: resumeSession,
      sessionSummaries: summaries
    });
    const latestSummary = summaries.at(-1);
    const basePlan = buildBasePlanFromSummary(previousSummary || latestSummary);
    const nextPlan =
      preSessionPlanOverride ||
      buildInitialPreSessionPlan({
        caseItem: nextCase,
        sessionNumber: resumeSession,
        basePlan
      });

    console.log("[sessions] resume open chat", {
      caseId,
      sessionNumber: resumeSession,
      recordId: resumeRecord.id
    });
    setSelectedCaseId(caseId);
    setSessionNumber(resumeSession);
    setSessionSummaries(summaries);
    setSessionSummary(previousSummary);
    setPreSessionPlan(nextPlan);
    setHistory(resumeRecord.conversationHistory || []);
    updateActiveSessionRecordId(resumeRecord.id);
    setSaveStatus(null);
    setScreen(screens.simulation);
    setSessionRecords((current) => mergeSessionRecordList(current, resumeRecord));
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
    updateActiveSessionRecordId("");
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
    updateActiveSessionRecordId("");
    setSessionNumber(1);
    setSessionSummary(null);
    setSessionSummaries(summaries);
    setPreSessionPlan(buildInitialPreSessionPlan({ caseItem: selectedCase, sessionNumber: 1, basePlan }));
    setSaveStatus(null);
    setScreen(screens.home);
  }

  async function handleAsk(question, selectedInterventionType = "", conversationContext = {}) {
    const turnId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const sessionRecordId = getOrCreateActiveSessionRecordId();
    const pendingEntry = {
      id: turnId,
      question,
      answer: "",
      responseId: "pending-patient-response",
      analysis: null,
      patientState: null,
      responseCategory: "pending",
      interventionType: selectedInterventionType,
      guidedIntervention: null,
      conversationStage: conversationContext.conversationStage
        ? {
            sessionNumber,
            stageName: conversationContext.conversationStage.stageName,
            stageLabel: conversationContext.conversationStage.stageLabel
          }
        : null,
      createdAt,
      isPendingResponse: true
    };
    const pendingHistory = [...history, pendingEntry];
    await persistSessionProgress(pendingHistory, { recordId: sessionRecordId });

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

    const nextEntry = {
        id: turnId,
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
        createdAt
      };
    const nextHistory = [...history, nextEntry];
    setHistory(nextHistory);
    void persistSessionProgress(nextHistory, { recordId: sessionRecordId });

    return response.text;
  }

  async function persistSessionProgress(nextHistory, { recordId = "" } = {}) {
    const nextRecordId = recordId || getOrCreateActiveSessionRecordId();
    const liveReport = buildEducationalReport(nextHistory, selectedCase);
    const sessionRecord = buildSessionHistoryRecord({
      id: nextRecordId,
      caseItem: selectedCase,
      history: nextHistory,
      report: liveReport,
      sessionNumber,
      preSessionPlan: normalizePreSessionPlan(preSessionPlan, { caseItem: selectedCase, sessionNumber }),
      status: "in_progress"
    });

    const saveResult = await saveSessionHistory(sessionRecord);
    setSessionRecords((current) => mergeSessionRecordList(current, sessionRecord));
    if (!saveResult.cloudSaved && saveResult.error) {
      console.warn("[sessions] save error message", saveResult.error?.message || saveResult.error);
      console.warn("[sessions] save error code", saveResult.error?.code || null);
    }
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
      id: activeSessionRecordIdRef.current || "",
      caseItem: selectedCase,
      history,
      report,
      sessionNumber,
      preSessionPlan: normalizePreSessionPlan(preSessionPlan, { caseItem: selectedCase, sessionNumber }),
      clinicalArtifacts,
      clinicalDecision,
      clinicalPlanEvaluation,
      status: "completed"
    });
    const saveResult = await saveSessionHistory(sessionRecord);
    setSessionRecords((current) => mergeSessionRecordList(current, sessionRecord));
    updateActiveSessionRecordId("");
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
    updateActiveSessionRecordId("");
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

  if (isAccessGateRequired && !authSession) {
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

  if (isAccessGateRequired && authSession && approvalState.status !== "approved") {
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
          sessionRecords={sessionRecords}
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

function findResumableSessionRecord(records = [], caseId, sessionNumber) {
  return records
    .filter((record) =>
      record?.status === "in_progress" &&
      record.caseId === caseId &&
      Number(record.sessionNumber) === Number(sessionNumber) &&
      Array.isArray(record.conversationHistory) &&
      record.conversationHistory.length > 0
    )
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())[0] || null;
}

function findLatestResumableSessionRecord(records = [], caseId) {
  return records
    .filter((record) =>
      record?.status === "in_progress" &&
      record.caseId === caseId &&
      Array.isArray(record.conversationHistory) &&
      record.conversationHistory.length > 0
    )
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())[0] || null;
}

function resolveInitialHistoryForSession({
  nextScreen,
  safeSession,
  nextCase,
  previousSummary,
  processTotal,
  resumeRecord
}) {
  if (nextScreen === screens.simulation && resumeRecord?.conversationHistory?.length) {
    return resumeRecord.conversationHistory;
  }
  if (nextScreen === screens.simulation && safeSession > 1) {
    return [createSessionPrelude(nextCase, safeSession, previousSummary, processTotal)];
  }
  return [];
}

function mergeSessionRecordList(records = [], nextRecord = null) {
  if (!nextRecord?.id) return records;
  const merged = new Map();
  for (const record of [...records, nextRecord].filter(Boolean)) {
    const current = merged.get(record.id);
    const currentTime = current ? new Date(current.updatedAt || current.createdAt).getTime() : 0;
    const nextTime = new Date(record.updatedAt || record.createdAt).getTime();
    if (!current || nextTime >= currentTime) merged.set(record.id, record);
  }
  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
  );
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
