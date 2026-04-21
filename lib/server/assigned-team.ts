import "server-only"

import type { User } from "@supabase/supabase-js"

import { buildAuthCallbackUrl } from "@/lib/auth-config"
import {
  getPermissionsForAssignedAccessLevel,
  type AssignedAccessLevel,
  type AssignedPermission,
} from "@/lib/assigned-access"
import {
  createPositionDraft,
  createTeamDraft,
  createTeamUserDraft,
  type PositionDefinition,
  type PositionDraft,
  type ProjectSite,
  type TeamActivityEntry,
  type TeamDefinition,
  type TeamDetailData,
  type TeamMemberProfile,
  type TeamMemberProfileData,
  type TeamMemberSummary,
  type TeamMemberTaskStats,
  type TeamTask,
  type TeamTaskSection,
  type TeamWorkspaceData,
  type TeamWorkspaceViewer,
  type TeamUserDraft,
  type TeamDraft,
} from "@/lib/team-data"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Database } from "@/lib/supabase/database.types"
import {
  getAssignedAccessContext,
  slugifyAssignedValue,
  type AssignedAccessContext,
} from "@/lib/server/assigned-access"

const DAY_IN_MS = 24 * 60 * 60 * 1000

type OrgData = {
  teams: Database["public"]["Tables"]["assigned_teams"]["Row"][]
  positions: Database["public"]["Tables"]["assigned_positions"]["Row"][]
  projects: Database["public"]["Tables"]["assigned_projects"]["Row"][]
  memberships: Database["public"]["Tables"]["assigned_memberships"]["Row"][]
  profiles: Database["public"]["Tables"]["assigned_user_profiles"]["Row"][]
  memberProjects: Database["public"]["Tables"]["assigned_member_projects"]["Row"][]
  teamProjects: Database["public"]["Tables"]["assigned_team_projects"]["Row"][]
  tasks: Database["public"]["Tables"]["assigned_tasks"]["Row"][]
  activity: Database["public"]["Tables"]["assigned_activity_log"]["Row"][]
}

const ASSIGNED_ADMIN_TEAM_SLUG = "admin"
const ASSIGNED_ADMIN_TEAM_FALLBACK_ID = "__assigned_admin_team__"

function createFallbackAdminTeamRow(organizationId: string): Database["public"]["Tables"]["assigned_teams"]["Row"] {
  const timestamp = new Date().toISOString()

  return {
    id: ASSIGNED_ADMIN_TEAM_FALLBACK_ID,
    organization_id: organizationId,
    slug: ASSIGNED_ADMIN_TEAM_SLUG,
    name: "Admin",
    description: "Platform administration, permissions, and company-wide oversight.",
    lead_user_id: null,
    parent_department: "Administration",
    color: "#111827",
    icon: "shield",
    created_at: timestamp,
    updated_at: timestamp,
  }
}

function resolveMembershipTeamId(
  membership: Database["public"]["Tables"]["assigned_memberships"]["Row"],
  adminTeamId: string | null
) {
  if (membership.team_id) {
    return membership.team_id
  }

  if (membership.access_level === "admin") {
    return adminTeamId
  }

  return null
}

function requireAuthenticatedUser(user: User | null): asserts user is User {
  if (!user) {
    throw new Error("You must be signed in.")
  }
}

function requirePermission(access: AssignedAccessContext, permission: AssignedPermission) {
  if (!access.permissions.includes(permission)) {
    throw new Error("You do not have access to this action.")
  }
}

function formatRelativeDate(value: string) {
  const timestamp = new Date(value).getTime()
  const delta = Date.now() - timestamp

  if (Number.isNaN(timestamp)) {
    return "Recently"
  }

  if (delta < 60 * 60 * 1000) {
    const minutes = Math.max(1, Math.round(delta / (60 * 1000)))
    return `${minutes}m ago`
  }

  if (delta < DAY_IN_MS) {
    const hours = Math.max(1, Math.round(delta / (60 * 60 * 1000)))
    return `${hours}h ago`
  }

  const days = Math.round(delta / DAY_IN_MS)
  if (days <= 1) {
    return "Yesterday"
  }

  if (days < 7) {
    return `${days} days ago`
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

function formatDueLabel(dueAt: string | null, status: Database["public"]["Tables"]["assigned_tasks"]["Row"]["status"]) {
  if (status === "done") {
    return "Completed"
  }

  if (!dueAt) {
    return "No due date"
  }

  const target = new Date(dueAt).getTime()
  if (Number.isNaN(target)) {
    return "No due date"
  }

  const delta = target - Date.now()
  const days = Math.round(delta / DAY_IN_MS)

  if (days < 0) {
    return `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`
  }

  if (days === 0) {
    return "Due today"
  }

  if (days === 1) {
    return "Due tomorrow"
  }

  return `Due in ${days} days`
}

function deriveTaskSection(task: Database["public"]["Tables"]["assigned_tasks"]["Row"]): TeamTaskSection | "blocked" {
  if (task.status === "done") {
    return "completed"
  }

  if (task.status === "on_hold") {
    return "blocked"
  }

  if (task.due_date) {
    const dueAt = new Date(task.due_date).getTime()
    if (!Number.isNaN(dueAt)) {
      if (dueAt < Date.now()) {
        return "overdue"
      }

      if (dueAt - Date.now() <= DAY_IN_MS * 2) {
        return "due_soon"
      }
    }
  }

  return "in_progress"
}

function getWorkloadFromStats(stats: Omit<TeamMemberTaskStats, "workload">) {
  const weightedLoad = stats.active + stats.overdue + stats.blocked

  if (weightedLoad >= 7) {
    return "heavy" as const
  }

  if (weightedLoad >= 4) {
    return "medium" as const
  }

  return "light" as const
}

function buildViewer(access: AssignedAccessContext): TeamWorkspaceViewer {
  return {
    accessLevel: access.accessLevel,
    canManageUsers: access.permissions.includes("edit_users"),
    canManageTeams: access.permissions.includes("manage_teams"),
    canManagePositions: access.permissions.includes("manage_positions"),
    canViewWorkload: access.permissions.includes("view_detailed_workload"),
    canAssignTasks: access.permissions.includes("assign_tasks"),
    canViewInactiveUsers: access.permissions.includes("view_inactive_users"),
    canViewPermissions: access.permissions.includes("manage_permissions"),
    canInviteUsers: access.permissions.includes("edit_users"),
    awaitingAssignment: access.awaitingAssignment,
    bootstrapAvailable: access.bootstrapAvailable,
  }
}

async function loadOrganizationData(organizationId: string) {
  const admin = createAdminClient()

  const [
    teamsResult,
    positionsResult,
    projectsResult,
    membershipsResult,
    profilesResult,
    memberProjectsResult,
    teamProjectsResult,
    tasksResult,
    activityResult,
  ] = await Promise.all([
    admin
      .from("assigned_teams")
      .select("*")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true }),
    admin
      .from("assigned_positions")
      .select("*")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true }),
    admin
      .from("assigned_projects")
      .select("*")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true }),
    admin
      .from("assigned_memberships")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: true }),
    admin
      .from("assigned_user_profiles")
      .select("*")
      .order("created_at", { ascending: true }),
    admin
      .from("assigned_member_projects")
      .select("*"),
    admin
      .from("assigned_team_projects")
      .select("*"),
    admin
      .from("assigned_tasks")
      .select("*")
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false }),
    admin
      .from("assigned_activity_log")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
  ])

  const error =
    teamsResult.error
    ?? positionsResult.error
    ?? projectsResult.error
    ?? membershipsResult.error
    ?? profilesResult.error
    ?? memberProjectsResult.error
    ?? teamProjectsResult.error
    ?? tasksResult.error
    ?? activityResult.error

  if (error) {
    throw error
  }

  return {
    teams: teamsResult.data ?? [],
    positions: positionsResult.data ?? [],
    projects: projectsResult.data ?? [],
    memberships: membershipsResult.data ?? [],
    profiles: profilesResult.data ?? [],
    memberProjects: memberProjectsResult.data ?? [],
    teamProjects: teamProjectsResult.data ?? [],
    tasks: tasksResult.data ?? [],
    activity: activityResult.data ?? [],
  } satisfies OrgData
}

function createTaskStats(tasks: Database["public"]["Tables"]["assigned_tasks"]["Row"][]): TeamMemberTaskStats {
  const completedThisWeekThreshold = Date.now() - DAY_IN_MS * 7
  const pending = tasks.filter((task) => task.status !== "done" && task.status !== "cancelled").length
  const active = tasks.filter((task) => {
    const section = deriveTaskSection(task)
    return section === "in_progress" || section === "due_soon" || section === "overdue" || section === "blocked"
  }).length
  const overdue = tasks.filter((task) => deriveTaskSection(task) === "overdue").length
  const blocked = tasks.filter((task) => task.status === "on_hold").length
  const completedThisWeek = tasks.filter((task) => {
    if (task.status !== "done" || !task.completed_at) {
      return false
    }

    const completedAt = new Date(task.completed_at).getTime()
    return !Number.isNaN(completedAt) && completedAt >= completedThisWeekThreshold
  }).length

  return {
    pending,
    active,
    overdue,
    blocked,
    completedThisWeek,
    workload: getWorkloadFromStats({
      pending,
      active,
      overdue,
      blocked,
      completedThisWeek,
    }),
  }
}

function mapProjectRows(rows: Database["public"]["Tables"]["assigned_projects"]["Row"][]): ProjectSite[] {
  return rows.map((project) => ({
    id: project.id,
    slug: project.slug,
    name: project.name,
    locationText: project.location_text,
    status: project.status,
  }))
}

function buildTeamDefinitions(
  teamRows: Database["public"]["Tables"]["assigned_teams"]["Row"][],
  data: OrgData,
  internalMemberships: Database["public"]["Tables"]["assigned_memberships"]["Row"][],
  profileMap: Map<string, Database["public"]["Tables"]["assigned_user_profiles"]["Row"]>,
  tasksByUserId: Map<string, Database["public"]["Tables"]["assigned_tasks"]["Row"][]>,
  adminTeamId: string | null
): TeamDefinition[] {
  return teamRows.map((team) => {
    const teamMembers = internalMemberships.filter((membership) => resolveMembershipTeamId(membership, adminTeamId) === team.id)
    const memberCount = teamMembers.filter((membership) => membership.status === "active").length
    const explicitProjectIds = data.teamProjects
      .filter((entry) => entry.team_id === team.id)
      .map((entry) => entry.project_id)
    const derivedProjectIds = data.memberProjects
      .filter((entry) => teamMembers.some((member) => member.id === entry.membership_id))
      .map((entry) => entry.project_id)
    const projectIds = Array.from(new Set([...explicitProjectIds, ...derivedProjectIds]))
    const openTaskCount = teamMembers.reduce(
      (sum, membership) => sum + createTaskStats(tasksByUserId.get(membership.user_id) ?? []).pending,
      0
    )

    return {
      id: team.id,
      slug: team.slug,
      name: team.name,
      description: team.description,
      leadUserId: team.lead_user_id,
      leadName: team.lead_user_id ? profileMap.get(team.lead_user_id)?.display_name ?? null : null,
      parentDepartment: team.parent_department,
      color: team.color,
      icon: team.icon,
      memberCount,
      openTaskCount,
      projectIds,
    }
  })
}

function buildPositionDefinitions(
  rows: Database["public"]["Tables"]["assigned_positions"]["Row"][]
): PositionDefinition[] {
  return rows.map((position) => ({
    id: position.id,
    teamId: position.team_id,
    name: position.name,
    slug: position.slug,
    description: position.description,
  }))
}

function shouldIncludeTaskStatsForMember(
  access: AssignedAccessContext,
  membership: Database["public"]["Tables"]["assigned_memberships"]["Row"]
) {
  if (access.accessLevel === "admin") {
    return true
  }

  if (access.accessLevel === "team_lead") {
    return (
      membership.user_id === access.profile.userId
      || membership.access_level === "admin"
      || membership.team_id === access.team?.id
    )
  }

  return membership.user_id === access.profile.userId
}

function buildMemberSummary(
  membership: Database["public"]["Tables"]["assigned_memberships"]["Row"],
  access: AssignedAccessContext,
  profileMap: Map<string, Database["public"]["Tables"]["assigned_user_profiles"]["Row"]>,
  teamMap: Map<string, TeamDefinition>,
  positionMap: Map<string, PositionDefinition>,
  memberProjectsMap: Map<string, Database["public"]["Tables"]["assigned_member_projects"]["Row"][]>,
  tasksByUserId: Map<string, Database["public"]["Tables"]["assigned_tasks"]["Row"][]>,
  adminTeamId: string | null
): TeamMemberSummary {
  const profile = profileMap.get(membership.user_id)
  const projects = memberProjectsMap.get(membership.id) ?? []
  const resolvedTeamId = resolveMembershipTeamId(membership, adminTeamId)
  const canSeeContact =
    access.accessLevel === "admin"
    || membership.user_id === access.profile.userId
    || membership.access_level === "admin"
    || (access.accessLevel === "team_lead" && membership.team_id === access.team?.id)
  const taskStats = shouldIncludeTaskStatsForMember(access, membership)
    ? createTaskStats(tasksByUserId.get(membership.user_id) ?? [])
    : null
  const team = resolvedTeamId ? teamMap.get(resolvedTeamId) ?? null : null
  const position = membership.position_id ? positionMap.get(membership.position_id) ?? null : null
  const managerProfile = membership.manager_user_id ? profileMap.get(membership.manager_user_id) ?? null : null
  const displayName = profile?.display_name
    ?? [profile?.first_name ?? "", profile?.last_name ?? ""].join(" ").trim()
    ?? profile?.email
    ?? "Assigned User"

  return {
    userId: membership.user_id,
    fullName: displayName,
    avatarUrl: profile?.avatar_url ?? null,
    email: canSeeContact ? profile?.email ?? null : null,
    phone: canSeeContact ? profile?.phone ?? null : null,
    accessLevel: membership.access_level as AssignedAccessLevel,
    teamId: resolvedTeamId,
    teamName: team?.name ?? null,
    teamColor: team?.color ?? null,
    positionId: membership.position_id,
    positionName: position?.name ?? null,
    managerUserId: membership.manager_user_id,
    managerName: managerProfile?.display_name ?? null,
    projectIds: projects.map((entry) => entry.project_id),
    primaryProjectId: projects.find((entry) => entry.is_primary)?.project_id ?? projects[0]?.project_id ?? null,
    availability: membership.availability,
    status: membership.status,
    taskStats,
  }
}

function buildMemberTaskList(
  tasks: Database["public"]["Tables"]["assigned_tasks"]["Row"][]
): TeamTask[] {
  return tasks.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    derivedStatus: deriveTaskSection(task),
    projectId: task.project_id,
    dueAt: task.due_date,
    dueLabel: formatDueLabel(task.due_date, task.status),
    createdAt: task.created_at,
  }))
}

function buildActivityEntries(
  rows: Database["public"]["Tables"]["assigned_activity_log"]["Row"][]
): TeamActivityEntry[] {
  return rows.map((entry) => ({
    id: entry.id,
    kind: entry.kind,
    summary: entry.summary,
    createdAt: entry.created_at,
    dateLabel: formatRelativeDate(entry.created_at),
    projectId: entry.project_id,
  }))
}

function visibleMembershipsForDirectory(
  access: AssignedAccessContext,
  memberships: Database["public"]["Tables"]["assigned_memberships"]["Row"][]
) {
  return memberships.filter((membership) => {
    if (access.accessLevel === "admin") {
      return true
    }

    if (membership.status === "inactive") {
      return false
    }

    return membership.access_level !== "external"
  })
}

async function loadWorkspaceRuntime(user: User | null) {
  requireAuthenticatedUser(user)

  const access = await getAssignedAccessContext(user)

  if (!access.organizationId) {
    throw new Error("Assigned is not connected to an organization yet.")
  }

  if (access.accessLevel === "external") {
    throw new Error("External users do not have access to the full team workspace.")
  }

  const orgData = await loadOrganizationData(access.organizationId)
  const adminTeamRow =
    orgData.teams.find((team) => team.slug === ASSIGNED_ADMIN_TEAM_SLUG)
    ?? (orgData.memberships.some((membership) => membership.access_level === "admin")
      ? createFallbackAdminTeamRow(access.organizationId)
      : null)
  const teamRows =
    adminTeamRow && !orgData.teams.some((team) => team.id === adminTeamRow.id)
      ? [...orgData.teams, adminTeamRow]
      : orgData.teams
  const adminTeamId = adminTeamRow?.id ?? null
  const profileMap = new Map(orgData.profiles.map((profile) => [profile.user_id, profile]))
  const tasksByUserId = new Map<string, Database["public"]["Tables"]["assigned_tasks"]["Row"][]>()

  for (const task of orgData.tasks) {
    if (!task.assignee_user_id) {
      continue
    }

    const bucket = tasksByUserId.get(task.assignee_user_id) ?? []
    bucket.push(task)
    tasksByUserId.set(task.assignee_user_id, bucket)
  }

  const internalMemberships = orgData.memberships.filter((membership) => membership.access_level !== "external")
  const teams = buildTeamDefinitions(teamRows, orgData, internalMemberships, profileMap, tasksByUserId, adminTeamId)
  const positions = buildPositionDefinitions(orgData.positions)
  const projects = mapProjectRows(orgData.projects)
  const teamMap = new Map(teams.map((team) => [team.id, team]))
  const positionMap = new Map(positions.map((position) => [position.id, position]))
  const memberProjectsMap = new Map<string, Database["public"]["Tables"]["assigned_member_projects"]["Row"][]>()

  for (const assignment of orgData.memberProjects) {
    const bucket = memberProjectsMap.get(assignment.membership_id) ?? []
    bucket.push(assignment)
    memberProjectsMap.set(assignment.membership_id, bucket)
  }

  return {
    access,
    viewer: buildViewer(access),
    orgData,
    teams,
    adminTeamId,
    positions,
    projects,
    profileMap,
    teamMap,
    positionMap,
    memberProjectsMap,
    tasksByUserId,
  }
}

export async function getTeamWorkspace(user: User | null): Promise<TeamWorkspaceData> {
  const runtime = await loadWorkspaceRuntime(user)
  const memberships = visibleMembershipsForDirectory(runtime.access, runtime.orgData.memberships)
  const members = memberships.map((membership) =>
    buildMemberSummary(
      membership,
      runtime.access,
      runtime.profileMap,
      runtime.teamMap,
      runtime.positionMap,
      runtime.memberProjectsMap,
      runtime.tasksByUserId,
      runtime.adminTeamId
    )
  )

  return {
    viewer: runtime.viewer,
    teams: runtime.teams,
    positions: runtime.positions,
    projects: runtime.projects,
    members,
  }
}

export async function getTeamDetail(
  user: User | null,
  teamSlug: string
): Promise<TeamDetailData> {
  const runtime = await loadWorkspaceRuntime(user)
  const team = runtime.teams.find((entry) => entry.slug === teamSlug || entry.id === teamSlug)

  if (!team) {
    throw new Error("This team could not be found.")
  }

  const members = visibleMembershipsForDirectory(runtime.access, runtime.orgData.memberships)
    .filter((membership) => resolveMembershipTeamId(membership, runtime.adminTeamId) === team.id)
    .map((membership) =>
      buildMemberSummary(
        membership,
        runtime.access,
        runtime.profileMap,
        runtime.teamMap,
        runtime.positionMap,
        runtime.memberProjectsMap,
        runtime.tasksByUserId,
        runtime.adminTeamId
      )
    )

  const positions = runtime.positions.filter((position) => position.teamId === team.id)
  const projects = runtime.projects.filter((project) => team.projectIds.includes(project.id))
  const canViewActivity =
    runtime.access.accessLevel === "admin"
    || (runtime.access.accessLevel === "team_lead" && runtime.access.team?.id === team.id)
  const recentActivity = canViewActivity
    ? buildActivityEntries(
        runtime.orgData.activity.filter((entry) =>
          entry.target_user_id
          && members.some((member) => member.userId === entry.target_user_id)
        ).slice(0, 10)
      )
    : []

  return {
    viewer: runtime.viewer,
    team,
    positions,
    projects,
    members,
    recentActivity,
    canViewActivity,
  }
}

export async function getTeamMemberProfile(
  user: User | null,
  memberUserId: string
): Promise<TeamMemberProfileData> {
  const runtime = await loadWorkspaceRuntime(user)
  const membership = runtime.orgData.memberships.find((entry) => entry.user_id === memberUserId)

  if (!membership) {
    throw new Error("This member could not be found.")
  }

  if (
    membership.status === "inactive"
    && !runtime.viewer.canViewInactiveUsers
    && membership.user_id !== runtime.access.profile.userId
  ) {
    throw new Error("You do not have access to this member.")
  }

  const summary = buildMemberSummary(
    membership,
    runtime.access,
    runtime.profileMap,
    runtime.teamMap,
    runtime.positionMap,
    runtime.memberProjectsMap,
    runtime.tasksByUserId,
    runtime.adminTeamId
  )
  const profile = runtime.profileMap.get(membership.user_id) ?? null
  const isSelf = membership.user_id === runtime.access.profile.userId
  const isSameTeamLeadScope =
    runtime.access.accessLevel === "team_lead" && membership.team_id === runtime.access.team?.id
  const canSeeContact = runtime.access.accessLevel === "admin" || isSameTeamLeadScope || isSelf
  const canSeeDetailedTasks = runtime.access.accessLevel === "admin" || isSameTeamLeadScope || isSelf
  const canEdit = runtime.viewer.canManageUsers
  const canViewPermissions = runtime.viewer.canViewPermissions
  const tasks = canSeeDetailedTasks ? buildMemberTaskList(runtime.tasksByUserId.get(membership.user_id) ?? []) : []
  const recentActivity = canSeeDetailedTasks
    ? buildActivityEntries(
        runtime.orgData.activity
          .filter((entry) => entry.target_user_id === membership.user_id)
          .slice(0, 12)
      )
    : []
  const member: TeamMemberProfile = {
    ...summary,
    email: canSeeContact ? profile?.email ?? null : null,
    phone: canSeeContact ? profile?.phone ?? null : null,
    timezone: canSeeContact ? profile?.timezone ?? null : null,
    tasks,
    recentActivity,
    permissions: getPermissionsForAssignedAccessLevel(summary.accessLevel),
    canEdit,
    canViewPermissions,
    canViewDetailedTasks: canSeeDetailedTasks,
  }

  const projects = runtime.projects.filter((project) => summary.projectIds.includes(project.id))

  return {
    viewer: runtime.viewer,
    member,
    projects,
  }
}

async function syncTeamProjects(teamId: string, projectIds: string[]) {
  const admin = createAdminClient()
  const existing = await admin
    .from("assigned_team_projects")
    .select("id, project_id")
    .eq("team_id", teamId)

  if (existing.error) {
    throw existing.error
  }

  const nextSet = new Set(projectIds)
  const current = existing.data ?? []
  const toDelete = current.filter((item) => !nextSet.has(item.project_id)).map((item) => item.id)
  const toInsert = projectIds.filter((projectId) => !current.some((item) => item.project_id === projectId))

  if (toDelete.length > 0) {
    const deleteResult = await admin.from("assigned_team_projects").delete().in("id", toDelete)
    if (deleteResult.error) {
      throw deleteResult.error
    }
  }

  if (toInsert.length > 0) {
    const insertResult = await admin.from("assigned_team_projects").insert(
      toInsert.map((projectId) => ({
        team_id: teamId,
        project_id: projectId,
      }))
    )

    if (insertResult.error) {
      throw insertResult.error
    }
  }
}

async function syncMemberProjects(membershipId: string, projectIds: string[], primaryProjectId: string | null) {
  const admin = createAdminClient()
  const existing = await admin
    .from("assigned_member_projects")
    .select("id, project_id")
    .eq("membership_id", membershipId)

  if (existing.error) {
    throw existing.error
  }

  const nextSet = new Set(projectIds)
  const current = existing.data ?? []
  const toDelete = current.filter((item) => !nextSet.has(item.project_id)).map((item) => item.id)
  const toInsert = projectIds.filter((projectId) => !current.some((item) => item.project_id === projectId))

  if (toDelete.length > 0) {
    const deleteResult = await admin.from("assigned_member_projects").delete().in("id", toDelete)
    if (deleteResult.error) {
      throw deleteResult.error
    }
  }

  if (toInsert.length > 0) {
    const insertResult = await admin.from("assigned_member_projects").insert(
      toInsert.map((projectId) => ({
        membership_id: membershipId,
        project_id: projectId,
        is_primary: projectId === primaryProjectId,
      }))
    )

    if (insertResult.error) {
      throw insertResult.error
    }
  }

  const updatePrimaryResult = await admin
    .from("assigned_member_projects")
    .update({
      is_primary: false,
    })
    .eq("membership_id", membershipId)

  if (updatePrimaryResult.error) {
    throw updatePrimaryResult.error
  }

  if (primaryProjectId) {
    const setPrimaryResult = await admin
      .from("assigned_member_projects")
      .update({
        is_primary: true,
      })
      .eq("membership_id", membershipId)
      .eq("project_id", primaryProjectId)

    if (setPrimaryResult.error) {
      throw setPrimaryResult.error
    }
  }
}

async function insertActivityEntry(input: {
  organizationId: string
  actorUserId: string
  targetUserId?: string | null
  projectId?: string | null
  summary: string
  kind: Database["public"]["Tables"]["assigned_activity_log"]["Row"]["kind"]
}) {
  const admin = createAdminClient()
  const result = await admin.from("assigned_activity_log").insert({
    organization_id: input.organizationId,
    actor_user_id: input.actorUserId,
    target_user_id: input.targetUserId ?? null,
    project_id: input.projectId ?? null,
    summary: input.summary,
    kind: input.kind,
  })

  if (result.error) {
    throw result.error
  }
}

async function getAdminTeamId(
  organizationId: string,
  admin = createAdminClient()
) {
  const result = await admin
    .from("assigned_teams")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("slug", ASSIGNED_ADMIN_TEAM_SLUG)
    .maybeSingle<{ id: string }>()

  if (result.error) {
    throw result.error
  }

  return result.data?.id ?? null
}

export async function createTeam(user: User | null, draftInput: TeamDraft) {
  const admin = createAdminClient()
  const access = await getAssignedAccessContext(user, admin)
  requireAuthenticatedUser(user)
  requirePermission(access, "manage_teams")

  const draft = createTeamDraft(draftInput)
  const slug = slugifyAssignedValue(draft.name)

  if (!access.organizationId || !slug) {
    throw new Error("A valid team name is required.")
  }

  const insertResult = await admin
    .from("assigned_teams")
    .insert({
      organization_id: access.organizationId,
      slug,
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      lead_user_id: draft.leadUserId,
      parent_department: draft.parentDepartment.trim() || null,
      color: draft.color.trim() || "#1f7a53",
      icon: draft.icon.trim() || "layers",
    })
    .select("id")
    .single<{ id: string }>()

  if (insertResult.error) {
    throw insertResult.error
  }

  await syncTeamProjects(insertResult.data.id, draft.defaultProjectIds)
  await insertActivityEntry({
    organizationId: access.organizationId,
    actorUserId: user.id,
    summary: `${draft.name.trim()} team was created.`,
    kind: "update",
  })

  return insertResult.data.id
}

export async function updateTeam(user: User | null, teamId: string, draftInput: TeamDraft) {
  const admin = createAdminClient()
  const access = await getAssignedAccessContext(user, admin)
  requireAuthenticatedUser(user)
  requirePermission(access, "manage_teams")

  const draft = createTeamDraft(draftInput)
  const slug = slugifyAssignedValue(draft.name)

  const updateResult = await admin
    .from("assigned_teams")
    .update({
      slug,
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      lead_user_id: draft.leadUserId,
      parent_department: draft.parentDepartment.trim() || null,
      color: draft.color.trim() || "#1f7a53",
      icon: draft.icon.trim() || "layers",
    })
    .eq("id", teamId)

  if (updateResult.error) {
    throw updateResult.error
  }

  await syncTeamProjects(teamId, draft.defaultProjectIds)

  if (access.organizationId) {
    await insertActivityEntry({
      organizationId: access.organizationId,
      actorUserId: user.id,
      summary: `${draft.name.trim()} team was updated.`,
      kind: "update",
    })
  }
}

export async function createPosition(user: User | null, draftInput: PositionDraft) {
  const admin = createAdminClient()
  const access = await getAssignedAccessContext(user, admin)
  requireAuthenticatedUser(user)
  requirePermission(access, "manage_positions")

  const draft = createPositionDraft(draftInput)
  const slug = slugifyAssignedValue(draft.name)

  if (!access.organizationId || !draft.teamId || !slug) {
    throw new Error("Team and position name are required.")
  }

  const result = await admin.from("assigned_positions").insert({
    organization_id: access.organizationId,
    team_id: draft.teamId,
    slug,
    name: draft.name.trim(),
    description: draft.description.trim() || null,
  })

  if (result.error) {
    throw result.error
  }

  await insertActivityEntry({
    organizationId: access.organizationId,
    actorUserId: user.id,
    summary: `${draft.name.trim()} position was created.`,
    kind: "update",
  })
}

function splitName(fullName: string) {
  const trimmed = fullName.trim()
  const [firstName = "", ...rest] = trimmed.split(/\s+/)
  return {
    firstName,
    lastName: rest.join(" "),
  }
}

async function upsertInvitedUserProfile(input: {
  userId: string
  email: string
  fullName: string
  phone: string
  avatarUrl: string
}) {
  const admin = createAdminClient()
  const { firstName, lastName } = splitName(input.fullName)

  const result = await admin.from("assigned_user_profiles").upsert({
    user_id: input.userId,
    email: input.email,
    first_name: firstName,
    last_name: lastName,
    display_name: input.fullName.trim(),
    phone: input.phone.trim() || null,
    avatar_url: input.avatarUrl.trim() || null,
  }, {
    onConflict: "user_id",
  })

  if (result.error) {
    throw result.error
  }
}

export async function createOrInviteMember(user: User | null, draftInput: TeamUserDraft) {
  const admin = createAdminClient()
  const access = await getAssignedAccessContext(user, admin)
  requireAuthenticatedUser(user)
  requirePermission(access, "edit_users")

  const draft = createTeamUserDraft(draftInput)
  const normalizedEmail = draft.email.trim().toLowerCase()
  const adminTeamId = access.organizationId ? await getAdminTeamId(access.organizationId, admin) : null
  const resolvedTeamId =
    draft.accessLevel === "admin"
      ? draft.teamId ?? adminTeamId
      : draft.teamId && draft.teamId === adminTeamId
        ? null
        : draft.teamId

  if (!access.organizationId || !draft.fullName.trim() || !normalizedEmail) {
    throw new Error("Name and email are required.")
  }

  let targetUserId: string | null = null
  const existingProfile = await admin
    .from("assigned_user_profiles")
    .select("user_id")
    .ilike("email", normalizedEmail)
    .maybeSingle<{ user_id: string }>()

  if (existingProfile.error) {
    throw existingProfile.error
  }

  if (existingProfile.data) {
    targetUserId = existingProfile.data.user_id
  } else {
    const inviteResult = await admin.auth.admin.inviteUserByEmail(normalizedEmail, {
      data: {
        full_name: draft.fullName.trim(),
        first_name: splitName(draft.fullName).firstName,
        last_name: splitName(draft.fullName).lastName,
      },
      redirectTo: buildAuthCallbackUrl("/onboarding"),
    })

    if (inviteResult.error) {
      throw inviteResult.error
    }

    targetUserId = inviteResult.data.user?.id ?? null
  }

  if (!targetUserId) {
    throw new Error("Unable to create the invited user record.")
  }

  await upsertInvitedUserProfile({
    userId: targetUserId,
    email: normalizedEmail,
    fullName: draft.fullName,
    phone: draft.phone,
    avatarUrl: draft.avatarUrl,
  })

  const membershipLookup = await admin
    .from("assigned_memberships")
    .select("id")
    .eq("organization_id", access.organizationId)
    .eq("user_id", targetUserId)
    .maybeSingle<{ id: string }>()

  if (membershipLookup.error) {
    throw membershipLookup.error
  }

  if (!membershipLookup.data) {
    const insertMembership = await admin
      .from("assigned_memberships")
      .insert({
        organization_id: access.organizationId,
        user_id: targetUserId,
        access_level: draft.accessLevel,
        is_admin: draft.accessLevel === "admin",
        team_id: resolvedTeamId,
        position_id: draft.positionId,
        manager_user_id: draft.managerUserId,
        status: draft.status,
        availability: draft.availability,
      })
      .select("id")
      .single<{ id: string }>()

    if (insertMembership.error) {
      throw insertMembership.error
    }

    await syncMemberProjects(insertMembership.data.id, draft.projectIds, draft.primaryProjectId)
  } else {
    const updateMembership = await admin
      .from("assigned_memberships")
      .update({
        access_level: draft.accessLevel,
        is_admin: draft.accessLevel === "admin",
        team_id: resolvedTeamId,
        position_id: draft.positionId,
        manager_user_id: draft.managerUserId,
        status: draft.status,
        availability: draft.availability,
      })
      .eq("id", membershipLookup.data.id)

    if (updateMembership.error) {
      throw updateMembership.error
    }

    await syncMemberProjects(membershipLookup.data.id, draft.projectIds, draft.primaryProjectId)
  }

  await insertActivityEntry({
    organizationId: access.organizationId,
    actorUserId: user.id,
    targetUserId,
    projectId: draft.primaryProjectId,
    summary: `${draft.fullName.trim()} was added to Assigned.`,
    kind: "assignment",
  })

  return targetUserId
}

export async function updateMember(user: User | null, targetUserId: string, draftInput: TeamUserDraft) {
  const admin = createAdminClient()
  const access = await getAssignedAccessContext(user, admin)
  requireAuthenticatedUser(user)
  requirePermission(access, "edit_users")

  const draft = createTeamUserDraft(draftInput)
  const normalizedEmail = draft.email.trim().toLowerCase()
  const adminTeamId = access.organizationId ? await getAdminTeamId(access.organizationId, admin) : null
  const resolvedTeamId =
    draft.accessLevel === "admin"
      ? draft.teamId ?? adminTeamId
      : draft.teamId && draft.teamId === adminTeamId
        ? null
        : draft.teamId

  if (!access.organizationId) {
    throw new Error("Missing organization.")
  }

  await upsertInvitedUserProfile({
    userId: targetUserId,
    email: normalizedEmail,
    fullName: draft.fullName,
    phone: draft.phone,
    avatarUrl: draft.avatarUrl,
  })

  const membershipLookup = await admin
    .from("assigned_memberships")
    .select("id")
    .eq("organization_id", access.organizationId)
    .eq("user_id", targetUserId)
    .single<{ id: string }>()

  if (membershipLookup.error) {
    throw membershipLookup.error
  }

  const updateMembership = await admin
    .from("assigned_memberships")
    .update({
      access_level: draft.accessLevel,
      is_admin: draft.accessLevel === "admin",
      team_id: resolvedTeamId,
      position_id: draft.positionId,
      manager_user_id: draft.managerUserId,
      status: draft.status,
      availability: draft.availability,
    })
    .eq("id", membershipLookup.data.id)

  if (updateMembership.error) {
    throw updateMembership.error
  }

  await syncMemberProjects(membershipLookup.data.id, draft.projectIds, draft.primaryProjectId)
  await insertActivityEntry({
    organizationId: access.organizationId,
    actorUserId: user.id,
    targetUserId,
    projectId: draft.primaryProjectId,
    summary: `${draft.fullName.trim()} profile was updated.`,
    kind: "update",
  })
}
