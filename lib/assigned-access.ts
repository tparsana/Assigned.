export const assignedAccessLevelOptions = [
  "employee",
  "team_lead",
  "admin",
  "external",
] as const

export type AssignedAccessLevel = (typeof assignedAccessLevelOptions)[number]

export const assignedPermissionOptions = [
  "view_workspace",
  "view_own_tasks",
  "update_own_tasks",
  "complete_own_tasks",
  "view_team_directory",
  "view_detailed_workload",
  "create_tasks",
  "assign_tasks",
  "view_inactive_users",
  "edit_users",
  "manage_permissions",
  "manage_teams",
  "manage_positions",
  "assign_projects",
] as const

export type AssignedPermission = (typeof assignedPermissionOptions)[number]

export interface AssignedAccessLevelDefinition {
  value: AssignedAccessLevel
  label: string
  shortLabel: string
  description: string
}

export const assignedAccessLevelDefinitions: AssignedAccessLevelDefinition[] = [
  {
    value: "employee",
    label: "Employee",
    shortLabel: "Employee",
    description: "Standard internal access for teammates working on their own assigned tasks and team visibility.",
  },
  {
    value: "team_lead",
    label: "Team Lead",
    shortLabel: "Lead",
    description: "Leads can see workload in their scope, create work, and assign tasks across their team.",
  },
  {
    value: "admin",
    label: "Admin",
    shortLabel: "Admin",
    description: "Full company administration, permission control, user management, and organization setup.",
  },
  {
    value: "external",
    label: "External",
    shortLabel: "External",
    description: "Restricted access for vendors, clients, and outside collaborators with limited task visibility.",
  },
]

export const assignedAccessLevelPermissionMap: Record<AssignedAccessLevel, AssignedPermission[]> = {
  employee: [
    "view_workspace",
    "view_own_tasks",
    "update_own_tasks",
    "complete_own_tasks",
    "view_team_directory",
  ],
  team_lead: [
    "view_workspace",
    "view_own_tasks",
    "update_own_tasks",
    "complete_own_tasks",
    "view_team_directory",
    "view_detailed_workload",
    "create_tasks",
    "assign_tasks",
  ],
  admin: [...assignedPermissionOptions],
  external: [
    "view_own_tasks",
  ],
}

export const assignedPermissionLabels: Record<AssignedPermission, string> = {
  view_workspace: "Workspace access",
  view_own_tasks: "View own tasks",
  update_own_tasks: "Update own tasks",
  complete_own_tasks: "Complete own tasks",
  view_team_directory: "Team directory access",
  view_detailed_workload: "Detailed workload access",
  create_tasks: "Create tasks",
  assign_tasks: "Assign tasks",
  view_inactive_users: "View inactive users",
  edit_users: "Edit users",
  manage_permissions: "Manage permissions",
  manage_teams: "Manage teams",
  manage_positions: "Manage positions",
  assign_projects: "Assign projects",
}

export type AssignedAccountProfile = {
  userId: string | null
  email: string
  firstName: string
  lastName: string
  displayName: string
  avatarUrl: string | null
  phone: string | null
  timezone: string
}

export type AssignedOrganization = {
  id: string
  name: string
  slug: string
} | null

export type AssignedProfileReference = {
  id: string
  label: string
} | null

export type AssignedProjectReference = {
  id: string
  name: string
  locationText: string | null
}

export type AssignedAccessSnapshot = {
  profile: AssignedAccountProfile
  accessLevel: AssignedAccessLevel | null
  isAdmin: boolean
  onboardingCompleted: boolean
  organization: AssignedOrganization
  permissions: AssignedPermission[]
  bootstrapAvailable: boolean
  team: AssignedProfileReference
  position: AssignedProfileReference
  manager: AssignedProfileReference
  projects: AssignedProjectReference[]
  awaitingAssignment: boolean
}

export function isAssignedAccessLevel(value: string | null | undefined): value is AssignedAccessLevel {
  return Boolean(value) && assignedAccessLevelOptions.includes(value as AssignedAccessLevel)
}

export function getAssignedAccessLevelDefinition(accessLevel: AssignedAccessLevel | null | undefined) {
  return assignedAccessLevelDefinitions.find((definition) => definition.value === accessLevel) ?? null
}

export function getAssignedAccessLevelLabel(accessLevel: AssignedAccessLevel | null | undefined) {
  return getAssignedAccessLevelDefinition(accessLevel)?.label ?? "Unassigned"
}

export function getAssignedAccessLevelDescription(accessLevel: AssignedAccessLevel | null | undefined) {
  return getAssignedAccessLevelDefinition(accessLevel)?.description ?? ""
}

export function getPermissionsForAssignedAccessLevel(accessLevel: AssignedAccessLevel | null | undefined) {
  if (!accessLevel) {
    return []
  }

  return [...assignedAccessLevelPermissionMap[accessLevel]]
}

export function getAssignedPermissionLabel(permission: AssignedPermission) {
  return assignedPermissionLabels[permission]
}

export function getAssignedPermissionFlags(input: {
  accessLevel: AssignedAccessLevel | null | undefined
}) {
  const permissions = getPermissionsForAssignedAccessLevel(input.accessLevel)
  const hasPermission = (permission: AssignedPermission) => permissions.includes(permission)

  return {
    directoryAccess: hasPermission("view_team_directory"),
    workloadView: hasPermission("view_detailed_workload"),
    taskAssignment: hasPermission("assign_tasks"),
    editUsers: hasPermission("edit_users"),
    inactiveUsers: hasPermission("view_inactive_users"),
    globalPermissions: hasPermission("manage_permissions"),
    manageTeams: hasPermission("manage_teams"),
    managePositions: hasPermission("manage_positions"),
    assignProjects: hasPermission("assign_projects"),
  }
}

export function buildAssignedDisplayName(firstName: string, lastName: string, email: string) {
  const fullName = `${firstName} ${lastName}`.trim()
  if (fullName) {
    return fullName
  }

  const localPart = email.split("@")[0] ?? ""
  return localPart || "Assigned User"
}

export function createEmptyAssignedAccessSnapshot(): AssignedAccessSnapshot {
  return {
    profile: {
      userId: null,
      email: "",
      firstName: "",
      lastName: "",
      displayName: "",
      avatarUrl: null,
      phone: null,
      timezone: "America/Phoenix",
    },
    accessLevel: null,
    isAdmin: false,
    onboardingCompleted: false,
    organization: null,
    permissions: [],
    bootstrapAvailable: false,
    team: null,
    position: null,
    manager: null,
    projects: [],
    awaitingAssignment: true,
  }
}
