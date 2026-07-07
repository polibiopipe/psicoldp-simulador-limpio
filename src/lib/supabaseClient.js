import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const hasSupabaseUrl = Boolean(supabaseUrl);
const hasSupabaseAnonKey = Boolean(supabaseAnonKey);

export const supabaseConfigStatus = {
  hasUrl: hasSupabaseUrl,
  hasAnonKey: hasSupabaseAnonKey,
  urlHost: getSupabaseUrlHost(supabaseUrl),
  keyPrefix: getPublicKeyPrefix(supabaseAnonKey)
};

logSupabaseConfigStatus();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const isHostedRuntime = !isLocalRuntimeHost();
export const isAccessGateRequired = isSupabaseConfigured || import.meta.env.PROD || isHostedRuntime;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

function isLocalRuntimeHost() {
  const hostname = String(globalThis.location?.hostname || "").toLowerCase();
  return (
    hostname === "" ||
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".local")
  );
}

function getPublicKeyPrefix(key) {
  const value = String(key || "").trim();
  if (!value) return "missing";
  if (value.startsWith("sb_publishable")) return "sb_publishable";
  if (value.startsWith("eyJ")) return "jwt_anon";
  return "unknown";
}

function getSupabaseUrlHost(url) {
  try {
    return new URL(String(url || "")).host || "missing";
  } catch {
    return url ? "invalid-url" : "missing";
  }
}

function logSupabaseConfigStatus() {
  if (typeof console === "undefined") return;
  console.info(`[supabase] url present: ${hasSupabaseUrl}`);
  console.info(`[supabase] url value host: ${getSupabaseUrlHost(supabaseUrl)}`);
  console.info(`[supabase] key present: ${hasSupabaseAnonKey}`);
  console.info(`[supabase] key prefix: ${getPublicKeyPrefix(supabaseAnonKey)}`);
}
