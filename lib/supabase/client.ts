"use client"

import { createBrowserClient } from "@supabase/ssr"

import { getSupabaseEnv } from "@/lib/supabase/shared"

export function createClient() {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseEnv()

  return createBrowserClient(supabaseUrl, supabasePublishableKey)
}

