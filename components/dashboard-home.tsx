"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  ListTodo,
  Calendar,
  Sparkles,
  Plus,
  ChevronRight,
  CheckCircle2,
  Clock,
  Camera,
} from "lucide-react"
import {
  formatTimeLabel,
  getScheduledBlocksForDate,
  getTasksForDate,
  useTaskedState,
} from "@/lib/tasked-store"

function hashInsightPayload(value: string) {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash.toString(16)
}

function buildFallbackInsight(
  todayTasks: Array<{ completed: boolean; dueDate: string | null }>,
  todaySchedule: Array<{ type: string }>
) {
  const openTasks = todayTasks.filter((task) => !task.completed)
  const overdueTasks = openTasks.filter(
    (task) => task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10)
  )
  const nextBlock = todaySchedule[0]

  if (overdueTasks.length > 0) {
    return "Clear one overdue task before adding anything new today."
  }

  if (nextBlock?.type === "focus") {
    return "Protect your next focus block for the hardest open task."
  }

  if (openTasks.length > 0) {
    return "Finish one meaningful task before you reorganize the rest."
  }

  return "Use the quiet space to plan tomorrow before the day closes."
}

export function DashboardHome() {
  const {
    profile,
    tasks,
    scheduleBlocks,
    ai,
    lists,
    todayKey,
    toggleTask,
    addTask,
  } = useTaskedState()

  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [addTaskMode, setAddTaskMode] = useState<"options" | "manual">("options")
  const [manualTaskTitle, setManualTaskTitle] = useState("")
  const [aiInsight, setAiInsight] = useState(
    "Your mornings are strongest. Try clearing your hardest task before noon."
  )

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  })

  const todayTasks = getTasksForDate(tasks, todayKey).sort((left, right) => {
    if (left.completed === right.completed) {
      return (left.estimatedMinutes ?? 0) - (right.estimatedMinutes ?? 0)
    }

    return left.completed ? 1 : -1
  })
  const todaySchedule = getScheduledBlocksForDate(scheduleBlocks, todayKey)
  const fallbackInsight = buildFallbackInsight(todayTasks, todaySchedule)
  const insightPayload = JSON.stringify({
    tasks: todayTasks.map((task) => ({
      title: task.title,
      completed: task.completed,
      priority: task.priority,
      dueDate: task.dueDate,
    })),
    schedule: todaySchedule.map((block) => ({
      title: block.title,
      startTime: block.startTime,
      type: block.type,
    })),
  })

  useEffect(() => {
    if (!ai.weeklyInsights) {
      setAiInsight("Turn weekly insights back on when you want AI planning nudges.")
      return
    }

    if (todayTasks.length === 0 && todaySchedule.length === 0) {
      setAiInsight(fallbackInsight)
      return
    }

    let active = true
    const cacheKey = `tasked.dashboard-insight.${todayKey}.${hashInsightPayload(insightPayload)}`
    const cachedInsight = window.sessionStorage.getItem(cacheKey)

    if (cachedInsight) {
      setAiInsight(cachedInsight)
      return
    }

    void fetch("/api/ai/dashboard-insight", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: insightPayload,
    })
      .then(async (response) => {
        const payload = (await response.json()) as { insight?: string }
        if (active && payload.insight) {
          setAiInsight(payload.insight)
          window.sessionStorage.setItem(cacheKey, payload.insight)
        }
      })
      .catch(() => {
        if (active) {
          setAiInsight(fallbackInsight)
        }
      })

    return () => {
      active = false
    }
  }, [ai.weeklyInsights, fallbackInsight, insightPayload, todayKey, todaySchedule.length, todayTasks.length])

  const closeAddTask = () => {
    setAddTaskOpen(false)
    setAddTaskMode("options")
    setManualTaskTitle("")
  }

  const handleManualTaskAdd = () => {
    const title = manualTaskTitle.trim()
    if (!title) {
      return
    }

    addTask({
      title,
      plannedDate: todayKey,
      dueDate: todayKey,
      boardColumn: "today",
      priority: "medium",
      listId: lists[0]?.id ?? "",
      estimatedMinutes: 30,
    })
    closeAddTask()
  }

  const scheduleTone = (type: string) => {
    if (type === "focus") return "bg-celeste/20"
    if (type === "meeting") return "bg-marigold/10"
    return "bg-muted"
  }

  return (
    <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-6">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
          {greeting()}, {profile.firstName}
        </h1>
        <p className="text-muted-foreground mt-1">{todayLabel}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4 gap-4">
              <div className="flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-foreground">Today&apos;s Tasks</h2>
              </div>
              <Link
                href="/app/planner"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0"
              >
                Open planner
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {todayTasks.length === 0 ? (
                <div className="p-6 rounded-lg bg-background text-center">
                  <p className="text-sm text-muted-foreground">
                    Nothing is planned for today yet.
                  </p>
                </div>
              ) : (
                todayTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-start sm:items-center gap-4 p-4 rounded-lg transition-colors ${
                      task.completed ? "bg-herb/5" : "bg-background hover:bg-muted/50"
                    }`}
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        task.completed
                          ? "border-herb bg-herb"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {task.completed && (
                        <CheckCircle2 className="w-4 h-4 text-herb-foreground" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`font-medium ${
                          task.completed
                            ? "line-through text-muted-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {task.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {task.estimatedMinutes ? `${task.estimatedMinutes} min` : "No estimate"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-foreground">Today&apos;s Schedule</h2>
              </div>
              <Link
                href="/app/calendar"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0"
              >
                Full calendar
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {todaySchedule.length === 0 ? (
                <div className="p-6 rounded-lg bg-background text-center">
                  <p className="text-sm text-muted-foreground">
                    Nothing is scheduled yet.
                  </p>
                </div>
              ) : (
                todaySchedule.map((item) => (
                  <div
                    key={item.id}
                    className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-lg ${scheduleTone(item.type)}`}
                  >
                    <div className="w-full sm:w-24 text-sm font-medium text-foreground/70 shrink-0">
                      {formatTimeLabel(item.startTime)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground">{item.title}</div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground sm:justify-end">
                      <Clock className="w-4 h-4" />
                      {formatTimeLabel(item.endTime)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-3">
              <Plus className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Add Task</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Add a task manually or capture a photo to turn notes into action.
            </p>
            <Button
              onClick={() => {
                setAddTaskOpen(true)
                setAddTaskMode("options")
              }}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Add Task
            </Button>
          </div>

          <div className="bg-primary/5 rounded-xl border border-primary/10 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-marigold" />
              <h2 className="font-semibold text-foreground">AI Insight</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {aiInsight}
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="font-semibold text-foreground mb-4">Continue</h2>
            <div className="space-y-3">
              <Link
                href="/app/planner"
                className="block p-3 bg-background rounded-lg hover:bg-muted transition-colors"
              >
                <div className="text-sm font-medium text-foreground">Daily Planner</div>
                <div className="text-xs text-muted-foreground">
                  {todayTasks.filter((task) => !task.completed).length} tasks still active today
                </div>
              </Link>
              <Link
                href="/app/capture"
                className="block p-3 bg-background rounded-lg hover:bg-muted transition-colors"
              >
                <div className="text-sm font-medium text-foreground">Capture</div>
                <div className="text-xs text-muted-foreground">
                  Scan a page and review extracted tasks before adding them
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={addTaskOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeAddTask()
            return
          }

          setAddTaskOpen(true)
        }}
      >
        <DialogContent className="sm:max-w-md">
          {addTaskMode === "options" ? (
            <>
              <DialogHeader>
                <DialogTitle>Add a task</DialogTitle>
                <DialogDescription>
                  Choose how you want to bring something into today.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-3">
                <button
                  onClick={() => setAddTaskMode("manual")}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/40"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Manual add</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Type a task directly into today&apos;s list.
                    </p>
                  </div>
                </button>

                <Link
                  href="/app/capture"
                  onClick={closeAddTask}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/40"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Capture photo</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Snap a page and review extracted tasks before adding them.
                    </p>
                  </div>
                </Link>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Manual add</DialogTitle>
                <DialogDescription>
                  Add a task directly to today&apos;s task list.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <Input
                  autoFocus
                  value={manualTaskTitle}
                  onChange={(event) => setManualTaskTitle(event.target.value)}
                  placeholder="What needs to be done today?"
                />

                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                  <Button variant="ghost" onClick={() => setAddTaskMode("options")}>
                    Back
                  </Button>
                  <div className="flex items-center justify-end gap-3">
                    <Button variant="ghost" onClick={closeAddTask}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleManualTaskAdd}
                      disabled={!manualTaskTitle.trim()}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Add Task
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
