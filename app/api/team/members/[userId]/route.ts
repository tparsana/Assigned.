import { NextResponse } from "next/server"
import { z } from "zod"

import { assignedAccessLevelOptions } from "@/lib/assigned-access"
import { deleteAssignedUser } from "@/lib/server/assigned-access"
import { getTeamMemberProfile, updateMember } from "@/lib/server/assigned-team"
import { createClient } from "@/lib/supabase/server"

const memberSchema = z.object({
  fullName: z.string().trim().min(1).max(160),
  email: z.string().trim().email(),
  phone: z.string().trim().max(40).default(""),
  avatarUrl: z.string().trim().max(2000).default(""),
  accessLevel: z.enum(assignedAccessLevelOptions),
  teamId: z.string().uuid().nullable(),
  positionId: z.string().uuid().nullable(),
  managerUserId: z.string().uuid().nullable(),
  projectIds: z.array(z.string().uuid()).default([]),
  primaryProjectId: z.string().uuid().nullable(),
  availability: z.enum(["available", "busy", "on_leave"]),
  status: z.enum(["active", "inactive"]),
})

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { userId } = await context.params

  try {
    const data = await getTeamMemberProfile(user, userId)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load the user profile." },
      { status: user ? 400 : 401 }
    )
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { userId } = await context.params
  const parsed = memberSchema.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid user payload." }, { status: 400 })
  }

  try {
    await updateMember(user, userId, parsed.data)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update the user." },
      { status: user ? 400 : 401 }
    )
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { userId } = await context.params

  try {
    await deleteAssignedUser(user, userId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete the user." },
      { status: user ? 400 : 401 }
    )
  }
}
