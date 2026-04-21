"use client"

import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/database.types"
import { getSupabaseEnv } from "@/lib/supabase/shared"

declare global {
  var __assignedSupabaseBrowserClient__: SupabaseClient<Database> | undefined
}

export function createClient() {
  if (globalThis.__assignedSupabaseBrowserClient__) {
    return globalThis.__assignedSupabaseBrowserClient__
  }

  const { supabaseUrl, supabasePublishableKey } = getSupabaseEnv()

  globalThis.__assignedSupabaseBrowserClient__ = createBrowserClient(
    supabaseUrl,
    supabasePublishableKey
  )

  return globalThis.__assignedSupabaseBrowserClient__
}
