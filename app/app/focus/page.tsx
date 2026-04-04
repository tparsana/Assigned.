"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  formatPomodoroClock,
  getPomodoroModeLabel,
  getPomodoroRemainingSeconds,
  getTaskListName,
  isPomodoroSessionActive,
  useTaskedState,
  type PomodoroMode,
  type Task,
} from "@/lib/tasked-store"
import { ArrowLeft, CheckCircle2, Clock, Pause, Play, RotateCcw, X } from "lucide-react"

const MODE_SEQUENCE: PomodoroMode[] = ["focus", "shortBreak", "longBreak"]

const MODE_COPY: Record<PomodoroMode, { label: string; description: string; action: string }> = {
  focus: {
    label: "Focus",
    description: "Quiet the rest. Do one meaningful thing without switching.",
    action: "Start focus block",
  },
  shortBreak: {
    label: "Short break",
    description: "Step away briefly so the next block still feels sharp.",
    action: "Start short break",
  },
  longBreak: {
    label: "Long break",
    description: "Reset properly, stretch, and come back with a clear head.",
    action: "Start long break",
  },
}

function sortFocusTasks(tasks: Task[], todayKey: string) {
  const priorityRank = { high: 0, medium: 1, low: 2, none: 3 }

  return [...tasks].sort((left, right) => {
    const leftDoing = left.boardColumn === "doing" ? 0 : 1
    const rightDoing = right.boardColumn === "doing" ? 0 : 1
    if (leftDoing !== rightDoing) {
      return leftDoing - rightDoing
    }

    const leftToday = left.plannedDate === todayKey ? 0 : 1
    const rightToday = right.plannedDate === todayKey ? 0 : 1
    if (leftToday !== rightToday) {
      return leftToday - rightToday
    }

    const priorityDifference = priorityRank[left.priority] - priorityRank[right.priority]
    if (priorityDifference !== 0) {
      return priorityDifference
    }

    return (left.estimatedMinutes ?? 0) - (right.estimatedMinutes ?? 0)
  })
}

function getCycleMarkerPosition(angle: number, radius: number) {
  const radians = ((angle - 90) * Math.PI) / 180

  return {
    left: `${50 + Math.cos(radians) * radius}%`,
    top: `${50 + Math.sin(radians) * radius}%`,
  }
}

function FocusDial({
  timeLabel,
  mode,
  progress,
  completedFocusSessions,
  status,
  selectedTaskTitle,
}: {
  timeLabel: string
  mode: PomodoroMode
  progress: number
  completedFocusSessions: number
  status: "idle" | "running" | "paused" | "completed"
  selectedTaskTitle: string
}) {
  const size = 520
  const radius = 186
  const circumference = 2 * Math.PI * radius
  const strokeOffset = circumference * (1 - progress)
  const cycleFillCount =
    completedFocusSessions > 0 && completedFocusSessions % 4 === 0
      ? 4
      : completedFocusSessions % 4

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[34rem]">
      <div className="absolute -left-[22%] top-[-20%] h-[136%] w-[136%] rounded-full border border-foreground/6 shadow-[0_30px_120px_rgba(28,28,28,0.08)]" />
      <div className="absolute left-[6%] top-[6%] h-[88%] w-[88%] rounded-full border border-foreground/5" />
      <div className="absolute left-[13%] top-[13%] h-[74%] w-[74%] rounded-full border border-foreground/4" />

      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="tasked-focus-progress" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--foreground)" stopOpacity="0.92" />
            <stop offset="100%" stopColor="var(--foreground)" stopOpacity="0.28" />
          </linearGradient>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--foreground)"
          strokeOpacity="0.08"
          strokeWidth="8"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#tasked-focus-progress)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />

        {Array.from({ length: 12 }).map((_, index) => {
          const angle = -70 + index * 12
          const outerRadius = radius + 6
          const innerRadius = radius - 8
          const radians = ((angle - 90) * Math.PI) / 180
          const x1 = size / 2 + Math.cos(radians) * innerRadius
          const y1 = size / 2 + Math.sin(radians) * innerRadius
          const x2 = size / 2 + Math.cos(radians) * outerRadius
          const y2 = size / 2 + Math.sin(radians) * outerRadius

          return (
            <line
              key={angle}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--foreground)"
              strokeOpacity="0.18"
              strokeWidth={index % 3 === 0 ? 2.5 : 1.5}
              strokeLinecap="round"
            />
          )
        })}
      </svg>

      {[{ label: "01", angle: 18 }, { label: "02", angle: 38 }, { label: "03", angle: 58 }, { label: "04", angle: 78 }].map(
        ({ label, angle }, index) => (
          <div
            key={label}
            className={`absolute -translate-x-1/2 -translate-y-1/2 text-[clamp(1.6rem,2vw,2.4rem)] font-semibold tracking-[-0.08em] ${
              index < cycleFillCount ? "text-foreground/70" : "text-foreground/20"
            }`}
            style={getCycleMarkerPosition(angle, 47)}
          >
            {label}
          </div>
        )
      )}

      <div className="absolute inset-0 flex flex-col items-center justify-center px-10 text-center">
        <div className="mb-4 text-[0.72rem] font-semibold uppercase tracking-[0.42em] text-muted-foreground">
          {MODE_COPY[mode].label}
        </div>
        <div className="font-mono text-[clamp(4.4rem,10vw,7.4rem)] font-semibold tracking-[-0.08em] text-foreground">
          {timeLabel}
        </div>
        <div className="mt-2 max-w-xs text-sm text-muted-foreground">
          {selectedTaskTitle}
        </div>
        <div className="mt-4 rounded-full border border-foreground/10 bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
          {status === "running"
            ? "In session"
            : status === "paused"
              ? "Paused"
              : status === "completed"
                ? "Ready for the next block"
                : "Ready when you are"}
        </div>
      </div>
    </div>
  )
}

export default function FocusPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    lists,
    tasks,
    todayKey,
    pomodoro,
    setPomodoroTask,
    setPomodoroMode,
    startPomodoro,
    pausePomodoro,
    resumePomodoro,
    resetPomodoro,
    endPomodoroSession,
  } = useTaskedState()

  const [timerNow, setTimerNow] = useState(() => Date.now())
  const [exitDialogOpen, setExitDialogOpen] = useState(false)

  useEffect(() => {
    if (pomodoro.status !== "running") {
      return
    }

    setTimerNow(Date.now())
    const interval = window.setInterval(() => setTimerNow(Date.now()), 1000)

    return () => window.clearInterval(interval)
  }, [pomodoro.status, pomodoro.endsAt])

  const returnPath = useMemo(() => {
    const candidate = searchParams.get("from")
    if (!candidate || !candidate.startsWith("/app") || candidate === "/app/focus") {
      return "/app"
    }

    return candidate
  }, [searchParams])

  const incompleteTasks = useMemo(
    () => tasks.filter((task) => !task.completed),
    [tasks]
  )
  const suggestedTasks = useMemo(() => {
    const plannedTasks = incompleteTasks.filter(
      (task) =>
        task.boardColumn === "doing" ||
        task.boardColumn === "today" ||
        task.plannedDate === todayKey
    )

    return sortFocusTasks(plannedTasks.length > 0 ? plannedTasks : incompleteTasks, todayKey)
  }, [incompleteTasks, todayKey])
  const selectedTask = tasks.find((task) => task.id === pomodoro.selectedTaskId) ?? null
  const taskOptions = useMemo(() => {
    if (!selectedTask || suggestedTasks.some((task) => task.id === selectedTask.id)) {
      return suggestedTasks
    }

    return [selectedTask, ...suggestedTasks]
  }, [selectedTask, suggestedTasks])

  const remainingSeconds = getPomodoroRemainingSeconds(pomodoro, timerNow)
  const totalSeconds = Math.max(pomodoro.startedWithSeconds, remainingSeconds, 1)
  const progress = Math.min(1, Math.max(0, 1 - remainingSeconds / totalSeconds))
  const isSessionActive = isPomodoroSessionActive(pomodoro)
  const selectedTaskTitle =
    selectedTask?.title ??
    (pomodoro.mode === "focus" ? "Pick one task and stay with it." : "Use this time to reset properly.")
  const selectedTaskMeta = selectedTask
    ? [
        getTaskListName(lists, selectedTask.listId),
        selectedTask.estimatedMinutes ? `${selectedTask.estimatedMinutes} min` : null,
      ]
        .filter(Boolean)
        .join(" • ")
    : "No task attached"

  const completionMessage =
    pomodoro.status === "completed"
      ? pomodoro.lastCompletedMode === "focus"
        ? `Focus block done. ${getPomodoroModeLabel(pomodoro.mode)} is queued next.`
        : "Break complete. Step back in with one clear target."
      : MODE_COPY[pomodoro.mode].description

  const handleExit = () => {
    if (isSessionActive) {
      setExitDialogOpen(true)
      return
    }

    router.push(returnPath)
  }

  const leaveAndContinue = () => {
    setExitDialogOpen(false)
    router.push(returnPath)
  }

  const endAndExit = () => {
    endPomodoroSession()
    setExitDialogOpen(false)
    router.push(returnPath)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.9),transparent_24%),linear-gradient(180deg,rgba(250,250,255,0.98)_0%,rgba(238,240,242,0.92)_100%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_24%),linear-gradient(180deg,rgba(28,28,28,1)_0%,rgba(35,35,35,1)_100%)]" />
      <div className="absolute left-[-18vw] top-[-32vh] h-[64rem] w-[64rem] rounded-full border border-foreground/6" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-6 pb-4 pt-6 sm:px-8 lg:px-12">
          <div
            className="text-[1.9rem] font-semibold tracking-tight text-foreground/10"
            style={{ textShadow: "0 12px 32px rgba(28, 28, 28, 0.14)" }}
          >
            Tasked.
          </div>

          <Button
            variant="ghost"
            className="rounded-full border border-foreground/10 bg-background/55 px-4 backdrop-blur-sm hover:bg-background/80"
            onClick={handleExit}
          >
            <ArrowLeft className="h-4 w-4" />
            Exit
          </Button>
        </header>

        <main className="flex flex-1 items-center px-6 pb-8 sm:px-8 lg:px-12">
          <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)] lg:items-center">
            <section className="relative">
              <FocusDial
                timeLabel={formatPomodoroClock(remainingSeconds)}
                mode={pomodoro.mode}
                progress={progress}
                completedFocusSessions={pomodoro.completedFocusSessions}
                status={pomodoro.status}
                selectedTaskTitle={selectedTaskTitle}
              />
            </section>

            <section className="mx-auto w-full max-w-xl">
              <div className="rounded-[2rem] border border-foreground/10 bg-background/65 p-5 shadow-[0_40px_120px_-60px_rgba(28,28,28,0.35)] backdrop-blur-xl sm:p-6">
                <div className="flex flex-wrap gap-2">
                  {MODE_SEQUENCE.map((mode) => {
                    const isActive = pomodoro.mode === mode

                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPomodoroMode(mode)}
                        disabled={pomodoro.status === "running"}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? "border-foreground bg-foreground text-background"
                            : "border-foreground/10 bg-background/70 text-muted-foreground hover:text-foreground"
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        {MODE_COPY[mode].label}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-6">
                  <div className="text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-muted-foreground">
                    {MODE_COPY[pomodoro.mode].label}
                  </div>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-[2.55rem]">
                    {completionMessage}
                  </h1>
                  <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
                    {MODE_COPY[pomodoro.mode].description}
                  </p>
                </div>

                <div className="mt-6 rounded-[1.5rem] border border-foreground/10 bg-background/75 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                        Task in focus
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Keep the target narrow enough to finish a meaningful slice.
                      </div>
                    </div>
                    {selectedTask ? (
                      <div className="rounded-full border border-foreground/10 px-3 py-1 text-xs text-muted-foreground">
                        {selectedTask.completed ? "Done" : "Live"}
                      </div>
                    ) : null}
                  </div>

                  <Select
                    value={selectedTask?.id ?? "none"}
                    onValueChange={(value) => setPomodoroTask(value === "none" ? null : value)}
                  >
                    <SelectTrigger className="mt-4 h-12 w-full rounded-2xl border-foreground/10 bg-background px-4">
                      <SelectValue placeholder="Choose a task" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No task attached</SelectItem>
                      {taskOptions.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-3 py-1">{selectedTaskMeta}</span>
                    <span className="rounded-full bg-muted px-3 py-1">
                      {pomodoro.completedFocusSessions} block{pomodoro.completedFocusSessions === 1 ? "" : "s"} done
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
                  {pomodoro.status === "running" ? (
                    <Button className="h-12 rounded-2xl text-base" onClick={pausePomodoro}>
                      <Pause className="h-4 w-4" />
                      Pause timer
                    </Button>
                  ) : pomodoro.status === "paused" ? (
                    <Button className="h-12 rounded-2xl text-base" onClick={resumePomodoro}>
                      <Play className="h-4 w-4" />
                      Resume timer
                    </Button>
                  ) : (
                    <Button className="h-12 rounded-2xl text-base" onClick={() => startPomodoro()}>
                      <Play className="h-4 w-4" />
                      {MODE_COPY[pomodoro.mode].action}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    className="h-12 rounded-2xl border-foreground/10 bg-background/70 px-5"
                    onClick={() => resetPomodoro()}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[1.35rem] border border-foreground/10 bg-background/75 p-4">
                    <div className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                      Status
                    </div>
                    <div className="mt-3 text-lg font-semibold text-foreground">
                      {pomodoro.status === "running"
                        ? "Locked in"
                        : pomodoro.status === "paused"
                          ? "Holding"
                          : pomodoro.status === "completed"
                            ? "Completed"
                            : "Ready"}
                    </div>
                  </div>

                  <div className="rounded-[1.35rem] border border-foreground/10 bg-background/75 p-4">
                    <div className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                      Mode
                    </div>
                    <div className="mt-3 text-lg font-semibold text-foreground">
                      {getPomodoroModeLabel(pomodoro.mode)}
                    </div>
                  </div>

                  <div className="rounded-[1.35rem] border border-foreground/10 bg-background/75 p-4">
                    <div className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                      Round
                    </div>
                    <div className="mt-3 text-lg font-semibold text-foreground">
                      {Math.min(4, (pomodoro.completedFocusSessions % 4) + 1)} / 4
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Full screen on purpose. Leave if you need to, and the session can keep running.
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

      <Dialog open={exitDialogOpen} onOpenChange={setExitDialogOpen}>
        <DialogContent className="rounded-[1.75rem] border-foreground/10 bg-background/95 p-6 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Leave focus mode?</DialogTitle>
            <DialogDescription>
              Your current timer can keep running in the background, or you can end it now and return to the app.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button variant="outline" className="border-foreground/10" onClick={() => setExitDialogOpen(false)}>
              <X className="h-4 w-4" />
              Stay here
            </Button>
            <Button variant="outline" className="border-foreground/10" onClick={leaveAndContinue}>
              <CheckCircle2 className="h-4 w-4" />
              Exit, keep session
            </Button>
            <Button onClick={endAndExit}>End session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
