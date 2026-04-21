import { NextResponse } from "next/server"
import { z } from "zod"

import { getTeamDetail, updateTeam } from "@/lib/server/assigned-team"
import { createClient } from "@/lib/supabase/server"

const teamSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).default(""),
  leadUserId: z.string().uuid().nullable().optional(),
  parentDepartment: z.string().trim().max(120).default(""),
  defaultProjectIds: z.array(z.string().uuid()).default([]),
  color: z.string().trim().max(32).default("#1f7a53"),
  icon: z.string().trim().max(60).default("layers"),
})

export async function GET(
  _request: Request,
  context: { params: Promise<{ teamId: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { teamId } = await context.params

  try {
    const data = await getTeamDetail(user, teamId)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load the team." },
      { status: user ? 400 : 401 }
    )
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ teamId: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { teamId } = await context.params
  const parsed = teamSchema.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid team payload." }, { status: 400 })
  }

  try {
    await updateTeam(user, teamId, {
      ...parsed.data,
      leadUserId: parsed.data.leadUserId ?? null,
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update the team." },
      { status: user ? 400 : 401 }
    )
  }
}
