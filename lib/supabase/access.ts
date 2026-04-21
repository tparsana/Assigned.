import type { SupabaseClient, User } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/database.types"

export async function getCurrentUserAccess(
  supabase: SupabaseClient<Database>,
  user: User
) {
  const [profileResult, membershipResult] = await Promise.all([
    supabase
      .from("assigned_user_profiles")
      .select("user_id, onboarding_completed")
      .eq("user_id", user.id)
      .maybeSingle<{ user_id: string; onboarding_completed: boolean }>(),
    supabase
      .from("assigned_memberships")
      .select("access_level, is_admin")
      .eq("user_id", user.id)
      .maybeSingle<{ access_level: Database["public"]["Enums"]["assigned_access_level"]; is_admin: boolean }>(),
  ])

  return {
    profile: profileResult.data ?? null,
    profileError: profileResult.error,
    membership: membershipResult.data ?? null,
    membershipError: membershipResult.error,
  }
}
