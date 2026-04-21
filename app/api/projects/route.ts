import { NextResponse } from "next/server"
import { z } from "zod"

import { createProject } from "@/lib/server/assigned-workspace"
import { createClient } from "@/lib/supabase/server"

const projectSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(4000).nullable().optional(),
  locationText: z.string().trim().max(500).nullable().optional(),
  status: z.enum(["active", "planning", "handover", "on_hold"]).optional(),
  leadUserId: z.string().uuid().nullable().optional(),
  startDate: z.string().trim().nullable().optional(),
  endDate: z.string().trim().nullable().optional(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const parsed = projectSchema.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid project payload." }, { status: 400 })
  }

  try {
    const result = await createProject(user, parsed.data)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create the project." },
      { status: user ? 400 : 401 }
    )
  }
}
