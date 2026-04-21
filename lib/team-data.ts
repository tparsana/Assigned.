import {
  assignedAccessLevelDefinitions,
  getAssignedAccessLevelLabel,
  getAssignedPermissionFlags,
  getPermissionsForAssignedAccessLevel,
  type AssignedAccessLevel,
  type AssignedPermission,
} from "@/lib/assigned-access"

export const availabilityStatusOptions = ["available", "busy", "on_leave"] as const
export const memberStatusOptions = ["active", "inactive"] as const

export type AvailabilityStatus = (typeof availabilityStatusOptions)[number]
export type MemberStatus = (typeof memberStatusOptions)[number]
export type WorkloadLevel = "light" | "medium" | "heavy"
export type TeamTaskStatus = "open" | "in_progress" | "on_hold" | "done" | "cancelled"
export type TeamTaskSection = "in_progress" | "due_soon" | "overdue" | "completed"

export interface ProjectSite {
  id: string
  slug: string
  name: string
  locationText: string | null
  status: "active" | "planning" | "handover" | "on_hold"
}

export interface PositionDefinition {
  id: string
  teamId: string
  name: string
  slug: string
  description: string | null
}

export interface TeamDefinition {
  id: string
  slug: string
  name: string
  description: string | null
  leadUserId: string | null
  leadName: string | null
  parentDepartment: string | null
  color: string
  icon: string | null
  memberCount: number
  openTaskCount: number
  projectIds: string[]
}

export interface TeamTask {
  id: string
  title: string
  status: TeamTaskStatus
  derivedStatus: TeamTaskSection | "blocked"
  projectId: string | null
  dueAt: string | null
  dueLabel: string
  createdAt: string
}

export interface TeamActivityEntry {
  id: string
  kind: "assignment" | "completion" | "comment" | "update"
  summary: string
  createdAt: string
  dateLabel: string
  projectId: string | null
}

export interface TeamMemberTaskStats {
  pending: number
  active: number
  overdue: number
  blocked: number
  completedThisWeek: number
  workload: WorkloadLevel
}

export interface TeamMemberSummary {
  userId: string
  fullName: string
  avatarUrl: string | null
  email?: string | null
  phone?: string | null
  accessLevel: AssignedAccessLevel
  teamId: string | null
  teamName: string | null
  teamColor: string | null
  positionId: string | null
  positionName: string | null
  managerUserId: string | null
  managerName: string | null
  projectIds: string[]
  primaryProjectId: string | null
  availability: AvailabilityStatus
  status: MemberStatus
  taskStats: TeamMemberTaskStats | null
}

export interface TeamMemberProfile extends TeamMemberSummary {
  email: string | null
  phone: string | null
  timezone: string | null
  tasks: TeamTask[]
  recentActivity: TeamActivityEntry[]
  permissions: AssignedPermission[]
  canEdit: boolean
  canViewPermissions: boolean
  canViewDetailedTasks: boolean
}

export interface TeamWorkspaceViewer {
  accessLevel: AssignedAccessLevel | null
  canManageUsers: boolean
  canManageTeams: boolean
  canManagePositions: boolean
  canViewWorkload: boolean
  canAssignTasks: boolean
  canViewInactiveUsers: boolean
  canViewPermissions: boolean
  canInviteUsers: boolean
  awaitingAssignment: boolean
  bootstrapAvailable: boolean
}

export interface TeamWorkspaceData {
  viewer: TeamWorkspaceViewer
  teams: TeamDefinition[]
  positions: PositionDefinition[]
  projects: ProjectSite[]
  members: TeamMemberSummary[]
}

export interface TeamDetailData {
  viewer: TeamWorkspaceViewer
  team: TeamDefinition
  positions: PositionDefinition[]
  projects: ProjectSite[]
  members: TeamMemberSummary[]
  recentActivity: TeamActivityEntry[]
  canViewActivity: boolean
}

export interface TeamMemberProfileData {
  viewer: TeamWorkspaceViewer
  member: TeamMemberProfile
  projects: ProjectSite[]
}

export interface TeamUserDraft {
  fullName: string
  email: string
  phone: string
  avatarUrl: string
  accessLevel: AssignedAccessLevel
  teamId: string | null
  positionId: string | null
  managerUserId: string | null
  projectIds: string[]
  primaryProjectId: string | null
  availability: AvailabilityStatus
  status: MemberStatus
}

export interface TeamDraft {
  name: string
  description: string
  leadUserId: string | null
  parentDepartment: string
  defaultProjectIds: string[]
  color: string
  icon: string
}

export interface PositionDraft {
  name: string
  teamId: string | null
  description: string
}

export function availabilityLabel(value: AvailabilityStatus) {
  switch (value) {
    case "available":
      return "Available"
    case "busy":
      return "Busy"
    case "on_leave":
      return "On Leave"
    default:
      return value
  }
}

export function memberStatusLabel(value: MemberStatus) {
  return value === "inactive" ? "Inactive" : "Active"
}

export const accessLevelLabels = Object.fromEntries(
  assignedAccessLevelDefinitions.map((item) => [item.value, item.label])
) as Record<AssignedAccessLevel, string>

export function getTeamById(teamId: string | null | undefined, teams: TeamDefinition[]) {
  return teams.find((team) => team.id === teamId) ?? null
}

export function getTeamBySlug(teamSlug: string | null | undefined, teams: TeamDefinition[]) {
  return teams.find((team) => team.slug === teamSlug) ?? null
}

export function getPositionById(positionId: string | null | undefined, positions: PositionDefinition[]) {
  return positions.find((position) => position.id === positionId) ?? null
}

export function getMemberById(memberId: string, members: TeamMemberSummary[]) {
  return members.find((member) => member.userId === memberId) ?? null
}

export function getProjectById(projectId: string | null | undefined, projects: ProjectSite[]) {
  return projects.find((project) => project.id === projectId) ?? null
}

export function getCurrentProject(member: Pick<TeamMemberSummary, "primaryProjectId" | "projectIds">, projects: ProjectSite[]) {
  return getProjectById(member.primaryProjectId ?? member.projectIds[0] ?? null, projects)
}

export function getPendingTaskCount(member: Pick<TeamMemberSummary, "taskStats">) {
  return member.taskStats?.pending ?? 0
}

export function getActiveTaskCount(member: Pick<TeamMemberSummary, "taskStats">) {
  return member.taskStats?.active ?? 0
}

export function getOverdueTaskCount(member: Pick<TeamMemberSummary, "taskStats">) {
  return member.taskStats?.overdue ?? 0
}

export function getBlockedTaskCount(member: Pick<TeamMemberSummary, "taskStats">) {
  return member.taskStats?.blocked ?? 0
}

export function getCompletedThisWeekCount(member: Pick<TeamMemberSummary, "taskStats">) {
  return member.taskStats?.completedThisWeek ?? 0
}

export function getWorkloadLevel(member: Pick<TeamMemberSummary, "taskStats">): WorkloadLevel {
  return member.taskStats?.workload ?? "light"
}

export function getTeamLead(team: TeamDefinition, members: TeamMemberSummary[]) {
  return members.find((member) => member.userId === team.leadUserId) ?? null
}

export function getTeamMemberCount(teamId: string, members: TeamMemberSummary[]) {
  return members.filter((member) => member.teamId === teamId && member.status === "active").length
}

export function getTeamMembers(teamId: string, members: TeamMemberSummary[]) {
  return members.filter((member) => member.teamId === teamId)
}

export function getTeamOpenTaskCount(teamId: string, members: TeamMemberSummary[]) {
  return getTeamMembers(teamId, members).reduce((sum, member) => sum + getPendingTaskCount(member), 0)
}

export function getTeamProjects(teamId: string, teams: TeamDefinition[], projects: ProjectSite[]) {
  const team = getTeamById(teamId, teams)
  if (!team) {
    return []
  }

  const projectIds = new Set(team.projectIds)
  return projects.filter((project) => projectIds.has(project.id))
}

export function getTeamPositions(teamId: string, positions: PositionDefinition[]) {
  return positions
    .filter((position) => position.teamId === teamId)
    .sort((left, right) => left.name.localeCompare(right.name))
}

export function getVisibleMembersForViewer(
  members: TeamMemberSummary[],
  viewer: TeamWorkspaceViewer
) {
  if (viewer.canViewInactiveUsers) {
    return members
  }

  return members.filter((member) => member.status === "active")
}

export function canViewDetailedWorkload(viewer: TeamWorkspaceViewer) {
  return viewer.canViewWorkload
}

export function canManageTeamDirectory(viewer: TeamWorkspaceViewer) {
  return viewer.canManageUsers
}

export function canUseQuickActions(viewer: TeamWorkspaceViewer) {
  return viewer.canAssignTasks || viewer.canManageUsers
}

export function canViewPermissionsPanel(viewer: TeamWorkspaceViewer) {
  return viewer.canViewPermissions
}

export function getAccessLevelOptionsForViewer(viewer: TeamWorkspaceViewer) {
  if (viewer.canViewPermissions) {
    return [...assignedAccessLevelDefinitions]
  }

  return assignedAccessLevelDefinitions.filter((definition) => definition.value !== "admin")
}

export function getPositionsForTeam(
  teamId: string | null,
  positions: PositionDefinition[]
) {
  if (!teamId) {
    return []
  }

  return getTeamPositions(teamId, positions)
}

export function createTeamUserDraft(
  input?: Partial<TeamUserDraft>
): TeamUserDraft {
  return {
    fullName: "",
    email: "",
    phone: "",
    avatarUrl: "",
    accessLevel: "employee",
    teamId: null,
    positionId: null,
    managerUserId: null,
    projectIds: [],
    primaryProjectId: null,
    availability: "available",
    status: "active",
    ...input,
  }
}

export function createTeamDraft(
  input?: Partial<TeamDraft>
): TeamDraft {
  return {
    name: "",
    description: "",
    leadUserId: null,
    parentDepartment: "",
    defaultProjectIds: [],
    color: "#1f7a53",
    icon: "layers",
    ...input,
  }
}

export function createPositionDraft(input?: Partial<PositionDraft>): PositionDraft {
  return {
    name: "",
    teamId: null,
    description: "",
    ...input,
  }
}

export function getPermissionSummaryForAccessLevel(accessLevel: AssignedAccessLevel) {
  return getAssignedPermissionFlags({ accessLevel })
}

export function getPermissionsForMember(member: Pick<TeamMemberSummary, "accessLevel">) {
  return getPermissionsForAssignedAccessLevel(member.accessLevel)
}

export function groupTasksForProfile(tasks: TeamTask[]) {
  return {
    inProgress: tasks.filter((task) => task.derivedStatus === "in_progress" || task.derivedStatus === "blocked"),
    dueSoon: tasks.filter((task) => task.derivedStatus === "due_soon"),
    overdue: tasks.filter((task) => task.derivedStatus === "overdue"),
    completed: tasks.filter((task) => task.derivedStatus === "completed"),
  }
}

export function getAccessBadgeLabel(accessLevel: AssignedAccessLevel) {
  return getAssignedAccessLevelLabel(accessLevel)
}
