import { NextResponse } from "next/server"
import { timingSafeEqual } from "node:crypto"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

const bootstrapSchema = z.object({
  secret: z.string().trim().min(1),
})

function secretMatches(input: string, expected: string) {
  const left = Buffer.from(input)
  const right = Buffer.from(expected)

  if (left.length !== right.length) {
    return false
  }

  return timingSafeEqual(left, right)
}

export async function POST(request: Request) {
  const configuredSecret = process.env.ASSIGNED_ADMIN_ACCESS_CODE?.trim()

  if (!configuredSecret) {
    return NextResponse.json(
      { error: "Missing ASSIGNED_ADMIN_ACCESS_CODE on the server." },
      { status: 500 }
    )
  }

  const parsed = bootstrapSchema.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid bootstrap payload." }, { status: 400 })
  }

  if (!secretMatches(parsed.data.secret, configuredSecret)) {
    return NextResponse.json({ error: "The admin bootstrap code is invalid." }, { status: 403 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 })
  }

  const result = await supabase.rpc("assigned_claim_bootstrap_admin")

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true, data: result.data })
}
