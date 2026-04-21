import type { AssignedAccessLevel } from "@/lib/assigned-access"

export const ASSIGNED_APP_LANDING_PATH = "/app"
export const ASSIGNED_DASHBOARD_PATH = "/app/dashboard"
export const ASSIGNED_MY_TASKS_PATH = "/app/my-tasks"

export function canAccessAssignedDashboard(accessLevel: AssignedAccessLevel | null | undefined) {
  return accessLevel === "admin" || accessLevel === "team_lead"
}

export function getAssignedHomePath(accessLevel: AssignedAccessLevel | null | undefined) {
  return canAccessAssignedDashboard(accessLevel)
    ? ASSIGNED_DASHBOARD_PATH
    : ASSIGNED_MY_TASKS_PATH
}
