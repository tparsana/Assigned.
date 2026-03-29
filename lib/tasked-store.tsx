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

import { createClient } from "@/lib/supabase/client"

export type TaskSource = "manual" | "image" | "voice" | "imported"
export type TaskPriority = "high" | "medium" | "low"
export type BoardColumn = "inbox" | "today" | "doing" | "waiting" | "done"
export type PlanningMethod = "top3" | "ivylee" | "hybrid" | "time-blocking" | "kanban"
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

export interface TaskedState {
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
}

type AddTaskInput = {
  title: string
  listId?: string
  priority?: TaskPriority
  dueDate?: string | null
  plannedDate?: string | null
  estimatedMinutes?: number | null
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

type TaskedContextValue = TaskedState & {
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
  exportState: () => string
  resetState: () => void
}

const LEGACY_STORAGE_KEY = "tasked.local-state.v1"
const STORAGE_KEY_PREFIX = "tasked.local-state.v2"
const TASKED_STATE_TABLE = "tasked_user_states"
const TaskedContext = createContext<TaskedContextValue | null>(null)

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

export function formatLongDateLabel(value: string) {
  return format(parseISO(value), "EEEE, MMM d")
}

export function formatTimeLabel(value: string) {
  const [hours, minutes] = value.split(":").map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return format(date, "h:mm a")
}

function getStorageKey(userId?: string | null) {
  if (!userId) {
    return LEGACY_STORAGE_KEY
  }

  return `${STORAGE_KEY_PREFIX}.${userId}`
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
    return JSON.parse(savedState) as TaskedState
  } catch {
    window.localStorage.removeItem(storageKey)
    return null
  }
}

function writeStoredState(storageKey: string, state: TaskedState) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(storageKey, JSON.stringify(state))
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

function normalizeState(
  value: Partial<TaskedState> | null | undefined,
  fallback: TaskedState
): TaskedState {
  if (!value) {
    return fallback
  }

  return {
    ...fallback,
    ...value,
    lists: Array.isArray(value.lists) ? value.lists : fallback.lists,
    tasks: Array.isArray(value.tasks) ? value.tasks : fallback.tasks,
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
  }
}

function syncProfileWithUser(state: TaskedState, user?: User | null) {
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

function createSeedState(profileSeed?: Partial<ProfileState>): TaskedState {
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
    boardColumn: plannedDate && plannedDate <= dateKey(new Date()) ? "today" : "waiting",
    source: item.source,
    tags: [],
    rawText: item.rawText,
    createdAt: dateKey(new Date()),
    completedAt: null,
  }
}

export function TaskedStateProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), [])
  const [state, setState] = useState<TaskedState>(() => createSeedState())
  const [hydrated, setHydrated] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [cloudEnabled, setCloudEnabled] = useState(false)
  const lastSerializedStateRef = useRef<string | null>(null)
  const currentUserRef = useRef<User | null>(null)

  const loadStateForUser = useCallback(
    async (user: User | null) => {
      currentUserRef.current = user
      setUserId(user?.id ?? null)

      const profileSeed = buildProfileSeed(user)
      const baseState = createSeedState(profileSeed)
      const localFallback = readStoredState(getStorageKey(user?.id))
      const fallbackState = syncProfileWithUser(normalizeState(localFallback, baseState), user)

      if (!user) {
        setCloudEnabled(false)
        setState(fallbackState)
        lastSerializedStateRef.current = JSON.stringify(fallbackState)
        setHydrated(true)
        return
      }

      const { data, error } = await supabase
        .from(TASKED_STATE_TABLE)
        .select("state")
        .eq("user_id", user.id)
        .maybeSingle()

      if (error) {
        console.error("Tasked cloud state unavailable:", error.message)
        setCloudEnabled(false)
        setState(fallbackState)
        lastSerializedStateRef.current = JSON.stringify(fallbackState)
        setHydrated(true)
        return
      }

      const nextState = syncProfileWithUser(
        normalizeState((data?.state as Partial<TaskedState> | undefined) ?? fallbackState, baseState),
        user
      )

      if (!data) {
        const { error: upsertError } = await supabase
          .from(TASKED_STATE_TABLE)
          .upsert(
            {
              user_id: user.id,
              state: nextState,
            },
            { onConflict: "user_id" }
          )

        if (upsertError) {
          console.error("Unable to create Tasked cloud state:", upsertError.message)
          setCloudEnabled(false)
        } else {
          setCloudEnabled(true)
        }
      } else {
        setCloudEnabled(true)
      }

      setState(nextState)
      lastSerializedStateRef.current = JSON.stringify(nextState)
      setHydrated(true)
    },
    [supabase]
  )

  useEffect(() => {
    let active = true

    void supabase.auth.getUser().then(({ data }) => {
      if (!active) {
        return
      }

      void loadStateForUser(data.user ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadStateForUser(session?.user ?? null)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [loadStateForUser, supabase])

  useEffect(() => {
    if (!hydrated) {
      return
    }

    writeStoredState(getStorageKey(userId), state)

    if (userId) {
      window.localStorage.removeItem(LEGACY_STORAGE_KEY)
    }
  }, [hydrated, state, userId])

  useEffect(() => {
    if (!hydrated || !userId || !cloudEnabled) {
      return
    }

    const serializedState = JSON.stringify(state)
    if (lastSerializedStateRef.current === serializedState) {
      return
    }

    const timeout = window.setTimeout(() => {
      void supabase
        .from(TASKED_STATE_TABLE)
        .upsert(
          {
            user_id: userId,
            state,
          },
          { onConflict: "user_id" }
        )
        .then(({ error }) => {
          if (error) {
            console.error("Unable to sync Tasked cloud state:", error.message)
            return
          }

          lastSerializedStateRef.current = serializedState
        })
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [cloudEnabled, hydrated, state, supabase, userId])

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
          priority: input.priority ?? "medium",
          dueDate: input.dueDate ?? null,
          plannedDate: input.plannedDate ?? null,
          estimatedMinutes: input.estimatedMinutes ?? null,
          boardColumn: input.boardColumn ?? (input.plannedDate === dateKey(new Date()) ? "today" : "waiting"),
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

    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => {
        if (task.id !== taskId) {
          return task
        }

        return {
          ...task,
          boardColumn: column,
          completed: column === "done" ? true : task.completed && column !== "done" ? false : task.completed,
          plannedDate:
            column === "today" && !task.plannedDate
              ? todayValue
              : task.plannedDate,
          completedAt:
            column === "done"
              ? todayValue
              : column !== "done"
                ? null
                : task.completedAt,
        }
      }),
    }))
  }, [])

  const addList = useCallback((name: string) => {
    const trimmed = name.trim()
    const listId = makeId("list")

    if (!trimmed) {
      return listId
    }

    setState((current) => ({
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
    }))

    return listId
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

  const moveUnfinishedTodayToTomorrow = useCallback(() => {
    const todayValue = dateKey(new Date())
    const tomorrowValue = dateKey(addDays(new Date(), 1))

    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        !task.completed && task.plannedDate === todayValue
          ? { ...task, plannedDate: tomorrowValue, boardColumn: "waiting" }
          : task
      ),
      scheduleBlocks: current.scheduleBlocks.filter((block) => block.date !== todayValue || !block.taskId),
    }))
  }, [])

  const startTomorrowPlan = useCallback(() => {
    const tomorrowValue = dateKey(addDays(new Date(), 1))

    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task, index) =>
        !task.completed && !task.plannedDate && index < 3
          ? { ...task, plannedDate: tomorrowValue, boardColumn: "waiting" }
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

  const exportState = useCallback(() => JSON.stringify(state, null, 2), [state])
  const resetState = useCallback(() => {
    const nextState = createSeedState(buildProfileSeed(currentUserRef.current))
    setState(nextState)
  }, [])

  const contextValue = useMemo<TaskedContextValue>(
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
      moveUnfinishedTodayToTomorrow,
      removeNextWeekPriority,
      removeReviewWin,
      scheduleTask,
      setIntegrationConnected,
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
    <TaskedContext.Provider value={contextValue}>
      {children}
    </TaskedContext.Provider>
  )
}

export function useTaskedState() {
  const value = useContext(TaskedContext)

  if (!value) {
    throw new Error("useTaskedState must be used within TaskedStateProvider")
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
