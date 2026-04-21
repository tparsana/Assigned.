import { NextResponse } from "next/server"
import { z } from "zod"

import { createTaskAttachment } from "@/lib/server/assigned-workspace"
import { createClient } from "@/lib/supabase/server"

const attachmentSchema = z.object({
  fileUrl: z.string().trim().url().max(5000),
  fileType: z.string().trim().max(200).nullable().optional(),
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
  const parsed = attachmentSchema.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid attachment payload." }, { status: 400 })
  }

  try {
    await createTaskAttachment(user, taskId, parsed.data)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to add attachment." },
      { status: user ? 400 : 401 }
    )
  }
}
