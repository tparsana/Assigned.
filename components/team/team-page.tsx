"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import {
  Briefcase,
  ChevronRight,
  Eye,
  Filter,
  MapPin,
  Pencil,
  Plus,
  Search,
  SquarePen,
} from "lucide-react"

import { assignedAccessLevelDefinitions } from "@/lib/assigned-access"
import { CreateEditUserModal } from "@/components/team/create-edit-user-modal"
import { CreatePositionModal } from "@/components/team/create-position-modal"
import { CreateTeamModal } from "@/components/team/create-team-modal"
import { useTeamDirectoryData } from "@/components/team/team-data-provider"
import {
  AvailabilityBadge,
  MemberAvatar,
  MemberWorkloadIndicator,
  RoleBadge,
  SoftSection,
  StatCard,
  TeamBadge,
} from "@/components/team/team-ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  availabilityStatusOptions,
  canManageTeamDirectory,
  canUseQuickActions,
  canViewDetailedWorkload,
  createPositionDraft,
  createTeamDraft,
  createTeamUserDraft,
  getAccessLevelOptionsForViewer,
  getActiveTaskCount,
  getCurrentProject,
  getOverdueTaskCount,
  getPendingTaskCount,
  getTeamById,
  getTeamLead,
  getTeamMemberCount,
  getTeamOpenTaskCount,
  getTeamProjects,
  getVisibleMembersForViewer,
  type PositionDraft,
  type TeamDraft,
  type TeamUserDraft,
} from "@/lib/team-data"

type TeamView = "directory" | "teams" | "workload"

export function TeamPage() {
  const router = useRouter()
  const {
    hydrated,
    loading,
    error,
    viewer,
    teams,
    positions,
    members,
    projects,
    createUser,
    updateUser,
    createTeam,
    updateTeam,
    createPosition,
    getDefaultPositionDraft,
    getDefaultTeamDraft,
    getDefaultUserDraft,
  } = useTeamDirectoryData()

  const canSeeWorkload = canViewDetailedWorkload(viewer)
  const canManage = canManageTeamDirectory(viewer)
  const canQuickAct = canUseQuickActions(viewer)

  const [view, setView] = useState<TeamView>("directory")
  const [query, setQuery] = useState("")
  const [teamFilter, setTeamFilter] = useState("all")
  const [positionFilter, setPositionFilter] = useState("all")
  const [accessLevelFilter, setAccessLevelFilter] = useState("all")
  const [projectFilter, setProjectFilter] = useState("all")
  const [availabilityFilter, setAvailabilityFilter] = useState("all")
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [userModalMode, setUserModalMode] = useState<"create" | "edit">("create")
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [userDraft, setUserDraft] = useState<TeamUserDraft>(createTeamUserDraft())
  const [teamModalOpen, setTeamModalOpen] = useState(false)
  const [teamModalMode, setTeamModalMode] = useState<"create" | "edit">("create")
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null)
  const [teamDraft, setTeamDraft] = useState<TeamDraft>(createTeamDraft())
  const [positionModalOpen, setPositionModalOpen] = useState(false)
  const [positionDraft, setPositionDraft] = useState<PositionDraft>(createPositionDraft())

  const visibleMembers = useMemo(
    () => getVisibleMembersForViewer(members, viewer),
    [members, viewer]
  )

  const visibleProjects = useMemo(() => {
    const visibleProjectIds = new Set(visibleMembers.flatMap((member) => member.projectIds))
    return projects.filter((project) => visibleProjectIds.has(project.id))
  }, [projects, visibleMembers])

  const allVisiblePositions = useMemo(
    () =>
      positions
        .filter((position) => visibleMembers.some((member) => member.positionId === position.id))
        .sort((left, right) => left.name.localeCompare(right.name)),
    [positions, visibleMembers]
  )

  const filteredMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return visibleMembers.filter((member) => {
      const currentProject = getCurrentProject(member, projects)
      const matchesQuery =
        !normalizedQuery
        || member.fullName.toLowerCase().includes(normalizedQuery)
        || (member.positionName ?? "").toLowerCase().includes(normalizedQuery)
        || (member.teamName ?? "").toLowerCase().includes(normalizedQuery)
        || (currentProject?.name ?? "").toLowerCase().includes(normalizedQuery)
        || (currentProject?.locationText ?? "").toLowerCase().includes(normalizedQuery)

      const matchesTeam = teamFilter === "all" || member.teamId === teamFilter
      const matchesPosition = positionFilter === "all" || member.positionId === positionFilter
      const matchesAccessLevel = accessLevelFilter === "all" || member.accessLevel === accessLevelFilter
      const matchesProject = projectFilter === "all" || member.projectIds.includes(projectFilter)
      const matchesAvailability =
        availabilityFilter === "all"
        || (availabilityFilter === "inactive"
          ? member.status === "inactive"
          : member.availability === availabilityFilter)

      return matchesQuery && matchesTeam && matchesPosition && matchesAccessLevel && matchesProject && matchesAvailability
    })
  }, [
    accessLevelFilter,
    availabilityFilter,
    positionFilter,
    projectFilter,
    projects,
    query,
    teamFilter,
    visibleMembers,
  ])

  const workloadMembers = useMemo(
    () => filteredMembers.filter((member) => member.taskStats !== null),
    [filteredMembers]
  )

  const groupedDirectory = useMemo(
    () =>
      teams
        .map((team) => ({
          team,
          members: filteredMembers.filter((member) => member.teamId === team.id),
        }))
        .filter((entry) => entry.members.length > 0),
    [filteredMembers, teams]
  )

  const teamCards = useMemo(
    () =>
      teams
        .filter((team) => teamFilter === "all" || team.id === teamFilter)
        .filter((team) => {
          const teamMembers = filteredMembers.filter((member) => member.teamId === team.id)
          return teamMembers.length > 0 || !query
        })
        .map((team) => ({
          team,
          lead: getTeamLead(team, members),
          memberCount: getTeamMemberCount(team.id, members),
          projects: getTeamProjects(team.id, teams, projects),
          openTasks: getTeamOpenTaskCount(team.id, members),
        })),
    [filteredMembers, members, projects, query, teamFilter, teams]
  )

  const summary = useMemo(() => {
    const activeInternalUsers = visibleMembers.filter((member) => member.status === "active").length
    const busyCount = visibleMembers.filter((member) => member.availability === "busy").length
    const heavyCount = visibleMembers.filter((member) => member.taskStats?.workload === "heavy").length
    const activeSites = new Set(visibleMembers.flatMap((member) => member.projectIds)).size

    return {
      activeInternalUsers,
      busyCount,
      heavyCount,
      activeSites,
    }
  }, [visibleMembers])

  const handleOpenCreateUser = () => {
    setUserModalMode("create")
    setEditingMemberId(null)
    setUserDraft(getDefaultUserDraft())
    setUserModalOpen(true)
  }

  const handleOpenEditUser = (memberId: string) => {
    const member = members.find((entry) => entry.userId === memberId)
    if (!member) {
      return
    }

    setUserModalMode("edit")
    setEditingMemberId(memberId)
    setUserDraft(getDefaultUserDraft({
      fullName: member.fullName,
      email: member.email ?? "",
      phone: member.phone ?? "",
      avatarUrl: member.avatarUrl ?? "",
      accessLevel: member.accessLevel,
      teamId: member.teamId,
      positionId: member.positionId,
      managerUserId: member.managerUserId,
      projectIds: member.projectIds,
      primaryProjectId: member.primaryProjectId,
      availability: member.availability,
      status: member.status,
    }))
    setUserModalOpen(true)
  }

  const handleOpenCreateTeam = () => {
    setTeamModalMode("create")
    setEditingTeamId(null)
    setTeamDraft(getDefaultTeamDraft())
    setTeamModalOpen(true)
  }

  const handleOpenEditTeam = (teamId: string) => {
    const team = teams.find((entry) => entry.id === teamId)
    if (!team) {
      return
    }

    setTeamModalMode("edit")
    setEditingTeamId(teamId)
    setTeamDraft(getDefaultTeamDraft({
      name: team.name,
      description: team.description ?? "",
      leadUserId: team.leadUserId,
      parentDepartment: team.parentDepartment ?? "",
      defaultProjectIds: team.projectIds,
      color: team.color,
      icon: team.icon ?? "layers",
    }))
    setTeamModalOpen(true)
  }

  if (loading && !hydrated) {
    return (
      <div className="px-4 py-6 lg:px-8">
        <SoftSection className="p-10 text-center">
          <div className="text-lg font-medium text-foreground">Loading team workspace...</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Pulling the live organization directory, teams, and workload data from Supabase.
          </p>
        </SoftSection>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-6 lg:px-8">
        <SoftSection className="p-10 text-center">
          <div className="text-lg font-medium text-foreground">Team workspace unavailable</div>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </SoftSection>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 pb-24 lg:px-8 lg:pb-8">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Team</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Directory, teams, and workload visibility for Samaya’s operating structure.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
            <div className="relative min-w-[320px] flex-1 xl:w-[320px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search people, positions, teams, or projects"
                className="h-11 rounded-2xl bg-card pl-11"
              />
            </div>

            {canManage ? (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="h-11 rounded-2xl" onClick={handleOpenCreateTeam}>
                  <Plus className="h-4 w-4" />
                  Create Team
                </Button>
                <Button variant="outline" className="h-11 rounded-2xl" onClick={() => {
                  setPositionDraft(getDefaultPositionDraft())
                  setPositionModalOpen(true)
                }}>
                  <Plus className="h-4 w-4" />
                  Create Position
                </Button>
                <Button className="h-11 rounded-2xl" onClick={handleOpenCreateUser}>
                  <Plus className="h-4 w-4" />
                  Add User
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Active People"
            value={summary.activeInternalUsers}
            helper={`${teams.length} teams in the current structure`}
          />
          <StatCard
            label="Busy Right Now"
            value={summary.busyCount}
            helper="People currently marked as busy"
            tone="warning"
          />
          <StatCard
            label="Heavy Workload"
            value={summary.heavyCount}
            helper="Members who need balancing soon"
            tone="danger"
          />
          <StatCard
            label="Active Sites"
            value={summary.activeSites}
            helper="Projects currently attached to visible teams"
            tone="success"
          />
        </div>

        <SoftSection className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Tabs value={view} onValueChange={(value) => setView(value as TeamView)} className="gap-0">
              <TabsList className="h-11 rounded-2xl bg-muted/70 p-1">
                <TabsTrigger value="directory" className="rounded-xl px-4">
                  Directory
                </TabsTrigger>
                <TabsTrigger value="teams" className="rounded-xl px-4">
                  Teams
                </TabsTrigger>
                {canSeeWorkload ? (
                  <TabsTrigger value="workload" className="rounded-xl px-4">
                    Workload
                  </TabsTrigger>
                ) : null}
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              Filters
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <select
              value={teamFilter}
              onChange={(event) => setTeamFilter(event.target.value)}
              className="h-11 rounded-2xl border border-border bg-background px-4 text-sm text-foreground"
            >
              <option value="all">All teams</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>

            <select
              value={positionFilter}
              onChange={(event) => setPositionFilter(event.target.value)}
              className="h-11 rounded-2xl border border-border bg-background px-4 text-sm text-foreground"
            >
              <option value="all">All positions</option>
              {allVisiblePositions.map((position) => (
                <option key={position.id} value={position.id}>{position.name}</option>
              ))}
            </select>

            <select
              value={accessLevelFilter}
              onChange={(event) => setAccessLevelFilter(event.target.value)}
              className="h-11 rounded-2xl border border-border bg-background px-4 text-sm text-foreground"
            >
              <option value="all">All access levels</option>
              {getAccessLevelOptionsForViewer(viewer).map((definition) => (
                <option key={definition.value} value={definition.value}>{definition.label}</option>
              ))}
            </select>

            <select
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
              className="h-11 rounded-2xl border border-border bg-background px-4 text-sm text-foreground"
            >
              <option value="all">All projects</option>
              {visibleProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}{project.locationText ? ` · ${project.locationText}` : ""}
                </option>
              ))}
            </select>

            <select
              value={availabilityFilter}
              onChange={(event) => setAvailabilityFilter(event.target.value)}
              className="h-11 rounded-2xl border border-border bg-background px-4 text-sm text-foreground"
            >
              <option value="all">All availability</option>
              {availabilityStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "on_leave" ? "On Leave" : status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
              {viewer.canViewInactiveUsers ? <option value="inactive">Inactive</option> : null}
            </select>
          </div>
        </SoftSection>

        {view === "directory" ? (
          <div className="flex flex-col gap-6">
            {groupedDirectory.length === 0 ? (
              <SoftSection className="p-12 text-center">
                <div className="text-lg font-medium text-foreground">No team members match these filters.</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Adjust the search or filter set to bring the right people back into view.
                </p>
              </SoftSection>
            ) : (
              groupedDirectory.map(({ team, members: teamMembers }) => (
                <SoftSection key={team.id} className="space-y-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: team.color }} />
                        <h2 className="text-xl font-semibold text-foreground">{team.name}</h2>
                      </div>
                      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{team.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {canManage ? (
                        <Button
                          variant="ghost"
                          className="h-9 rounded-xl px-3 text-muted-foreground"
                          onClick={() => handleOpenEditTeam(team.id)}
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                      ) : null}
                      <Button variant="ghost" className="h-9 rounded-xl px-3 text-muted-foreground" asChild>
                        <Link href={`/app/team/teams/${team.slug}`}>
                          Open team
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                    {teamMembers.map((member) => {
                      const currentProject = getCurrentProject(member, projects)
                      const showWorkload = Boolean(member.taskStats) && viewer.canViewWorkload

                      return (
                        <div
                          key={member.userId}
                          onClick={() => router.push(`/app/team/members/${member.userId}`)}
                          className="group relative cursor-pointer rounded-[28px] border border-border/80 bg-background p-5 transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <MemberAvatar member={member} className="size-14" />
                            <AvailabilityBadge availability={member.availability} status={member.status} />
                          </div>

                          <div className="mt-4">
                            <div className="text-lg font-semibold text-foreground">{member.fullName}</div>
                            <div className="mt-1 text-sm text-muted-foreground">
                              {member.positionName ?? "Awaiting assignment"}
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <TeamBadge team={team} />
                            <RoleBadge accessLevel={member.accessLevel} />
                          </div>

                          <div className="mt-5 space-y-3 text-sm">
                            <div className="flex items-start gap-3 text-muted-foreground">
                              <MapPin className="mt-0.5 h-4 w-4" />
                              <div>
                                <div className="font-medium text-foreground">
                                  {currentProject?.name ?? "Awaiting assignment"}
                                </div>
                                <div>{currentProject?.locationText ?? "No project location yet"}</div>
                              </div>
                            </div>

                            {showWorkload ? (
                              <div className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3">
                                <div>
                                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                    Pending Tasks
                                  </div>
                                  <div className="mt-1 text-lg font-semibold text-foreground">
                                    {getPendingTaskCount(member)}
                                  </div>
                                </div>
                                <MemberWorkloadIndicator member={member} />
                              </div>
                            ) : null}
                          </div>

                          {canQuickAct ? (
                            <div className="pointer-events-none absolute inset-x-5 bottom-5 flex translate-y-2 items-center gap-2 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl bg-background/95"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  router.push(`/app/team/members/${member.userId}`)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </Button>
                              {viewer.canAssignTasks ? (
                                <Button variant="outline" size="sm" className="rounded-xl bg-background/95" asChild>
                                  <Link
                                    href={`/app/my-tasks`}
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <SquarePen className="h-4 w-4" />
                                    Assign Task
                                  </Link>
                                </Button>
                              ) : null}
                              {viewer.canManageUsers ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-xl bg-background/95"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    handleOpenEditUser(member.userId)
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                  Edit
                                </Button>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                </SoftSection>
              ))
            )}
          </div>
        ) : null}

        {view === "teams" ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {teamCards.map(({ team, lead, memberCount, projects: teamProjects, openTasks }) => (
              <Link key={team.id} href={`/app/team/teams/${team.slug}`}>
                <SoftSection className="h-full transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
                  <div className="flex h-full flex-col justify-between gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: team.color }} />
                            <h2 className="text-xl font-semibold text-foreground">{team.name}</h2>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            {team.description}
                          </p>
                        </div>
                        <ChevronRight className="mt-1 h-5 w-5 text-muted-foreground" />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-muted/35 px-4 py-3">
                          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Team Lead</div>
                          <div className="mt-1 text-sm font-medium text-foreground">{lead?.fullName ?? "Unassigned"}</div>
                        </div>
                        <div className="rounded-2xl bg-muted/35 px-4 py-3">
                          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Members</div>
                          <div className="mt-1 text-sm font-medium text-foreground">{memberCount}</div>
                        </div>
                        <div className="rounded-2xl bg-muted/35 px-4 py-3">
                          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Open Tasks</div>
                          <div className="mt-1 text-sm font-medium text-foreground">{openTasks}</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Linked Projects / Sites
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {teamProjects.length === 0 ? (
                          <span className="text-sm text-muted-foreground">No projects linked yet.</span>
                        ) : (
                          teamProjects.map((project) => (
                            <span
                              key={project.id}
                              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground"
                            >
                              <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                              {project.name}{project.locationText ? ` · ${project.locationText}` : ""}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </SoftSection>
              </Link>
            ))}
          </div>
        ) : null}

        {view === "workload" && canSeeWorkload ? (
          workloadMembers.length > 0 ? (
            <SoftSection className="overflow-hidden p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="px-5">Name</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Active Tasks</TableHead>
                    <TableHead>Overdue</TableHead>
                    <TableHead>Workload</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead className="min-w-[220px]">Assigned Projects / Sites</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workloadMembers.map((member) => {
                    const currentTeam = getTeamById(member.teamId, teams)

                    return (
                      <TableRow
                        key={member.userId}
                        className="cursor-pointer"
                        onClick={() => router.push(`/app/team/members/${member.userId}`)}
                      >
                        <TableCell className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <MemberAvatar member={member} className="size-10" />
                            <div>
                              <div className="font-medium text-foreground">{member.fullName}</div>
                              <div className="text-xs text-muted-foreground">
                                {member.managerName ? `Lead: ${member.managerName}` : "No team lead set"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {currentTeam ? <TeamBadge team={currentTeam} /> : "Unassigned"}
                        </TableCell>
                        <TableCell>{member.positionName ?? "Unassigned"}</TableCell>
                        <TableCell>{getActiveTaskCount(member)}</TableCell>
                        <TableCell className={getOverdueTaskCount(member) > 0 ? "text-[#C44949]" : "text-muted-foreground"}>
                          {getOverdueTaskCount(member)}
                        </TableCell>
                        <TableCell>
                          <MemberWorkloadIndicator member={member} compact />
                        </TableCell>
                        <TableCell>
                          <AvailabilityBadge availability={member.availability} status={member.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {member.projectIds.map((projectId) => {
                              const project = projects.find((entry) => entry.id === projectId)
                              if (!project) {
                                return null
                              }

                              return (
                                <span
                                  key={projectId}
                                  className="rounded-full bg-muted/40 px-2.5 py-1 text-xs text-foreground"
                                >
                                  {project.name}
                                </span>
                              )
                            })}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </SoftSection>
          ) : (
            <SoftSection className="p-10 text-center text-sm text-muted-foreground">
              Detailed workload is only shown for people inside your current management scope.
            </SoftSection>
          )
        ) : null}
      </div>

      <CreateEditUserModal
        open={userModalOpen}
        onOpenChange={setUserModalOpen}
        mode={userModalMode}
        teams={teams}
        members={members}
        projects={projects}
        positions={positions}
        initialDraft={userDraft}
        onSave={async (draft) => {
          if (userModalMode === "edit" && editingMemberId) {
            await updateUser(editingMemberId, draft)
            return
          }

          await createUser(draft)
        }}
        allowAccessEdits={viewer.canViewPermissions}
      />

      <CreateTeamModal
        open={teamModalOpen}
        onOpenChange={setTeamModalOpen}
        mode={teamModalMode}
        members={members}
        projects={projects}
        initialDraft={teamDraft}
        onSave={async (draft) => {
          if (teamModalMode === "edit" && editingTeamId) {
            await updateTeam(editingTeamId, draft)
            return
          }

          await createTeam(draft)
        }}
      />

      <CreatePositionModal
        open={positionModalOpen}
        onOpenChange={setPositionModalOpen}
        teams={teams}
        initialDraft={positionDraft}
        onSave={async (draft) => {
          await createPosition(draft)
        }}
      />
    </div>
  )
}
