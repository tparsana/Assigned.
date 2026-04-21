import { NextResponse } from "next/server"
import { z } from "zod"

import { deleteChecklistItem, updateChecklistItem } from "@/lib/server/assigned-workspace"
import { createClient } from "@/lib/supabase/server"

const checklistPatchSchema = z.object({
  text: z.string().trim().min(1).max(500).optional(),
  isCompleted: z.boolean().optional(),
})

export async function PATCH(
  request: Request,
  context: { params: Promise<{ itemId: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { itemId } = await context.params
  const parsed = checklistPatchSchema.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid checklist update payload." }, { status: 400 })
  }

  try {
    await updateChecklistItem(user, itemId, parsed.data)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update checklist item." },
      { status: user ? 400 : 401 }
    )
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ itemId: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { itemId } = await context.params

  try {
    await deleteChecklistItem(user, itemId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete checklist item." },
      { status: user ? 400 : 401 }
    )
  }
}
