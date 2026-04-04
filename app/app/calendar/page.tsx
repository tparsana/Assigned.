"use client"

import { useMemo, useState } from "react"

import { addDays, format, parseISO } from "date-fns"

import { AddTaskDialog } from "@/components/add-task-dialog"
import { DayTimeline } from "@/components/day-timeline"
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
import { AlertCircle, Calendar, ChevronLeft, ChevronRight, Clock, GripVertical, Plus } from "lucide-react"
import {
  formatLongDateLabel,
  formatTaskDateLabel,
  getScheduledBlocksForDate,
  getUnscheduledTasksForDate,
  useTaskedState,
  type BlockType,
  type Task,
} from "@/lib/tasked-store"

type ViewMode = "day" | "week"

const DAY_HOURS = Array.from({ length: 24 }, (_, index) => index)

function getDefaultStartTime(currentDateKey: string) {
  const now = new Date()
  if (format(now, "yyyy-MM-dd") !== currentDateKey) {
    return "09:00"
  }

  const rounded = new Date(now)
  rounded.setSeconds(0, 0)
  rounded.setMinutes(Math.ceil(rounded.getMinutes() / 15) * 15)
  if (rounded.getMinutes() === 60) {
    rounded.setHours(rounded.getHours() + 1, 0, 0, 0)
  }

  return `${String(rounded.getHours()).padStart(2, "0")}:${String(rounded.getMinutes()).padStart(2, "0")}`
}

export default function CalendarPage() {
  const { tasks, scheduleBlocks, scheduleTask, unscheduleTask, deleteScheduleBlock } = useTaskedState()

  const [view, setView] = useState<ViewMode>("day")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [taskToSchedule, setTaskToSchedule] = useState<Task | null>(null)
  const [scheduleStartTime, setScheduleStartTime] = useState("09:00")
  const [scheduleType, setScheduleType] = useState<BlockType>("focus")

  const currentDateKey = format(currentDate, "yyyy-MM-dd")
  const now = new Date()
  const dayBlocks = useMemo(
    () => getScheduledBlocksForDate(scheduleBlocks, currentDateKey),
    [currentDateKey, scheduleBlocks]
  )
  const unscheduledTasks = useMemo(
    () => getUnscheduledTasksForDate(tasks, scheduleBlocks, currentDateKey),
    [currentDateKey, scheduleBlocks, tasks]
  )
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(currentDate, index))

  const openScheduleDialog = (task: Task, preferredStartTime?: string) => {
    setTaskToSchedule(task)
    setScheduleStartTime(preferredStartTime ?? getDefaultStartTime(currentDateKey))
    setScheduleType("focus")
  }

  const closeScheduleDialog = () => {
    setTaskToSchedule(null)
    setScheduleStartTime("09:00")
    setScheduleType("focus")
  }

  const confirmScheduleTask = () => {
    if (!taskToSchedule) {
      return
    }

    scheduleTask(taskToSchedule.id, {
      date: currentDateKey,
      startTime: scheduleStartTime,
      type: scheduleType,
    })
    closeScheduleDialog()
  }

  const handleDropTaskAtTime = (taskId: string, startTime: string) => {
    scheduleTask(taskId, {
      date: currentDateKey,
      startTime,
      type: "focus",
    })
  }

  return (
    <div className="flex min-h-0 flex-col px-4 py-6 pb-24 lg:px-8 lg:pb-6">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <h1 className="flex items-center gap-3 text-2xl font-semibold text-foreground">
            <Calendar className="h-7 w-7" />
            Time Blocking
          </h1>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="border-border"
              onClick={() => setCurrentDate((date) => addDays(date, view === "day" ? -1 : -7))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[200px] rounded-lg border border-border bg-card px-4 py-2 text-center">
              <span className="font-medium text-foreground">{formatLongDateLabel(currentDateKey)}</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="border-border"
              onClick={() => setCurrentDate((date) => addDays(date, view === "day" ? 1 : 7))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center rounded-lg bg-muted p-1">
            <button
              onClick={() => setView("day")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                view === "day" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setView("week")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                view === "week" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {view === "day" ? (
        <div className="grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-4 lg:h-[calc(100dvh-13rem)] lg:min-h-[38rem]">
          <div className="order-1 lg:col-span-1 lg:min-h-0">
            <div className="flex h-[34dvh] min-h-[260px] flex-col rounded-xl border border-border bg-card p-4 lg:h-full">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-foreground">Unscheduled</h2>
                <span className="text-sm text-muted-foreground">{unscheduledTasks.length}</span>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                Drag tasks onto the timeline or choose an exact time.
              </p>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {unscheduledTasks.length === 0 ? (
                  <div className="rounded-lg bg-background p-4 text-sm text-muted-foreground">
                    Everything planned for this day is already scheduled.
                  </div>
                ) : (
                  unscheduledTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/task-id", task.id)
                        event.dataTransfer.effectAllowed = "move"
                      }}
                      className="rounded-lg border border-border bg-background p-3 transition-shadow hover:shadow-sm"
                    >
                      <div className="mb-1 flex items-start justify-between gap-3">
                        <div className="text-sm font-medium text-foreground">{task.title}</div>
                        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        {task.estimatedMinutes ? (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {task.estimatedMinutes}m
                          </span>
                        ) : null}
                        {task.dueDate ? (
                          <span className="flex items-center gap-1 text-xs text-marigold">
                            <AlertCircle className="h-3 w-3" />
                            {formatTaskDateLabel(task.dueDate)}
                          </span>
                        ) : null}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3 w-full border-border"
                        onClick={() => openScheduleDialog(task)}
                      >
                        Schedule Task
                      </Button>
                    </div>
                  ))
                )}
              </div>

              <Button
                variant="ghost"
                className="mt-4 w-full text-muted-foreground"
                onClick={() => setAddTaskOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </div>
          </div>

          <div className="order-2 lg:col-span-3 lg:min-h-0">
            <div className="flex h-[52dvh] min-h-[340px] flex-col rounded-xl border border-border bg-card p-4 lg:h-full">
              <div className="min-h-0 flex-1">
                <DayTimeline
                  blocks={dayBlocks}
                  hours={DAY_HOURS}
                  now={now}
                  showCurrentTime={format(now, "yyyy-MM-dd") === currentDateKey}
                  scrollHeightClassName="h-full"
                  autoScroll
                  fillParent
                  onDropTaskAtTime={handleDropTaskAtTime}
                  onUnscheduleTask={unscheduleTask}
                  onDeleteBlock={deleteScheduleBlock}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border border-celeste bg-celeste/50" />
                <span className="text-muted-foreground">Focus Time</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border border-marigold/50 bg-marigold/20" />
                <span className="text-muted-foreground">Meeting</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border border-border bg-muted" />
                <span className="text-muted-foreground">Break / Buffer</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border border-primary/30 bg-primary/10" />
                <span className="text-muted-foreground">Admin</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-semibold text-foreground">Week Overview</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {weekDays.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd")
              const blocksForDay = getScheduledBlocksForDate(scheduleBlocks, dayKey)
              const unscheduledForDay = getUnscheduledTasksForDate(tasks, scheduleBlocks, dayKey)

              return (
                <div key={dayKey} className="rounded-xl border border-border bg-background p-4">
                  <div className="font-medium text-foreground">{format(parseISO(dayKey), "EEE, MMM d")}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{blocksForDay.length} scheduled blocks</div>
                  <div className="text-sm text-muted-foreground">{unscheduledForDay.length} unscheduled tasks</div>
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

      <Dialog open={Boolean(taskToSchedule)} onOpenChange={(open) => !open && closeScheduleDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule task</DialogTitle>
            <DialogDescription>
              Place {taskToSchedule?.title ? `"${taskToSchedule.title}"` : "this task"} at a specific time on{" "}
              {formatLongDateLabel(currentDateKey)}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Start time</label>
              <Input
                type="time"
                value={scheduleStartTime}
                onChange={(event) => setScheduleStartTime(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Block type</label>
              <select
                value={scheduleType}
                onChange={(event) => setScheduleType(event.target.value as BlockType)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
              >
                <option value="focus">Focus</option>
                <option value="meeting">Meeting</option>
                <option value="admin">Admin</option>
                <option value="break">Break</option>
                <option value="buffer">Buffer</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={closeScheduleDialog}>
              Cancel
            </Button>
            <Button onClick={confirmScheduleTask}>Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
