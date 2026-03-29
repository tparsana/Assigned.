"use client"

import { useMemo, useState } from "react"

import { addDays, format, parseISO } from "date-fns"

import { AddTaskDialog } from "@/components/add-task-dialog"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Coffee,
  Brain,
  Users,
  AlertCircle,
  X,
} from "lucide-react"
import {
  formatLongDateLabel,
  formatTaskDateLabel,
  formatTimeLabel,
  getScheduleBlockStyle,
  getScheduledBlocksForDate,
  getUnscheduledTasksForDate,
  useTaskedState,
  type ScheduleBlock,
} from "@/lib/tasked-store"

type ViewMode = "day" | "week"

const hours = Array.from({ length: 12 }, (_, index) => index + 8)

export default function CalendarPage() {
  const {
    tasks,
    scheduleBlocks,
    scheduleTask,
    unscheduleTask,
    deleteScheduleBlock,
  } = useTaskedState()

  const [view, setView] = useState<ViewMode>("day")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [addTaskOpen, setAddTaskOpen] = useState(false)

  const currentDateKey = format(currentDate, "yyyy-MM-dd")
  const dayBlocks = useMemo(
    () => getScheduledBlocksForDate(scheduleBlocks, currentDateKey),
    [currentDateKey, scheduleBlocks]
  )
  const unscheduledTasks = useMemo(
    () => getUnscheduledTasksForDate(tasks, scheduleBlocks, currentDateKey),
    [currentDateKey, scheduleBlocks, tasks]
  )

  const getBlockIcon = (type: ScheduleBlock["type"]) => {
    switch (type) {
      case "focus":
        return Brain
      case "meeting":
        return Users
      case "break":
        return Coffee
      default:
        return Clock
    }
  }

  const getBlockTone = (type: ScheduleBlock["type"]) => {
    switch (type) {
      case "focus":
        return "bg-celeste/50 border-celeste"
      case "meeting":
        return "bg-marigold/20 border-marigold/50"
      case "break":
      case "buffer":
        return "bg-muted border-border"
      default:
        return "bg-primary/10 border-primary/30"
    }
  }

  const currentTimeIndicator = useMemo(() => {
    const now = new Date()
    if (format(now, "yyyy-MM-dd") !== currentDateKey) {
      return null
    }

    const minutesFromStart = (now.getHours() - 8) * 60 + now.getMinutes()
    if (minutesFromStart < 0 || minutesFromStart > 12 * 60) {
      return null
    }

    return `${(minutesFromStart / 60) * 80}px`
  }, [currentDateKey])

  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(currentDate, index))

  return (
    <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
            <Calendar className="w-7 h-7" />
            Time Blocking
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="border-border"
              onClick={() => setCurrentDate((date) => addDays(date, view === "day" ? -1 : -7))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="px-4 py-2 bg-card border border-border rounded-lg min-w-[200px] text-center">
              <span className="font-medium text-foreground">{formatLongDateLabel(currentDateKey)}</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="border-border"
              onClick={() => setCurrentDate((date) => addDays(date, view === "day" ? 1 : 7))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center bg-muted rounded-lg p-1">
            <button
              onClick={() => setView("day")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === "day"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setView("week")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === "week"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {view === "day" ? (
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-card rounded-xl border border-border p-4 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground">Unscheduled</h2>
                <span className="text-sm text-muted-foreground">{unscheduledTasks.length}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Quickly place tasks into today’s calendar.
              </p>
              <div className="space-y-2">
                {unscheduledTasks.length === 0 ? (
                  <div className="p-4 rounded-lg bg-background text-sm text-muted-foreground">
                    Everything planned for this day is already scheduled.
                  </div>
                ) : (
                  unscheduledTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-background rounded-lg border border-border hover:shadow-sm transition-shadow"
                    >
                      <div className="font-medium text-foreground text-sm">{task.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        {task.estimatedMinutes && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {task.estimatedMinutes}m
                          </span>
                        )}
                        {task.dueDate && (
                          <span className="flex items-center gap-1 text-xs text-marigold">
                            <AlertCircle className="w-3 h-3" />
                            {formatTaskDateLabel(task.dueDate)}
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-3 border-border"
                        onClick={() => scheduleTask(task.id, { date: currentDateKey, type: "focus" })}
                      >
                        Schedule Task
                      </Button>
                    </div>
                  ))
                )}
              </div>
              <Button variant="ghost" className="w-full mt-4 text-muted-foreground" onClick={() => setAddTaskOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>
          </div>

          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="relative" style={{ height: `${hours.length * 80}px` }}>
                {hours.map((hour, index) => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-t border-border flex"
                    style={{ top: `${index * 80}px` }}
                  >
                    <div className="w-16 md:w-20 px-2 py-2 text-xs text-muted-foreground bg-muted/30">
                      {hour > 12 ? `${hour - 12} PM` : hour === 12 ? "12 PM" : `${hour} AM`}
                    </div>
                    <div className="flex-1" />
                  </div>
                ))}

                <div className="absolute left-16 md:left-20 right-4 top-0">
                  {dayBlocks.map((block) => {
                    const Icon = getBlockIcon(block.type)

                    return (
                      <div
                        key={block.id}
                        className={`absolute left-0 right-0 ${getBlockTone(block.type)} border rounded-lg p-3 hover:shadow-md transition-shadow`}
                        style={getScheduleBlockStyle(block)}
                      >
                        <div className="flex items-start gap-2">
                          <Icon className="w-4 h-4 text-foreground/70 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground text-sm truncate">
                              {block.title}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {formatTimeLabel(block.startTime)} - {formatTimeLabel(block.endTime)}
                            </div>
                          </div>
                          {block.taskId ? (
                            <button
                              onClick={() => unscheduleTask(block.taskId!)}
                              className="p-1 text-muted-foreground hover:text-foreground rounded"
                              aria-label="Unschedule task"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => deleteScheduleBlock(block.id)}
                              className="p-1 text-muted-foreground hover:text-foreground rounded"
                              aria-label="Remove block"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {currentTimeIndicator && (
                  <div
                    className="absolute left-16 md:left-20 right-0 flex items-center z-10"
                    style={{ top: currentTimeIndicator }}
                  >
                    <div className="w-3 h-3 rounded-full bg-destructive" />
                    <div className="flex-1 h-0.5 bg-destructive" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-celeste/50 border border-celeste" />
                <span className="text-muted-foreground">Focus Time</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-marigold/20 border border-marigold/50" />
                <span className="text-muted-foreground">Meeting</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-muted border border-border" />
                <span className="text-muted-foreground">Break / Buffer</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-primary/10 border border-primary/30" />
                <span className="text-muted-foreground">Admin</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-4">Week Overview</h2>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            {weekDays.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd")
              const blocksForDay = getScheduledBlocksForDate(scheduleBlocks, dayKey)
              const unscheduledForDay = getUnscheduledTasksForDate(tasks, scheduleBlocks, dayKey)

              return (
                <div key={dayKey} className="rounded-xl border border-border bg-background p-4">
                  <div className="font-medium text-foreground">{format(parseISO(dayKey), "EEE, MMM d")}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {blocksForDay.length} scheduled blocks
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {unscheduledForDay.length} unscheduled tasks
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <AddTaskDialog
        open={addTaskOpen}
        onOpenChange={setAddTaskOpen}
        defaultPlannedDate={currentDateKey}
        title="Add calendar task"
        description="Create a task for this day, then schedule it when you’re ready."
      />
    </div>
  )
}
