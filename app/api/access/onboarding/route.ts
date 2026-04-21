import { NextResponse } from "next/server"
import { z } from "zod"

import { buildAssignedDisplayName } from "@/lib/assigned-access"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

const onboardingSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().max(80).default(""),
  phone: z.string().trim().max(40).nullable().optional(),
  timezone: z.string().trim().min(1).max(80),
  avatarUrl: z.string().trim().max(2_000_000).nullable().optional(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 })
  }

  const parsed = onboardingSchema.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid onboarding payload." }, { status: 400 })
  }

  const admin = createAdminClient()
  const email = user.email ?? ""
  const updateResult = await admin
    .from("assigned_user_profiles")
    .update({
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      display_name: buildAssignedDisplayName(parsed.data.firstName, parsed.data.lastName, email),
      phone: parsed.data.phone ?? null,
      timezone: parsed.data.timezone,
      avatar_url: parsed.data.avatarUrl ?? null,
      onboarding_completed: true,
    })
    .eq("user_id", user.id)

  if (updateResult.error) {
    return NextResponse.json({ error: updateResult.error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
