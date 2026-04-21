"use client"

import { useMemo, useState } from "react"
import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, startOfMonth, startOfWeek, subDays, subMonths } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"

import type { CalendarPageData, TaskSummary } from "@/lib/task-data"
import { StatusBadge } from "@/components/workspace/task-ui"
import { Button } from "@/components/ui/button"

type CalendarMode = "month" | "week" | "day"

function groupTasksByDate(tasks: TaskSummary[]) {
  return tasks.reduce<Record<string, TaskSummary[]>>((accumulator, task) => {
    if (!task.dueDate) {
      return accumulator
    }

    const key = task.dueDate.slice(0, 10)
    accumulator[key] = [...(accumulator[key] ?? []), task]
    return accumulator
  }, {})
}

export function CalendarPageView({ data }: { data: CalendarPageData }) {
  const [mode, setMode] = useState<CalendarMode>("month")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [filterMode, setFilterMode] = useState<"mine" | "assigned_by_me" | "all_visible">(
    data.scopedToMineByDefault ? "mine" : "all_visible"
  )
  const [projectId, setProjectId] = useState("all")
  const [category, setCategory] = useState("all")
  const [assigneeId, setAssigneeId] = useState("all")
  const [status, setStatus] = useState("all")

  const filteredTasks = useMemo(() => {
    return data.tasks.filter((task) => {
      const matchesScope =
        filterMode === "all_visible"
          ? true
          : filterMode === "assigned_by_me"
            ? task.createdBy?.userId === data.viewer.currentUserId
            : task.assignee.userId === data.viewer.currentUserId

      const matchesProject = projectId === "all" || task.project?.id === projectId
      const matchesCategory = category === "all" || task.category === category
      const matchesAssignee = assigneeId === "all" || task.assignee.userId === assigneeId
      const matchesStatus = status === "all" || task.status === status

      return matchesScope && matchesProject && matchesCategory && matchesAssignee && matchesStatus
    })
  }, [assigneeId, category, data.tasks, data.viewer.currentUserId, filterMode, projectId, status])

  const tasksByDate = useMemo(() => groupTasksByDate(filteredTasks), [filteredTasks])
  const currentKey = format(currentDate, "yyyy-MM-dd")
  const visibleDates =
    mode === "month"
      ? eachDayOfInterval({
          start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }),
          end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 }),
        })
      : mode === "week"
        ? eachDayOfInterval({
            start: startOfWeek(currentDate, { weekStartsOn: 1 }),
            end: endOfWeek(currentDate, { weekStartsOn: 1 }),
          })
        : [currentDate]

  const rangeTasks = mode === "day"
    ? tasksByDate[currentKey] ?? []
    : visibleDates.flatMap((date) => tasksByDate[format(date, "yyyy-MM-dd")] ?? [])

  const shiftRange = (direction: "prev" | "next") => {
    if (mode === "month") {
      setCurrentDate((current) => (direction === "prev" ? subMonths(current, 1) : addMonths(current, 1)))
      return
    }

    if (mode === "week") {
      setCurrentDate((current) => (direction === "prev" ? subDays(current, 7) : addDays(current, 7)))
      return
    }

    setCurrentDate((current) => (direction === "prev" ? subDays(current, 1) : addDays(current, 1)))
  }

  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Task Schedule</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Calendar</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              A task-based calendar for due dates and scheduled visibility across the workspace.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-border bg-card p-1">
            {(["month", "week", "day"] as const).map((value) => (
              <button
                key={value}
                onClick={() => setMode(value)}
                className={`rounded-full px-4 py-2 text-sm capitalize transition-colors ${
                  mode === value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-border/80 bg-card p-5">
          <div className="grid gap-3 lg:grid-cols-5">
            <select
              value={filterMode}
              onChange={(event) => setFilterMode(event.target.value as "mine" | "assigned_by_me" | "all_visible")}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="mine">Mine</option>
              <option value="assigned_by_me">Assigned by me</option>
              {data.viewer.accessLevel === "admin" || data.viewer.canViewDetailedWorkload ? (
                <option value="all_visible">All visible</option>
              ) : null}
            </select>
            <select
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="all">All projects</option>
              {data.projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="all">All categories</option>
              {data.categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              value={assigneeId}
              onChange={(event) => setAssigneeId(event.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="all">All assignees</option>
              {data.members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.fullName}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-[32px] border border-border/80 bg-card px-5 py-4">
          <Button variant="outline" size="icon" onClick={() => shiftRange("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-lg font-medium text-foreground">
            {mode === "month"
              ? format(currentDate, "MMMM yyyy")
              : mode === "week"
                ? `${format(visibleDates[0], "MMM d")} - ${format(visibleDates[visibleDates.length - 1], "MMM d, yyyy")}`
                : format(currentDate, "EEEE, MMM d, yyyy")}
          </div>
          <Button variant="outline" size="icon" onClick={() => shiftRange("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {mode === "month" ? (
          <div className="grid gap-4 md:grid-cols-7">
            {visibleDates.map((date) => {
              const key = format(date, "yyyy-MM-dd")
              const dayTasks = tasksByDate[key] ?? []

              return (
                <div key={key} className="min-h-44 rounded-[28px] border border-border/80 bg-card p-4">
                  <div className="mb-3 text-sm font-medium text-foreground">{format(date, "EEE d")}</div>
                  <div className="space-y-2">
                    {dayTasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="rounded-2xl bg-background px-3 py-2 text-xs text-foreground">
                        <div className="line-clamp-2 font-medium">{task.title}</div>
                        <div className="mt-1 text-muted-foreground">{task.assignee.fullName}</div>
                      </div>
                    ))}
                    {dayTasks.length > 3 ? (
                      <div className="text-xs text-muted-foreground">+{dayTasks.length - 3} more</div>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {visibleDates.map((date) => {
              const dayTasks = tasksByDate[format(date, "yyyy-MM-dd")] ?? []

              return (
                <div key={date.toISOString()} className="rounded-[32px] border border-border/80 bg-card p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-lg font-medium text-foreground">{format(date, "EEEE, MMM d")}</div>
                    <div className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                      {dayTasks.length}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {dayTasks.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border bg-background/80 px-4 py-8 text-center text-sm text-muted-foreground">
                        No due tasks on this date.
                      </div>
                    ) : (
                      dayTasks.map((task) => (
                        <div key={task.id} className="rounded-3xl border border-border bg-background p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-medium text-foreground">{task.title}</div>
                              <div className="mt-1 text-sm text-muted-foreground">
                                {task.assignee.fullName}
                                {task.project ? ` · ${task.project.name}` : ""}
                              </div>
                            </div>
                            <StatusBadge status={task.status} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="rounded-[32px] border border-border/80 bg-card p-5">
          <div className="mb-4 text-lg font-medium text-foreground">Visible range summary</div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-background p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Tasks in range</div>
              <div className="mt-3 text-3xl font-semibold text-foreground">{rangeTasks.length}</div>
            </div>
            <div className="rounded-3xl bg-background p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Overdue</div>
              <div className="mt-3 text-3xl font-semibold text-foreground">
                {rangeTasks.filter((task) => task.isOverdue).length}
              </div>
            </div>
            <div className="rounded-3xl bg-background p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Due today</div>
              <div className="mt-3 text-3xl font-semibold text-foreground">
                {rangeTasks.filter((task) => task.isDueToday).length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
