import { NextResponse } from "next/server"
import { z } from "zod"

import { createTaskComment } from "@/lib/server/assigned-workspace"
import { createClient } from "@/lib/supabase/server"

const commentSchema = z.object({
  body: z.string().trim().min(1).max(5000),
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
  const parsed = commentSchema.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid comment payload." }, { status: 400 })
  }

  try {
    await createTaskComment(user, taskId, parsed.data.body)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to add comment." },
      { status: user ? 400 : 401 }
    )
  }
}
