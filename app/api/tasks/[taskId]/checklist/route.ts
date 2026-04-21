import { NextResponse } from "next/server"
import { z } from "zod"

import { createChecklistItem } from "@/lib/server/assigned-workspace"
import { createClient } from "@/lib/supabase/server"

const checklistSchema = z.object({
  text: z.string().trim().min(1).max(500),
})

export async function POST(
  request: Request,
  context: { params: Promise<{ taskId: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { taskId } = await context.params
  const parsed = checklistSchema.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid checklist item payload." }, { status: 400 })
  }

  try {
    await createChecklistItem(user, taskId, parsed.data.text)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to add checklist item." },
      { status: user ? 400 : 401 }
    )
  }
}
