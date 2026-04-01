"use client"

import { useMemo, useState } from "react"

import { addDays, format, isToday } from "date-fns"

import { AddTaskDialog } from "@/components/add-task-dialog"
import { LIFE_LIST_ID } from "@/components/add-task-dialog"
import { Button } from "@/components/ui/button"
import {
  Target,
  ListOrdered,
  CheckCircle2,
  Circle,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Star,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from "lucide-react"
import {
  formatLongDateLabel,
  getTaskPriorityBadgeClass,
  getTaskPriorityBadgeStyle,
  getTasksForDate,
  getTaskListName,
  useTaskedState,
  type Task,
} from "@/lib/tasked-store"

type PlannerMode = "top3" | "ivylee" | "hybrid" | "none"

function sortPlannerTasks(tasks: Task[]) {
  return [...tasks].sort((left, right) => {
    if (left.completed === right.completed) {
      const priorityRank = { high: 0, medium: 1, low: 2, none: 3 }
      const priorityDifference = priorityRank[left.priority] - priorityRank[right.priority]

      if (priorityDifference !== 0) {
        return priorityDifference
      }

      return (left.estimatedMinutes ?? 0) - (right.estimatedMinutes ?? 0)
    }

    return left.completed ? 1 : -1
  })
}

export default function PlannerPage() {
  const {
    tasks,
    lists,
    todayKey,
    toggleTask,
    moveTaskToColumn,
    moveUnfinishedTasksToDate,
    moveUnfinishedTodayToTomorrow,
    startTomorrowPlan,
    preferences,
  } = useTaskedState()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [addTaskListId, setAddTaskListId] = useState<string | undefined>(undefined)
  const currentDateKey = format(currentDate, "yyyy-MM-dd")
  const viewingToday = isToday(currentDate)
  const viewingPastDay = currentDateKey < todayKey
  const plannerMode: PlannerMode =
    preferences.defaultPlanningMethod === "ivylee" ||
    preferences.defaultPlanningMethod === "hybrid" ||
    preferences.defaultPlanningMethod === "none"
      ? preferences.defaultPlanningMethod
      : "top3"

  const lifeListIds = useMemo(
    () =>
      new Set(
        lists
          .filter((list) => list.name.trim().toLowerCase() === "life")
          .map((list) => list.id)
      ),
    [lists]
  )
  const todayTasks = useMemo(
    () => sortPlannerTasks(getTasksForDate(tasks, currentDateKey)),
    [currentDateKey, tasks]
  )
  const lifeTasks = useMemo(
    () => todayTasks.filter((task) => lifeListIds.has(task.listId)),
    [lifeListIds, todayTasks]
  )
  const plannerTasks = useMemo(
    () => todayTasks.filter((task) => !lifeListIds.has(task.listId)),
    [lifeListIds, todayTasks]
  )
  const top3Tasks = plannerTasks.slice(0, 3)
  const otherTasks = plannerTasks.slice(3)
  const ivyLeeTasks = plannerTasks.slice(0, 6)
  const currentTask =
    top3Tasks.find((task) => !task.completed) ??
    ivyLeeTasks.find((task) => !task.completed) ??
    null
  const completedTop3 = top3Tasks.filter((task) => task.completed).length
  const completedIvyLee = ivyLeeTasks.filter((task) => task.completed).length

  const openAddTaskDialog = (defaultListId?: string) => {
    setAddTaskListId(defaultListId)
    setAddTaskOpen(true)
  }

  return (
    <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-6">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Daily Planner</h1>

        <div className="flex flex-col gap-4 xl:ml-auto xl:flex-row xl:items-center xl:gap-4">
          <div className="flex items-center gap-2 xl:justify-end">
            <Button
              variant="outline"
              size="icon"
              className="border-border"
              onClick={() => setCurrentDate((date) => addDays(date, -1))}
              aria-label="Previous day"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="min-w-[220px] rounded-lg border border-border bg-card px-4 py-2 text-center">
              <span className="font-medium text-foreground">{formatLongDateLabel(currentDateKey)}</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="border-border"
              onClick={() => setCurrentDate((date) => addDays(date, 1))}
              aria-label="Next day"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {(plannerMode === "top3" || plannerMode === "hybrid") && (
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">Top 3 Priorities</h2>
                    <p className="text-sm text-muted-foreground">{completedTop3}/{top3Tasks.length || 3} completed</p>
                  </div>
                </div>
                <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-herb rounded-full transition-all"
                    style={{
                      width: `${top3Tasks.length === 0 ? 0 : (completedTop3 / top3Tasks.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {top3Tasks.length === 0 ? (
                  <div className="p-4 rounded-lg bg-background text-sm text-muted-foreground">
                    No tasks are planned for this day yet.
                  </div>
                ) : (
                  top3Tasks.map((task, index) => (
                    <div
                      key={task.id}
                      className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                        task.completed
                          ? "bg-herb/5 border border-herb/20"
                          : index === top3Tasks.findIndex((value) => !value.completed)
                            ? "bg-primary/5 border border-primary/20"
                            : "bg-background border border-border"
                      }`}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                        {index + 1}
                      </div>
                      <button
                        onClick={() => toggleTask(task.id)}
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${
                          task.completed
                            ? "border-herb bg-herb"
                            : "border-border hover:border-primary"
                        }`}
                      >
                        {task.completed && <CheckCircle2 className="w-5 h-5 text-herb-foreground" />}
                      </button>
                      <div className="flex-1">
                        <div className={`font-medium ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {task.title}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">{getTaskListName(lists, task.listId)}</span>
                          {task.estimatedMinutes && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {task.estimatedMinutes}m
                            </span>
                          )}
                        </div>
                      </div>
                      {index === top3Tasks.findIndex((value) => !value.completed) && !task.completed && (
                        <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium">
                          Current
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {plannerMode === "ivylee" && (
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <ListOrdered className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">Ivy Lee Method</h2>
                    <p className="text-sm text-muted-foreground">{completedIvyLee}/{ivyLeeTasks.length || 6} tasks completed</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {ivyLeeTasks.map((task, index) => {
                  const isCurrentTask = index === ivyLeeTasks.findIndex((value) => !value.completed)

                  return (
                    <div
                      key={task.id}
                      className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                        task.completed
                          ? "bg-herb/5"
                          : isCurrentTask
                            ? "bg-primary/5 border-2 border-primary/30"
                            : "bg-background hover:bg-muted/50"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
                        task.completed
                          ? "bg-herb text-herb-foreground"
                          : isCurrentTask
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                      }`}>
                        {task.completed ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                      </div>
                      <button
                        onClick={() => toggleTask(task.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          task.completed
                            ? "border-herb bg-herb"
                            : "border-border hover:border-primary"
                        }`}
                      >
                        {task.completed && <CheckCircle2 className="w-4 h-4 text-herb-foreground" />}
                      </button>
                      <div className="flex-1">
                        <div className={`font-medium ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {task.title}
                        </div>
                      </div>
                      {task.estimatedMinutes && (
                        <span className="text-sm text-muted-foreground">{task.estimatedMinutes}m</span>
                      )}
                      {isCurrentTask && !task.completed && (
                        <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Focus
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {(plannerMode === "top3" || plannerMode === "hybrid") && (
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground">Other Tasks</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => openAddTaskDialog()}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Task
                </Button>
              </div>
              <div className="space-y-2">
                {otherTasks.length === 0 ? (
                  <div className="p-4 rounded-lg bg-background text-sm text-muted-foreground">
                    No extra tasks waiting behind your main priorities.
                  </div>
                ) : (
                  otherTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-background hover:bg-muted/50 transition-colors"
                    >
                      <button
                        onClick={() => toggleTask(task.id)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          task.completed
                            ? "border-herb bg-herb"
                            : "border-border hover:border-primary"
                        }`}
                      >
                        {task.completed && <CheckCircle2 className="w-3 h-3 text-herb-foreground" />}
                      </button>
                      <span className={`flex-1 ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {task.title}
                      </span>
                      <span className="text-xs text-muted-foreground">{getTaskListName(lists, task.listId)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {plannerMode === "none" && (
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground">Tasks</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => openAddTaskDialog()}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Task
                </Button>
              </div>
              <div className="space-y-2">
                {plannerTasks.length === 0 ? (
                  <div className="p-4 rounded-lg bg-background text-sm text-muted-foreground">
                    No tasks are planned for this day yet.
                  </div>
                ) : (
                  plannerTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                        task.completed ? "bg-herb/5" : "bg-background hover:bg-muted/50"
                      }`}
                    >
                      <button
                        onClick={() => toggleTask(task.id)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          task.completed
                            ? "border-herb bg-herb"
                            : "border-border hover:border-primary"
                        }`}
                      >
                        {task.completed && <CheckCircle2 className="w-3 h-3 text-herb-foreground" />}
                      </button>
                      <span className={`flex-1 ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {task.title}
                      </span>
                      {task.priority !== "none" ? (
                        <span
                          className={`rounded px-2 py-0.5 text-xs ${getTaskPriorityBadgeClass(task.priority)}`}
                          style={getTaskPriorityBadgeStyle(task.priority)}
                        >
                          {task.priority}
                        </span>
                      ) : null}
                      <span className="text-xs text-muted-foreground">{getTaskListName(lists, task.listId)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="bg-celeste/20 rounded-xl border border-celeste/30 p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-foreground" />
                <h2 className="font-semibold text-foreground">Life Task</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => openAddTaskDialog(LIFE_LIST_ID)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Life Task
              </Button>
            </div>
            {lifeTasks.length > 0 ? (
              <div className="space-y-2">
                {lifeTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center gap-4 rounded-lg bg-card p-3 transition-colors ${
                      task.completed ? "bg-herb/5" : ""
                    }`}
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        task.completed
                          ? "border-herb bg-herb"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {task.completed && <CheckCircle2 className="w-3 h-3 text-herb-foreground" />}
                    </button>
                    <span className={`flex-1 ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {task.title}
                    </span>
                    {task.priority !== "none" ? (
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${getTaskPriorityBadgeClass(task.priority)}`}
                        style={getTaskPriorityBadgeStyle(task.priority)}
                      >
                        {task.priority}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-card rounded-lg text-sm text-muted-foreground">
                Your life tasks are clear for now.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-primary rounded-xl p-6 text-primary-foreground">
            <h3 className="font-semibold mb-2">Focus Mode</h3>
            <p className="text-primary-foreground/80 text-sm mb-4">
              Mark your current priority as the task in progress for the rest of the app.
            </p>
            <Button
              variant="secondary"
              className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              onClick={() => currentTask && moveTaskToColumn(currentTask.id, "doing")}
              disabled={!currentTask}
            >
              Start Focus Session
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-marigold" />
              <h3 className="font-semibold text-foreground">AI Suggestions</h3>
            </div>
              <div className="space-y-3 text-sm text-muted-foreground">
              <p>Your highest priority work is already in this plan. Try tackling it before noon.</p>
              <p>Tasks with smaller estimates can wait until after your main block is done.</p>
              </div>
            </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">End of Day</h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start border-border"
                onClick={() =>
                  viewingToday
                    ? moveUnfinishedTodayToTomorrow()
                    : moveUnfinishedTasksToDate(currentDateKey, todayKey)
                }
                disabled={!viewingToday && !viewingPastDay}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {viewingToday ? "Move unfinished to tomorrow" : "Move unfinished to today"}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-border"
                onClick={startTomorrowPlan}
                disabled={!viewingToday}
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Start tomorrow&apos;s plan
              </Button>
            </div>
            {!viewingToday && viewingPastDay && (
              <p className="mt-3 text-xs text-muted-foreground">
                Roll unfinished tasks from this day into today when you need to catch up.
              </p>
            )}
            {!viewingToday && !viewingPastDay && (
              <p className="mt-3 text-xs text-muted-foreground">
                End-of-day actions are available only while viewing today.
              </p>
            )}
          </div>
        </div>
      </div>

      <AddTaskDialog
        open={addTaskOpen}
        onOpenChange={(open) => {
          setAddTaskOpen(open)
          if (!open) {
            setAddTaskListId(undefined)
          }
        }}
        defaultListId={addTaskListId}
        defaultPlannedDate={currentDateKey}
        title="Add planner task"
        description={`Add a task directly into ${viewingToday ? "today's" : formatLongDateLabel(currentDateKey)} plan.`}
      />
    </div>
  )
}
