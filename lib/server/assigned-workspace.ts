import "server-only"

import type { User } from "@supabase/supabase-js"

import type { AssignedAccessLevel, AssignedPermission } from "@/lib/assigned-access"
import {
  assignedTaskCategoryOptions,
  type CalendarPageData,
  type CreateProjectInput,
  type CreateTaskInput,
  type MyTasksData,
  type ProjectDetailData,
  type ProjectSummaryData,
  type ProjectsPageData,
  type TaskAttachmentData,
  type TaskBoardData,
  type TaskChecklistItemData,
  type TaskCommentData,
  type TaskDashboardSummary,
  type TaskDetailData,
  type TaskPersonSummary,
  type TaskProjectSummary,
  type TaskSummary,
  type UpdateTaskInput,
  type WorkspaceMemberOption,
  type WorkspaceProjectOption,
} from "@/lib/task-data"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Database, DbTables } from "@/lib/supabase/database.types"
import { getAssignedAccessContext, slugifyAssignedValue } from "@/lib/server/assigned-access"

type MembershipRow = DbTables["assigned_memberships"]["Row"]
type ProfileRow = DbTables["assigned_user_profiles"]["Row"]
type TeamRow = DbTables["assigned_teams"]["Row"]
type PositionRow = DbTables["assigned_positions"]["Row"]
type ProjectRow = DbTables["assigned_projects"]["Row"]
type TaskRow = DbTables["assigned_tasks"]["Row"]
type MemberProjectRow = DbTables["assigned_member_projects"]["Row"]
type ChecklistRow = DbTables["assigned_task_checklist_items"]["Row"]
type CommentRow = DbTables["assigned_task_comments"]["Row"]
type AttachmentRow = DbTables["assigned_task_attachments"]["Row"]
type ActivityRow = DbTables["assigned_activity_log"]["Row"]

type WorkspaceContext = {
  user: User
  accessLevel: AssignedAccessLevel
  permissions: AssignedPermission[]
  organizationId: string
  membership: MembershipRow
}

type WorkspaceDataset = {
  memberships: MembershipRow[]
  profiles: ProfileRow[]
  teams: TeamRow[]
  positions: PositionRow[]
  projects: ProjectRow[]
  memberProjects: MemberProjectRow[]
  tasks: TaskRow[]
  checklistItems: ChecklistRow[]
  comments: CommentRow[]
  attachments: AttachmentRow[]
  activity: ActivityRow[]
}

function requireAuthenticatedUser(user: User | null): asserts user is User {
  if (!user) {
    throw new Error("You must be signed in.")
  }
}

function requirePermission(context: WorkspaceContext, permission: AssignedPermission) {
  if (!context.permissions.includes(permission)) {
    throw new Error("You do not have access to this action.")
  }
}

async function getWorkspaceContext(user: User | null): Promise<WorkspaceContext> {
  requireAuthenticatedUser(user)

  const access = await getAssignedAccessContext(user)
  if (!access.organizationId || !access.accessLevel) {
    throw new Error("Your Assigned workspace is not ready yet.")
  }

  const admin = createAdminClient()
  const membershipResult = await admin
    .from("assigned_memberships")
    .select("*")
    .eq("user_id", user.id)
    .single<MembershipRow>()

  if (membershipResult.error) {
    throw membershipResult.error
  }

  return {
    user,
    accessLevel: access.accessLevel,
    permissions: access.permissions,
    organizationId: access.organizationId,
    membership: membershipResult.data,
  }
}

async function loadWorkspaceDataset(organizationId: string): Promise<WorkspaceDataset> {
  const admin = createAdminClient()

  const [
    membershipsResult,
    profilesResult,
    teamsResult,
    positionsResult,
    projectsResult,
    memberProjectsResult,
    tasksResult,
    checklistResult,
    commentsResult,
    attachmentsResult,
    activityResult,
  ] = await Promise.all([
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
    admin.from("assigned_member_projects").select("*"),
    admin
      .from("assigned_tasks")
      .select("*")
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false }),
    admin.from("assigned_task_checklist_items").select("*"),
    admin.from("assigned_task_comments").select("*"),
    admin.from("assigned_task_attachments").select("*"),
    admin
      .from("assigned_activity_log")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
  ])

  const error =
    membershipsResult.error
    ?? profilesResult.error
    ?? teamsResult.error
    ?? positionsResult.error
    ?? projectsResult.error
    ?? memberProjectsResult.error
    ?? tasksResult.error
    ?? checklistResult.error
    ?? commentsResult.error
    ?? attachmentsResult.error
    ?? activityResult.error

  if (error) {
    throw error
  }

  return {
    memberships: membershipsResult.data ?? [],
    profiles: profilesResult.data ?? [],
    teams: teamsResult.data ?? [],
    positions: positionsResult.data ?? [],
    projects: projectsResult.data ?? [],
    memberProjects: memberProjectsResult.data ?? [],
    tasks: tasksResult.data ?? [],
    checklistItems: checklistResult.data ?? [],
    comments: commentsResult.data ?? [],
    attachments: attachmentsResult.data ?? [],
    activity: activityResult.data ?? [],
  }
}

function buildLookupMaps(data: WorkspaceDataset) {
  const profileByUserId = new Map(data.profiles.map((profile) => [profile.user_id, profile]))
  const membershipByUserId = new Map(data.memberships.map((membership) => [membership.user_id, membership]))
  const teamById = new Map(data.teams.map((team) => [team.id, team]))
  const positionById = new Map(data.positions.map((position) => [position.id, position]))
  const projectById = new Map(data.projects.map((project) => [project.id, project]))

  return {
    profileByUserId,
    membershipByUserId,
    teamById,
    positionById,
    projectById,
  }
}

function isInternalAccessLevel(accessLevel: AssignedAccessLevel) {
  return accessLevel !== "external"
}

function canAssignToUser(context: WorkspaceContext, targetMembership: MembershipRow | undefined) {
  if (!targetMembership || targetMembership.status !== "active") {
    return false
  }

  if (context.accessLevel === "admin") {
    return true
  }

  if (targetMembership.user_id === context.user.id) {
    return true
  }

  if (context.accessLevel !== "team_lead") {
    return false
  }

  return Boolean(
    context.membership.team_id
    && targetMembership.team_id
    && context.membership.team_id === targetMembership.team_id
  )
}

function canViewMembership(context: WorkspaceContext, targetMembership: MembershipRow) {
  if (context.accessLevel === "admin") {
    return true
  }

  if (targetMembership.user_id === context.user.id) {
    return true
  }

  if (context.accessLevel !== "team_lead") {
    return false
  }

  return Boolean(
    context.membership.team_id
    && targetMembership.team_id
    && context.membership.team_id === targetMembership.team_id
  )
}

function canViewTask(context: WorkspaceContext, task: TaskRow, membershipByUserId: Map<string, MembershipRow>) {
  if (context.accessLevel === "admin") {
    return true
  }

  if (task.assignee_user_id === context.user.id || task.created_by_user_id === context.user.id) {
    return true
  }

  if (context.accessLevel !== "team_lead") {
    return false
  }

  const assigneeMembership = membershipByUserId.get(task.assignee_user_id)
  const creatorMembership = membershipByUserId.get(task.created_by_user_id)

  return Boolean(
    context.membership.team_id
    && (
      (assigneeMembership?.team_id && assigneeMembership.team_id === context.membership.team_id)
      || (creatorMembership?.team_id && creatorMembership.team_id === context.membership.team_id)
    )
  )
}

function canManageTask(context: WorkspaceContext, task: TaskRow, membershipByUserId: Map<string, MembershipRow>) {
  if (context.accessLevel === "admin") {
    return true
  }

  if (task.assignee_user_id === context.user.id) {
    return true
  }

  if (task.created_by_user_id === context.user.id) {
    return true
  }

  if (context.accessLevel !== "team_lead") {
    return false
  }

  const assigneeMembership = membershipByUserId.get(task.assignee_user_id)

  return Boolean(
    context.membership.team_id
    && assigneeMembership?.team_id
    && assigneeMembership.team_id === context.membership.team_id
  )
}

function buildViewer(context: WorkspaceContext): TaskBoardData["viewer"] {
  const can = (permission: AssignedPermission) => context.permissions.includes(permission)

  return {
    currentUserId: context.user.id,
    accessLevel: context.accessLevel,
    canAssignTasks: can("assign_tasks"),
    canCreateTasks: can("create_tasks"),
    canManageProjects: can("assign_projects"),
    canViewDetailedWorkload: can("view_detailed_workload"),
  }
}

function buildPersonSummary(
  userId: string | null,
  profileByUserId: Map<string, ProfileRow>,
  membershipByUserId: Map<string, MembershipRow>,
  teamById: Map<string, TeamRow>,
  positionById: Map<string, PositionRow>
): TaskPersonSummary {
  if (!userId) {
    return {
      userId: "",
      fullName: "Unknown user",
      avatarUrl: null,
      accessLevel: null,
      teamName: null,
      positionName: null,
    }
  }

  const profile = profileByUserId.get(userId)
  const membership = membershipByUserId.get(userId)
  const team = membership?.team_id ? teamById.get(membership.team_id) : null
  const position = membership?.position_id ? positionById.get(membership.position_id) : null

  return {
    userId,
    fullName: profile?.display_name || [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Assigned User",
    avatarUrl: profile?.avatar_url ?? null,
    accessLevel: (membership?.access_level as AssignedAccessLevel | undefined) ?? null,
    teamName: team?.name ?? null,
    positionName: position?.name ?? null,
  }
}

function buildMemberOption(
  membership: MembershipRow,
  profileByUserId: Map<string, ProfileRow>,
  teamById: Map<string, TeamRow>,
  positionById: Map<string, PositionRow>
): WorkspaceMemberOption {
  const profile = profileByUserId.get(membership.user_id)
  const team = membership.team_id ? teamById.get(membership.team_id) : null
  const position = membership.position_id ? positionById.get(membership.position_id) : null

  return {
    userId: membership.user_id,
    fullName: profile?.display_name || [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Assigned User",
    avatarUrl: profile?.avatar_url ?? null,
    accessLevel: membership.access_level as AssignedAccessLevel,
    teamId: membership.team_id,
    teamName: team?.name ?? null,
    positionId: membership.position_id,
    positionName: position?.name ?? null,
  }
}

function buildProjectOption(
  project: ProjectRow,
  profileByUserId: Map<string, ProfileRow>
): WorkspaceProjectOption {
  const leadProfile = project.lead_user_id ? profileByUserId.get(project.lead_user_id) : null

  return {
    id: project.id,
    slug: project.slug,
    name: project.name,
    description: project.description,
    locationText: project.location_text,
    status: project.status,
    leadUserId: project.lead_user_id,
    leadName: leadProfile?.display_name ?? null,
    startDate: project.start_date,
    endDate: project.end_date,
  }
}

function buildTaskSummary(
  task: TaskRow,
  maps: ReturnType<typeof buildLookupMaps>,
  checklistItems: ChecklistRow[],
  comments: CommentRow[],
  attachments: AttachmentRow[]
): TaskSummary {
  const dueDate = task.due_date
  const now = Date.now()
  const dueTimestamp = dueDate ? new Date(dueDate).getTime() : Number.NaN
  const isClosed = task.status === "done" || task.status === "cancelled"
  const checklistForTask = checklistItems.filter((item) => item.task_id === task.id)
  const commentCount = comments.filter((comment) => comment.task_id === task.id).length
  const attachmentCount = attachments.filter((attachment) => attachment.task_id === task.id).length
  const project = task.project_id ? maps.projectById.get(task.project_id) ?? null : null

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    assignee: buildPersonSummary(
      task.assignee_user_id,
      maps.profileByUserId,
      maps.membershipByUserId,
      maps.teamById,
      maps.positionById
    ),
    createdBy: task.created_by_user_id
      ? buildPersonSummary(
          task.created_by_user_id,
          maps.profileByUserId,
          maps.membershipByUserId,
          maps.teamById,
          maps.positionById
        )
      : null,
    category: task.category,
    project: project
      ? {
          id: project.id,
          slug: project.slug,
          name: project.name,
          locationText: project.location_text,
          status: project.status,
        } satisfies TaskProjectSummary
      : null,
    dueDate,
    priority: task.priority,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
    isOverdue: !isClosed && !Number.isNaN(dueTimestamp) && dueTimestamp < now,
    isDueToday: !isClosed && !Number.isNaN(dueTimestamp) && new Date(dueTimestamp).toDateString() === new Date().toDateString(),
    checklist: {
      total: checklistForTask.length,
      completed: checklistForTask.filter((item) => item.is_completed).length,
    },
    commentCount,
    attachmentCount,
  }
}

function buildSummary(tasks: TaskSummary[]): TaskDashboardSummary {
  return {
    open: tasks.filter((task) => task.status === "open").length,
    inProgress: tasks.filter((task) => task.status === "in_progress").length,
    onHold: tasks.filter((task) => task.status === "on_hold").length,
    done: tasks.filter((task) => task.status === "done").length,
    overdue: tasks.filter((task) => task.isOverdue).length,
    dueToday: tasks.filter((task) => task.isDueToday).length,
  }
}

function sortTasks(tasks: TaskSummary[]) {
  return [...tasks].sort((left, right) => {
    const leftDue = left.dueDate ? new Date(left.dueDate).getTime() : Number.MAX_SAFE_INTEGER
    const rightDue = right.dueDate ? new Date(right.dueDate).getTime() : Number.MAX_SAFE_INTEGER

    if (left.status !== right.status) {
      const rank = {
        open: 0,
        in_progress: 1,
        on_hold: 2,
        done: 3,
        cancelled: 4,
      } as const

      return rank[left.status] - rank[right.status]
    }

    if (leftDue !== rightDue) {
      return leftDue - rightDue
    }

    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  })
}

async function buildBoardData(context: WorkspaceContext): Promise<TaskBoardData> {
  const data = await loadWorkspaceDataset(context.organizationId)
  const maps = buildLookupMaps(data)
  const visibleTasks = data.tasks.filter((task) => canViewTask(context, task, maps.membershipByUserId))
  const visibleMembers = data.memberships
    .filter((membership) => membership.status === "active")
    .filter((membership) => canViewMembership(context, membership))
    .map((membership) => buildMemberOption(membership, maps.profileByUserId, maps.teamById, maps.positionById))
    .sort((left, right) => left.fullName.localeCompare(right.fullName))
  const projects =
    context.accessLevel === "external"
      ? data.projects.filter((project) =>
          visibleTasks.some((task) => task.project_id === project.id)
        )
      : data.projects

  const taskSummaries = sortTasks(
    visibleTasks.map((task) =>
      buildTaskSummary(task, maps, data.checklistItems, data.comments, data.attachments)
    )
  )

  return {
    viewer: buildViewer(context),
    members: visibleMembers,
    projects: projects.map((project) => buildProjectOption(project, maps.profileByUserId)),
    categories: [...assignedTaskCategoryOptions],
    tasks: taskSummaries,
    summary: buildSummary(taskSummaries),
  }
}

function getProjectMemberIds(projectId: string, data: WorkspaceDataset) {
  const membershipById = new Map(data.memberships.map((membership) => [membership.id, membership]))

  return data.memberProjects
    .filter((memberProject) => memberProject.project_id === projectId)
    .map((memberProject) => membershipById.get(memberProject.membership_id)?.user_id ?? null)
    .filter((value): value is string => Boolean(value))
}

async function readTaskOrThrow(context: WorkspaceContext, taskId: string) {
  const data = await loadWorkspaceDataset(context.organizationId)
  const maps = buildLookupMaps(data)
  const task = data.tasks.find((entry) => entry.id === taskId)

  if (!task) {
    throw new Error("Task not found.")
  }

  if (!canViewTask(context, task, maps.membershipByUserId)) {
    throw new Error("You do not have access to this task.")
  }

  return { data, maps, task }
}

function validateTaskCategory(value: string) {
  const category = value.trim()
  if (!category) {
    throw new Error("Category is required.")
  }

  return category
}

function normalizeOptionalText(value: string | null | undefined) {
  if (value === undefined) {
    return undefined
  }

  const normalized = value?.trim() ?? ""
  return normalized ? normalized : null
}

async function createActivityLog(input: {
  organizationId: string
  actorUserId: string
  targetUserId?: string | null
  taskId?: string | null
  projectId?: string | null
  kind: Database["public"]["Enums"]["assigned_activity_kind"]
  summary: string
}) {
  const admin = createAdminClient()
  await admin.from("assigned_activity_log").insert({
    organization_id: input.organizationId,
    actor_user_id: input.actorUserId,
    target_user_id: input.targetUserId ?? null,
    task_id: input.taskId ?? null,
    project_id: input.projectId ?? null,
    kind: input.kind,
    summary: input.summary,
  })
}

export async function getDashboardData(user: User | null): Promise<TaskBoardData> {
  const context = await getWorkspaceContext(user)
  return buildBoardData(context)
}

export async function getMyTasksData(user: User | null): Promise<MyTasksData> {
  const context = await getWorkspaceContext(user)
  const board = await buildBoardData(context)
  const tasks = board.tasks.filter((task) => task.assignee.userId === context.user.id)
  const now = Date.now()
  const startOfTomorrow = new Date()
  startOfTomorrow.setHours(24, 0, 0, 0)

  return {
    ...board,
    tasks,
    summary: buildSummary(tasks),
    sections: {
      today: tasks.filter((task) => task.isDueToday && task.status !== "done"),
      upcoming: tasks.filter((task) => {
        if (task.status === "done" || !task.dueDate || task.isDueToday || task.isOverdue) {
          return false
        }

        return new Date(task.dueDate).getTime() >= startOfTomorrow.getTime()
      }),
      overdue: tasks.filter((task) => task.isOverdue),
      completed: tasks
        .filter((task) => task.status === "done")
        .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()),
    },
  }
}

export async function getCalendarData(user: User | null): Promise<CalendarPageData> {
  const context = await getWorkspaceContext(user)
  const board = await buildBoardData(context)

  return {
    ...board,
    scopedToMineByDefault: context.accessLevel !== "admin",
  }
}

export async function getProjectsPageData(user: User | null): Promise<ProjectsPageData> {
  const context = await getWorkspaceContext(user)
  const data = await loadWorkspaceDataset(context.organizationId)
  const maps = buildLookupMaps(data)
  const visibleTasks = data.tasks.filter((task) => canViewTask(context, task, maps.membershipByUserId))
  const visibleProjects =
    context.accessLevel === "external"
      ? data.projects.filter((project) => visibleTasks.some((task) => task.project_id === project.id))
      : data.projects

  const projects = visibleProjects.map((project) => {
    const projectTasks = visibleTasks.filter((task) => task.project_id === project.id)
    const memberIds = new Set([
      ...getProjectMemberIds(project.id, data),
      ...projectTasks.map((task) => task.assignee_user_id),
    ])

    return {
      ...buildProjectOption(project, maps.profileByUserId),
      totalLinkedTasks: projectTasks.length,
      openTasks: projectTasks.filter((task) => task.status !== "done" && task.status !== "cancelled").length,
      overdueTasks: projectTasks.filter((task) => {
        if (!task.due_date || task.status === "done" || task.status === "cancelled") {
          return false
        }

        return new Date(task.due_date).getTime() < Date.now()
      }).length,
      teamCount: memberIds.size,
    } satisfies ProjectSummaryData
  })

  const visibleMembers = data.memberships
    .filter((membership) => membership.status === "active")
    .filter((membership) => canViewMembership(context, membership))
    .map((membership) => buildMemberOption(membership, maps.profileByUserId, maps.teamById, maps.positionById))
    .sort((left, right) => left.fullName.localeCompare(right.fullName))

  return {
    viewer: buildViewer(context),
    projects,
    members: visibleMembers,
  }
}

export async function getProjectDetailData(user: User | null, projectId: string): Promise<ProjectDetailData> {
  const context = await getWorkspaceContext(user)
  const data = await loadWorkspaceDataset(context.organizationId)
  const maps = buildLookupMaps(data)
  const project = data.projects.find((entry) => entry.id === projectId)

  if (!project) {
    throw new Error("Project not found.")
  }

  if (context.accessLevel === "external" && !data.tasks.some((task) => task.project_id === projectId && task.assignee_user_id === context.user.id)) {
    throw new Error("You do not have access to this project.")
  }

  const linkedTaskRows = data.tasks
    .filter((task) => task.project_id === projectId)
    .filter((task) => canViewTask(context, task, maps.membershipByUserId))
  const linkedTasks = sortTasks(
    linkedTaskRows.map((task) =>
      buildTaskSummary(task, maps, data.checklistItems, data.comments, data.attachments)
    )
  )

  const teamMembers = Array.from(
    new Set([
      ...getProjectMemberIds(projectId, data),
      ...linkedTaskRows.map((task) => task.assignee_user_id),
    ])
  )
    .map((memberUserId) => maps.membershipByUserId.get(memberUserId))
    .filter((membership): membership is MembershipRow => Boolean(membership))
    .filter((membership) => canViewMembership(context, membership))
    .map((membership) => buildMemberOption(membership, maps.profileByUserId, maps.teamById, maps.positionById))
    .sort((left, right) => left.fullName.localeCompare(right.fullName))

  const recentComments = data.comments
    .filter((comment) => linkedTaskRows.some((task) => task.id === comment.task_id))
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
    .slice(0, 12)
    .map((comment) => ({
      id: comment.id,
      body: comment.body,
      createdAt: comment.created_at,
      user: buildPersonSummary(
        comment.user_id,
        maps.profileByUserId,
        maps.membershipByUserId,
        maps.teamById,
        maps.positionById
      ),
    } satisfies TaskCommentData))

  const memberIds = new Set([
    ...getProjectMemberIds(projectId, data),
    ...linkedTaskRows.map((task) => task.assignee_user_id),
  ])

  return {
    viewer: buildViewer(context),
    project: {
      ...buildProjectOption(project, maps.profileByUserId),
      totalLinkedTasks: linkedTaskRows.length,
      openTasks: linkedTaskRows.filter((task) => task.status !== "done" && task.status !== "cancelled").length,
      overdueTasks: linkedTaskRows.filter((task) => {
        if (!task.due_date || task.status === "done" || task.status === "cancelled") {
          return false
        }

        return new Date(task.due_date).getTime() < Date.now()
      }).length,
      teamCount: memberIds.size,
    },
    linkedTasks,
    teamMembers,
    recentComments,
  }
}

export async function getTaskDetailData(user: User | null, taskId: string): Promise<TaskDetailData> {
  const context = await getWorkspaceContext(user)
  const { data, maps, task } = await readTaskOrThrow(context, taskId)

  const taskSummary = buildTaskSummary(task, maps, data.checklistItems, data.comments, data.attachments)
  const checklistItems = data.checklistItems
    .filter((item) => item.task_id === task.id)
    .sort((left, right) => left.sort_order - right.sort_order || new Date(left.created_at).getTime() - new Date(right.created_at).getTime())
    .map((item) => ({
      id: item.id,
      text: item.text,
      isCompleted: item.is_completed,
      sortOrder: item.sort_order,
      createdAt: item.created_at,
    } satisfies TaskChecklistItemData))

  const comments = data.comments
    .filter((comment) => comment.task_id === task.id)
    .sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime())
    .map((comment) => ({
      id: comment.id,
      body: comment.body,
      createdAt: comment.created_at,
      user: buildPersonSummary(
        comment.user_id,
        maps.profileByUserId,
        maps.membershipByUserId,
        maps.teamById,
        maps.positionById
      ),
    } satisfies TaskCommentData))

  const attachments = data.attachments
    .filter((attachment) => attachment.task_id === task.id)
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
    .map((attachment) => ({
      id: attachment.id,
      fileUrl: attachment.file_url,
      fileType: attachment.file_type,
      createdAt: attachment.created_at,
      uploadedBy: buildPersonSummary(
        attachment.uploaded_by,
        maps.profileByUserId,
        maps.membershipByUserId,
        maps.teamById,
        maps.positionById
      ),
    } satisfies TaskAttachmentData))

  return {
    viewer: {
      ...buildViewer(context),
      canEdit: canManageTask(context, task, maps.membershipByUserId),
      canDelete:
        context.accessLevel === "admin"
        || task.created_by_user_id === context.user.id
        || (task.assignee_user_id === context.user.id && context.accessLevel !== "external"),
    },
    task: taskSummary,
    checklistItems,
    comments,
    attachments,
  }
}

export async function getTaskFormOptions(user: User | null) {
  const context = await getWorkspaceContext(user)
  const data = await loadWorkspaceDataset(context.organizationId)
  const maps = buildLookupMaps(data)
  const members = data.memberships
    .filter((membership) => membership.status === "active")
    .filter((membership) => canAssignToUser(context, membership))
    .map((membership) => buildMemberOption(membership, maps.profileByUserId, maps.teamById, maps.positionById))
    .sort((left, right) => left.fullName.localeCompare(right.fullName))

  const projects =
    context.accessLevel === "external"
      ? []
      : data.projects.map((project) => buildProjectOption(project, maps.profileByUserId))

  return {
    viewer: buildViewer(context),
    members,
    projects,
    categories: [...assignedTaskCategoryOptions],
  }
}

export async function createTask(user: User | null, input: CreateTaskInput) {
  const context = await getWorkspaceContext(user)
  requirePermission(context, "create_tasks")

  const admin = createAdminClient()
  const data = await loadWorkspaceDataset(context.organizationId)
  const maps = buildLookupMaps(data)
  const assigneeMembership = maps.membershipByUserId.get(input.assigneeUserId)

  if (!canAssignToUser(context, assigneeMembership)) {
    throw new Error("You cannot assign a task to that teammate.")
  }

  if (input.projectId && !data.projects.some((project) => project.id === input.projectId)) {
    throw new Error("Project not found.")
  }

  const title = input.title.trim()
  if (!title) {
    throw new Error("Title is required.")
  }

  const insertPayload: DbTables["assigned_tasks"]["Insert"] = {
    organization_id: context.organizationId,
    title,
    description: normalizeOptionalText(input.description) ?? null,
    assignee_user_id: input.assigneeUserId,
    created_by_user_id: context.user.id,
    category: validateTaskCategory(input.category),
    project_id: input.projectId ?? null,
    due_date: normalizeOptionalText(input.dueDate) ?? null,
    status: input.status ?? "open",
    priority: input.priority ?? null,
    completed_at: input.status === "done" ? new Date().toISOString() : null,
  }

  const taskResult = await admin
    .from("assigned_tasks")
    .insert(insertPayload)
    .select("id, assignee_user_id, project_id, title")
    .single<{ id: string; assignee_user_id: string; project_id: string | null; title: string }>()

  if (taskResult.error) {
    throw taskResult.error
  }

  if (input.attachmentUrl?.trim()) {
    const attachmentResult = await admin.from("assigned_task_attachments").insert({
      task_id: taskResult.data.id,
      uploaded_by: context.user.id,
      file_url: input.attachmentUrl.trim(),
      file_type: null,
    })

    if (attachmentResult.error) {
      throw attachmentResult.error
    }
  }

  await createActivityLog({
    organizationId: context.organizationId,
    actorUserId: context.user.id,
    targetUserId: taskResult.data.assignee_user_id,
    taskId: taskResult.data.id,
    projectId: taskResult.data.project_id,
    kind: "assignment",
    summary: `Created task "${taskResult.data.title}"`,
  })

  return { id: taskResult.data.id }
}

export async function updateTask(user: User | null, taskId: string, input: UpdateTaskInput) {
  const context = await getWorkspaceContext(user)
  const admin = createAdminClient()
  const data = await loadWorkspaceDataset(context.organizationId)
  const maps = buildLookupMaps(data)
  const existingTask = data.tasks.find((task) => task.id === taskId)

  if (!existingTask) {
    throw new Error("Task not found.")
  }

  if (!canManageTask(context, existingTask, maps.membershipByUserId)) {
    throw new Error("You do not have access to update this task.")
  }

  if (input.assigneeUserId && input.assigneeUserId !== existingTask.assignee_user_id) {
    const assigneeMembership = maps.membershipByUserId.get(input.assigneeUserId)
    if (!canAssignToUser(context, assigneeMembership)) {
      throw new Error("You cannot assign a task to that teammate.")
    }
  }

  if (input.projectId && !data.projects.some((project) => project.id === input.projectId)) {
    throw new Error("Project not found.")
  }

  const nextStatus = input.status ?? existingTask.status
  const updatePayload: DbTables["assigned_tasks"]["Update"] = {
    title: input.title === undefined ? undefined : input.title.trim(),
    description: input.description === undefined ? undefined : normalizeOptionalText(input.description) ?? null,
    assignee_user_id: input.assigneeUserId,
    category: input.category === undefined ? undefined : validateTaskCategory(input.category),
    project_id: input.projectId === undefined ? undefined : input.projectId,
    due_date: input.dueDate === undefined ? undefined : normalizeOptionalText(input.dueDate) ?? null,
    status: nextStatus,
    priority: input.priority === undefined ? undefined : input.priority,
    completed_at:
      nextStatus === "done"
        ? existingTask.completed_at ?? new Date().toISOString()
        : input.status
          ? null
          : undefined,
  }

  const result = await admin
    .from("assigned_tasks")
    .update(updatePayload)
    .eq("id", taskId)

  if (result.error) {
    throw result.error
  }

  if (input.status && input.status !== existingTask.status) {
    await createActivityLog({
      organizationId: context.organizationId,
      actorUserId: context.user.id,
      targetUserId: input.assigneeUserId ?? existingTask.assignee_user_id,
      taskId,
      projectId: input.projectId ?? existingTask.project_id,
      kind: "update",
      summary: `Moved "${existingTask.title}" to ${input.status.replaceAll("_", " ")}`,
    })
  }
}

export async function deleteTask(user: User | null, taskId: string) {
  const context = await getWorkspaceContext(user)
  const admin = createAdminClient()
  const data = await loadWorkspaceDataset(context.organizationId)
  const maps = buildLookupMaps(data)
  const existingTask = data.tasks.find((task) => task.id === taskId)

  if (!existingTask) {
    throw new Error("Task not found.")
  }

  if (
    !(
      context.accessLevel === "admin"
      || existingTask.created_by_user_id === context.user.id
      || existingTask.assignee_user_id === context.user.id
      || canManageTask(context, existingTask, maps.membershipByUserId)
    )
  ) {
    throw new Error("You do not have access to delete this task.")
  }

  const result = await admin
    .from("assigned_tasks")
    .delete()
    .eq("id", taskId)

  if (result.error) {
    throw result.error
  }
}

export async function createProject(user: User | null, input: CreateProjectInput) {
  const context = await getWorkspaceContext(user)
  requirePermission(context, "assign_projects")

  const admin = createAdminClient()
  const name = input.name.trim()

  if (!name) {
    throw new Error("Project name is required.")
  }

  const result = await admin
    .from("assigned_projects")
    .insert({
      organization_id: context.organizationId,
      slug: slugifyAssignedValue(name),
      name,
      description: normalizeOptionalText(input.description) ?? null,
      location_text: normalizeOptionalText(input.locationText) ?? null,
      status: input.status ?? "planning",
      lead_user_id: input.leadUserId ?? null,
      start_date: normalizeOptionalText(input.startDate) ?? null,
      end_date: normalizeOptionalText(input.endDate) ?? null,
    })
    .select("id")
    .single<{ id: string }>()

  if (result.error) {
    throw result.error
  }

  return { id: result.data.id }
}

export async function updateProject(user: User | null, projectId: string, input: CreateProjectInput) {
  const context = await getWorkspaceContext(user)
  requirePermission(context, "assign_projects")

  const admin = createAdminClient()
  const name = input.name.trim()

  if (!name) {
    throw new Error("Project name is required.")
  }

  const result = await admin
    .from("assigned_projects")
    .update({
      slug: slugifyAssignedValue(name),
      name,
      description: normalizeOptionalText(input.description) ?? null,
      location_text: normalizeOptionalText(input.locationText) ?? null,
      status: input.status ?? "planning",
      lead_user_id: input.leadUserId ?? null,
      start_date: normalizeOptionalText(input.startDate) ?? null,
      end_date: normalizeOptionalText(input.endDate) ?? null,
    })
    .eq("id", projectId)

  if (result.error) {
    throw result.error
  }
}

export async function createChecklistItem(user: User | null, taskId: string, text: string) {
  const context = await getWorkspaceContext(user)
  const { data, maps, task } = await readTaskOrThrow(context, taskId)

  if (!canManageTask(context, task, maps.membershipByUserId)) {
    throw new Error("You do not have access to edit this task.")
  }

  const trimmed = text.trim()
  if (!trimmed) {
    throw new Error("Checklist text is required.")
  }

  const nextSortOrder =
    data.checklistItems
      .filter((item) => item.task_id === taskId)
      .reduce((max, item) => Math.max(max, item.sort_order), -1) + 1

  const admin = createAdminClient()
  const result = await admin
    .from("assigned_task_checklist_items")
    .insert({
      task_id: taskId,
      text: trimmed,
      sort_order: nextSortOrder,
    })

  if (result.error) {
    throw result.error
  }
}

export async function updateChecklistItem(
  user: User | null,
  itemId: string,
  input: { text?: string; isCompleted?: boolean }
) {
  const context = await getWorkspaceContext(user)
  const admin = createAdminClient()
  const itemResult = await admin
    .from("assigned_task_checklist_items")
    .select("*")
    .eq("id", itemId)
    .single<ChecklistRow>()

  if (itemResult.error) {
    throw itemResult.error
  }

  const { maps, task } = await readTaskOrThrow(context, itemResult.data.task_id)

  if (!canManageTask(context, task, maps.membershipByUserId)) {
    throw new Error("You do not have access to edit this checklist.")
  }

  const result = await admin
    .from("assigned_task_checklist_items")
    .update({
      text: input.text === undefined ? undefined : input.text.trim(),
      is_completed: input.isCompleted,
    })
    .eq("id", itemId)

  if (result.error) {
    throw result.error
  }
}

export async function deleteChecklistItem(user: User | null, itemId: string) {
  const context = await getWorkspaceContext(user)
  const admin = createAdminClient()
  const itemResult = await admin
    .from("assigned_task_checklist_items")
    .select("*")
    .eq("id", itemId)
    .single<ChecklistRow>()

  if (itemResult.error) {
    throw itemResult.error
  }

  const { maps, task } = await readTaskOrThrow(context, itemResult.data.task_id)

  if (!canManageTask(context, task, maps.membershipByUserId)) {
    throw new Error("You do not have access to edit this checklist.")
  }

  const result = await admin
    .from("assigned_task_checklist_items")
    .delete()
    .eq("id", itemId)

  if (result.error) {
    throw result.error
  }
}

export async function createTaskComment(user: User | null, taskId: string, body: string) {
  const context = await getWorkspaceContext(user)
  const { task } = await readTaskOrThrow(context, taskId)
  const admin = createAdminClient()
  const trimmed = body.trim()

  if (!trimmed) {
    throw new Error("Comment text is required.")
  }

  const result = await admin.from("assigned_task_comments").insert({
    task_id: taskId,
    user_id: context.user.id,
    body: trimmed,
  })

  if (result.error) {
    throw result.error
  }

  await createActivityLog({
    organizationId: context.organizationId,
    actorUserId: context.user.id,
    targetUserId: task.assignee_user_id,
    taskId,
    projectId: task.project_id,
    kind: "comment",
    summary: `Commented on "${task.title}"`,
  })
}

export async function createTaskAttachment(
  user: User | null,
  taskId: string,
  input: { fileUrl: string; fileType?: string | null }
) {
  const context = await getWorkspaceContext(user)
  const { maps, task } = await readTaskOrThrow(context, taskId)

  if (!canManageTask(context, task, maps.membershipByUserId)) {
    throw new Error("You do not have access to add attachments.")
  }

  const fileUrl = input.fileUrl.trim()
  if (!fileUrl) {
    throw new Error("Attachment URL is required.")
  }

  const admin = createAdminClient()
  const result = await admin.from("assigned_task_attachments").insert({
    task_id: taskId,
    uploaded_by: context.user.id,
    file_url: fileUrl,
    file_type: normalizeOptionalText(input.fileType) ?? null,
  })

  if (result.error) {
    throw result.error
  }
}
