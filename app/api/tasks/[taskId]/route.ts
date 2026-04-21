import { NextResponse } from "next/server"
import { z } from "zod"

import { assignedTaskPriorityOptions, assignedTaskStatusOptions } from "@/lib/task-data"
import { deleteTask, getTaskDetailData, updateTask } from "@/lib/server/assigned-workspace"
import { createClient } from "@/lib/supabase/server"

const taskPatchSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  assigneeUserId: z.string().uuid().optional(),
  category: z.string().trim().min(1).max(100).optional(),
  projectId: z.string().uuid().nullable().optional(),
  dueDate: z.string().trim().nullable().optional(),
  status: z.enum(assignedTaskStatusOptions).optional(),
  priority: z.enum(assignedTaskPriorityOptions).nullable().optional(),
})

export async function GET(
  _request: Request,
  context: { params: Promise<{ taskId: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { taskId } = await context.params

  try {
    const data = await getTaskDetailData(user, taskId)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load the task." },
      { status: user ? 400 : 401 }
    )
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ taskId: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { taskId } = await context.params
  const parsed = taskPatchSchema.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid task payload." }, { status: 400 })
  }

  try {
    await updateTask(user, taskId, parsed.data)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update the task." },
      { status: user ? 400 : 401 }
    )
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ taskId: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { taskId } = await context.params

  try {
    await deleteTask(user, taskId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete the task." },
      { status: user ? 400 : 401 }
    )
  }
}
