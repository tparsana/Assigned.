"use client"

import Link from "next/link"
import { useState } from "react"
import { Loader2, Paperclip, Plus, Send, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

import type { TaskDetailData } from "@/lib/task-data"
import { AddTaskDialog } from "@/components/add-task-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CategoryBadge, PersonAvatar, PriorityBadge, ProjectBadge, StatusBadge } from "@/components/workspace/task-ui"

async function readJson<T>(response: Response) {
  return (await response.json().catch(() => ({}))) as T
}

export function TaskDetailPageView({ data }: { data: TaskDetailData }) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [checklistText, setChecklistText] = useState("")
  const [commentBody, setCommentBody] = useState("")
  const [attachmentUrl, setAttachmentUrl] = useState("")
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [error, setError] = useState("")

  const runMutation = async (key: string, run: () => Promise<Response>) => {
    setBusyKey(key)
    setError("")
    const response = await run()
    const payload = await readJson<{ error?: string }>(response)
    setBusyKey(null)

    if (!response.ok) {
      setError(payload.error ?? "Unable to save changes.")
      return false
    }

    router.refresh()
    return true
  }

  const addChecklistItem = async () => {
    if (!checklistText.trim()) {
      return
    }

    const ok = await runMutation("checklist-create", () =>
      fetch(`/api/tasks/${data.task.id}/checklist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: checklistText }),
      })
    )

    if (ok) {
      setChecklistText("")
    }
  }

  const toggleChecklistItem = async (itemId: string, nextValue: boolean) => {
    await runMutation(`checklist-${itemId}`, () =>
      fetch(`/api/tasks/checklist/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isCompleted: nextValue }),
      })
    )
  }

  const deleteChecklistItem = async (itemId: string) => {
    await runMutation(`checklist-delete-${itemId}`, () =>
      fetch(`/api/tasks/checklist/${itemId}`, {
        method: "DELETE",
      })
    )
  }

  const addComment = async () => {
    if (!commentBody.trim()) {
      return
    }

    const ok = await runMutation("comment-create", () =>
      fetch(`/api/tasks/${data.task.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body: commentBody }),
      })
    )

    if (ok) {
      setCommentBody("")
    }
  }

  const addAttachment = async () => {
    if (!attachmentUrl.trim()) {
      return
    }

    const ok = await runMutation("attachment-create", () =>
      fetch(`/api/tasks/${data.task.id}/attachments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileUrl: attachmentUrl }),
      })
    )

    if (ok) {
      setAttachmentUrl("")
    }
  }

  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="flex flex-col gap-6">
        <div className="rounded-[36px] border border-border/80 bg-card p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Task Detail</div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{data.task.title}</h1>

              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge status={data.task.status} />
                <CategoryBadge category={data.task.category} />
                <ProjectBadge task={data.task} />
                <PriorityBadge priority={data.task.priority} />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <PersonAvatar name={data.task.assignee.fullName} avatarUrl={data.task.assignee.avatarUrl} />
                  <span>{data.task.assignee.fullName}</span>
                </div>
                <div>{data.task.dueDate ? new Date(data.task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "No due date"}</div>
                {data.task.project ? <Link href={`/app/projects/${data.task.project.id}`} className="underline-offset-4 hover:underline">{data.task.project.name}</Link> : null}
              </div>
            </div>

            {data.viewer.canEdit ? (
              <Button onClick={() => setEditOpen(true)} className="rounded-full px-5">
                Edit task
              </Button>
            ) : null}
          </div>
        </div>

        {error ? <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div> : null}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <div className="space-y-5">
            <div className="rounded-[32px] border border-border/80 bg-card p-5">
              <div className="mb-3 text-lg font-medium text-foreground">Description</div>
              <div className="text-sm leading-7 text-muted-foreground">
                {data.task.description || "No description added yet."}
              </div>
            </div>

            <div className="rounded-[32px] border border-border/80 bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-lg font-medium text-foreground">Checklist</div>
                <div className="text-sm text-muted-foreground">
                  {data.task.checklist.completed}/{data.task.checklist.total}
                </div>
              </div>

              {data.viewer.canEdit ? (
                <div className="mb-4 flex gap-2">
                  <Input
                    value={checklistText}
                    onChange={(event) => setChecklistText(event.target.value)}
                    placeholder="Add checklist item"
                  />
                  <Button onClick={() => void addChecklistItem()} disabled={busyKey === "checklist-create"}>
                    {busyKey === "checklist-create" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
              ) : null}

              <div className="space-y-2">
                {data.checklistItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-background px-4 py-3">
                    <input
                      type="checkbox"
                      checked={item.isCompleted}
                      onChange={(event) => void toggleChecklistItem(item.id, event.target.checked)}
                      disabled={!data.viewer.canEdit || busyKey === `checklist-${item.id}`}
                      className="h-4 w-4"
                    />
                    <div className={`flex-1 text-sm ${item.isCompleted ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {item.text}
                    </div>
                    {data.viewer.canEdit ? (
                      <button
                        onClick={() => void deleteChecklistItem(item.id)}
                        disabled={busyKey === `checklist-delete-${item.id}`}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                      >
                        {busyKey === `checklist-delete-${item.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    ) : null}
                  </div>
                ))}
                {data.checklistItems.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-background/80 px-4 py-8 text-center text-sm text-muted-foreground">
                    No checklist items yet.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[32px] border border-border/80 bg-card p-5">
              <div className="mb-4 text-lg font-medium text-foreground">Comments / Updates</div>
              <div className="space-y-4">
                {data.comments.map((comment) => (
                  <div key={comment.id} className="rounded-3xl bg-background px-4 py-4">
                    <div className="flex items-center gap-3">
                      <PersonAvatar name={comment.user.fullName} avatarUrl={comment.user.avatarUrl} />
                      <div>
                        <div className="font-medium text-foreground">{comment.user.fullName}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm leading-7 text-muted-foreground">{comment.body}</div>
                  </div>
                ))}
                {data.comments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-background/80 px-4 py-8 text-center text-sm text-muted-foreground">
                    No comments yet.
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex flex-col gap-3">
                <Textarea
                  value={commentBody}
                  onChange={(event) => setCommentBody(event.target.value)}
                  placeholder="Add an update or note"
                  className="min-h-28"
                />
                <div className="flex justify-end">
                  <Button onClick={() => void addComment()} disabled={busyKey === "comment-create"}>
                    {busyKey === "comment-create" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Add comment
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[32px] border border-border/80 bg-card p-5">
              <div className="mb-4 text-lg font-medium text-foreground">Attachments</div>
              <div className="space-y-3">
                {data.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-3xl bg-background px-4 py-3"
                  >
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">{attachment.fileUrl}</div>
                      <div className="text-xs text-muted-foreground">
                        Added by {attachment.uploadedBy.fullName}
                      </div>
                    </div>
                  </a>
                ))}
                {data.attachments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-background/80 px-4 py-8 text-center text-sm text-muted-foreground">
                    No attachments yet.
                  </div>
                ) : null}
              </div>

              {data.viewer.canEdit ? (
                <div className="mt-4 flex gap-2">
                  <Input
                    value={attachmentUrl}
                    onChange={(event) => setAttachmentUrl(event.target.value)}
                    placeholder="Add attachment URL"
                  />
                  <Button onClick={() => void addAttachment()} disabled={busyKey === "attachment-create"}>
                    {busyKey === "attachment-create" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="rounded-[32px] border border-border/80 bg-card p-5">
              <div className="mb-4 text-lg font-medium text-foreground">Task Meta</div>
              <div className="space-y-3 text-sm">
                <div className="rounded-2xl bg-background px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Created by</div>
                  <div className="mt-2 text-foreground">{data.task.createdBy?.fullName || "Unknown"}</div>
                </div>
                <div className="rounded-2xl bg-background px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Updated</div>
                  <div className="mt-2 text-foreground">
                    {new Date(data.task.updatedAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {data.viewer.canEdit ? (
        <AddTaskDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          task={data.task}
          title="Edit task"
          description="Update assignee, category, project, or delivery details."
          onDelete={() => router.replace("/app")}
        />
      ) : null}
    </div>
  )
}
