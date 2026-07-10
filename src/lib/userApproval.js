import { isSupabaseConfigured, supabase } from "./supabaseClient.js";

const PROFILE_FIELDS = "id,email,approved";

export async function getOrCreateUserApproval(user) {
  if (!isSupabaseConfigured || !supabase || !user?.id) {
    return approvalError("No se pudo verificar el perfil de acceso.", "configuration");
  }

  console.info("[auth-gate] user id:", safeLogValue(user.id));
  console.info("[auth-gate] user email:", safeLogValue(user.email));
  console.info("[auth-gate] query started");

  const profileById = await fetchUserProfileById(user.id);
  if (profileById.error) {
    logProfileError(profileById.error);
    if (isTransientApprovalError(profileById.error)) {
      return approvalTransientError("Sin conexión. Conservaremos tu sesión mientras recuperamos el acceso.");
    }
  } else if (profileById.data) {
    logProfileData(profileById.data);
    return mapProfileApproval(profileById.data);
  }

  const profileByEmail = await fetchUserProfileByEmail(user.email);
  if (profileByEmail.error) {
    logProfileError(profileByEmail.error);
    if (isTransientApprovalError(profileByEmail.error)) {
      return approvalTransientError("Sin conexión. Conservaremos tu sesión mientras recuperamos el acceso.");
    }
    return approvalError("No se pudo verificar el estado de aprobación.", "server");
  }

  if (profileByEmail.data) {
    logProfileData(profileByEmail.data);
    return mapProfileApproval(profileByEmail.data);
  }

  console.info("[auth-gate] profile found:", false);
  console.info("[auth-gate] profile approved:", false);
  return approvalError("No se encontró un perfil de acceso para esta cuenta.", "not_found");
}

async function fetchUserProfileById(userId) {
  return supabase
    .from("user_profiles")
    .select(PROFILE_FIELDS)
    .eq("id", userId)
    .maybeSingle();
}

async function fetchUserProfileByEmail(email) {
  if (!email) return { data: null, error: null };
  return supabase
    .from("user_profiles")
    .select(PROFILE_FIELDS)
    .eq("email", email)
    .maybeSingle();
}

function mapProfileApproval(profile) {
  return {
    status: profile.approved === true ? "approved" : "pending",
    profile,
    error: null,
    errorType: profile.approved === true ? "" : "not_approved"
  };
}

function approvalError(message, errorType = "server") {
  return {
    status: "error",
    profile: null,
    error: message,
    errorType
  };
}

function approvalTransientError(message) {
  return {
    status: "transient_error",
    profile: null,
    error: message,
    errorType: "network"
  };
}

function isTransientApprovalError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  const name = String(error?.name || "").toLowerCase();
  return (
    name.includes("typeerror") ||
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network request failed") ||
    message.includes("load failed") ||
    message.includes("fetch")
  );
}

function logProfileData(profile) {
  console.info("[auth-gate] profile data:", sanitizeProfile(profile));
  console.info("[auth-gate] profile found:", Boolean(profile));
  console.info("[auth-gate] profile approved:", profile?.approved === true);
}

function logProfileError(error) {
  console.error("[auth-gate] profile error message:", safeLogValue(error?.message || error));
  console.error("[auth-gate] profile error code:", safeLogValue(error?.code));
}

function sanitizeProfile(profile) {
  if (!profile) return null;
  return {
    id: safeLogValue(profile.id),
    email: safeLogValue(profile.email),
    approved: profile.approved === true
  };
}

function safeLogValue(value) {
  return String(value ?? "").slice(0, 240);
}
