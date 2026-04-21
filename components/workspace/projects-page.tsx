"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Plus, Search } from "lucide-react"

import type { ProjectsPageData } from "@/lib/task-data"
import { CreateProjectDialog } from "@/components/workspace/create-project-dialog"
import { PersonAvatar, ProjectStatusBadge } from "@/components/workspace/task-ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ProjectsPageView({ data }: { data: ProjectsPageData }) {
  const [createOpen, setCreateOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return data.projects.filter((project) => {
      const matchesQuery =
        !normalizedQuery
        || project.name.toLowerCase().includes(normalizedQuery)
        || (project.description ?? "").toLowerCase().includes(normalizedQuery)
        || (project.locationText ?? "").toLowerCase().includes(normalizedQuery)
        || (project.leadName ?? "").toLowerCase().includes(normalizedQuery)

      const matchesStatus = status === "all" || project.status === status
      return matchesQuery && matchesStatus
    })
  }, [data.projects, query, status])

  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Shared Context</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Projects</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Optional work contexts such as Antarvan, Office, and Swagram Swadesh.
            </p>
          </div>
          {data.viewer.canManageProjects ? (
            <Button onClick={() => setCreateOpen(true)} className="h-11 rounded-full px-5">
              <Plus className="mr-2 h-4 w-4" />
              Create project
            </Button>
          ) : null}
        </div>

        <div className="rounded-[32px] border border-border/80 bg-card p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search projects, leads, or locations"
                className="pl-9"
              />
            </div>

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="all">All statuses</option>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="handover">Handover</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              href={`/app/projects/${project.id}`}
              className="rounded-[32px] border border-border/80 bg-card p-5 shadow-[0_1px_0_rgba(15,23,42,0.03)] transition-colors hover:border-border"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xl font-semibold text-foreground">{project.name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {project.locationText || "No location set"}
                  </div>
                </div>
                <ProjectStatusBadge status={project.status} />
              </div>

              <div className="mt-4 text-sm leading-6 text-muted-foreground">
                {project.description || "No description yet."}
              </div>

              <div className="mt-5 grid gap-3 rounded-3xl bg-background/80 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total linked tasks</span>
                  <span className="font-medium text-foreground">{project.totalLinkedTasks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Overdue linked tasks</span>
                  <span className="font-medium text-foreground">{project.overdueTasks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Team count</span>
                  <span className="font-medium text-foreground">{project.teamCount}</span>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <PersonAvatar name={project.leadName ?? "No lead"} avatarUrl={null} className="h-8 w-8" />
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Lead</div>
                  <div className="text-sm font-medium text-foreground">{project.leadName ?? "Not assigned"}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        members={data.members}
      />
    </div>
  )
}
