"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Trash2 } from "lucide-react"

import type { TaskSummary } from "@/lib/task-data"
import {
  assignedTaskPriorityOptions,
  assignedTaskStatusOptions,
  getTaskPriorityLabel,
  getTaskStatusLabel,
  type AssignedTaskPriority,
  type AssignedTaskStatus,
  type WorkspaceMemberOption,
  type WorkspaceProjectOption,
} from "@/lib/task-data"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type TaskFormOptions = {
  members: WorkspaceMemberOption[]
  projects: WorkspaceProjectOption[]
  categories: string[]
}

type AddTaskDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultListId?: string
  defaultBoardColumn?: string
  defaultPlannedDate?: string | null
  title?: string
  description?: string
  showCaptureOption?: boolean
  task?: TaskSummary | null
  onSuccess?: (taskId: string) => void
  onDelete?: () => void
  preferredAssigneeUserId?: string | null
  lockAssignee?: boolean
}

async function readJson<T>(response: Response) {
  return (await response.json().catch(() => ({}))) as T
}

export function AddTaskDialog({
  open,
  onOpenChange,
  defaultPlannedDate,
  title,
  description,
  task = null,
  onSuccess,
  onDelete,
  preferredAssigneeUserId = null,
  lockAssignee = false,
}: AddTaskDialogProps) {
  const router = useRouter()
  const [options, setOptions] = useState<TaskFormOptions>({
    members: [],
    projects: [],
    categories: [],
  })
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    title: "",
    description: "",
    assigneeUserId: "",
    category: "",
    projectId: "",
    dueDate: "",
    status: "open" as AssignedTaskStatus,
    priority: "" as "" | AssignedTaskPriority,
    attachmentUrl: "",
  })

  const isEditMode = Boolean(task)

  useEffect(() => {
    if (!open) {
      return
    }

    let active = true
    setLoadingOptions(true)
    setError("")

    void fetch("/api/tasks/options", { cache: "no-store" })
      .then(async (response) => {
        const payload = await readJson<TaskFormOptions & { error?: string }>(response)
        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load task options.")
        }

        if (!active) {
          return
        }

        setOptions({
          members: payload.members ?? [],
          projects: payload.projects ?? [],
          categories: payload.categories ?? [],
        })
      })
      .catch((loadError) => {
        if (!active) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load task options.")
      })
      .finally(() => {
        if (active) {
          setLoadingOptions(false)
        }
      })

    return () => {
      active = false
    }
  }, [open])

  const defaultAssigneeId = useMemo(() => {
    if (task?.assignee.userId) {
      return task.assignee.userId
    }

    if (preferredAssigneeUserId && options.members.some((member) => member.userId === preferredAssigneeUserId)) {
      return preferredAssigneeUserId
    }

    return options.members[0]?.userId ?? ""
  }, [options.members, preferredAssigneeUserId, task])

  const defaultCategory = useMemo(() => {
    if (task?.category) {
      return task.category
    }

    return options.categories[0] ?? "General"
  }, [options.categories, task])

  useEffect(() => {
    if (!open) {
      return
    }

    setForm({
      title: task?.title ?? "",
      description: task?.description ?? "",
      assigneeUserId: defaultAssigneeId,
      category: defaultCategory,
      projectId: task?.project?.id ?? "",
      dueDate: task?.dueDate?.slice(0, 10) ?? defaultPlannedDate ?? "",
      status: task?.status ?? "open",
      priority: task?.priority ?? "",
      attachmentUrl: "",
    })
  }, [defaultAssigneeId, defaultCategory, defaultPlannedDate, open, task])

  const closeDialog = () => {
    setError("")
    onOpenChange(false)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.assigneeUserId || !form.category.trim()) {
      setError("Title, assignee, and category are required.")
      return
    }

    setSaving(true)
    setError("")

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      assigneeUserId: form.assigneeUserId,
      category: form.category.trim(),
      projectId: form.projectId || null,
      dueDate: form.dueDate || null,
      status: form.status,
      priority: form.priority || null,
      attachmentUrl: form.attachmentUrl.trim() || null,
    }

    const response = await fetch(isEditMode ? `/api/tasks/${task?.id}` : "/api/tasks", {
      method: isEditMode ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const result = await readJson<{ error?: string; id?: string }>(response)
    setSaving(false)

    if (!response.ok) {
      setError(result.error ?? `Unable to ${isEditMode ? "update" : "create"} the task.`)
      return
    }

    closeDialog()
    router.refresh()
    if (result.id) {
      onSuccess?.(result.id)
    } else if (task?.id) {
      onSuccess?.(task.id)
    }
  }

  const handleDelete = async () => {
    if (!task) {
      return
    }

    setDeleting(true)
    setError("")

    const response = await fetch(`/api/tasks/${task.id}`, {
      method: "DELETE",
    })
    const result = await readJson<{ error?: string }>(response)
    setDeleting(false)

    if (!response.ok) {
      setError(result.error ?? "Unable to delete the task.")
      return
    }

    closeDialog()
    router.refresh()
    onDelete?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title ?? (isEditMode ? "Edit task" : "Create task")}</DialogTitle>
          <DialogDescription>
            {description ?? "Keep it fast. Title, assignee, and category are the only required fields."}
          </DialogDescription>
        </DialogHeader>

        {loadingOptions ? (
          <div className="flex min-h-[240px] items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading task form...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Title</label>
              <Input
                autoFocus
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="What needs to get done?"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Add context, notes, or handoff details."
                className="min-h-28"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Assignee</label>
                <select
                  value={form.assigneeUserId}
                  onChange={(event) => setForm((current) => ({ ...current, assigneeUserId: event.target.value }))}
                  disabled={lockAssignee}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
                >
                  {options.members.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.fullName}
                      {member.teamName ? ` · ${member.teamName}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Category</label>
                <select
                  value={form.category}
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
                >
                  {options.categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Project (optional)</label>
                <select
                  value={form.projectId}
                  onChange={(event) => setForm((current) => ({ ...current, projectId: event.target.value }))}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
                >
                  <option value="">No project</option>
                  {options.projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Due date</label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Status</label>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, status: event.target.value as AssignedTaskStatus }))
                  }
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
                >
                  {assignedTaskStatusOptions
                    .filter((status) => status !== "cancelled")
                    .map((status) => (
                      <option key={status} value={status}>
                        {getTaskStatusLabel(status)}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Priority</label>
                <select
                  value={form.priority}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      priority: event.target.value as "" | AssignedTaskPriority,
                    }))
                  }
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
                >
                  <option value="">No priority</option>
                  {assignedTaskPriorityOptions.map((priority) => (
                    <option key={priority} value={priority}>
                      {getTaskPriorityLabel(priority)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {!isEditMode && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Attachment URL (optional)</label>
                <Input
                  value={form.attachmentUrl}
                  onChange={(event) => setForm((current) => ({ ...current, attachmentUrl: event.target.value }))}
                  placeholder="https://..."
                />
              </div>
            )}

            {error ? <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div> : null}
          </div>
        )}

        <DialogFooter className="items-center">
          {isEditMode ? (
            <Button
              type="button"
              variant="outline"
              className="mr-auto border-destructive/20 text-destructive hover:bg-destructive/5 hover:text-destructive"
              disabled={saving || deleting}
              onClick={() => void handleDelete()}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete
            </Button>
          ) : null}
          <Button variant="ghost" onClick={closeDialog} disabled={saving || deleting}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving || deleting || loadingOptions}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isEditMode ? "Save changes" : "Create task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
