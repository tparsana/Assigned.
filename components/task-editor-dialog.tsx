"use client"

import { useEffect, useState } from "react"

import { format } from "date-fns"
import { Trash2 } from "lucide-react"

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
import { useTaskedState, type BoardColumn, type Task, type TaskPriority } from "@/lib/tasked-store"

const boardColumnOptions: Array<{ value: BoardColumn; label: string }> = [
  { value: "inbox", label: "Backlog" },
  { value: "today", label: "Today" },
  { value: "doing", label: "Doing" },
  { value: "waiting", label: "Waiting" },
  { value: "done", label: "Done" },
]

type TaskEditorDialogProps = {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskEditorDialog({ task, open, onOpenChange }: TaskEditorDialogProps) {
  const { lists, updateTask, deleteTask, moveTaskToColumn } = useTaskedState()
  const [title, setTitle] = useState("")
  const [listId, setListId] = useState("")
  const [priority, setPriority] = useState<TaskPriority>("none")
  const [plannedDate, setPlannedDate] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [estimatedMinutes, setEstimatedMinutes] = useState("")
  const [boardColumn, setBoardColumn] = useState<BoardColumn>("waiting")
  const [note, setNote] = useState("")

  useEffect(() => {
    if (!task || !open) {
      return
    }

    setTitle(task.title)
    setListId(task.listId)
    setPriority(task.priority)
    setPlannedDate(task.plannedDate ?? "")
    setDueDate(task.dueDate ?? "")
    setEstimatedMinutes(task.estimatedMinutes ? String(task.estimatedMinutes) : "")
    setBoardColumn(task.boardColumn)
    setNote(task.note ?? "")
  }, [open, task])

  const closeDialog = () => onOpenChange(false)

  const handleSave = () => {
    if (!task) {
      return
    }

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      return
    }

    updateTask(task.id, {
      title: trimmedTitle,
      listId: listId || lists[0]?.id || "",
      priority,
      plannedDate: plannedDate || null,
      dueDate: dueDate || null,
      estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : null,
      note: note.trim(),
    })

    if (boardColumn !== task.boardColumn) {
      moveTaskToColumn(task.id, boardColumn)
    }

    closeDialog()
  }

  const handleDelete = () => {
    if (!task) {
      return
    }

    if (!window.confirm(`Delete "${task.title}"?`)) {
      return
    }

    deleteTask(task.id)
    closeDialog()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
          <DialogDescription>
            Update the task details, timing, and notes in one place.
          </DialogDescription>
        </DialogHeader>

        {task ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Task name</label>
              <Input
                autoFocus
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="What needs to get done?"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">List</label>
                <select
                  value={listId}
                  onChange={(event) => setListId(event.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
                >
                  {lists.length === 0 ? (
                    <option value="">No lists yet</option>
                  ) : (
                    lists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Priority</label>
                <select
                  value={priority}
                  onChange={(event) => setPriority(event.target.value as TaskPriority)}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
                >
                  <option value="none">None</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Planned date</label>
                <Input
                  type="date"
                  value={plannedDate}
                  onChange={(event) => setPlannedDate(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Due date</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Est. minutes</label>
                <Input
                  type="number"
                  min="5"
                  step="5"
                  value={estimatedMinutes}
                  onChange={(event) => setEstimatedMinutes(event.target.value)}
                  placeholder="30"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Workflow stage</label>
                <select
                  value={boardColumn}
                  onChange={(event) => setBoardColumn(event.target.value as BoardColumn)}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
                >
                  {boardColumnOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Note</label>
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Add context, details, or reminders for this task."
                className="min-h-28"
              />
            </div>

            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
              Created {format(new Date(task.createdAt), "MMM d, yyyy")}
            </div>
          </div>
        ) : null}

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete task
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!title.trim()}>
              Save changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
