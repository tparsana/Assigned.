import type { AssignedAccessLevel } from "@/lib/assigned-access"
import type { Database } from "@/lib/supabase/database.types"

export const assignedTaskStatusOptions = [
  "open",
  "in_progress",
  "on_hold",
  "done",
  "cancelled",
] as const

export const assignedTaskPriorityOptions = ["low", "medium", "high"] as const

export const assignedTaskCategoryOptions = [
  "General",
  "Sales",
  "Marketing",
  "Construction",
  "Planning",
  "Legal",
  "Documentation",
  "Finance",
  "Operations",
] as const

export type AssignedTaskStatus = (typeof assignedTaskStatusOptions)[number]
export type AssignedTaskPriority = (typeof assignedTaskPriorityOptions)[number]
export type AssignedTaskCategory = (typeof assignedTaskCategoryOptions)[number]
export type AssignedProjectStatus = Database["public"]["Enums"]["assigned_project_status"]

export interface WorkspaceMemberOption {
  userId: string
  fullName: string
  avatarUrl: string | null
  accessLevel: AssignedAccessLevel
  teamId: string | null
  teamName: string | null
  positionId: string | null
  positionName: string | null
}

export interface WorkspaceProjectOption {
  id: string
  slug: string
  name: string
  description: string | null
  locationText: string | null
  status: AssignedProjectStatus
  leadUserId: string | null
  leadName: string | null
  startDate: string | null
  endDate: string | null
}

export interface TaskPersonSummary {
  userId: string
  fullName: string
  avatarUrl: string | null
  accessLevel: AssignedAccessLevel | null
  teamName: string | null
  positionName: string | null
}

export interface TaskProjectSummary {
  id: string
  slug: string
  name: string
  locationText: string | null
  status: AssignedProjectStatus
}

export interface TaskChecklistProgress {
  total: number
  completed: number
}

export interface TaskSummary {
  id: string
  title: string
  description: string | null
  status: AssignedTaskStatus
  assignee: TaskPersonSummary
  createdBy: TaskPersonSummary | null
  category: string
  project: TaskProjectSummary | null
  dueDate: string | null
  priority: AssignedTaskPriority | null
  createdAt: string
  updatedAt: string
  isOverdue: boolean
  isDueToday: boolean
  checklist: TaskChecklistProgress
  commentCount: number
  attachmentCount: number
}

export interface TaskDashboardSummary {
  open: number
  inProgress: number
  onHold: number
  done: number
  overdue: number
  dueToday: number
}

export interface TaskBoardData {
  viewer: {
    currentUserId: string
    accessLevel: AssignedAccessLevel | null
    canAssignTasks: boolean
    canCreateTasks: boolean
    canManageProjects: boolean
    canViewDetailedWorkload: boolean
  }
  members: WorkspaceMemberOption[]
  projects: WorkspaceProjectOption[]
  categories: string[]
  tasks: TaskSummary[]
  summary: TaskDashboardSummary
}

export interface TaskChecklistItemData {
  id: string
  text: string
  isCompleted: boolean
  sortOrder: number
  createdAt: string
}

export interface TaskCommentData {
  id: string
  body: string
  createdAt: string
  user: TaskPersonSummary
}

export interface TaskAttachmentData {
  id: string
  fileUrl: string
  fileType: string | null
  createdAt: string
  uploadedBy: TaskPersonSummary
}

export interface TaskDetailData {
  viewer: TaskBoardData["viewer"] & {
    canEdit: boolean
    canDelete: boolean
  }
  task: TaskSummary
  checklistItems: TaskChecklistItemData[]
  comments: TaskCommentData[]
  attachments: TaskAttachmentData[]
}

export interface MyTasksData extends TaskBoardData {
  sections: {
    today: TaskSummary[]
    upcoming: TaskSummary[]
    overdue: TaskSummary[]
    completed: TaskSummary[]
  }
}

export interface ProjectSummaryData extends WorkspaceProjectOption {
  totalLinkedTasks: number
  openTasks: number
  overdueTasks: number
  teamCount: number
}

export interface ProjectsPageData {
  viewer: TaskBoardData["viewer"]
  projects: ProjectSummaryData[]
  members: WorkspaceMemberOption[]
}

export interface ProjectDetailData {
  viewer: TaskBoardData["viewer"]
  project: ProjectSummaryData
  linkedTasks: TaskSummary[]
  teamMembers: WorkspaceMemberOption[]
  recentComments: TaskCommentData[]
}

export interface CalendarPageData extends TaskBoardData {
  scopedToMineByDefault: boolean
}

export interface CreateTaskInput {
  title: string
  description?: string | null
  assigneeUserId: string
  category: string
  projectId?: string | null
  dueDate?: string | null
  status?: AssignedTaskStatus
  priority?: AssignedTaskPriority | null
  attachmentUrl?: string | null
}

export interface UpdateTaskInput {
  title?: string
  description?: string | null
  assigneeUserId?: string
  category?: string
  projectId?: string | null
  dueDate?: string | null
  status?: AssignedTaskStatus
  priority?: AssignedTaskPriority | null
}

export interface CreateProjectInput {
  name: string
  description?: string | null
  locationText?: string | null
  status?: AssignedProjectStatus
  leadUserId?: string | null
  startDate?: string | null
  endDate?: string | null
}

export function getTaskStatusLabel(status: AssignedTaskStatus) {
  switch (status) {
    case "open":
      return "Open"
    case "in_progress":
      return "In Progress"
    case "on_hold":
      return "On Hold"
    case "done":
      return "Done"
    case "cancelled":
      return "Cancelled"
    default:
      return status
  }
}

export function getTaskPriorityLabel(priority: AssignedTaskPriority | null) {
  if (!priority) {
    return "No priority"
  }

  return priority.charAt(0).toUpperCase() + priority.slice(1)
}

export function getProjectStatusLabel(status: AssignedProjectStatus) {
  switch (status) {
    case "active":
      return "Active"
    case "planning":
      return "Planning"
    case "on_hold":
      return "On Hold"
    case "handover":
      return "Handover"
    default:
      return status
  }
}

export function isTaskClosed(status: AssignedTaskStatus) {
  return status === "done" || status === "cancelled"
}

export function formatCompactDate(value: string | null) {
  if (!value) {
    return "No due date"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "No due date"
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}
