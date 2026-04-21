import { NextResponse } from "next/server"
import { z } from "zod"

import { createPosition } from "@/lib/server/assigned-team"
import { createClient } from "@/lib/supabase/server"

const positionSchema = z.object({
  name: z.string().trim().min(1).max(120),
  teamId: z.string().uuid().nullable(),
  description: z.string().trim().max(500).default(""),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const parsed = positionSchema.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid position payload." }, { status: 400 })
  }

  try {
    await createPosition(user, parsed.data)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create the position." },
      { status: user ? 400 : 401 }
    )
  }
}
