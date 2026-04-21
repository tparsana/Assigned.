"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowLeft, Briefcase, Pencil, Users } from "lucide-react"

import { CreateTeamModal } from "@/components/team/create-team-modal"
import { useTeamDirectoryData } from "@/components/team/team-data-provider"
import {
  AvailabilityBadge,
  MemberAvatar,
  RoleBadge,
  SoftSection,
  StatCard,
  TeamBadge,
} from "@/components/team/team-ui"
import { Button } from "@/components/ui/button"
import { createTeamDraft, type TeamDetailData, type TeamDraft } from "@/lib/team-data"

type TeamDetailPageProps = {
  teamId: string
  initialDetail?: TeamDetailData | null
}

export function TeamDetailPage({ teamId, initialDetail = null }: TeamDetailPageProps) {
  const {
    viewer,
    members,
    projects,
    loadTeamDetail,
    updateTeam,
  } = useTeamDirectoryData()
  const [detail, setDetail] = useState<TeamDetailData | null>(initialDetail)
  const [loading, setLoading] = useState(!initialDetail)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [teamDraft, setTeamDraft] = useState<TeamDraft>(createTeamDraft())

  useEffect(() => {
    if (initialDetail) {
      return
    }

    let active = true

    void (async () => {
      setLoading(true)
      setError(null)
      const payload = await loadTeamDetail(teamId)

      if (!active) {
        return
      }

      if (!payload) {
        setError("This team could not be loaded.")
        setLoading(false)
        return
      }

      setDetail(payload)
      setTeamDraft(createTeamDraft({
        name: payload.team.name,
        description: payload.team.description ?? "",
        leadUserId: payload.team.leadUserId,
        parentDepartment: payload.team.parentDepartment ?? "",
        defaultProjectIds: payload.team.projectIds,
        color: payload.team.color,
        icon: payload.team.icon ?? "layers",
      }))
      setLoading(false)
    })()

    return () => {
      active = false
    }
  }, [initialDetail, loadTeamDetail, teamId])

  if (loading) {
    return (
      <div className="px-4 py-6 lg:px-8">
        <SoftSection className="p-10 text-center">
          <div className="text-lg font-medium text-foreground">Loading team details...</div>
        </SoftSection>
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="px-4 py-6 lg:px-8">
        <SoftSection className="p-10 text-center">
          <div className="text-lg font-medium text-foreground">This team could not be found.</div>
          <p className="mt-2 text-sm text-muted-foreground">{error ?? "Try again from the Team directory."}</p>
          <Button variant="outline" className="mt-6" asChild>
            <Link href="/app/team">
              <ArrowLeft className="h-4 w-4" />
              Back to Team
            </Link>
          </Button>
        </SoftSection>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 pb-24 lg:px-8 lg:pb-8">
      <div className="mx-auto flex w-full max-w-[1380px] flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <Button variant="ghost" className="w-fit rounded-full px-0 text-muted-foreground" asChild>
              <Link href="/app/team">
                <ArrowLeft className="h-4 w-4" />
                Back to Team
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: detail.team.color }} />
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">{detail.team.name}</h1>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{detail.team.description}</p>
            </div>
          </div>

          {viewer.canManageTeams ? (
            <Button className="rounded-2xl" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Edit Team
            </Button>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Team Lead"
            value={detail.team.leadName ?? "Unassigned"}
            helper="Primary owner for this group"
          />
          <StatCard
            label="Member Count"
            value={detail.team.memberCount}
            helper="People currently attached"
          />
          <StatCard
            label="Linked Projects"
            value={detail.projects.length}
            helper={detail.projects.map((project) => project.locationText ?? project.name).join(", ") || "None linked yet"}
            tone="success"
          />
          <StatCard
            label="Open Tasks"
            value={detail.team.openTaskCount}
            helper="Pending work currently attached to this team"
            tone="warning"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <SoftSection className="space-y-6">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">Members</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {detail.members.map((member) => (
                <Link
                  key={member.userId}
                  href={`/app/team/members/${member.userId}`}
                  className="rounded-[24px] border border-border/80 bg-background p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <MemberAvatar member={member} />
                      <div>
                        <div className="font-medium text-foreground">{member.fullName}</div>
                        <div className="text-sm text-muted-foreground">{member.positionName ?? "Awaiting assignment"}</div>
                      </div>
                    </div>
                    <AvailabilityBadge availability={member.availability} status={member.status} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <TeamBadge team={detail.team} />
                    <RoleBadge accessLevel={member.accessLevel} />
                  </div>

                  <div className="mt-4 text-sm text-muted-foreground">
                    Pending tasks:{" "}
                    <span className="font-medium text-foreground">
                      {member.taskStats ? member.taskStats.pending : "Limited"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </SoftSection>

          <div className="flex flex-col gap-6">
            <SoftSection className="space-y-4">
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold text-foreground">Positions in Team</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {detail.positions.length === 0 ? (
                  <span className="text-sm text-muted-foreground">No positions created yet.</span>
                ) : (
                  detail.positions.map((position) => (
                    <span
                      key={position.id}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground"
                    >
                      {position.name}
                    </span>
                  ))
                )}
              </div>
            </SoftSection>

            <SoftSection className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Linked Projects</h2>
              <div className="space-y-3">
                {detail.projects.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                    No projects linked to this team yet.
                  </div>
                ) : (
                  detail.projects.map((project) => (
                    <div
                      key={project.id}
                      className="rounded-2xl border border-border/70 bg-background px-4 py-3"
                    >
                      <div className="font-medium text-foreground">{project.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {project.name}{project.locationText ? ` · ${project.locationText}` : ""}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SoftSection>

            <SoftSection className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
              {detail.canViewActivity ? (
                <div className="space-y-3">
                  {detail.recentActivity.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                      No recent activity has been recorded yet.
                    </div>
                  ) : (
                    detail.recentActivity.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-border/70 bg-background px-4 py-3"
                      >
                        <div className="mt-1 text-sm text-muted-foreground">{item.summary}</div>
                        <div className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          {item.dateLabel}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                  Recent activity is only shown to admins and team leads within their own scope.
                </div>
              )}
            </SoftSection>
          </div>
        </div>
      </div>

      <CreateTeamModal
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        members={members}
        projects={projects}
        initialDraft={teamDraft}
        onSave={async (draft) => {
          await updateTeam(detail.team.id, draft)
        }}
      />
    </div>
  )
}
