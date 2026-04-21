function normalizeEnvValue(value?: string) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function readEnv(...names: string[]) {
  for (const name of names) {
    const value = normalizeEnvValue(process.env[name])

    if (value) {
      return value
    }
  }

  return null
}

export function getSupabaseEnv() {
  const supabaseUrl =
    normalizeEnvValue(process.env.NEXT_PUBLIC_ASSIGNED_SUPABASE_URL)
    ?? normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL)

  const supabasePublishableKey =
    normalizeEnvValue(process.env.NEXT_PUBLIC_ASSIGNED_SUPABASE_PUBLISHABLE_KEY)
    ?? normalizeEnvValue(process.env.NEXT_PUBLIC_ASSIGNED_SUPABASE_ANON_KEY)
    ?? normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
    ?? normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  if (!supabaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_ASSIGNED_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL"
    )
  }

  if (!supabasePublishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_ASSIGNED_SUPABASE_PUBLISHABLE_KEY, NEXT_PUBLIC_ASSIGNED_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    )
  }

  return {
    supabaseUrl,
    supabasePublishableKey,
  }
}

export function getSupabaseServiceRoleKey() {
  const serviceRoleKey = readEnv(
    "ASSIGNED_SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY"
  )

  if (!serviceRoleKey) {
    throw new Error(
      "Missing ASSIGNED_SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY"
    )
  }

  return serviceRoleKey
}
