"use client"

import { useMemo, useState } from "react"
import { Search, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

import { AddTaskDialog } from "@/components/add-task-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SummaryCard, TaskCard } from "@/components/workspace/task-ui"
import {
  assignedTaskStatusOptions,
  getTaskStatusLabel,
  type TaskBoardData,
  type TaskSummary,
} from "@/lib/task-data"

type FilterState = {
  query: string
  assignee: string
  category: string
  project: string
  createdBy: string
  dueDate: string
  status: string
}

const boardColumns: Array<{ id: TaskSummary["status"]; title: string }> = [
  { id: "open", title: "Open" },
  { id: "in_progress", title: "In Progress" },
  { id: "on_hold", title: "On Hold" },
  { id: "done", title: "Done" },
]

async function readJson<T>(response: Response) {
  return (await response.json().catch(() => ({}))) as T
}

export function DashboardPageView({ data }: { data: TaskBoardData }) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    query: "",
    assignee: "all",
    category: "all",
    project: "all",
    createdBy: "all",
    dueDate: "all",
    status: "all",
  })
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null)

  const filteredTasks = useMemo(() => {
    const query = filters.query.trim().toLowerCase()

    return data.tasks.filter((task) => {
      const matchesQuery =
        !query
        || task.title.toLowerCase().includes(query)
        || (task.description ?? "").toLowerCase().includes(query)
        || task.assignee.fullName.toLowerCase().includes(query)
        || task.category.toLowerCase().includes(query)
        || (task.project?.name ?? "").toLowerCase().includes(query)

      const matchesAssignee = filters.assignee === "all" || task.assignee.userId === filters.assignee
      const matchesCategory = filters.category === "all" || task.category === filters.category
      const matchesProject = filters.project === "all" || task.project?.id === filters.project
      const matchesCreatedBy = filters.createdBy === "all" || task.createdBy?.userId === filters.createdBy
      const matchesDueDate =
        filters.dueDate === "all"
        || (filters.dueDate === "today" && task.isDueToday)
        || (filters.dueDate === "overdue" && task.isOverdue)
        || (filters.dueDate === "upcoming" && Boolean(task.dueDate) && !task.isDueToday && !task.isOverdue)
        || (filters.dueDate === "none" && !task.dueDate)
      const matchesStatus = filters.status === "all" || task.status === filters.status

      return matchesQuery && matchesAssignee && matchesCategory && matchesProject && matchesCreatedBy && matchesDueDate && matchesStatus
    })
  }, [data.tasks, filters])

  const columnTasks = useMemo(
    () =>
      Object.fromEntries(
        boardColumns.map((column) => [
          column.id,
          filteredTasks.filter((task) => task.status === column.id),
        ])
      ) as Record<TaskSummary["status"], TaskSummary[]>,
    [filteredTasks]
  )

  const handleMoveTask = async (taskId: string, status: TaskSummary["status"]) => {
    setMovingTaskId(taskId)
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    })
    await readJson<{ error?: string }>(response)
    setMovingTaskId(null)
    router.refresh()
  }

  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Control Center</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              The workspace board for shared task flow, handoffs, and follow-through.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="h-11 rounded-full px-5">
            <Plus className="mr-2 h-4 w-4" />
            Create task
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <SummaryCard label="Open" value={data.summary.open} />
          <SummaryCard label="In Progress" value={data.summary.inProgress} tone="default" />
          <SummaryCard label="On Hold" value={data.summary.onHold} tone="warning" />
          <SummaryCard label="Done" value={data.summary.done} tone="success" />
          <SummaryCard label="Overdue" value={data.summary.overdue} tone="danger" />
          <SummaryCard label="Due Today" value={data.summary.dueToday} tone="warning" />
        </div>

        <div className="rounded-[32px] border border-border/80 bg-card p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_repeat(6,minmax(0,0.7fr))]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.query}
                onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
                placeholder="Search tasks, people, categories, or projects"
                className="pl-9"
              />
            </div>

            <select
              value={filters.assignee}
              onChange={(event) => setFilters((current) => ({ ...current, assignee: event.target.value }))}
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
              value={filters.category}
              onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="all">All categories</option>
              {data.categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={filters.project}
              onChange={(event) => setFilters((current) => ({ ...current, project: event.target.value }))}
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
              value={filters.createdBy}
              onChange={(event) => setFilters((current) => ({ ...current, createdBy: event.target.value }))}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="all">All creators</option>
              {data.members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.fullName}
                </option>
              ))}
            </select>

            <select
              value={filters.dueDate}
              onChange={(event) => setFilters((current) => ({ ...current, dueDate: event.target.value }))}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="all">All due dates</option>
              <option value="today">Due today</option>
              <option value="overdue">Overdue</option>
              <option value="upcoming">Upcoming</option>
              <option value="none">No due date</option>
            </select>

            <select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="all">All statuses</option>
              {assignedTaskStatusOptions
                .filter((status) => status !== "cancelled")
                .map((status) => (
                  <option key={status} value={status}>
                    {getTaskStatusLabel(status)}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-4">
          {boardColumns.map((column) => (
            <div
              key={column.id}
              className="rounded-[32px] border border-border/80 bg-card p-4"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                const taskId = event.dataTransfer.getData("text/task-id")
                if (!taskId) {
                  return
                }

                void handleMoveTask(taskId, column.id)
              }}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-medium text-foreground">{column.title}</div>
                <div className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                  {columnTasks[column.id]?.length ?? 0}
                </div>
              </div>

              <div className="space-y-3">
                {(columnTasks[column.id] ?? []).map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData("text/task-id", task.id)}
                    className={movingTaskId === task.id ? "opacity-50" : ""}
                  >
                    <TaskCard task={task} compact />
                  </div>
                ))}
                {(columnTasks[column.id] ?? []).length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-background/80 px-4 py-8 text-center text-sm text-muted-foreground">
                    No tasks in {column.title.toLowerCase()}.
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AddTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create task"
        description="Create a task for yourself or a teammate. Project is optional."
      />
    </div>
  )
}
