import { NextResponse } from "next/server"
import { z } from "zod"

import { assignedTaskPriorityOptions, assignedTaskStatusOptions } from "@/lib/task-data"
import { createTask } from "@/lib/server/assigned-workspace"
import { createClient } from "@/lib/supabase/server"

const taskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).nullable().optional(),
  assigneeUserId: z.string().uuid(),
  category: z.string().trim().min(1).max(100),
  projectId: z.string().uuid().nullable().optional(),
  dueDate: z.string().trim().nullable().optional(),
  status: z.enum(assignedTaskStatusOptions).optional(),
  priority: z.enum(assignedTaskPriorityOptions).nullable().optional(),
  attachmentUrl: z.string().trim().max(5000).nullable().optional(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const parsed = taskSchema.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid task payload." }, { status: 400 })
  }

  try {
    const result = await createTask(user, parsed.data)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create the task." },
      { status: user ? 400 : 401 }
    )
  }
}
