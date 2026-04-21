"use client"

import Link from "next/link"

import type { ProjectDetailData } from "@/lib/task-data"
import { PersonAvatar, ProjectStatusBadge, TaskCard } from "@/components/workspace/task-ui"

export function ProjectDetailPageView({ data }: { data: ProjectDetailData }) {
  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="flex flex-col gap-6">
        <div className="rounded-[36px] border border-border/80 bg-card p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Project</div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{data.project.name}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                {data.project.description || "No project description added yet."}
              </p>
            </div>
            <ProjectStatusBadge status={data.project.status} />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl bg-background p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Location</div>
              <div className="mt-3 text-lg font-medium text-foreground">{data.project.locationText || "Not set"}</div>
            </div>
            <div className="rounded-3xl bg-background p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Project lead</div>
              <div className="mt-3 text-lg font-medium text-foreground">{data.project.leadName || "Not assigned"}</div>
            </div>
            <div className="rounded-3xl bg-background p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Start / End</div>
              <div className="mt-3 text-lg font-medium text-foreground">
                {data.project.startDate || "TBD"} to {data.project.endDate || "TBD"}
              </div>
            </div>
            <div className="rounded-3xl bg-background p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Team members</div>
              <div className="mt-3 text-lg font-medium text-foreground">{data.project.teamCount}</div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-border/80 bg-card p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total tasks</div>
            <div className="mt-3 text-3xl font-semibold text-foreground">{data.project.totalLinkedTasks}</div>
          </div>
          <div className="rounded-3xl border border-border/80 bg-card p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Open tasks</div>
            <div className="mt-3 text-3xl font-semibold text-foreground">{data.project.openTasks}</div>
          </div>
          <div className="rounded-3xl border border-border/80 bg-card p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Overdue tasks</div>
            <div className="mt-3 text-3xl font-semibold text-foreground">{data.project.overdueTasks}</div>
          </div>
          <div className="rounded-3xl border border-border/80 bg-card p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Comments / updates</div>
            <div className="mt-3 text-3xl font-semibold text-foreground">{data.recentComments.length}</div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <div className="rounded-[32px] border border-border/80 bg-card p-5">
            <div className="mb-4 text-lg font-medium text-foreground">Linked Tasks</div>
            <div className="space-y-3">
              {data.linkedTasks.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border bg-background/80 px-4 py-8 text-center text-sm text-muted-foreground">
                  No tasks are currently linked to this project.
                </div>
              ) : (
                data.linkedTasks.map((task) => <TaskCard key={task.id} task={task} />)
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[32px] border border-border/80 bg-card p-5">
              <div className="mb-4 text-lg font-medium text-foreground">Team on this Project</div>
              <div className="space-y-3">
                {data.teamMembers.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-border bg-background/80 px-4 py-8 text-center text-sm text-muted-foreground">
                    No team members linked yet.
                  </div>
                ) : (
                  data.teamMembers.map((member) => (
                    <Link
                      key={member.userId}
                      href={`/app/team/members/${member.userId}`}
                      className="flex items-center gap-3 rounded-3xl bg-background px-4 py-3"
                    >
                      <PersonAvatar name={member.fullName} avatarUrl={member.avatarUrl} />
                      <div>
                        <div className="font-medium text-foreground">{member.fullName}</div>
                        <div className="text-sm text-muted-foreground">
                          {member.positionName || member.accessLevel}
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[32px] border border-border/80 bg-card p-5">
              <div className="mb-4 text-lg font-medium text-foreground">Files / Docs</div>
              <div className="rounded-3xl border border-dashed border-border bg-background/80 px-4 py-8 text-center text-sm text-muted-foreground">
                Attach files directly on tasks for now. Shared project docs can layer in next.
              </div>
            </div>

            <div className="rounded-[32px] border border-border/80 bg-card p-5">
              <div className="mb-4 text-lg font-medium text-foreground">Activity</div>
              <div className="space-y-3">
                {data.recentComments.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-border bg-background/80 px-4 py-8 text-center text-sm text-muted-foreground">
                    No recent activity yet.
                  </div>
                ) : (
                  data.recentComments.map((comment) => (
                    <div key={comment.id} className="rounded-3xl bg-background px-4 py-3">
                      <div className="flex items-center gap-3">
                        <PersonAvatar name={comment.user.fullName} avatarUrl={comment.user.avatarUrl} className="h-8 w-8" />
                        <div>
                          <div className="font-medium text-foreground">{comment.user.fullName}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 text-sm leading-6 text-muted-foreground">{comment.body}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
