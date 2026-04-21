import { NextResponse, type NextRequest } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/server"

function getSafeRedirectPath(value: string | null, fallback = "/app") {
  if (!value || !value.startsWith("/")) {
    return fallback
  }

  return value
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = getSafeRedirectPath(searchParams.get("next"), "/app")
  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })

    if (!error) {
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  const errorUrl = new URL("/auth/signin", origin)
  errorUrl.searchParams.set("error", "The authentication link is invalid or has expired.")
  return NextResponse.redirect(errorUrl)
}
