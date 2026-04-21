import { NextResponse } from "next/server"
import { z } from "zod"

import { buildAssignedDisplayName } from "@/lib/assigned-access"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

const profilePatchSchema = z.object({
  firstName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  timezone: z.string().trim().max(80).optional(),
  avatarUrl: z.string().trim().max(2_000_000).nullable().optional(),
})

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 })
  }

  const parsed = profilePatchSchema.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid profile payload." }, { status: 400 })
  }

  const admin = createAdminClient()
  const existingProfileResult = await admin
    .from("assigned_user_profiles")
    .select("first_name, last_name, email, avatar_url, phone, timezone")
    .eq("user_id", user.id)
    .single<{
      first_name: string
      last_name: string
      email: string
      avatar_url: string | null
      phone: string | null
      timezone: string
    }>()

  if (existingProfileResult.error) {
    return NextResponse.json({ error: existingProfileResult.error.message }, { status: 500 })
  }

  const current = existingProfileResult.data
  const firstName = parsed.data.firstName ?? current.first_name
  const lastName = parsed.data.lastName ?? current.last_name
  const email = current.email

  const updateResult = await admin
    .from("assigned_user_profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
      display_name: buildAssignedDisplayName(firstName, lastName, email),
      phone: parsed.data.phone === undefined ? current.phone : parsed.data.phone,
      timezone: parsed.data.timezone ?? current.timezone,
      avatar_url: parsed.data.avatarUrl === undefined ? current.avatar_url : parsed.data.avatarUrl,
    })
    .eq("user_id", user.id)

  if (updateResult.error) {
    return NextResponse.json({ error: updateResult.error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
