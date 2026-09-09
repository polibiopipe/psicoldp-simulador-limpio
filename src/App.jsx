import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cases, difficultyOptions } from "./data/cases.js";
import { createPatientResponse } from "./utils/responseEngine.js";
import { buildEducationalReport } from "./utils/scoring.js";
import {
  getLatestSessionSummary,
  getSessionSummariesForCase,
  mergeSessionSummaryList,
  syncSessionSummariesFromHistory
} from "./engine/sessionMemory.js";
import {
  buildSessionHistoryRecord,
  getLatestInProgressSessionForCase,
  getSessionHistoryForUser,
  saveSessionHistory,
  isSessionSaveConfirmed
} from "./engine/sessionHistory.js";
import {
  buildAppointmentRecord,
  ensureAppointmentForSession,
  findActiveAppointmentForCase,
  findReusableAppointmentForSession,
  getSimulationAppointmentById,
  getSimulationAppointments,
  isAppointmentExpired,
  saveSimulationAppointment,
  startAppointmentForPractice
} from "./engine/simulationAppointments.js";
import {
  SESSION_DURATION_MINUTES,
  MAX_STUDENT_TURNS,
  SESSION_END_REASONS,
  getRemainingSessionTime,
  getRemainingTurns,
  getZonedDateKey,
  resolveSessionEndReason
} from "./engine/simulationUsagePolicy.js";
import {
  SESSION_COUNT_LIMITS,
  buildInitialPreSessionPlan,
  normalizePreSessionPlan
} from "./engine/clinicalPreparation.js";
import { buildClinicalAgendaItem } from "./engine/clinicalAgenda.js";
import { getNextSessionNumber, getSessionOpening } from "./data/sessionPrompts.js";
import {
  getAvailableSessionNumbers,
  getCompletedSessionCount,
  getProcessSessionTotal
} from "./engine/sessionPlanUtils.js";
import { CaseSelector } from "./components/CaseSelector.jsx";
import { CaseBrief } from "./components/CaseBrief.jsx";
import { SimulationChat } from "./components/SimulationChat.jsx";
import { SessionResults } from "./components/SessionResults.jsx";
import { EthicalNotice } from "./components/EthicalNotice.jsx";
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

import { getClinicalStorageOwner, setClinicalStorageOwner } from "./engine/clinicalStorage.js";

setClinicalStorageOwner(isSupabaseConfigured ? "" : "local");

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
  const [connectionNotice, setConnectionNotice] = useState("");
  const [saveStatus, setSaveStatus] = useState(null);
  const [closureSaveState, setClosureSaveState] = useState("idle");
  const [pendingResultsExit, setPendingResultsExit] = useState(null);
  const [agendaFocusCaseId, setAgendaFocusCaseId] = useState("");
  const [agendaScheduleRequest, setAgendaScheduleRequest] = useState(null);
  const [sessionRecords, setSessionRecords] = useState([]);
  const [appointmentRecords, setAppointmentRecords] = useState([]);
  const [appointmentsStatus, setAppointmentsStatus] = useState({ loading: true, authoritative: false, error: "" });
  const appointmentsRequestRef = useRef(0);
  const [activeSessionRecordId, setActiveSessionRecordId] = useState("");
  const [activeAppointmentId, setActiveAppointmentId] = useState("");
  const [activeSessionRecordSnapshot, setActiveSessionRecordSnapshot] = useState(null);
  const [activeAppointmentSnapshot, setActiveAppointmentSnapshot] = useState(null);
  const activeSessionRecordIdRef = useRef("");
  const activeAppointmentIdRef = useRef("");
  const sessionEndedAtRef = useRef("");
  const sessionEndReasonRef = useRef("");
  const approvalStateRef = useRef(approvalState);
  const authIdentityRef = useRef("");
  const approvalVerificationRef = useRef(0);
  const closureSavingRef = useRef(false);
  const interviewBusyRef = useRef(false);
  const navigationSavingRef = useRef(false);
  const openingPracticeRef = useRef(false);
  const closureDraftRef = useRef(null);
  const [interviewBusy, setInterviewBusy] = useState(false);
  const [navigationSaving, setNavigationSaving] = useState(false);
  const [openingPractice, setOpeningPractice] = useState(false);
  const handleInterviewBusy = useCallback((busy) => {
    if (isSupabaseConfigured && authIdentityRef.current !== authSession?.user?.id) return;
    interviewBusyRef.current = busy;
    setInterviewBusy(busy);
  }, [authSession?.user?.id]);
  const captureClosureDraft = useCallback((draft) => { closureDraftRef.current = draft; }, []);

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

  function updateActiveSessionRecordId(nextId = "", record = null) {
    activeSessionRecordIdRef.current = nextId;
    setActiveSessionRecordId(nextId);
    setActiveSessionRecordSnapshot((current) => {
      if (!nextId) return null;
      if (record?.id === nextId) return record;
      return current?.id === nextId ? current : null;
    });
  }

  function updateActiveAppointmentId(nextId = "", appointment = null) {
    activeAppointmentIdRef.current = nextId;
    setActiveAppointmentId(nextId);
    setActiveAppointmentSnapshot((current) => {
      if (!nextId) return null;
      if (appointment?.id === nextId) return appointment;
      return current?.id === nextId ? current : null;
    });
  }

  function getOrCreateActiveSessionRecordId() {
    if (activeSessionRecordIdRef.current) return activeSessionRecordIdRef.current;
    const nextId = crypto.randomUUID();
    updateActiveSessionRecordId(nextId);
    return nextId;
  }

  function clearSessionEndTracking() {
    sessionEndedAtRef.current = "";
    sessionEndReasonRef.current = "";
  }

  function restoreSessionEndTracking(record = null) {
    sessionEndedAtRef.current = record?.sessionMetrics?.endedAt || "";
    sessionEndReasonRef.current = record?.sessionMetrics?.endReason || "";
  }

  useEffect(() => {
    approvalStateRef.current = approvalState;
  }, [approvalState]);

  async function verifyApprovalForUser(user, { preserveActiveAccess = true } = {}) {
    if (!user) return;
    const verificationId = ++approvalVerificationRef.current;
    const hadApprovedAccess = preserveActiveAccess && approvalStateRef.current.status === "approved";
    if (!hadApprovedAccess) {
      setAuthLoading(true);
      setApprovalState({ status: "checking", profile: null, error: null });
    }

    const nextApprovalState = await getOrCreateUserApproval(user).catch(() => ({ status: "transient_error", error: "No pudimos verificar el acceso. Revisa la conexión y reintenta." }));
    if (authIdentityRef.current !== user.id || verificationId !== approvalVerificationRef.current) return;
    const shouldPreserveActiveAccess =
      hadApprovedAccess &&
      (
        nextApprovalState.status === "transient_error" ||
        (nextApprovalState.status === "error" && !["not_found", "configuration"].includes(nextApprovalState.errorType))
      );

    if (shouldPreserveActiveAccess) {
      setConnectionNotice(
        nextApprovalState.error ||
          "Sin conexión. Conservaremos tu sesión mientras recuperamos el acceso."
      );
      setAuthLoading(false);
      return;
    }

    setConnectionNotice("");
    setApprovalState(nextApprovalState);
    setAuthLoading(false);
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

      const nextUserId = nextSession?.user?.id || "";
      authIdentityRef.current = nextUserId;
      if (getClinicalStorageOwner() !== nextUserId) {
        setClinicalStorageOwner(nextUserId);
        interviewBusyRef.current = false;
        setInterviewBusy(false);
        closureDraftRef.current = null;
        setPendingResultsExit(null);
        approvalStateRef.current = { status: "checking" };
        setHistory([]);
        setSessionSummaries([]);
        setSessionSummary(null);
        setSessionRecords([]);
        setAppointmentRecords([]);
        updateActiveSessionRecordId("");
        updateActiveAppointmentId("");
        clearSessionEndTracking();
        setSaveStatus(null);
        setClosureSaveState("idle");
        setScreen(screens.home);
      }
      setAuthSession(nextSession);
      if (!nextSession?.user) {
        setApprovalState({ status: "signed_out", profile: null, error: null });
        setAuthLoading(false);
        return;
      }

      await verifyApprovalForUser(nextSession.user, { preserveActiveAccess: true });
      if (!isMounted || requestId !== approvalRequestId) return;
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
    if (!isSupabaseConfigured || !authSession?.user) return undefined;
    function handleOnline() {
      void verifyApprovalForUser(authSession.user, { preserveActiveAccess: true });
    }
    globalThis.addEventListener?.("online", handleOnline);
    return () => {
      globalThis.removeEventListener?.("online", handleOnline);
    };
  }, [authSession?.user?.id]);

  useEffect(() => {
    const requestId = ++appointmentsRequestRef.current;
    setSessionRecords([]);
    setAppointmentRecords([]);
    if (approvalState.status !== "approved" || !authSession?.user) {
      setAppointmentsStatus({ loading: false, authoritative: false, error: "" });
      return;
    }

    let cancelled = false;
    setAppointmentsStatus({ loading: true, authoritative: false, error: "" });
    Promise.allSettled([
      getSessionHistoryForUser(authSession),
      getSimulationAppointments(authSession)
    ]).then(([records, appointments]) => {
      if (cancelled) return;
      if (records.status === "fulfilled") {
        syncSessionSummariesFromHistory(records.value, authSession.user.id);
        setSessionRecords(records.value);
        setSessionSummaries(getSessionSummariesForCase(selectedCaseId));
      } else {
        setConnectionNotice("No pudimos cargar el historial de continuidad. Puedes reintentarlo en Mis sesiones guardadas.");
      }
      if (requestId !== appointmentsRequestRef.current) return;
      if (appointments.status === "fulfilled") {
        setAppointmentRecords(appointments.value);
        setAppointmentsStatus({ loading: false, authoritative: true, error: "" });
      } else {
        setAppointmentsStatus({ loading: false, authoritative: false, error: "No pudimos cargar tus citas. Reintenta para verificar tu agenda." });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [approvalState.status, authSession?.user?.id]);

  async function getFreshAuthSessionForSimulation() {
    if (!isSupabaseConfigured || !supabase) return authSession;

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.warn("[auth] simulation session error", sessionError.message);
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    const currentUser = userData?.user || null;

    if (userError && (userError.status === 0 || userError.status >= 500 || /fetch|network|timeout|retryable/i.test(`${userError.name} ${userError.message}`))) {
      setConnectionNotice("No pudimos verificar tu acceso por un problema de conexión. Tu práctica se conserva; vuelve a intentarlo.");
      throw new Error("No pudimos verificar tu acceso. Revisa la conexión y reintenta.");
    }
    if (userError || !sessionData?.session || !currentUser) {
      console.warn("[auth] simulation user validation failed", {
        hasSession: Boolean(sessionData?.session),
        hasUser: Boolean(currentUser),
        errorMessage: userError?.message || sessionError?.message || ""
      });
      setAuthSession(null);
      setApprovalState({ status: "signed_out", profile: null, error: null });
      setAuthLoading(false);
      setConnectionNotice("Tu sesion de acceso expiro. Inicia sesion nuevamente para continuar esta practica.");
      const error = new Error("No pudimos validar tu sesion. Vuelve a iniciar sesion.");
      error.errorType = "AUTH_INVALID";
      error.retryAvailable = true;
      throw error;
    }

    const { data: refreshedData } = await supabase.auth.getSession();
    const nextSession = refreshedData?.session || sessionData.session;
    setAuthSession(nextSession);
    console.info("[auth] simulation session ready", {
      userId: currentUser.id,
      hasSession: Boolean(nextSession)
    });
    return nextSession;
  }

  async function resolveResumeAppointmentForRecord({
    resumeRecord,
    caseId,
    sessionNumber: targetSession,
    currentAuthSession = null
  }) {
    const safeSession = Math.max(1, Number(targetSession) || 1);
    const validatedAuthSession = currentAuthSession || await getFreshAuthSessionForSimulation();
    const appointmentId = resumeRecord?.appointmentId || "";

    console.info("[sessions] resume validation started", {
      caseId,
      sessionNumber: safeSession,
      sessionRecordId: resumeRecord?.id || "",
      hasAppointmentId: Boolean(appointmentId)
    });

    if (!appointmentId) {
      setConnectionNotice("No pudimos validar la cita asociada a esta practica. Vuelve al panel y retoma la sesion nuevamente.");
      console.warn("[sessions] resume validation failed", { reason: "APPOINTMENT_REQUIRED", caseId, sessionNumber: safeSession });
      return { ok: false, appointment: null };
    }

    let appointment =
      appointmentRecords.find((record) => record.id === appointmentId) ||
      (activeAppointmentSnapshot?.id === appointmentId ? activeAppointmentSnapshot : null);

    if (!appointment) {
      appointment = await getSimulationAppointmentById(validatedAuthSession, appointmentId);
    }

    if (!appointment) {
      setConnectionNotice("No encontramos la cita vinculada a esta practica. El historial se conserva, pero debes retomar desde una cita valida.");
      console.warn("[sessions] resume validation failed", {
        reason: "APPOINTMENT_NOT_FOUND",
        caseId,
        sessionNumber: safeSession,
        appointmentId
      });
      return { ok: false, appointment: null };
    }

    const failures = [];
    if (appointment.userId && appointment.userId !== validatedAuthSession.user.id) failures.push("USER_MISMATCH");
    if (appointment.caseId !== caseId) failures.push("CASE_MISMATCH");
    if (Number(appointment.sessionNumber) !== safeSession) failures.push("SESSION_MISMATCH");
    if (!["scheduled", "in_progress"].includes(appointment.status)) failures.push("STATUS_NOT_REUSABLE");
    if (!appointment.startedAt) failures.push("MISSING_STARTED_AT");

    if (failures.length > 0) {
      setConnectionNotice("No pudimos reanudar esta practica porque la cita guardada no coincide con tu sesion actual.");
      console.warn("[sessions] resume validation failed", {
        reason: failures.join(","),
        caseId,
        sessionNumber: safeSession,
        appointmentId,
        status: appointment.status,
        hasStartedAt: Boolean(appointment.startedAt)
      });
      return { ok: false, appointment: null };
    }

    const activeAppointment = appointment.status === "scheduled"
      ? await activateAppointmentForPractice(appointment, validatedAuthSession)
      : appointment;
    const appointmentForChat = activeAppointment || appointment;
    const remainingMs = getRemainingSessionTime(appointmentForChat, new Date());

    updateActiveAppointmentId(appointmentForChat.id, appointmentForChat);
    setAppointmentRecords((current) => mergeAppointmentRecordList(current, appointmentForChat));
    console.info("[sessions] resume validation ok", {
      caseId,
      sessionNumber: safeSession,
      appointmentId: appointmentForChat.id,
      status: appointmentForChat.status,
      hasStartedAt: Boolean(appointmentForChat.startedAt),
      remainingMs,
      expired: remainingMs <= 0
    });

    return { ok: true, appointment: appointmentForChat, remainingMs };
  }

  function resetConversation(nextScreen = screens.brief) {
    setHistory(sessionNumber > 1 ? [createSessionPrelude(selectedCase, sessionNumber, sessionSummary, sessionTotal)] : []);
    updateActiveSessionRecordId("");
    updateActiveAppointmentId("");
    clearSessionEndTracking();
    setClosureSaveState("idle");
    setScreen(nextScreen);
  }

  async function selectCase(...args) {
    if (openingPracticeRef.current) return;
    openingPracticeRef.current = true;
    setOpeningPractice(true);
    try { return await selectCaseUnchecked(...args); }
    catch (error) { setConnectionNotice(error.message || "No pudimos abrir la práctica. Revisa la conexión y reintenta."); }
    finally { openingPracticeRef.current = false; setOpeningPractice(false); }
  }

  async function selectCaseUnchecked(caseId) {
    const openingOwner = authIdentityRef.current;
    const summaries = getSessionSummariesForCase(caseId);
    const nextCase = cases.find((caseItem) => caseItem.id === caseId) || cases[0];
    const resumeRecord =
      await getLatestInProgressSessionForCase(authSession, caseId) ||
      findLatestResumableSessionRecord(sessionRecords, caseId);
    if (openingOwner !== authIdentityRef.current) return false;
    if (resumeRecord) {
      await openResumeRecord({
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
    const targetSession = buildClinicalAgendaItem(nextCase).nextSessionNumber || 1;
    const previousSummary = getPreviousSessionSummary({ caseId, sessionNumber: targetSession, sessionSummaries: summaries });
    setSelectedCaseId(caseId);
    setSessionNumber(targetSession);
    setSessionSummaries(summaries);
    setSessionSummary(previousSummary);
    setPreSessionPlan(buildInitialPreSessionPlan({ caseItem: nextCase, sessionNumber: targetSession, basePlan }));
    setHistory([]);
    updateActiveSessionRecordId("");
    updateActiveAppointmentId("");
    clearSessionEndTracking();
    setClosureSaveState("idle");
    setScreen(screens.brief);
  }

  async function openCaseFromAgenda(...args) {
    if (openingPracticeRef.current) return;
    openingPracticeRef.current = true;
    setOpeningPractice(true);
    try { return await openCaseFromAgendaUnchecked(...args); }
    catch (error) { setConnectionNotice(error.message || "No pudimos abrir la práctica. Revisa la conexión y reintenta."); }
    finally { openingPracticeRef.current = false; setOpeningPractice(false); }
  }

  async function openCaseFromAgendaUnchecked(caseId, targetSession = 1, nextScreen = screens.brief) {
    const openingOwner = authIdentityRef.current;
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
    if (openingOwner !== authIdentityRef.current) return false;
    if (resumeRecord) {
      await openResumeRecord({
        caseId,
        nextCase,
        summaries,
        resumeRecord
      });
      return;
    }

    nextScreen = screens.brief;
    setClosureSaveState("idle");
    setSelectedCaseId(caseId);
    setSessionNumber(safeSession);
    setSessionSummaries(summaries);
    setSessionSummary(previousSummary);
    setPreSessionPlan(nextPlan);
    setSaveStatus(null);
    updateActiveSessionRecordId(nextScreen === screens.simulation && resumeRecord ? resumeRecord.id : "");
    updateActiveAppointmentId(
      nextScreen === screens.simulation
        ? findActiveAppointmentForCase(appointmentRecords, caseId, safeSession)?.id || ""
        : ""
    );
    setHistory(resolveInitialHistoryForSession({
      nextScreen,
      safeSession,
      nextCase,
      previousSummary,
      processTotal,
      resumeRecord
    }));
    clearSessionEndTracking();
    setScreen(nextScreen);
  }

  async function startSession(...args) {
    if (openingPracticeRef.current) return;
    openingPracticeRef.current = true;
    setOpeningPractice(true);
    try { return await startSessionUnchecked(...args); }
    catch (error) { setConnectionNotice(error.message || "No pudimos abrir la práctica. Revisa la conexión y reintenta."); }
    finally { openingPracticeRef.current = false; setOpeningPractice(false); }
  }

  async function startSessionUnchecked(session, planOverride = null) {
    const openingOwner = authIdentityRef.current;
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
    if (openingOwner !== authIdentityRef.current) return false;
    if (resumeRecord) {
      return await openResumeRecord({
        caseId: selectedCase.id,
        nextCase: selectedCase,
        summaries: sessionSummaries,
        resumeRecord,
        preSessionPlanOverride: normalizedPlan
      });
    }
    setSessionNumber(session);
    setSessionSummary(summary);
    setPreSessionPlan(normalizedPlan);
    updateActiveSessionRecordId(resumeRecord?.id || "");
    const reusableAppointment = findActiveAppointmentForCase(appointmentRecords, selectedCase.id, session);
    updateActiveAppointmentId(reusableAppointment?.id || "", reusableAppointment);
    setHistory(
      resumeRecord?.conversationHistory?.length
        ? resumeRecord.conversationHistory
        : session > 1
          ? [createSessionPrelude(selectedCase, session, summary, sessionTotal)]
          : []
    );
    setSaveStatus(null);
    setClosureSaveState("idle");
    clearSessionEndTracking();
    setScreen(screens.simulation);
    return true;
  }

  async function openResumeRecord({
    caseId,
    nextCase,
    summaries,
    resumeRecord,
    preSessionPlanOverride = null
  }) {
    const resumeOwner = authIdentityRef.current;
    const resumeSession = Number(resumeRecord.sessionNumber) || 1;
    const previousSummary = getPreviousSessionSummary({
      caseId,
      sessionNumber: resumeSession,
      sessionSummaries: summaries
    });
    const latestSummary = summaries.at(-1);
    const basePlan = resumeRecord.feedback?.preSessionPlan || resumeRecord.summary?.preSessionPlan || buildBasePlanFromSummary(previousSummary || latestSummary);
    const nextPlan =
      preSessionPlanOverride ||
      buildInitialPreSessionPlan({
        caseItem: nextCase,
        sessionNumber: resumeSession,
        basePlan
      });

    let resumeAppointment = null;
    if (resumeRecord.status !== "closure_pending") {
      let resumeValidation = null;
      try {
        resumeValidation = await resolveResumeAppointmentForRecord({
          resumeRecord,
          caseId,
          sessionNumber: resumeSession
        });
      } catch (error) {
        console.warn("[sessions] resume validation error", {
          message: error?.message || String(error || ""),
          errorType: error?.errorType || ""
        });
        setConnectionNotice(error?.message || "No pudimos validar tu sesion. Vuelve a iniciar sesion.");
        return;
      }
      if (!resumeValidation.ok) return;
      resumeAppointment = resumeValidation.appointment;
    }

    if (resumeOwner !== authIdentityRef.current) return false;
    console.log("[sessions] resume open chat", {
      caseId,
      sessionNumber: resumeSession,
      recordId: resumeRecord.id,
      appointmentId: resumeAppointment?.id || resumeRecord.appointmentId || ""
    });
    setSelectedCaseId(caseId);
    setSessionNumber(resumeSession);
    setSessionSummaries(summaries);
    setSessionSummary(previousSummary);
    setPreSessionPlan(nextPlan);
    setHistory(resumeRecord.conversationHistory || []);
    updateActiveSessionRecordId(resumeRecord.id, resumeRecord);
    updateActiveAppointmentId(
      resumeAppointment?.id ||
        resumeRecord.appointmentId ||
        findActiveAppointmentForCase(appointmentRecords, caseId, resumeSession)?.id ||
        "",
      resumeAppointment
    );
    setSaveStatus(null);
    setSessionRecords((current) => mergeSessionRecordList(current, resumeRecord));
    setClosureSaveState(resumeRecord.status === "closure_pending" ? "pending" : "idle");
    if (resumeRecord.status === "closure_pending") {
      restoreSessionEndTracking(resumeRecord);
    } else {
      clearSessionEndTracking();
    }
    if (resumeRecord.status === "closure_pending") {
      setScreen(screens.results);
      return true;
    }
    setScreen(screens.simulation);
    return true;
  }

  function beginSessionFromPreparation(session, preparationState = {}) {
    const nextPlan = normalizePreSessionPlan(
      {
        ...preSessionPlan,
        ...preparationState
      },
      { caseItem: selectedCase, sessionNumber: session }
    );
    return startSession(session, nextPlan);
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
    updateActiveAppointmentId("");
    clearSessionEndTracking();
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
    updateActiveAppointmentId("");
    clearSessionEndTracking();
    setSessionNumber(1);
    setSessionSummary(null);
    setSessionSummaries(summaries);
    setPreSessionPlan(buildInitialPreSessionPlan({ caseItem: selectedCase, sessionNumber: 1, basePlan }));
    setSaveStatus(null);
    setClosureSaveState("idle");
    setScreen(screens.home);
  }

  async function handleAsk(question, selectedInterventionType = "", conversationContext = {}) {
    const turnId = conversationContext.interventionId || crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const sessionRecordId = getOrCreateActiveSessionRecordId();
    const currentAuthSession = await getFreshAuthSessionForSimulation();
    const appointment = await ensureActiveAppointmentForCurrentSession(currentAuthSession);
    let response = null;
    try {
      response = await createPatientResponse({
        caseItem: selectedCase,
        difficulty,
        question,
        history,
        sessionNumber,
        authSession: currentAuthSession,
        sessionRecordId,
        appointmentId: appointment?.id || "",
        interventionId: turnId,
        selectedInterventionType,
        previousSessionSummary: sessionSummary,
        conversationStage: conversationContext.conversationStage || null
      });
    } catch (error) {
      if (error?.errorType === "AUTH_INVALID" && authIdentityRef.current === currentAuthSession?.user?.id) {
        setAuthSession(null);
        setApprovalState({ status: "signed_out", profile: null, error: null });
        setAuthLoading(false);
        setConnectionNotice("Tu sesion de acceso expiro. Inicia sesion nuevamente para continuar esta practica.");
      }
      throw error;
    }
    const responseText = String(response?.text || "").trim();
    if (!responseText) {
      throw new Error("La respuesta del paciente llegó vacía. Intenta reenviar la intervención.");
    }

    const nextEntry = {
        id: turnId,
        question,
        answer: responseText,
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
    if (activeSessionRecordIdRef.current !== sessionRecordId ||
        (isSupabaseConfigured && authIdentityRef.current !== currentAuthSession?.user?.id)) {
      throw new Error("La sesión cambió mientras llegaba la respuesta. Retoma la práctica desde el inicio.");
    }
    const nextHistory = [...history, nextEntry];
    setHistory(nextHistory);
    void persistSessionProgress(nextHistory, { recordId: sessionRecordId, appointment });
    void refreshAppointments(currentAuthSession);

    return responseText;
  }

  async function refreshAppointments(currentAuthSession = authSession) {
    const requestId = ++appointmentsRequestRef.current;
    setAppointmentsStatus((current) => ({ ...current, loading: true, error: "" }));
    try {
      const appointments = await getSimulationAppointments(currentAuthSession);
      if (requestId !== appointmentsRequestRef.current) return null;
      setAppointmentRecords(appointments);
      setAppointmentsStatus({ loading: false, authoritative: true, error: "" });
      return appointments;
    } catch {
      if (requestId === appointmentsRequestRef.current) {
        setAppointmentsStatus({ loading: false, authoritative: false, error: "No pudimos actualizar tus citas. Conservamos la última agenda verificada. Reintenta antes de programar." });
      }
      return null;
    }
  }

  function applyConfirmedAgendaChange(update) {
    ++appointmentsRequestRef.current;
    setAppointmentRecords(update);
    setAppointmentsStatus({ loading: false, authoritative: true, error: "" });
  }

  function getCurrentAppointmentForSession({ includeExpired = true } = {}) {
    const byActiveId =
      activeAppointmentIdRef.current &&
      (appointmentRecords.find((appointment) => appointment.id === activeAppointmentIdRef.current) ||
        (activeAppointmentSnapshot?.id === activeAppointmentIdRef.current ? activeAppointmentSnapshot : null));
    if (byActiveId && (includeExpired || !isAppointmentExpired(byActiveId))) return byActiveId;

    const activeRecord =
      activeSessionRecordIdRef.current &&
      (sessionRecords.find((record) => record.id === activeSessionRecordIdRef.current) ||
        (activeSessionRecordSnapshot?.id === activeSessionRecordIdRef.current ? activeSessionRecordSnapshot : null));
    const bySessionRecord =
      activeRecord?.appointmentId &&
      appointmentRecords.find((appointment) => appointment.id === activeRecord.appointmentId);
    if (bySessionRecord && (includeExpired || !isAppointmentExpired(bySessionRecord))) return bySessionRecord;

    if (!includeExpired) {
      return findActiveAppointmentForCase(appointmentRecords, selectedCase.id, sessionNumber);
    }

    return appointmentRecords
      .filter((appointment) =>
        appointment.caseId === selectedCase.id &&
        Number(appointment.sessionNumber) === Number(sessionNumber) &&
        ["scheduled", "in_progress", "closure_pending"].includes(appointment.status)
      )
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())[0] || null;
  }

  async function activateAppointmentForPractice(appointment, currentAuthSession = authSession) {
    const nextAppointment = startAppointmentForPractice(appointment);
    if (!nextAppointment) return null;

    const mustPersist =
      appointment.status !== nextAppointment.status ||
      appointment.startedAt !== nextAppointment.startedAt ||
      appointment.endsAt !== nextAppointment.endsAt;

    if (!mustPersist) {
      updateActiveAppointmentId(nextAppointment.id, nextAppointment);
      return nextAppointment;
    }

    const result = await saveSimulationAppointment(currentAuthSession, nextAppointment);
    if (!result.cloudSaved || !result.data) {
      throw new Error(result.error?.message || result.error || "No pudimos confirmar el inicio de la cita. Reintenta desde la agenda.");
    }
    const savedAppointment = result.data;
    updateActiveAppointmentId(savedAppointment.id, savedAppointment);
    setAppointmentRecords((current) => mergeAppointmentRecordList(current, savedAppointment));
    return savedAppointment;
  }

  async function ensureActiveAppointmentForCurrentSession(currentAuthSession = authSession) {
    const activeRecord =
      activeSessionRecordIdRef.current &&
      (sessionRecords.find((record) => record.id === activeSessionRecordIdRef.current) ||
        (activeSessionRecordSnapshot?.id === activeSessionRecordIdRef.current ? activeSessionRecordSnapshot : null));
    if (activeRecord?.appointmentId) {
      let linkedAppointment =
        appointmentRecords.find((appointment) => appointment.id === activeRecord.appointmentId) ||
        (activeAppointmentSnapshot?.id === activeRecord.appointmentId ? activeAppointmentSnapshot : null);
      if (!linkedAppointment) {
        linkedAppointment = await getSimulationAppointmentById(currentAuthSession, activeRecord.appointmentId);
        if (linkedAppointment) {
          setAppointmentRecords((current) => mergeAppointmentRecordList(current, linkedAppointment));
        }
      }
      if (linkedAppointment && !isAppointmentExpired(linkedAppointment)) {
        const activeAppointment = await activateAppointmentForPractice(linkedAppointment, currentAuthSession);
        if (activeAppointment) return activeAppointment;
      }
    }

    const existing =
      getCurrentAppointmentForSession({ includeExpired: false }) ||
      findReusableAppointmentForSession(appointmentRecords, selectedCase.id, sessionNumber, getZonedDateKey(new Date()));

    if (existing) {
      const activeAppointment = await activateAppointmentForPractice(existing, currentAuthSession);
      if (activeAppointment) return activeAppointment;
    }

    const today = getZonedDateKey(new Date());
    const result = await ensureAppointmentForSession({
      authSession: currentAuthSession,
      appointments: appointmentRecords,
      caseItem: selectedCase,
      sessionNumber,
      scheduledDate: today,
      scheduledTime: "09:00",
      durationMinutes: SESSION_DURATION_MINUTES
    });

    if (result?.appointment?.id) {
      const activeAppointment = await activateAppointmentForPractice(result.appointment, currentAuthSession);
      if (activeAppointment) return activeAppointment;
    }

    const refreshed = await refreshAppointments(currentAuthSession);
    const recovered = findActiveAppointmentForCase(refreshed || [], selectedCase.id, sessionNumber);
    if (recovered) {
      const activeAppointment = await activateAppointmentForPractice(recovered, currentAuthSession);
      if (activeAppointment) return activeAppointment;
    }

    throw new Error("No se pudo preparar la cita de esta sesion. Revisa la agenda antes de iniciar.");
  }

  async function persistSessionProgress(nextHistory, { recordId = "", appointment = null } = {}) {
    const nextRecordId = recordId || getOrCreateActiveSessionRecordId();
    const liveReport = buildEducationalReport(nextHistory, selectedCase);
    const sessionRecord = buildSessionHistoryRecord({
      id: nextRecordId,
      caseItem: selectedCase,
      history: nextHistory,
      report: liveReport,
      sessionNumber,
      preSessionPlan: normalizePreSessionPlan(preSessionPlan, { caseItem: selectedCase, sessionNumber }),
      appointmentId: appointment?.id || activeAppointmentIdRef.current || "",
      startedAt: appointment?.startedAt || "",
      endsAt: appointment?.endsAt || "",
      status: "in_progress"
    });

    const saveResult = await saveSessionHistory(sessionRecord, { userId: authSession?.user?.id || "local" });
    if (activeSessionRecordIdRef.current !== nextRecordId || (isSupabaseConfigured && authIdentityRef.current !== authSession?.user?.id)) return { cloudSaved: false, error: "La sesión cambió durante el guardado." };
    updateActiveSessionRecordId(nextRecordId, sessionRecord);
    setSessionRecords((current) => mergeSessionRecordList(current, sessionRecord));
    if (!saveResult.cloudSaved && saveResult.error) {
      setConnectionNotice("El último avance aún no está confirmado en la nube. Conserva esta pantalla; se reintentará al continuar o guardar el cierre.");
      console.warn("[sessions] save error message", saveResult.error?.message || saveResult.error);
      console.warn("[sessions] save error code", saveResult.error?.code || null);
    }
    return saveResult;
  }

  async function finishSession(requestedReason = "") {
    if (interviewBusyRef.current || closureSavingRef.current) return;
    closureDraftRef.current = null;
    const endedAt = new Date();
    const appointment = getCurrentAppointmentForSession({ includeExpired: true });
    sessionEndReasonRef.current = resolveSessionEndReason({
      requestedReason,
      sessionOrAppointment: appointment,
      history,
      now: endedAt
    });
    sessionEndedAtRef.current = endedAt.toISOString();
    setSaveStatus(null);
    setClosureSaveState("open");
    setScreen(screens.results);
  }

  async function startNewPracticeAfterExpiration(requestedReason = SESSION_END_REASONS.MAXIMUM_TIME) {
    sessionEndedAtRef.current = new Date().toISOString();
    sessionEndReasonRef.current = requestedReason;
    const result = await saveCompletedSession({ status: "closure_pending" });
    if (!isSessionSaveConfirmed(result)) {
      setScreen(screens.results);
      return;
    }
    setHistory(sessionNumber > 1 ? [createSessionPrelude(selectedCase, sessionNumber, sessionSummary, sessionTotal)] : []);
    updateActiveSessionRecordId("");
    updateActiveAppointmentId("");
    clearSessionEndTracking();
    setSaveStatus(null);
    setClosureSaveState("idle");
    setScreen(screens.simulation);
  }

  async function saveCompletedSession({
    clinicalDecision = null,
    clinicalPlanEvaluation = null,
    clinicalArtifacts = null,
    status = "completed"
  } = {}) {
    if (closureSavingRef.current) return { cloudSaved: false, error: "El guardado sigue en curso." };
    closureSavingRef.current = true;
    try {
      setSaveStatus({
        type: "saving",
        message: "Guardando sesion..."
      });
      if (status === "completed" && clinicalDecision && !clinicalDecision.justification?.trim()) {
        throw new Error("Fundamenta tu decisión antes de guardar los cambios del cierre.");
      }
      const appointment = getCurrentAppointmentForSession({ includeExpired: true });
      const endedAt = sessionEndedAtRef.current || new Date().toISOString();
      const endReason = sessionEndReasonRef.current || resolveSessionEndReason({
        sessionOrAppointment: appointment,
        history,
        now: new Date(endedAt)
      });
      const sessionRecord = buildSessionHistoryRecord({
        id: getOrCreateActiveSessionRecordId(),
        caseItem: selectedCase,
        history,
        report,
        sessionNumber,
        preSessionPlan: normalizePreSessionPlan(preSessionPlan, { caseItem: selectedCase, sessionNumber }),
        appointmentId: activeAppointmentIdRef.current || "",
        startedAt: appointment?.startedAt || "",
        endsAt: appointment?.endsAt || "",
        endedAt,
        endReason,
        clinicalArtifacts,
        clinicalDecision,
        clinicalPlanEvaluation,
        status
      });
      const saveResult = await saveSessionHistory(sessionRecord, { userId: authSession?.user?.id || "local" });
      if (isSupabaseConfigured && authIdentityRef.current !== authSession?.user?.id) return { cloudSaved: false, error: "La cuenta cambió durante el guardado." };
      if (!isSessionSaveConfirmed(saveResult)) {
        setSaveStatus({ type: "error", message: typeof saveResult.error === "string" ? saveResult.error : "No pudimos confirmar el cierre. Tu sesión y borrador se conservan; vuelve a guardar." });
        return saveResult;
      }
      setSessionRecords((current) => mergeSessionRecordList(current, sessionRecord));
      if (appointment && saveResult.cloudSaved) {
        setAppointmentRecords((current) => mergeAppointmentRecordList(current, {
          ...appointment, status, completedAt: saveResult.data?.[0]?.completed_at || "", updatedAt: saveResult.data?.[0]?.updated_at
        }));
      }
      updateActiveSessionRecordId(sessionRecord.id, sessionRecord);
      setClosureSaveState(status === "closure_pending" ? "pending" : "saved");
      if (saveResult.cloudSaved) {
        setSaveStatus({
          type: "success",
          message: status === "closure_pending" ? "Cierre pendiente guardado." : "Sesion guardada correctamente."
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
    } catch (error) {
      setSaveStatus({ type: "error", message: error.message || "No pudimos guardar el cierre. Tu borrador se conserva." });
      return { cloudSaved: false, error: error.message };
    } finally {
      closureSavingRef.current = false;
    }
  }

  async function saveClosurePendingSession() {
    const status = activeSessionRecordSnapshot?.status === "completed" ? "completed" : "closure_pending";
    return saveCompletedSession({ ...(closureDraftRef.current || {}), status });
  }

  async function handleSignOut() {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setConnectionNotice("No pudimos cerrar tu sesión de acceso. Revisa la conexión y vuelve a intentarlo.");
        return;
      }
    }
    setHistory([]);
    updateActiveSessionRecordId("");
    updateActiveAppointmentId("");
    setSessionNumber(1);
    setSessionSummary(null);
    setAuthSession(null);
    setApprovalState({ status: "signed_out", profile: null, error: null });
    setConnectionNotice("");
    setAuthLoading(false);
    setScreen(screens.home);
  }

  async function refreshApproval() {
    if (!authSession?.user) return;
    await verifyApprovalForUser(authSession.user, { preserveActiveAccess: true });
  }

  function openTrustCenter() {
    setScreen(screens.trustCenter);
  }

  function closeTrustCenter() {
    setScreen(screens.home);
  }

  function openClinicalAgenda(caseId = "", options = {}) {
    setAgendaFocusCaseId(typeof caseId === "string" ? caseId : "");
    setAgendaScheduleRequest(
      options?.scheduleSessionNumber
        ? {
            caseId: typeof caseId === "string" ? caseId : "",
            sessionNumber: Number(options.scheduleSessionNumber) || 1
          }
        : null
    );
    setScreen(screens.clinicalAgenda);
  }

  function navigateWorkspace(targetScreen) {
    return requestExitFromResults(targetScreen);
  }

  async function requestExitFromResults(destination = screens.home, exitAction = null) {
    if (interviewBusyRef.current || closureSavingRef.current || navigationSavingRef.current || openingPracticeRef.current) {
      setConnectionNotice("Espera a que termine la respuesta o el guardado antes de cambiar de pantalla.");
      return false;
    }
    if (destination === screen && !exitAction) return true;
    if (screen === screens.simulation && destination === screens.results) {
      await finishSession();
      return true;
    }
    if (shouldWarnBeforeLeavingResults()) {
      setPendingResultsExit({ targetScreen: destination, exitAction });
      return false;
    }
    if (screen === screens.simulation && history.some((entry) => !entry.isSessionPrelude)) {
      navigationSavingRef.current = true;
      setNavigationSaving(true);
      try {
        const result = await persistSessionProgress(history);
        if (!isSessionSaveConfirmed(result)) return false;
      } catch {
        setConnectionNotice("No pudimos guardar el avance. Conservamos la entrevista; vuelve a intentarlo antes de salir.");
        return false;
      } finally {
        navigationSavingRef.current = false;
        setNavigationSaving(false);
      }
    }
    if (typeof exitAction === "function") await exitAction();
    else performWorkspaceNavigation(destination);
    return true;
  }

  function performWorkspaceNavigation(targetScreen) {
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

  function shouldWarnBeforeLeavingResults() {
    return screen === screens.results && history.some((entry) => !entry.isSessionPrelude) && closureSaveState !== "saved";
  }

  async function leaveResultsWithPendingClosure() {
    const exitRequest = pendingResultsExit;
    const targetScreen = exitRequest?.targetScreen || screens.home;
    const result = await saveClosurePendingSession();
    if (!isSessionSaveConfirmed(result)) return;
    setPendingResultsExit(null);
    if (typeof exitRequest?.exitAction === "function") {
      exitRequest.exitAction();
      return;
    }
    performWorkspaceNavigation(targetScreen);
  }

  function cancelResultsExit() {
    setPendingResultsExit(null);
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
          onSignOut={() => requestExitFromResults(screens.home, handleSignOut)}
        navigationBusy={interviewBusy || navigationSaving || openingPractice || saveStatus?.type === "saving"}
        />
        <AppFooter onOpenTrust={openTrustCenter} />
      </main>
    );
  }

  const userEmail = isSupabaseConfigured && authSession ? authSession.user.email : "";
  const userId = isSupabaseConfigured && authSession ? authSession.user.id : "";
  const activeSessionRecordForUsage =
    activeSessionRecordId &&
    (sessionRecords.find((record) => record.id === activeSessionRecordId) ||
      (activeSessionRecordSnapshot?.id === activeSessionRecordId ? activeSessionRecordSnapshot : null));
  const activeAppointmentForUsage =
    (activeAppointmentId &&
      (appointmentRecords.find((appointment) => appointment.id === activeAppointmentId) ||
        (activeAppointmentSnapshot?.id === activeAppointmentId ? activeAppointmentSnapshot : null))) ||
    (activeSessionRecordForUsage?.appointmentId &&
      appointmentRecords.find((appointment) => appointment.id === activeSessionRecordForUsage.appointmentId)) ||
    findActiveAppointmentForCase(appointmentRecords, selectedCase.id, sessionNumber);

  return (
    <main className={`app-shell authenticated-shell ${screen === screens.simulation ? "simulation-mode" : ""}`}>
      <EthicalNotice compact={screen !== screens.home} />
      {connectionNotice && (
        <div className="connection-status-banner" role="status">
          {connectionNotice}
        </div>
      )}
      <AuthenticatedLayout
        currentScreen={screen}
        userEmail={userEmail}
        isLocalMode={!isSupabaseConfigured}
        hasEvaluation={history.length > 0}
        onNavigate={navigateWorkspace}
        onSignOut={() => requestExitFromResults(screens.home, handleSignOut)}
        navigationBusy={interviewBusy || navigationSaving || openingPractice || saveStatus?.type === "saving"}
      >

      {(navigationSaving || openingPractice) && <div className="connection-status-banner" role="status">
        {navigationSaving ? "Guardando tu avance antes de salir…" : "Preparando la sesión…"}
      </div>}
      {(appointmentsStatus.loading || appointmentsStatus.error) && (
        <div className="connection-status-banner" role={appointmentsStatus.error ? "alert" : "status"}>
          {appointmentsStatus.loading ? "Estamos verificando tus citas…" : appointmentsStatus.error}
          {appointmentsStatus.error && (
            <button className="secondary-action" type="button" onClick={() => void refreshAppointments()}>
              Reintentar carga de agenda
            </button>
          )}
        </div>
      )}

      {screen === screens.home && (
        <ClinicalDashboard
          cases={cases}
          appointments={appointmentRecords}
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
        <SavedSessions authSession={authSession} onBackHome={goHome}
          onResumeSession={(caseId, targetSession) => openCaseFromAgenda(caseId, targetSession, screens.simulation)} onHistoryChange={(records) => {
          syncSessionSummariesFromHistory(records, authSession?.user?.id || "local");
          setSessionRecords(records);
          setSessionSummaries(getSessionSummariesForCase(selectedCase.id));
        }} />
      )}

      {screen === screens.clinicalAgenda && (
        <ClinicalAgenda
          cases={cases}
          authSession={authSession}
          sessionRecords={sessionRecords}
          appointments={appointmentRecords}
          appointmentsStatus={appointmentsStatus}
          initialCaseId={agendaFocusCaseId}
          initialScheduleRequest={agendaScheduleRequest}
          onBackHome={goHome}
          onPrepareCase={(caseId, targetSession) => openCaseFromAgenda(caseId, targetSession, screens.brief)}
          onStartSession={(caseId, targetSession) => openCaseFromAgenda(caseId, targetSession, screens.simulation)}
          onAppointmentsChange={applyConfirmedAgendaChange}
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
          userId={userId}
          userEmail={userEmail}
          sessionRecordId={activeSessionRecordId}
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
          sessionUsage={buildSessionUsage({
            appointment: activeAppointmentForUsage,
            sessionRecord: activeSessionRecordForUsage,
            history
          })}
          onAsk={handleAsk}
          onFinish={finishSession}
          onRestart={() => resetConversation(screens.simulation)}
          onStartNewPractice={startNewPracticeAfterExpiration}
          onChangeCase={() => requestExitFromResults(screens.home)}
          onOpenTrust={() => requestExitFromResults(screens.trustCenter)}
          onBusyChange={handleInterviewBusy}
        />
      )}

      {screen === screens.results && (
        <section className="results-layout screen">
          {saveStatus && (
            <div className={`save-status ${saveStatus.type}`}>
              {saveStatus.message}
              {saveStatus.type === "success" && (
                <button className="secondary-action" type="button" onClick={() => requestExitFromResults(screens.savedSessions)}>
                  Ver Mis sesiones
                </button>
              )}
            </div>
          )}
          <SessionResults
            report={report}
            caseItem={selectedCase}
            history={history}
            sessionNumber={sessionNumber}
            feedbackProps={{
              onBackToInterview: () => requestExitFromResults(screens.simulation),
              onSelectCase: () => requestExitFromResults(screens.select)
            }}
            closureProps={{
              totalSessions: sessionTotal,
              previousSessionSummaries: sessionSummaries,
              preSessionPlan: normalizePreSessionPlan(preSessionPlan, { caseItem: selectedCase, sessionNumber }),
              userId,
              userEmail,
              sessionRecordId: activeSessionRecordId,
              onContinueSession: advanceToNextSession,
              onScheduleNextSession: (targetSession) => openClinicalAgenda(selectedCase.id, { scheduleSessionNumber: targetSession }),
              onBackHome: goHome,
              onRequestExit: requestExitFromResults,
              onSaveSessionRecord: saveCompletedSession,
              onDraftSnapshot: captureClosureDraft,
              initialClinicalDecision: activeSessionRecordSnapshot?.feedback?.clinicalDecision,
              initialClinicalArtifacts: activeSessionRecordSnapshot?.feedback?.clinicalArtifacts,
              onDraftChange: () => { setClosureSaveState("open"); setSaveStatus(null); }
            }}
          />
        </section>
      )}

      </AuthenticatedLayout>
      {pendingResultsExit && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="confirmation-modal closure-pending-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="closure-pending-title"
          >
            <span className="eyebrow">Cierre pendiente</span>
            <h2 id="closure-pending-title">{activeSessionRecordSnapshot?.status === "completed" ? "Tienes cambios del cierre sin guardar" : "Falta registrar la decisión clínica"}</h2>
            <p>
              {activeSessionRecordSnapshot?.status === "completed"
                ? "Guarda tus cambios antes de salir. La sesión conservará su estado completado."
                : "Puedes volver y completar la decisión, o dejar el cierre pendiente para retomarlo después."}
            </p>
            <div className="modal-actions">
              <button className="primary-action" type="button" onClick={cancelResultsExit} disabled={saveStatus?.type === "saving"}>
                Volver y registrar decisión
              </button>
              <button className="secondary-action" type="button" onClick={leaveResultsWithPendingClosure} disabled={saveStatus?.type === "saving"}>
                {activeSessionRecordSnapshot?.status === "completed" ? "Guardar cambios y salir" : "Salir y dejar pendiente"}
              </button>
            </div>
          </section>
        </div>
      )}
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
      ["in_progress", "closure_pending"].includes(record?.status) &&
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
      ["in_progress", "closure_pending"].includes(record?.status) &&
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

function mergeAppointmentRecordList(records = [], nextRecord = null) {
  if (!nextRecord?.id) return records;
  const merged = new Map();
  for (const record of [...records, nextRecord].filter(Boolean)) {
    const current = merged.get(record.id);
    const currentTime = current ? new Date(current.updatedAt || current.createdAt).getTime() : 0;
    const nextTime = new Date(record.updatedAt || record.createdAt).getTime();
    if (!current || nextTime >= currentTime) merged.set(record.id, record);
  }
  return Array.from(merged.values()).sort(
    (a, b) => new Date(a.scheduledFor || a.createdAt).getTime() - new Date(b.scheduledFor || b.createdAt).getTime()
  );
}

function buildSessionUsage({ appointment = null, sessionRecord = null, history = [] } = {}) {
  const startedAt = appointment?.startedAt || sessionRecord?.startedAt || "";
  const endsAt = appointment?.endsAt || sessionRecord?.endsAt || "";
  const durationMinutes = appointment?.durationMinutes || sessionRecord?.durationMinutes || SESSION_DURATION_MINUTES;
  const usageSource = {
    startedAt,
    endsAt,
    durationMinutes
  };

  return {
    appointmentId: appointment?.id || "",
    status: appointment?.status || "",
    startedAt,
    durationMinutes,
    remainingMs: getRemainingSessionTime(usageSource, new Date()),
    remainingTurns: getRemainingTurns(history),
    usedTurns: Math.max(0, MAX_STUDENT_TURNS - getRemainingTurns(history))
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
