import { NextResponse } from "next/server"
import { z } from "zod"

import { createTeam } from "@/lib/server/assigned-team"
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

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const parsed = teamSchema.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid team payload." }, { status: 400 })
  }

  try {
    const teamId = await createTeam(user, {
      ...parsed.data,
      leadUserId: parsed.data.leadUserId ?? null,
    })
    return NextResponse.json({ ok: true, teamId })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create the team." },
      { status: user ? 400 : 401 }
    )
  }
}
