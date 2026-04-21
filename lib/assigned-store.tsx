"use client"

import {
  addDays,
  differenceInCalendarDays,
  endOfWeek,
  format,
  isThisWeek,
  isToday,
  isTomorrow,
  isYesterday,
  parseISO,
  startOfWeek,
} from "date-fns"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type { User } from "@supabase/supabase-js"

import { useAssignedAccess } from "@/components/assigned-access-provider"

export type TaskSource = "manual" | "image" | "voice" | "imported"
export type TaskPriority = "none" | "high" | "medium" | "low"
export type BoardColumn = "inbox" | "today" | "doing" | "done"
export type PlanningMethod = "top3" | "ivylee" | "hybrid" | "none" | "time-blocking" | "kanban"
export type InboxItemStatus = "pending" | "approved" | "discarded"
export type BlockType = "focus" | "meeting" | "break" | "buffer" | "admin"
export type ListIcon =
  | "briefcase"
  | "graduation-cap"
  | "user"
  | "search"
  | "home"
  | "calendar"
  | "folder"

export interface TaskList {
  id: string
  name: string
  icon: ListIcon
  colorClassName: string
}

export interface Task {
  id: string
  title: string
  completed: boolean
  listId: string
  priority: TaskPriority
  dueDate: string | null
  plannedDate: string | null
  estimatedMinutes: number | null
  note?: string
  boardColumn: BoardColumn
  source: TaskSource
  tags: string[]
  rawText?: string
  createdAt: string
  completedAt: string | null
}

export interface InboxItem {
  id: string
  title: string
  source: TaskSource
  suggestedListId: string
  suggestedDate: string | null
  confidence: number
  rawText?: string
  status: InboxItemStatus
  isNew: boolean
  createdAt: string
}

export interface ScheduleBlock {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  type: BlockType
  taskId: string | null
}

export interface ReviewState {
  wins: string[]
  reflections: Record<string, string>
  nextWeekPriorities: string[]
  completedAt: string | null
}

export interface ProfileState {
  firstName: string
  lastName: string
  email: string
  timezone: string
  avatarUrl: string | null
}

export interface NotificationSettings {
  dailyPlanningReminder: boolean
  taskDueReminders: boolean
  weeklyReviewReminder: boolean
  emailDigest: boolean
}

export interface PreferenceSettings {
  defaultPlanningMethod: PlanningMethod
  workHours: {
    start: string
    end: string
  }
  startOfWeek: "Sunday" | "Monday"
  minimalMode: boolean
}

export interface AISettings {
  taskSuggestions: boolean
  autoCategorization: boolean
  smartDueDates: boolean
  weeklyInsights: boolean
}

export interface IntegrationSettings {
  googleCalendar: boolean
  appleCalendar: boolean
  outlook: boolean
}

export interface PrivacySettings {
  allowAnalytics: boolean
}

export type PomodoroMode = "focus" | "shortBreak" | "longBreak"
export type PomodoroStatus = "idle" | "running" | "paused" | "completed"

export interface PomodoroState {
  mode: PomodoroMode
  status: PomodoroStatus
  selectedTaskId: string | null
  durations: Record<PomodoroMode, number>
  remainingSeconds: number
  startedAt: string | null
  endsAt: string | null
  startedWithSeconds: number
  completedFocusSessions: number
  lastCompletedMode: PomodoroMode | null
}

export interface AssignedState {
  lists: TaskList[]
  tasks: Task[]
  inboxItems: InboxItem[]
  scheduleBlocks: ScheduleBlock[]
  review: ReviewState
  profile: ProfileState
  notifications: NotificationSettings
  preferences: PreferenceSettings
  ai: AISettings
  integrations: IntegrationSettings
  privacy: PrivacySettings
  pomodoro: PomodoroState
}

type AddTaskInput = {
  title: string
  listId?: string
  priority?: TaskPriority
  dueDate?: string | null
  plannedDate?: string | null
  estimatedMinutes?: number | null
  note?: string
  boardColumn?: BoardColumn
  source?: TaskSource
  tags?: string[]
  rawText?: string
}

type AddInboxItemInput = {
  title: string
  source: TaskSource
  suggestedListId?: string
  suggestedDate?: string | null
  confidence?: number
  rawText?: string
  isNew?: boolean
}

type AddScheduleBlockInput = {
  title: string
  date: string
  startTime: string
  endTime: string
  type: BlockType
  taskId?: string | null
}

type AssignedContextValue = AssignedState & {
  hydrated: boolean
  todayKey: string
  addTask: (input: AddTaskInput) => string
  updateTask: (taskId: string, patch: Partial<Task>) => void
  deleteTask: (taskId: string) => void
  toggleTask: (taskId: string) => void
  moveTaskToColumn: (taskId: string, column: BoardColumn) => void
  addList: (name: string) => string
  addInboxItem: (input: AddInboxItemInput) => void
  addInboxItems: (items: AddInboxItemInput[]) => void
  updateInboxItem: (itemId: string, patch: Partial<InboxItem>) => void
  approveInboxItem: (itemId: string) => void
  approveAllInboxItems: () => void
  discardInboxItem: (itemId: string) => void
  addScheduleBlock: (input: AddScheduleBlockInput) => void
  deleteScheduleBlock: (blockId: string) => void
  scheduleTask: (taskId: string, input?: Partial<AddScheduleBlockInput>) => void
  unscheduleTask: (taskId: string) => void
  moveUnfinishedTasksToDate: (sourceDate: string, targetDate: string) => void
  moveUnfinishedTodayToTomorrow: () => void
  startTomorrowPlan: () => void
  addReviewWin: (value: string) => void
  removeReviewWin: (index: number) => void
  setReviewReflection: (prompt: string, value: string) => void
  addNextWeekPriority: (value: string) => void
  removeNextWeekPriority: (index: number) => void
  completeWeeklyReview: () => void
  updateProfile: (patch: Partial<ProfileState>) => void
  updateNotificationSetting: <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => void
  updatePreferences: (patch: Partial<PreferenceSettings>) => void
  updateAISetting: <K extends keyof AISettings>(key: K, value: AISettings[K]) => void
  setIntegrationConnected: <K extends keyof IntegrationSettings>(
    key: K,
    value: IntegrationSettings[K]
  ) => void
  setPrivacySetting: <K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]) => void
  setPomodoroTask: (taskId: string | null) => void
  setPomodoroMode: (mode: PomodoroMode) => void
  startPomodoro: (mode?: PomodoroMode) => void
  pausePomodoro: () => void
  resumePomodoro: () => void
  resetPomodoro: (mode?: PomodoroMode) => void
  endPomodoroSession: () => void
  exportState: () => string
  resetState: () => Promise<void>
}

// Keep reading the old browser keys so existing local caches survive the rename to Assigned.
const LEGACY_STORAGE_KEY = "tasked.local-state.v1"
const LEGACY_USER_STORAGE_KEY_PREFIX = "tasked.local-state.v2"
const STORAGE_KEY_PREFIX = "assigned.local-state.v1"
const AssignedContext = createContext<AssignedContextValue | null>(null)
const DEFAULT_POMODORO_DURATIONS: Record<PomodoroMode, number> = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15,
}
const ASSIGNED_STATE_SYNC_DEBOUNCE_MS = 350

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function dateKey(date: Date) {
  return format(date, "yyyy-MM-dd")
}

function resolveSuggestedDate(value: string | null | undefined, baseDate = new Date()) {
  if (!value) {
    return null
  }

  switch (value) {
    case "Today":
      return dateKey(baseDate)
    case "Tomorrow":
      return dateKey(addDays(baseDate, 1))
    case "Yesterday":
      return dateKey(addDays(baseDate, -1))
    case "This week":
      return dateKey(addDays(baseDate, 3))
    case "Next week":
      return dateKey(addDays(baseDate, 7))
    default:
      return value
  }
}

export function formatTaskDateLabel(value: string | null | undefined) {
  if (!value) {
    return "No date"
  }

  const parsed = parseISO(value)
  if (isToday(parsed)) return "Today"
  if (isTomorrow(parsed)) return "Tomorrow"
  if (isYesterday(parsed)) return "Yesterday"
  return format(parsed, "EEE, MMM d")
}

export function formatTaskDueChipLabel(value: string | null | undefined) {
  if (!value) {
    return ""
  }

  const parsed = parseISO(value)
  if (isToday(parsed)) return "Today"
  if (isTomorrow(parsed)) return "Tomorrow"
  if (isYesterday(parsed)) return "Yesterday"
  return format(parsed, "d MMM")
}

export function getTaskPriorityBadgeClass(priority: TaskPriority) {
  switch (priority) {
    case "none":
      return ""
    case "high":
      return "border bg-transparent"
    case "medium":
      return "border bg-transparent"
    case "low":
      return "border bg-transparent"
    default:
      return "border bg-transparent"
  }
}

export function getCompletedTaskAccentClass() {
  return "border bg-transparent"
}

export function getTaskPriorityBadgeStyle(priority: TaskPriority) {
  switch (priority) {
    case "high":
      return { color: "#dc2626", borderColor: "#dc2626" }
    case "medium":
      return { color: "#ca8a04", borderColor: "#ca8a04" }
    case "low":
      return { color: "#16a34a", borderColor: "#16a34a" }
    default:
      return undefined
  }
}

export function getCompletedTaskAccentStyle() {
  return { color: "#16a34a", borderColor: "#16a34a" }
}

export function formatLongDateLabel(value: string) {
  return format(parseISO(value), "EEEE, MMM d")
}

export function formatTimeLabel(value: string) {
  const [hours, minutes] = value.split(":").map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return format(date, "h:mm a")
}

function createPomodoroSeed(): PomodoroState {
  const focusSeconds = DEFAULT_POMODORO_DURATIONS.focus * 60

  return {
    mode: "focus",
    status: "idle",
    selectedTaskId: null,
    durations: { ...DEFAULT_POMODORO_DURATIONS },
    remainingSeconds: focusSeconds,
    startedAt: null,
    endsAt: null,
    startedWithSeconds: focusSeconds,
    completedFocusSessions: 0,
    lastCompletedMode: null,
  }
}

function getPomodoroModeSeconds(pomodoro: PomodoroState, mode = pomodoro.mode) {
  return pomodoro.durations[mode] * 60
}

export function getPomodoroRemainingSeconds(pomodoro: PomodoroState, now = Date.now()) {
  if (pomodoro.status !== "running" || !pomodoro.endsAt) {
    return pomodoro.remainingSeconds
  }

  return Math.max(0, Math.ceil((new Date(pomodoro.endsAt).getTime() - now) / 1000))
}

export function getPomodoroModeLabel(mode: PomodoroMode) {
  switch (mode) {
    case "focus":
      return "Focus"
    case "shortBreak":
      return "Short break"
    case "longBreak":
      return "Long break"
    default:
      return "Focus"
  }
}

export function formatPomodoroClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export function isPomodoroSessionActive(pomodoro: PomodoroState) {
  return pomodoro.status === "running" || pomodoro.status === "paused"
}

function getNextPomodoroMode(mode: PomodoroMode, completedFocusSessions: number): PomodoroMode {
  if (mode === "focus") {
    return completedFocusSessions % 4 === 0 ? "longBreak" : "shortBreak"
  }

  return "focus"
}

function getStorageKey(userId?: string | null) {
  if (!userId) {
    return `${STORAGE_KEY_PREFIX}.guest`
  }

  return `${STORAGE_KEY_PREFIX}.${userId}`
}

function getLegacyStorageKeys(userId?: string | null) {
  if (!userId) {
    return [LEGACY_STORAGE_KEY]
  }

  return [LEGACY_STORAGE_KEY, `${LEGACY_USER_STORAGE_KEY_PREFIX}.${userId}`]
}

function readStoredState(storageKey: string) {
  if (typeof window === "undefined") {
    return null
  }

  const savedState = window.localStorage.getItem(storageKey)
  if (!savedState) {
    return null
  }

  try {
    return JSON.parse(savedState) as AssignedState
  } catch {
    window.localStorage.removeItem(storageKey)
    return null
  }
}

function readStoredStateWithFallback(storageKeys: string[]) {
  for (const storageKey of storageKeys) {
    const storedState = readStoredState(storageKey)

    if (storedState) {
      return storedState
    }
  }

  return null
}

function writeStoredState(storageKey: string, state: AssignedState) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(storageKey, JSON.stringify(state))
}

async function fetchAssignedState() {
  const response = await fetch("/api/state", { cache: "no-store" })
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string
    state?: Partial<AssignedState> | null
  }

  if (!response.ok) {
    throw new Error(payload.error ?? "Unable to load Assigned state.")
  }

  return payload.state ?? null
}

async function persistAssignedState(state: AssignedState) {
  const response = await fetch("/api/state", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      state,
    }),
  })

  const payload = (await response.json().catch(() => ({}))) as { error?: string }

  if (!response.ok) {
    throw new Error(payload.error ?? "Unable to sync Assigned state.")
  }
}

async function deleteAssignedStateOnServer() {
  const response = await fetch("/api/state", {
    method: "DELETE",
  })

  const payload = (await response.json().catch(() => ({}))) as { error?: string }

  if (!response.ok) {
    throw new Error(payload.error ?? "Unable to reset Assigned state.")
  }
}

function buildProfileSeed(user?: User | null): Partial<ProfileState> {
  const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>
  const fullName = typeof metadata.full_name === "string" ? metadata.full_name : ""
  const firstNameFromMetadata =
    typeof metadata.first_name === "string" ? metadata.first_name : fullName.split(" ")[0] ?? ""
  const lastNameFromMetadata =
    typeof metadata.last_name === "string"
      ? metadata.last_name
      : fullName.split(" ").slice(1).join(" ")

  const email = user?.email ?? "sarah@example.com"
  const emailName = email.split("@")[0] ?? ""
  const fallbackName = emailName
    .split(/[._-]/)
    .filter(Boolean)
    .map((value) => value.charAt(0).toUpperCase() + value.slice(1))
  const firstName = firstNameFromMetadata || fallbackName[0] || "Sarah"
  const lastName = lastNameFromMetadata || fallbackName.slice(1).join(" ") || "Chen"

  return {
    firstName,
    lastName,
    email,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Phoenix",
    avatarUrl: null,
  }
}

function normalizeListName(value: string) {
  return value.trim().toLowerCase()
}

function normalizeBoardColumn(value: string | null | undefined): BoardColumn {
  switch (value) {
    case "today":
    case "doing":
    case "done":
    case "inbox":
      return value
    case "waiting":
      return "today"
    default:
      return "inbox"
  }
}

function dedupeLists(state: AssignedState): AssignedState {
  if (state.lists.length < 2) {
    return state
  }

  const taskCounts = new Map<string, number>()
  const inboxCounts = new Map<string, number>()

  state.tasks.forEach((task) => {
    taskCounts.set(task.listId, (taskCounts.get(task.listId) ?? 0) + 1)
  })

  state.inboxItems.forEach((item) => {
    inboxCounts.set(item.suggestedListId, (inboxCounts.get(item.suggestedListId) ?? 0) + 1)
  })

  const canonicalByName = new Map<string, TaskList>()

  state.lists.forEach((list) => {
    const key = normalizeListName(list.name)
    const existing = canonicalByName.get(key)

    if (!existing) {
      canonicalByName.set(key, list)
      return
    }

    const existingReferences =
      (taskCounts.get(existing.id) ?? 0) + (inboxCounts.get(existing.id) ?? 0)
    const candidateReferences =
      (taskCounts.get(list.id) ?? 0) + (inboxCounts.get(list.id) ?? 0)

    if (candidateReferences > existingReferences) {
      canonicalByName.set(key, list)
    }
  })

  const idMap = new Map<string, string>()
  const dedupedLists = state.lists.filter((list) => {
    const canonical = canonicalByName.get(normalizeListName(list.name))
    if (!canonical) {
      return true
    }

    idMap.set(list.id, canonical.id)
    return canonical.id === list.id
  })

  const hasRemap = Array.from(idMap.entries()).some(([sourceId, targetId]) => sourceId !== targetId)
  if (!hasRemap && dedupedLists.length === state.lists.length) {
    return state
  }

  return {
    ...state,
    lists: dedupedLists,
    tasks: state.tasks.map((task) => ({
      ...task,
      listId: idMap.get(task.listId) ?? task.listId,
    })),
    inboxItems: state.inboxItems.map((item) => ({
      ...item,
      suggestedListId: idMap.get(item.suggestedListId) ?? item.suggestedListId,
    })),
  }
}

function normalizeState(
  value: Partial<AssignedState> | null | undefined,
  fallback: AssignedState
): AssignedState {
  if (!value) {
    return fallback
  }

  return dedupeLists({
    ...fallback,
    ...value,
    lists: Array.isArray(value.lists) ? value.lists : fallback.lists,
    tasks: Array.isArray(value.tasks)
      ? value.tasks.map((task) => ({
          ...task,
          boardColumn: normalizeBoardColumn(task.boardColumn),
        }))
      : fallback.tasks,
    inboxItems: Array.isArray(value.inboxItems) ? value.inboxItems : fallback.inboxItems,
    scheduleBlocks: Array.isArray(value.scheduleBlocks) ? value.scheduleBlocks : fallback.scheduleBlocks,
    review: {
      ...fallback.review,
      ...(value.review ?? {}),
      wins: Array.isArray(value.review?.wins) ? value.review.wins : fallback.review.wins,
      reflections: value.review?.reflections ?? fallback.review.reflections,
      nextWeekPriorities: Array.isArray(value.review?.nextWeekPriorities)
        ? value.review.nextWeekPriorities
        : fallback.review.nextWeekPriorities,
    },
    profile: {
      ...fallback.profile,
      ...(value.profile ?? {}),
    },
    notifications: {
      ...fallback.notifications,
      ...(value.notifications ?? {}),
    },
    preferences: {
      ...fallback.preferences,
      ...(value.preferences ?? {}),
      workHours: {
        ...fallback.preferences.workHours,
        ...(value.preferences?.workHours ?? {}),
      },
    },
    ai: {
      ...fallback.ai,
      ...(value.ai ?? {}),
    },
    integrations: {
      ...fallback.integrations,
      ...(value.integrations ?? {}),
    },
    privacy: {
      ...fallback.privacy,
      ...(value.privacy ?? {}),
    },
    pomodoro: {
      ...fallback.pomodoro,
      ...(value.pomodoro ?? {}),
      durations: {
        ...fallback.pomodoro.durations,
        ...(value.pomodoro?.durations ?? {}),
      },
    },
  })
}

function syncProfileWithUser(state: AssignedState, user?: User | null) {
  if (!user?.email) {
    return state
  }

  return {
    ...state,
    profile: {
      ...state.profile,
      email: user.email,
    },
  }
}

function createSeedState(profileSeed?: Partial<ProfileState>): AssignedState {
  return {
    lists: [],
    tasks: [],
    inboxItems: [],
    scheduleBlocks: [],
    review: {
      wins: [],
      reflections: {},
      nextWeekPriorities: [],
      completedAt: null,
    },
    profile: {
      firstName: profileSeed?.firstName ?? "Sarah",
      lastName: profileSeed?.lastName ?? "Chen",
      email: profileSeed?.email ?? "sarah@example.com",
      timezone: profileSeed?.timezone ?? "America/Phoenix",
      avatarUrl: profileSeed?.avatarUrl ?? null,
    },
    notifications: {
      dailyPlanningReminder: true,
      taskDueReminders: true,
      weeklyReviewReminder: true,
      emailDigest: false,
    },
    preferences: {
      defaultPlanningMethod: "top3",
      workHours: {
        start: "09:00",
        end: "17:00",
      },
      startOfWeek: "Sunday",
      minimalMode: false,
    },
    ai: {
      taskSuggestions: true,
      autoCategorization: true,
      smartDueDates: true,
      weeklyInsights: true,
    },
    integrations: {
      googleCalendar: false,
      appleCalendar: false,
      outlook: false,
    },
    privacy: {
      allowAnalytics: true,
    },
    pomodoro: createPomodoroSeed(),
  }
}

function getDefaultListId(lists: TaskList[], preferredListId?: string | null) {
  if (preferredListId && lists.some((list) => list.id === preferredListId)) {
    return preferredListId
  }

  return lists[0]?.id ?? ""
}

export function getTasksForDate(tasks: Task[], value: string) {
  return tasks.filter((task) => task.plannedDate === value)
}

export function getScheduledBlocksForDate(blocks: ScheduleBlock[], value: string) {
  return blocks
    .filter((block) => block.date === value)
    .sort((left, right) => left.startTime.localeCompare(right.startTime))
}

export function getUnscheduledTasksForDate(tasks: Task[], blocks: ScheduleBlock[], value: string) {
  const scheduledTaskIds = new Set(
    blocks
      .filter((block) => block.date === value && block.taskId)
      .map((block) => block.taskId)
  )

  return tasks.filter(
    (task) =>
      task.plannedDate === value &&
      !task.completed &&
      !scheduledTaskIds.has(task.id)
  )
}

export function getPendingInboxItems(items: InboxItem[]) {
  return items.filter((item) => item.status === "pending")
}

export function getOverdueTasks(tasks: Task[], today = new Date()) {
  const todayValue = dateKey(today)
  return tasks.filter((task) => !task.completed && task.dueDate && task.dueDate < todayValue)
}

export function getTasksCompletedThisWeek(
  tasks: Task[],
  weekStartsOn: 0 | 1 = 0
) {
  const start = startOfWeek(new Date(), { weekStartsOn })
  return tasks.filter((task) => {
    if (!task.completedAt) {
      return false
    }

    return isThisWeek(parseISO(task.completedAt), { weekStartsOn })
      && parseISO(task.completedAt) >= start
  })
}

export function getCompletionRate(tasks: Task[]) {
  if (tasks.length === 0) {
    return 0
  }

  const completed = tasks.filter((task) => task.completed).length
  return Math.round((completed / tasks.length) * 100)
}

function createTaskFromInboxItem(item: InboxItem): Task {
  const plannedDate = resolveSuggestedDate(item.suggestedDate)

  return {
    id: makeId("task"),
    title: item.title,
    completed: false,
    listId: item.suggestedListId,
    priority: item.confidence >= 90 ? "high" : item.confidence >= 80 ? "medium" : "low",
    dueDate: plannedDate,
    plannedDate,
    estimatedMinutes: 30,
    boardColumn: "today",
    source: item.source,
    tags: [],
    rawText: item.rawText,
    createdAt: dateKey(new Date()),
    completedAt: null,
  }
}

export function AssignedStateProvider({ children }: { children: ReactNode }) {
  const { loading: accessLoading, user } = useAssignedAccess()
  const [state, setState] = useState<AssignedState>(() => createSeedState())
  const [hydrated, setHydrated] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  )
  const lastSerializedStateRef = useRef<string | null>(null)
  const currentUserRef = useRef<User | null>(null)
  const pendingSyncRef = useRef(false)

  const loadStateForUser = useCallback(
    async (user: User | null) => {
      currentUserRef.current = user
      setUserId(user?.id ?? null)

      const profileSeed = buildProfileSeed(user)
      const baseState = createSeedState(profileSeed)
      const localFallback = readStoredStateWithFallback([
        getStorageKey(user?.id),
        ...getLegacyStorageKeys(user?.id),
      ])
      const fallbackState = syncProfileWithUser(normalizeState(localFallback, baseState), user)

      if (!user) {
        setState(fallbackState)
        lastSerializedStateRef.current = JSON.stringify(fallbackState)
        setHydrated(true)
        return
      }

      try {
        const remoteState = await fetchAssignedState()
        const nextState = syncProfileWithUser(
          normalizeState(remoteState ?? fallbackState, baseState),
          user
        )

        if (!remoteState) {
          await persistAssignedState(nextState)
        }

        setState(nextState)
        lastSerializedStateRef.current = JSON.stringify(nextState)
        pendingSyncRef.current = false
        setHydrated(true)
      } catch (error) {
        console.error("Assigned server state unavailable:", error instanceof Error ? error.message : error)
        setState(fallbackState)
        lastSerializedStateRef.current = JSON.stringify(fallbackState)
        pendingSyncRef.current = true
        setHydrated(true)
      }
    },
    []
  )

  useEffect(() => {
    if (accessLoading) {
      return
    }

    currentUserRef.current = user
    void loadStateForUser(user)
  }, [accessLoading, loadStateForUser, user])

  useEffect(() => {
    if (!hydrated) {
      return
    }

    writeStoredState(getStorageKey(userId), state)

    if (userId) {
      window.localStorage.removeItem(getStorageKey())
      getLegacyStorageKeys(userId).forEach((storageKey) => {
        window.localStorage.removeItem(storageKey)
      })
    }
  }, [hydrated, state, userId])

  useEffect(() => {
    if (!hydrated || !userId || !isOnline) {
      return
    }

    const serializedState = JSON.stringify(state)
    if (!pendingSyncRef.current && lastSerializedStateRef.current === serializedState) {
      return
    }

    const timeout = window.setTimeout(() => {
      void persistAssignedState(state)
        .then(() => {
          lastSerializedStateRef.current = serializedState
          pendingSyncRef.current = false
        })
        .catch((error) => {
          pendingSyncRef.current = true
          console.error(
            "Unable to sync Assigned state to the server:",
            error instanceof Error ? error.message : error
          )
        })
    }, ASSIGNED_STATE_SYNC_DEBOUNCE_MS)

    return () => window.clearTimeout(timeout)
  }, [hydrated, isOnline, state, userId])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const addTask = useCallback((input: AddTaskInput) => {
    const taskId = makeId("task")

    setState((current) => ({
      ...current,
      tasks: [
        ...current.tasks,
        {
          id: taskId,
          title: input.title.trim(),
          completed: false,
          listId: getDefaultListId(current.lists, input.listId),
          priority: input.priority ?? "none",
          dueDate: input.dueDate ?? null,
          plannedDate: input.plannedDate ?? null,
          estimatedMinutes: input.estimatedMinutes ?? null,
          note: input.note?.trim() ? input.note.trim() : "",
          boardColumn: input.boardColumn ?? "today",
          source: input.source ?? "manual",
          tags: input.tags ?? [],
          rawText: input.rawText,
          createdAt: dateKey(new Date()),
          completedAt: null,
        },
      ],
    }))

    return taskId
  }, [])

  const updateTask = useCallback((taskId: string, patch: Partial<Task>) => {
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        task.id === taskId ? { ...task, ...patch } : task
      ),
    }))
  }, [])

  const deleteTask = useCallback((taskId: string) => {
    setState((current) => ({
      ...current,
      tasks: current.tasks.filter((task) => task.id !== taskId),
      scheduleBlocks: current.scheduleBlocks.filter((block) => block.taskId !== taskId),
      pomodoro: {
        ...current.pomodoro,
        selectedTaskId: current.pomodoro.selectedTaskId === taskId ? null : current.pomodoro.selectedTaskId,
      },
    }))
  }, [])

  const toggleTask = useCallback((taskId: string) => {
    const todayValue = dateKey(new Date())

    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => {
        if (task.id !== taskId) {
          return task
        }

        const completed = !task.completed
        return {
          ...task,
          completed,
          boardColumn: completed ? "done" : task.boardColumn === "done" ? "today" : task.boardColumn,
          completedAt: completed ? todayValue : null,
        }
      }),
    }))
  }, [])

  const moveTaskToColumn = useCallback((taskId: string, column: BoardColumn) => {
    const todayValue = dateKey(new Date())
    const isDoneColumn = column === "done"

    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => {
        if (task.id !== taskId) {
          return task
        }

        return {
          ...task,
          boardColumn: column,
          completed: isDoneColumn,
          plannedDate:
            column === "today" && !task.plannedDate
              ? todayValue
              : task.plannedDate,
          completedAt: isDoneColumn ? todayValue : null,
        }
      }),
    }))
  }, [])

  const addList = useCallback((name: string) => {
    const trimmed = name.trim()

    if (!trimmed) {
      return ""
    }

    let resolvedListId = ""

    setState((current) => {
      const existingList = current.lists.find(
        (list) => normalizeListName(list.name) === normalizeListName(trimmed)
      )

      if (existingList) {
        resolvedListId = existingList.id
        return current
      }

      const listId = makeId("list")
      resolvedListId = listId

      return {
        ...current,
        lists: [
          ...current.lists,
          {
            id: listId,
            name: trimmed,
            icon: "folder",
            colorClassName: "bg-muted text-foreground",
          },
        ],
      }
    })

    return resolvedListId
  }, [])

  const addInboxItem = useCallback((input: AddInboxItemInput) => {
    setState((current) => ({
      ...current,
      inboxItems: [
        ...current.inboxItems,
        {
          id: makeId("inbox"),
          title: input.title.trim(),
          source: input.source,
          suggestedListId: getDefaultListId(current.lists, input.suggestedListId),
          suggestedDate: resolveSuggestedDate(input.suggestedDate ?? null),
          confidence: input.confidence ?? 85,
          rawText: input.rawText,
          status: "pending",
          isNew: input.isNew ?? true,
          createdAt: dateKey(new Date()),
        },
      ],
    }))
  }, [])

  const addInboxItems = useCallback((items: AddInboxItemInput[]) => {
    if (items.length === 0) {
      return
    }

    setState((current) => ({
      ...current,
      inboxItems: [
        ...current.inboxItems,
        ...items.map((item) => ({
          id: makeId("inbox"),
          title: item.title.trim(),
          source: item.source,
          suggestedListId: getDefaultListId(current.lists, item.suggestedListId),
          suggestedDate: resolveSuggestedDate(item.suggestedDate ?? null),
          confidence: item.confidence ?? 85,
          rawText: item.rawText,
          status: "pending" as InboxItemStatus,
          isNew: item.isNew ?? true,
          createdAt: dateKey(new Date()),
        })),
      ],
    }))
  }, [])

  const approveInboxItem = useCallback((itemId: string) => {
    setState((current) => {
      const item = current.inboxItems.find((value) => value.id === itemId)
      if (!item || item.status !== "pending") {
        return current
      }

      return {
        ...current,
        inboxItems: current.inboxItems.map((value) =>
          value.id === itemId ? { ...value, status: "approved" } : value
        ),
        tasks: [
          ...current.tasks,
          createTaskFromInboxItem({
            ...item,
            suggestedListId: getDefaultListId(current.lists, item.suggestedListId),
          }),
        ],
      }
    })
  }, [])

  const approveAllInboxItems = useCallback(() => {
    setState((current) => {
      const pendingItems = current.inboxItems.filter((item) => item.status === "pending")
      if (pendingItems.length === 0) {
        return current
      }

      return {
        ...current,
        inboxItems: current.inboxItems.map((item) =>
          item.status === "pending" ? { ...item, status: "approved" } : item
        ),
        tasks: [
          ...current.tasks,
          ...pendingItems.map((item) =>
            createTaskFromInboxItem({
              ...item,
              suggestedListId: getDefaultListId(current.lists, item.suggestedListId),
            })
          ),
        ],
      }
    })
  }, [])

  const discardInboxItem = useCallback((itemId: string) => {
    setState((current) => ({
      ...current,
      inboxItems: current.inboxItems.map((item) =>
        item.id === itemId ? { ...item, status: "discarded" } : item
      ),
    }))
  }, [])

  const updateInboxItem = useCallback((itemId: string, patch: Partial<InboxItem>) => {
    setState((current) => ({
      ...current,
      inboxItems: current.inboxItems.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item
      ),
    }))
  }, [])

  const addScheduleBlock = useCallback((input: AddScheduleBlockInput) => {
    setState((current) => ({
      ...current,
      scheduleBlocks: [
        ...current.scheduleBlocks,
        {
          id: makeId("block"),
          title: input.title,
          date: input.date,
          startTime: input.startTime,
          endTime: input.endTime,
          type: input.type,
          taskId: input.taskId ?? null,
        },
      ],
    }))
  }, [])

  const deleteScheduleBlock = useCallback((blockId: string) => {
    setState((current) => ({
      ...current,
      scheduleBlocks: current.scheduleBlocks.filter((block) => block.id !== blockId),
    }))
  }, [])

  const scheduleTask = useCallback((taskId: string, input?: Partial<AddScheduleBlockInput>) => {
    setState((current) => {
      const task = current.tasks.find((value) => value.id === taskId)
      if (!task) {
        return current
      }

      const targetDate = input?.date ?? task.plannedDate ?? dateKey(new Date())
      const existingBlocks = getScheduledBlocksForDate(current.scheduleBlocks, targetDate)
      const startTime = input?.startTime ?? (() => {
        const lastBlock = existingBlocks[existingBlocks.length - 1]
        if (!lastBlock) {
          return "09:00"
        }
        return lastBlock.endTime
      })()

      const estimatedMinutes = task.estimatedMinutes ?? 60
      const [hours, minutes] = startTime.split(":").map(Number)
      const totalMinutes = hours * 60 + minutes + estimatedMinutes
      const endHours = Math.floor(totalMinutes / 60)
      const endMinutes = totalMinutes % 60
      const endTime = input?.endTime ?? `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`

      return {
        ...current,
        tasks: current.tasks.map((value) =>
          value.id === taskId
            ? {
                ...value,
                plannedDate: targetDate,
                boardColumn: "today",
              }
            : value
        ),
        scheduleBlocks: [
          ...current.scheduleBlocks.filter((block) => block.taskId !== taskId || block.date !== targetDate),
          {
            id: makeId("block"),
            title: input?.title ?? task.title,
            date: targetDate,
            startTime,
            endTime,
            type: input?.type ?? "focus",
            taskId,
          },
        ],
      }
    })
  }, [])

  const unscheduleTask = useCallback((taskId: string) => {
    setState((current) => ({
      ...current,
      scheduleBlocks: current.scheduleBlocks.filter((block) => block.taskId !== taskId),
    }))
  }, [])

  const moveUnfinishedTasksToDate = useCallback((sourceDate: string, targetDate: string) => {
    const todayValue = dateKey(new Date())

    if (!sourceDate || !targetDate || sourceDate === targetDate) {
      return
    }

    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        !task.completed && task.plannedDate === sourceDate
          ? {
              ...task,
              plannedDate: targetDate,
              boardColumn: "today",
            }
          : task
      ),
      scheduleBlocks: current.scheduleBlocks.filter((block) => block.date !== sourceDate || !block.taskId),
    }))
  }, [])

  const moveUnfinishedTodayToTomorrow = useCallback(() => {
    const todayValue = dateKey(new Date())
    const tomorrowValue = dateKey(addDays(new Date(), 1))

    moveUnfinishedTasksToDate(todayValue, tomorrowValue)
  }, [moveUnfinishedTasksToDate])

  const startTomorrowPlan = useCallback(() => {
    const tomorrowValue = dateKey(addDays(new Date(), 1))

    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task, index) =>
        !task.completed && !task.plannedDate && index < 3
          ? { ...task, plannedDate: tomorrowValue, boardColumn: "today" }
          : task
      ),
    }))
  }, [])

  const addReviewWin = useCallback((value: string) => {
    const trimmed = value.trim()
    if (!trimmed) {
      return
    }

    setState((current) => ({
      ...current,
      review: {
        ...current.review,
        wins: [...current.review.wins, trimmed],
      },
    }))
  }, [])

  const removeReviewWin = useCallback((index: number) => {
    setState((current) => ({
      ...current,
      review: {
        ...current.review,
        wins: current.review.wins.filter((_, currentIndex) => currentIndex !== index),
      },
    }))
  }, [])

  const setReviewReflection = useCallback((prompt: string, value: string) => {
    setState((current) => ({
      ...current,
      review: {
        ...current.review,
        reflections: {
          ...current.review.reflections,
          [prompt]: value,
        },
      },
    }))
  }, [])

  const addNextWeekPriority = useCallback((value: string) => {
    const trimmed = value.trim()
    if (!trimmed) {
      return
    }

    setState((current) => ({
      ...current,
      review: {
        ...current.review,
        nextWeekPriorities:
          current.review.nextWeekPriorities.length >= 5
            ? current.review.nextWeekPriorities
            : [...current.review.nextWeekPriorities, trimmed],
      },
    }))
  }, [])

  const removeNextWeekPriority = useCallback((index: number) => {
    setState((current) => ({
      ...current,
      review: {
        ...current.review,
        nextWeekPriorities: current.review.nextWeekPriorities.filter(
          (_, currentIndex) => currentIndex !== index
        ),
      },
    }))
  }, [])

  const completeWeeklyReview = useCallback(() => {
    setState((current) => ({
      ...current,
      review: {
        ...current.review,
        completedAt: new Date().toISOString(),
      },
    }))
  }, [])

  const updateProfile = useCallback((patch: Partial<ProfileState>) => {
    setState((current) => ({
      ...current,
      profile: {
        ...current.profile,
        ...patch,
      },
    }))
  }, [])

  const updateNotificationSetting = useCallback(
    <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
      setState((current) => ({
        ...current,
        notifications: {
          ...current.notifications,
          [key]: value,
        },
      }))
    },
    []
  )

  const updatePreferences = useCallback((patch: Partial<PreferenceSettings>) => {
    setState((current) => ({
      ...current,
      preferences: {
        ...current.preferences,
        ...patch,
      },
    }))
  }, [])

  const updateAISetting = useCallback(
    <K extends keyof AISettings>(key: K, value: AISettings[K]) => {
      setState((current) => ({
        ...current,
        ai: {
          ...current.ai,
          [key]: value,
        },
      }))
    },
    []
  )

  const setIntegrationConnected = useCallback(
    <K extends keyof IntegrationSettings>(key: K, value: IntegrationSettings[K]) => {
      setState((current) => ({
        ...current,
        integrations: {
          ...current.integrations,
          [key]: value,
        },
      }))
    },
    []
  )

  const setPrivacySetting = useCallback(
    <K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]) => {
      setState((current) => ({
        ...current,
        privacy: {
          ...current.privacy,
          [key]: value,
        },
      }))
    },
    []
  )

  const setPomodoroTask = useCallback((taskId: string | null) => {
    setState((current) => ({
      ...current,
      pomodoro: {
        ...current.pomodoro,
        selectedTaskId: taskId,
      },
    }))
  }, [])

  const setPomodoroMode = useCallback((mode: PomodoroMode) => {
    setState((current) => {
      const remainingSeconds = getPomodoroModeSeconds(current.pomodoro, mode)

      return {
        ...current,
        pomodoro: {
          ...current.pomodoro,
          mode,
          status: "idle",
          remainingSeconds,
          startedAt: null,
          endsAt: null,
          startedWithSeconds: remainingSeconds,
          lastCompletedMode: null,
        },
      }
    })
  }, [])

  const startPomodoro = useCallback((mode?: PomodoroMode) => {
    setState((current) => {
      const targetMode = mode ?? current.pomodoro.mode
      const seconds =
        targetMode !== current.pomodoro.mode
          ? getPomodoroModeSeconds(current.pomodoro, targetMode)
          : current.pomodoro.status === "paused" || current.pomodoro.status === "completed"
            ? current.pomodoro.remainingSeconds
            : current.pomodoro.status === "running"
              ? getPomodoroRemainingSeconds(current.pomodoro)
              : getPomodoroModeSeconds(current.pomodoro, targetMode)
      const endsAt = new Date(Date.now() + seconds * 1000).toISOString()

      return {
        ...current,
        tasks:
          targetMode === "focus" && current.pomodoro.selectedTaskId
            ? current.tasks.map((task) =>
                task.id === current.pomodoro.selectedTaskId
                  ? {
                      ...task,
                      boardColumn: task.completed ? "done" : "doing",
                      plannedDate: task.plannedDate ?? dateKey(new Date()),
                    }
                  : task
              )
            : current.tasks,
        pomodoro: {
          ...current.pomodoro,
          mode: targetMode,
          status: "running",
          remainingSeconds: seconds,
          startedAt: new Date().toISOString(),
          endsAt,
          startedWithSeconds: seconds,
          lastCompletedMode: null,
        },
      }
    })
  }, [])

  const pausePomodoro = useCallback(() => {
    setState((current) => {
      if (current.pomodoro.status !== "running") {
        return current
      }

      return {
        ...current,
        pomodoro: {
          ...current.pomodoro,
          status: "paused",
          remainingSeconds: getPomodoroRemainingSeconds(current.pomodoro),
          startedAt: null,
          endsAt: null,
        },
      }
    })
  }, [])

  const resumePomodoro = useCallback(() => {
    setState((current) => {
      if (current.pomodoro.status !== "paused") {
        return current
      }

      const endsAt = new Date(Date.now() + current.pomodoro.remainingSeconds * 1000).toISOString()

      return {
        ...current,
        pomodoro: {
          ...current.pomodoro,
          status: "running",
          startedAt: new Date().toISOString(),
          endsAt,
          startedWithSeconds: current.pomodoro.remainingSeconds,
        },
      }
    })
  }, [])

  const resetPomodoro = useCallback((mode?: PomodoroMode) => {
    setState((current) => {
      const targetMode = mode ?? current.pomodoro.mode
      const remainingSeconds = getPomodoroModeSeconds(current.pomodoro, targetMode)

      return {
        ...current,
        pomodoro: {
          ...current.pomodoro,
          mode: targetMode,
          status: "idle",
          remainingSeconds,
          startedAt: null,
          endsAt: null,
          startedWithSeconds: remainingSeconds,
          lastCompletedMode: null,
        },
      }
    })
  }, [])

  const endPomodoroSession = useCallback(() => {
    setState((current) => {
      const remainingSeconds = getPomodoroModeSeconds(current.pomodoro, "focus")

      return {
        ...current,
        pomodoro: {
          ...current.pomodoro,
          mode: "focus",
          status: "idle",
          selectedTaskId: null,
          remainingSeconds,
          startedAt: null,
          endsAt: null,
          startedWithSeconds: remainingSeconds,
          completedFocusSessions: 0,
          lastCompletedMode: null,
        },
      }
    })
  }, [])

  useEffect(() => {
    if (!hydrated || state.pomodoro.status !== "running") {
      return
    }

    const syncCompletion = () => {
      setState((current) => {
        if (current.pomodoro.status !== "running") {
          return current
        }

        const remainingSeconds = getPomodoroRemainingSeconds(current.pomodoro)
        if (remainingSeconds > 0) {
          return current
        }

        const completedMode = current.pomodoro.mode
        const completedFocusSessions =
          completedMode === "focus"
            ? current.pomodoro.completedFocusSessions + 1
            : current.pomodoro.completedFocusSessions
        const nextMode = getNextPomodoroMode(completedMode, completedFocusSessions)
        const nextSeconds = getPomodoroModeSeconds(current.pomodoro, nextMode)

        return {
          ...current,
          pomodoro: {
            ...current.pomodoro,
            mode: nextMode,
            status: "completed",
            remainingSeconds: nextSeconds,
            startedAt: null,
            endsAt: null,
            startedWithSeconds: nextSeconds,
            completedFocusSessions,
            lastCompletedMode: completedMode,
          },
        }
      })
    }

    syncCompletion()
    const interval = window.setInterval(syncCompletion, 1000)

    return () => window.clearInterval(interval)
  }, [hydrated, state.pomodoro.status, state.pomodoro.endsAt])

  const exportState = useCallback(() => JSON.stringify(state, null, 2), [state])
  const resetState = useCallback(async () => {
    const nextState = createSeedState(buildProfileSeed(currentUserRef.current))
    setState(nextState)
    pendingSyncRef.current = false
    lastSerializedStateRef.current = JSON.stringify(nextState)

    if (currentUserRef.current) {
      try {
        await deleteAssignedStateOnServer()
      } catch (error) {
        pendingSyncRef.current = true
        console.error(
          "Unable to reset Assigned state on the server:",
          error instanceof Error ? error.message : error
        )
      }
    }
  }, [])

  const contextValue = useMemo<AssignedContextValue>(
    () => ({
      ...state,
      hydrated,
      todayKey: dateKey(new Date()),
      addTask,
      updateTask,
      deleteTask,
      toggleTask,
      moveTaskToColumn,
      addList,
      addInboxItem,
      addInboxItems,
      updateInboxItem,
      approveInboxItem,
      approveAllInboxItems,
      discardInboxItem,
      addScheduleBlock,
      deleteScheduleBlock,
      scheduleTask,
      unscheduleTask,
      moveUnfinishedTasksToDate,
      moveUnfinishedTodayToTomorrow,
      startTomorrowPlan,
      addReviewWin,
      removeReviewWin,
      setReviewReflection,
      addNextWeekPriority,
      removeNextWeekPriority,
      completeWeeklyReview,
      updateProfile,
      updateNotificationSetting,
      updatePreferences,
      updateAISetting,
      setIntegrationConnected,
      setPrivacySetting,
      setPomodoroTask,
      setPomodoroMode,
      startPomodoro,
      pausePomodoro,
      resumePomodoro,
      resetPomodoro,
      endPomodoroSession,
      exportState,
      resetState,
    }),
    [
      addInboxItem,
      addInboxItems,
      updateInboxItem,
      addList,
      addNextWeekPriority,
      addReviewWin,
      addScheduleBlock,
      addTask,
      approveAllInboxItems,
      approveInboxItem,
      completeWeeklyReview,
      deleteScheduleBlock,
      deleteTask,
      discardInboxItem,
      exportState,
      hydrated,
      moveTaskToColumn,
      moveUnfinishedTasksToDate,
      moveUnfinishedTodayToTomorrow,
      removeNextWeekPriority,
      removeReviewWin,
      scheduleTask,
      setPomodoroTask,
      setPomodoroMode,
      setIntegrationConnected,
      startPomodoro,
      pausePomodoro,
      resumePomodoro,
      resetPomodoro,
      endPomodoroSession,
      setPrivacySetting,
      setReviewReflection,
      startTomorrowPlan,
      state,
      toggleTask,
      unscheduleTask,
      updateAISetting,
      updateNotificationSetting,
      updatePreferences,
      updateProfile,
      updateTask,
      resetState,
    ]
  )

  return (
    <AssignedContext.Provider value={contextValue}>
      {children}
    </AssignedContext.Provider>
  )
}

export function useAssignedState() {
  const value = useContext(AssignedContext)

  if (!value) {
    throw new Error("useAssignedState must be used within AssignedStateProvider")
  }

  return value
}

export function getTaskListStats(tasks: Task[], lists: TaskList[]) {
  return lists.map((list) => {
    const listTasks = tasks.filter((task) => task.listId === list.id)
    const completedCount = listTasks.filter((task) => task.completed).length

    return {
      ...list,
      tasks: listTasks,
      taskCount: listTasks.length,
      completedCount,
      completionRate: listTasks.length === 0 ? 0 : Math.round((completedCount / listTasks.length) * 100),
    }
  })
}

export function getTaskListName(lists: TaskList[], listId?: string | null) {
  if (!listId) {
    return "No list"
  }

  return lists.find((list) => list.id === listId)?.name ?? "No list"
}

export function getWeekRangeLabel(weekStartsOn: 0 | 1 = 0) {
  const start = startOfWeek(new Date(), { weekStartsOn })
  const end = endOfWeek(new Date(), { weekStartsOn })
  return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`
}

export function getScheduleBlockStyle(block: ScheduleBlock) {
  const startHour = parseInt(block.startTime.split(":")[0], 10)
  const startMinutes = parseInt(block.startTime.split(":")[1], 10)
  const endHour = parseInt(block.endTime.split(":")[0], 10)
  const endMinutes = parseInt(block.endTime.split(":")[1], 10)

  const startPosition = (startHour - 8) * 80 + (startMinutes / 60) * 80
  const duration = (((endHour - startHour) * 60 + (endMinutes - startMinutes)) / 60) * 80

  return {
    top: `${startPosition}px`,
    height: `${duration}px`,
  }
}

export function getDaysOverdue(value: string) {
  return Math.max(differenceInCalendarDays(new Date(), parseISO(value)), 0)
}
