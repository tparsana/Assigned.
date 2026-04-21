"use client"

import { useMemo, useState } from "react"
import { Plus, Search } from "lucide-react"

import { AddTaskDialog } from "@/components/add-task-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState, TaskCard } from "@/components/workspace/task-ui"
import type { MyTasksData, TaskSummary } from "@/lib/task-data"

export function MyTasksPageView({ data }: { data: MyTasksData }) {
  const [createOpen, setCreateOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [project, setProject] = useState("all")
  const [status, setStatus] = useState("all")

  const filterTasks = (tasks: TaskSummary[]) => {
    const normalizedQuery = query.trim().toLowerCase()

    return tasks.filter((task) => {
      const matchesQuery =
        !normalizedQuery
        || task.title.toLowerCase().includes(normalizedQuery)
        || (task.description ?? "").toLowerCase().includes(normalizedQuery)
        || task.category.toLowerCase().includes(normalizedQuery)
        || (task.project?.name ?? "").toLowerCase().includes(normalizedQuery)

      const matchesCategory = category === "all" || task.category === category
      const matchesProject = project === "all" || task.project?.id === project
      const matchesStatus = status === "all" || task.status === status

      return matchesQuery && matchesCategory && matchesProject && matchesStatus
    })
  }

  const sections = useMemo(
    () => ({
      today: filterTasks(data.sections.today),
      upcoming: filterTasks(data.sections.upcoming),
      overdue: filterTasks(data.sections.overdue),
      completed: filterTasks(data.sections.completed),
    }),
    [category, data.sections.completed, data.sections.overdue, data.sections.today, data.sections.upcoming, project, query, status]
  )

  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Personal View</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">My Tasks</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              The focused view of work assigned to you, with the noise stripped out.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="h-11 rounded-full px-5">
            <Plus className="mr-2 h-4 w-4" />
            Add task
          </Button>
        </div>

        <div className="rounded-[32px] border border-border/80 bg-card p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,0.7fr))]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search your tasks"
                className="pl-9"
              />
            </div>
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
              value={project}
              onChange={(event) => setProject(event.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="all">All projects</option>
              {data.projects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
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

        <div className="grid gap-5 xl:grid-cols-2">
          {[
            { title: "Today", tasks: sections.today },
            { title: "Upcoming", tasks: sections.upcoming },
            { title: "Overdue", tasks: sections.overdue },
            { title: "Completed", tasks: sections.completed },
          ].map((section) => (
            <div key={section.title} className="rounded-[32px] border border-border/80 bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-foreground">{section.title}</h2>
                <div className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                  {section.tasks.length}
                </div>
              </div>

              <div className="space-y-3">
                {section.tasks.length === 0 ? (
                  <EmptyState
                    title={`No ${section.title.toLowerCase()} tasks`}
                    description="Nothing is sitting in this bucket right now."
                  />
                ) : (
                  section.tasks.map((task) => <TaskCard key={task.id} task={task} />)
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AddTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Add personal task"
        description="Create a task for yourself. Link a project only when it actually helps."
        preferredAssigneeUserId={data.viewer.currentUserId}
        lockAssignee
      />
    </div>
  )
}
