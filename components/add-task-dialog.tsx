"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Camera, Plus } from "lucide-react"

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
import { useTaskedState, type BoardColumn, type TaskPriority } from "@/lib/tasked-store"

type AddTaskDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultListId?: string
  defaultBoardColumn?: BoardColumn
  defaultPlannedDate?: string | null
  title?: string
  description?: string
  showCaptureOption?: boolean
}

export function AddTaskDialog({
  open,
  onOpenChange,
  defaultListId,
  defaultBoardColumn,
  defaultPlannedDate,
  title = "Add task",
  description = "Create a task and place it where you need it.",
  showCaptureOption = true,
}: AddTaskDialogProps) {
  const { addTask, lists, todayKey } = useTaskedState()
  const fallbackListId = defaultListId ?? lists[0]?.id ?? ""
  const [mode, setMode] = useState<"options" | "manual">(showCaptureOption ? "options" : "manual")
  const [taskTitle, setTaskTitle] = useState("")
  const [listId, setListId] = useState(fallbackListId)
  const [priority, setPriority] = useState<TaskPriority>("medium")
  const [plannedDate, setPlannedDate] = useState(defaultPlannedDate ?? todayKey)
  const [estimatedMinutes, setEstimatedMinutes] = useState("30")

  useEffect(() => {
    if (!open) {
      return
    }

    setTaskTitle("")
    setListId(defaultListId ?? lists[0]?.id ?? "")
    setPriority("medium")
    setPlannedDate(defaultPlannedDate ?? todayKey)
    setEstimatedMinutes("30")
    setMode(showCaptureOption ? "options" : "manual")
  }, [defaultListId, defaultPlannedDate, lists, open, showCaptureOption, todayKey])

  const closeDialog = () => {
    setMode(showCaptureOption ? "options" : "manual")
    onOpenChange(false)
  }

  const handleSubmit = () => {
    const titleValue = taskTitle.trim()
    if (!titleValue) {
      return
    }

    addTask({
      title: titleValue,
      listId,
      priority,
      plannedDate: plannedDate || null,
      dueDate: plannedDate || null,
      estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : null,
      boardColumn:
        defaultBoardColumn ??
        (plannedDate === todayKey ? "today" : "waiting"),
    })

    closeDialog()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          closeDialog()
          return
        }

        onOpenChange(true)
      }}
    >
      <DialogContent className="sm:max-w-md">
        {showCaptureOption && mode === "options" ? (
          <>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-3">
              <button
                onClick={() => setMode("manual")}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/40"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium text-foreground">Manual add</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Type a task directly into your list.
                  </p>
                </div>
              </button>

              <Link
                href="/app/capture"
                onClick={closeDialog}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/40"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Camera className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium text-foreground">Capture photo</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Review and edit extracted tasks before adding them.
                  </p>
                </div>
              </Link>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{showCaptureOption ? "Manual add" : title}</DialogTitle>
              <DialogDescription>
                {showCaptureOption ? "Add a task directly to your system." : description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Task</label>
                <Input
                  autoFocus
                  value={taskTitle}
                  onChange={(event) => setTaskTitle(event.target.value)}
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
                    value={plannedDate ?? ""}
                    onChange={(event) => setPlannedDate(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Est. minutes</label>
                  <Input
                    type="number"
                    min="5"
                    step="5"
                    value={estimatedMinutes}
                    onChange={(event) => setEstimatedMinutes(event.target.value)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              {showCaptureOption ? (
                <Button variant="ghost" onClick={() => setMode("options")}>
                  Back
                </Button>
              ) : (
                <Button variant="ghost" onClick={closeDialog}>
                  Cancel
                </Button>
              )}
              <div className="flex items-center gap-2">
                {showCaptureOption && (
                  <Button variant="ghost" onClick={closeDialog}>
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={handleSubmit}
                  disabled={!taskTitle.trim()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Add Task
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
