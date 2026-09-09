import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { readAccessConsent } from "./accessConsentPolicy.js";

async function verifyAccount(userId) {
  if (!supabase) throw new Error("No pudimos conectar con el registro de aceptación.");
  const { data, error } = await supabase.auth.getUser();
  if (error || data?.user?.id !== userId) throw new Error("La cuenta cambió o la sesión venció. Vuelve a iniciar sesión.");
}

export async function loadAccessConsent(userId = "") {
  if (!supabase) throw new Error("No pudimos conectar con el registro de aceptación.");
  if (userId) await verifyAccount(userId);
  const result = await readAccessConsent(supabase, userId);
  if (userId) await verifyAccount(userId);
  return result;
}

export async function acceptAccessConsent({ userId, version, adult, educationalUse, dataProcessing }) {
  if (!adult || !educationalUse || !dataProcessing) throw new Error("Debes confirmar las tres declaraciones para ingresar.");
  await verifyAccount(userId);
  const result = await supabase.from("simulation_access_consents").insert({
    user_id: userId, document_version: version, adult_confirmed: true,
    educational_use_accepted: true, data_processing_accepted: true
  }).select("*").single();
  // A concurrent acceptance in another tab is safe only after reading its receipt.
  if (result.error && result.error.code !== "23505") throw new Error("No se confirmó tu aceptación. Actualiza las condiciones y vuelve a intentarlo.");
  const confirmed = await loadAccessConsent(userId);
  if (!confirmed.receipt || confirmed.document.version !== version) throw new Error("Las condiciones cambiaron o el registro no se confirmó. Actualiza para revisarlas antes de ingresar.");
  return confirmed;
}

export function useAccessConsent(userId, enabled) {
  const [state, setState] = useState({ userId: "", status: "loading", document: null, receipt: null, error: "" });
  const request = useRef(0);
  const reload = useCallback(async () => {
    const requestId = ++request.current;
    if (!enabled || !userId) return;
    setState({ userId, status: "loading", document: null, receipt: null, error: "" });
    try {
      const result = await loadAccessConsent(userId);
      if (requestId === request.current) setState({ ...result, userId, status: result.receipt ? "accepted" : "required", error: "" });
    } catch (error) {
      if (requestId === request.current) setState({ userId, status: "error", document: null, receipt: null, error: error.message });
    }
  }, [userId, enabled]);
  useEffect(() => { void reload(); return () => { request.current++; }; }, [reload]);
  const accept = useCallback(async (declarations) => {
    const requestId = request.current;
    const result = await acceptAccessConsent({ ...declarations, userId, version: state.document?.version });
    if (requestId === request.current && enabled) setState({ ...result, userId, status: "accepted", error: "" });
  }, [userId, enabled, state.document?.version]);
  const visible = state.userId === userId ? state : { userId, status: "loading", document: null, receipt: null, error: "" };
  return { ...visible, ready: enabled && state.userId === userId && state.status === "accepted", reload, accept };
}
