import "server-only"

import { createClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/database.types"
import { getSupabaseEnv, getSupabaseServiceRoleKey } from "@/lib/supabase/shared"

export function createAdminClient() {
  const serviceRoleKey = getSupabaseServiceRoleKey()
  const { supabaseUrl } = getSupabaseEnv()

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
