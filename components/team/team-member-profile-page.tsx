"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  ArrowLeft,
  Mail,
  MapPin,
  Phone,
  Shield,
  SquarePen,
  Trash2,
  Users,
} from "lucide-react"

import { getAssignedAccessLevelLabel, getAssignedPermissionFlags } from "@/lib/assigned-access"
import { CreateEditUserModal } from "@/components/team/create-edit-user-modal"
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
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getActiveTaskCount,
  getBlockedTaskCount,
  getCompletedThisWeekCount,
  getCurrentProject,
  getOverdueTaskCount,
  groupTasksForProfile,
  type TeamMemberProfileData,
  type TeamUserDraft,
} from "@/lib/team-data"

type TeamMemberProfilePageProps = {
  memberId: string
}

export function TeamMemberProfilePage({ memberId }: TeamMemberProfilePageProps) {
  const {
    viewer,
    teams,
    members,
    positions,
    projects,
    loadMemberProfile,
    updateUser,
    deleteUser,
    getDefaultUserDraft,
  } = useTeamDirectoryData()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [editOpen, setEditOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<TeamMemberProfileData | null>(null)
  const [draft, setDraft] = useState<TeamUserDraft>(getDefaultUserDraft())
  const [isDeletingUser, setIsDeletingUser] = useState(false)

  useEffect(() => {
    let active = true

    void (async () => {
      setLoading(true)
      setError(null)
      const payload = await loadMemberProfile(memberId)

      if (!active) {
        return
      }

      if (!payload) {
        setError("This user profile could not be loaded.")
        setLoading(false)
        return
      }

      setDetail(payload)
      setDraft(getDefaultUserDraft({
        fullName: payload.member.fullName,
        email: payload.member.email ?? "",
        phone: payload.member.phone ?? "",
        avatarUrl: payload.member.avatarUrl ?? "",
        accessLevel: payload.member.accessLevel,
        teamId: payload.member.teamId,
        positionId: payload.member.positionId,
        managerUserId: payload.member.managerUserId,
        projectIds: payload.member.projectIds,
        primaryProjectId: payload.member.primaryProjectId,
        availability: payload.member.availability,
        status: payload.member.status,
      }))
      setLoading(false)
    })()

    return () => {
      active = false
    }
  }, [getDefaultUserDraft, loadMemberProfile, memberId])

  const member = detail?.member ?? null
  const team = member ? teams.find((entry) => entry.id === member.teamId) ?? null : null
  const manager = member?.managerUserId ? members.find((entry) => entry.userId === member.managerUserId) ?? null : null
  const assignedProjects = detail?.projects ?? []
  const permissionFlags = useMemo(
    () => member ? getAssignedPermissionFlags({ accessLevel: member.accessLevel }) : null,
    [member]
  )
  const groupedTasks = useMemo(
    () => groupTasksForProfile(member?.tasks ?? []),
    [member?.tasks]
  )

  if (loading) {
    return (
      <div className="px-4 py-6 lg:px-8">
        <SoftSection className="p-10 text-center">
          <div className="text-lg font-medium text-foreground">Loading user profile...</div>
        </SoftSection>
      </div>
    )
  }

  if (error || !member) {
    return (
      <div className="px-4 py-6 lg:px-8">
        <SoftSection className="p-10 text-center">
          <div className="text-lg font-medium text-foreground">This user could not be found.</div>
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

  const currentProject = getCurrentProject(member, projects)
  const handleDeleteUser = async () => {
    if (!window.confirm(`Delete ${member.fullName}'s account from Assigned? This removes their access and data-backed profile.`)) {
      return
    }

    setIsDeletingUser(true)
    const result = await deleteUser(member.userId)
    setIsDeletingUser(false)

    if (result.error) {
      setError(result.error)
      return
    }

    router.replace("/app/team")
    router.refresh()
  }

  return (
    <div className="px-4 py-6 pb-24 lg:px-8 lg:pb-8">
      <div className="mx-auto flex w-full max-w-[1380px] flex-col gap-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-4">
            <Button variant="ghost" className="w-fit rounded-full px-0 text-muted-foreground" asChild>
              <Link href="/app/team">
                <ArrowLeft className="h-4 w-4" />
                Back to Team
              </Link>
            </Button>

            <SoftSection className="p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                <MemberAvatar member={member} className="size-20" />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">{member.fullName}</h1>
                    <AvailabilityBadge availability={member.availability} status={member.status} />
                  </div>

                  <div className="mt-2 text-base text-muted-foreground">{member.positionName ?? "Awaiting assignment"}</div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {team ? <TeamBadge team={team} /> : null}
                    <RoleBadge accessLevel={member.accessLevel} />
                    {currentProject ? (
                      <span className="rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground">
                        {currentProject.name}{currentProject.locationText ? ` · ${currentProject.locationText}` : ""}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-5 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-3">
                    {member.email ? (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{member.email}</span>
                      </div>
                    ) : null}
                    {member.phone ? (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{member.phone}</span>
                      </div>
                    ) : null}
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{manager?.fullName ?? "No manager assigned"}</span>
                    </div>
                  </div>
                </div>

                {member.canEdit ? (
                  <div className="flex flex-wrap gap-3">
                    <Button className="rounded-2xl" onClick={() => setEditOpen(true)}>
                      <SquarePen className="h-4 w-4" />
                      Edit User
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-2xl border-destructive text-destructive hover:bg-destructive/10"
                      disabled={isDeletingUser}
                      onClick={() => {
                        void handleDeleteUser()
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      {isDeletingUser ? "Deleting..." : "Delete User"}
                    </Button>
                  </div>
                ) : null}
              </div>
            </SoftSection>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Active Tasks" value={getActiveTaskCount(member)} helper="Tasks not yet completed" />
          <StatCard
            label="Overdue Tasks"
            value={getOverdueTaskCount(member)}
            helper="Needs immediate follow-through"
            tone="danger"
          />
          <StatCard
            label="Completed This Week"
            value={getCompletedThisWeekCount(member)}
            helper="Recently closed items"
            tone="success"
          />
          <StatCard
            label="Blocked Tasks"
            value={getBlockedTaskCount(member)}
            helper="Waiting on another input"
            tone="warning"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-11 rounded-2xl bg-muted/70 p-1">
            <TabsTrigger value="overview" className="rounded-xl px-4">
              Overview
            </TabsTrigger>
            <TabsTrigger value="tasks" className="rounded-xl px-4" disabled={!member.canViewDetailedTasks}>
              Tasks
            </TabsTrigger>
            <TabsTrigger value="projects" className="rounded-xl px-4">
              Projects / Sites
            </TabsTrigger>
            <TabsTrigger value="activity" className="rounded-xl px-4" disabled={!member.canViewDetailedTasks}>
              Activity
            </TabsTrigger>
            {viewer.canViewPermissions ? (
              <TabsTrigger value="permissions" className="rounded-xl px-4">
                Permissions
              </TabsTrigger>
            ) : null}
          </TabsList>

          <TabsContent value="overview">
            <SoftSection className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {[
                { label: "Name", value: member.fullName },
                { label: "Email", value: member.email ?? "Visible to admins and direct leads" },
                { label: "Phone", value: member.phone ?? "Visible to admins and direct leads" },
                { label: "Team", value: team?.name ?? "Unassigned" },
                { label: "Position", value: member.positionName ?? "Unassigned" },
                { label: "Access Level", value: member.accessLevel },
                { label: "Manager / Team Lead", value: manager?.fullName ?? "Not set" },
                {
                  label: "Status",
                  value: member.status === "inactive"
                    ? "Inactive"
                    : member.availability === "on_leave"
                      ? "On Leave"
                      : member.availability === "busy"
                        ? "Busy"
                        : "Available",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-border/80 bg-background px-4 py-4"
                >
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.label}</div>
                  <div className="mt-2 text-sm font-medium text-foreground">{item.value}</div>
                </div>
              ))}
            </SoftSection>
          </TabsContent>

          <TabsContent value="tasks">
            {member.canViewDetailedTasks ? (
              <div className="grid gap-4 xl:grid-cols-4">
                {[
                  { key: "inProgress", label: "In Progress", items: groupedTasks.inProgress },
                  { key: "dueSoon", label: "Due Soon", items: groupedTasks.dueSoon },
                  { key: "overdue", label: "Overdue", items: groupedTasks.overdue },
                  { key: "completed", label: "Completed", items: groupedTasks.completed },
                ].map((group) => (
                  <SoftSection key={group.key} className="space-y-4">
                    <div className="text-lg font-semibold text-foreground">{group.label}</div>
                    <div className="space-y-3">
                      {group.items.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                          No tasks in this section.
                        </div>
                      ) : (
                        group.items.map((task) => {
                          const project = projects.find((entry) => entry.id === task.projectId)

                          return (
                            <div
                              key={task.id}
                              className="rounded-2xl border border-border/70 bg-background px-4 py-3"
                            >
                              <div className="font-medium text-foreground">{task.title}</div>
                              <div className="mt-1 text-sm text-muted-foreground">
                                {project?.name ?? "Unknown project"}{project?.locationText ? ` · ${project.locationText}` : ""}
                              </div>
                              <div className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                {task.dueLabel}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </SoftSection>
                ))}
              </div>
            ) : (
              <SoftSection className="p-10 text-center text-sm text-muted-foreground">
                Detailed tasks are only visible to this user, direct leads, and admins.
              </SoftSection>
            )}
          </TabsContent>

          <TabsContent value="projects">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {assignedProjects.length === 0 ? (
                <SoftSection className="p-8 text-sm text-muted-foreground">
                  No projects have been assigned yet.
                </SoftSection>
              ) : (
                assignedProjects.map((project) => (
                  <SoftSection key={project.id} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-semibold text-foreground">{project.name}</div>
                        <div className="text-sm text-muted-foreground">{project.locationText ?? "Project"}</div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">{project.locationText ?? "Location not set"}</div>
                  </SoftSection>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity">
            {member.canViewDetailedTasks ? (
              <SoftSection className="space-y-4">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
                </div>

                <div className="space-y-3">
                  {member.recentActivity.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                      No recent activity has been recorded yet.
                    </div>
                  ) : (
                    member.recentActivity.map((entry) => {
                      const project = entry.projectId ? projects.find((item) => item.id === entry.projectId) ?? null : null

                      return (
                        <div
                          key={entry.id}
                          className="rounded-2xl border border-border/70 bg-background px-4 py-4"
                        >
                          <div className="font-medium text-foreground">{entry.summary}</div>
                          {project ? (
                            <div className="mt-1 text-sm text-muted-foreground">
                              {project.name}{project.locationText ? ` · ${project.locationText}` : ""}
                            </div>
                          ) : null}
                          <div className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                            {entry.dateLabel}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </SoftSection>
            ) : (
              <SoftSection className="p-10 text-center text-sm text-muted-foreground">
                Activity is only visible to this user, direct leads, and admins.
              </SoftSection>
            )}
          </TabsContent>

          {viewer.canViewPermissions ? (
            <TabsContent value="permissions">
              <SoftSection className="space-y-5">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Permissions</h2>
                    <p className="text-sm text-muted-foreground">
                      Database-backed permission matrix for the current access level.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/80 bg-background px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Current access level</div>
                  <div className="mt-2 text-sm font-medium text-foreground">
                    {getAssignedAccessLevelLabel(member.accessLevel)}
                  </div>
                </div>

                {permissionFlags ? (
                  <div className="space-y-3">
                    {[
                      { key: "directoryAccess", label: "Team directory access" },
                      { key: "workloadView", label: "Detailed workload access" },
                      { key: "taskAssignment", label: "Assign tasks" },
                      { key: "editUsers", label: "Edit users" },
                      { key: "inactiveUsers", label: "View inactive users" },
                      { key: "globalPermissions", label: "Change global permissions" },
                      { key: "manageTeams", label: "Manage teams" },
                      { key: "managePositions", label: "Manage positions" },
                      { key: "assignProjects", label: "Assign projects" },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between rounded-2xl border border-border/70 bg-background px-4 py-4"
                      >
                        <div className="font-medium text-foreground">{item.label}</div>
                        <Switch
                          checked={Boolean(permissionFlags[item.key as keyof typeof permissionFlags])}
                          disabled
                          aria-label={item.label}
                        />
                      </div>
                    ))}
                  </div>
                ) : null}
              </SoftSection>
            </TabsContent>
          ) : null}
        </Tabs>
      </div>

      <CreateEditUserModal
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        teams={teams}
        members={members}
        projects={projects}
        positions={positions}
        initialDraft={draft}
        onSave={async (nextDraft) => {
          await updateUser(member.userId, nextDraft)
        }}
        allowAccessEdits={viewer.canViewPermissions}
      />
    </div>
  )
}
