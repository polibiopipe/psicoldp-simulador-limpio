import { isSupabaseConfigured, supabase } from "./supabaseClient.js";

const PROFILE_FIELDS = [
  "id",
  "email",
  "full_name",
  "approved",
  "role",
  "created_at",
  "approved_at",
  "approved_by"
].join(",");

export async function getOrCreateUserApproval(user) {
  if (!isSupabaseConfigured || !supabase || !user?.id) {
    return approvalError("No se pudo verificar el perfil de acceso.");
  }

  const profileResult = await fetchUserProfile(user.id);
  if (profileResult.error) {
    console.error("USER_APPROVAL_LOAD_ERROR", profileResult.error);
    return approvalError("No se pudo verificar el estado de aprobación.");
  }

  if (profileResult.data) return mapProfileApproval(profileResult.data);

  const pendingProfile = {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || null,
    approved: false,
    role: "student"
  };

  const { data, error } = await supabase
    .from("user_profiles")
    .insert(pendingProfile)
    .select(PROFILE_FIELDS)
    .single();

  if (!error && data) return mapProfileApproval(data);

  // The database trigger may have created the profile between both requests.
  if (error?.code === "23505") {
    const retryResult = await fetchUserProfile(user.id);
    if (!retryResult.error && retryResult.data) return mapProfileApproval(retryResult.data);
  }

  console.error("USER_APPROVAL_CREATE_ERROR", error);
  return approvalError("No se pudo crear o verificar el perfil de aprobación.");
}

async function fetchUserProfile(userId) {
  return supabase
    .from("user_profiles")
    .select(PROFILE_FIELDS)
    .eq("id", userId)
    .maybeSingle();
}

function mapProfileApproval(profile) {
  return {
    status: profile.approved === true ? "approved" : "pending",
    profile,
    error: null
  };
}

function approvalError(message) {
  return {
    status: "error",
    profile: null,
    error: message
  };
}
