"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import {
  createPositionDraft,
  createTeamDraft,
  createTeamUserDraft,
  type PositionDraft,
  type TeamDetailData,
  type TeamDraft,
  type TeamMemberProfileData,
  type TeamUserDraft,
  type TeamWorkspaceData,
  type TeamWorkspaceViewer,
} from "@/lib/team-data"

type TeamDirectoryContextValue = TeamWorkspaceData & {
  hydrated: boolean
  loading: boolean
  error: string | null
  refreshWorkspace: () => Promise<void>
  createUser: (draft: TeamUserDraft) => Promise<{ error?: string }>
  updateUser: (memberId: string, draft: TeamUserDraft) => Promise<{ error?: string }>
  deleteUser: (memberId: string) => Promise<{ error?: string }>
  createTeam: (draft: TeamDraft) => Promise<{ error?: string }>
  updateTeam: (teamId: string, draft: TeamDraft) => Promise<{ error?: string }>
  createPosition: (draft: PositionDraft) => Promise<{ error?: string }>
  loadTeamDetail: (teamId: string) => Promise<TeamDetailData | null>
  loadMemberProfile: (memberId: string) => Promise<TeamMemberProfileData | null>
  getDefaultUserDraft: (seed?: Partial<TeamUserDraft>) => TeamUserDraft
  getDefaultTeamDraft: (seed?: Partial<TeamDraft>) => TeamDraft
  getDefaultPositionDraft: (seed?: Partial<PositionDraft>) => PositionDraft
}

const TeamDirectoryContext = createContext<TeamDirectoryContextValue | null>(null)

const emptyViewer: TeamWorkspaceViewer = {
  accessLevel: null,
  canManageUsers: false,
  canManageTeams: false,
  canManagePositions: false,
  canViewWorkload: false,
  canAssignTasks: false,
  canViewInactiveUsers: false,
  canViewPermissions: false,
  canInviteUsers: false,
  awaitingAssignment: true,
  bootstrapAvailable: false,
}

async function readJson<T>(response: Response) {
  return (await response.json().catch(() => ({}))) as T
}

export function TeamDataProvider({
  children,
  initialData,
}: {
  children: ReactNode
  initialData?: TeamWorkspaceData
}) {
  const [workspace, setWorkspace] = useState<TeamWorkspaceData>(
    initialData ?? {
      viewer: emptyViewer,
      teams: [],
      positions: [],
      projects: [],
      members: [],
    }
  )
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)

  const refreshWorkspace = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/team/workspace", { cache: "no-store" })
      const payload = await readJson<TeamWorkspaceData & { error?: string }>(response)

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load the team workspace.")
      }

      setWorkspace(payload)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load the team workspace.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialData) {
      return
    }

    void refreshWorkspace()
  }, [initialData, refreshWorkspace])

  const sendMutation = useCallback(
    async (input: {
      url: string
      method: "POST" | "PATCH" | "DELETE"
      body?: unknown
    }) => {
      const response = await fetch(input.url, {
        method: input.method,
        headers: input.body === undefined ? undefined : {
          "Content-Type": "application/json",
        },
        body: input.body === undefined ? undefined : JSON.stringify(input.body),
      })

      const payload = await readJson<{ error?: string }>(response)

      if (!response.ok) {
        return { error: payload.error ?? "Unable to save changes." }
      }

      await refreshWorkspace()
      return {}
    },
    [refreshWorkspace]
  )

  const createUser = useCallback(
    async (draft: TeamUserDraft) =>
      sendMutation({
        url: "/api/team/members",
        method: "POST",
        body: draft,
      }),
    [sendMutation]
  )

  const updateUser = useCallback(
    async (memberId: string, draft: TeamUserDraft) =>
      sendMutation({
        url: `/api/team/members/${memberId}`,
        method: "PATCH",
        body: draft,
      }),
    [sendMutation]
  )

  const deleteUser = useCallback(
    async (memberId: string) =>
      sendMutation({
        url: `/api/team/members/${memberId}`,
        method: "DELETE",
      }),
    [sendMutation]
  )

  const createTeam = useCallback(
    async (draft: TeamDraft) =>
      sendMutation({
        url: "/api/team/teams",
        method: "POST",
        body: draft,
      }),
    [sendMutation]
  )

  const updateTeam = useCallback(
    async (teamId: string, draft: TeamDraft) =>
      sendMutation({
        url: `/api/team/teams/${teamId}`,
        method: "PATCH",
        body: draft,
      }),
    [sendMutation]
  )

  const createPosition = useCallback(
    async (draft: PositionDraft) =>
      sendMutation({
        url: "/api/team/positions",
        method: "POST",
        body: draft,
      }),
    [sendMutation]
  )

  const loadTeamDetail = useCallback(async (teamId: string) => {
    const response = await fetch(`/api/team/teams/${teamId}`, { cache: "no-store" })
    const payload = await readJson<TeamDetailData & { error?: string }>(response)

    if (!response.ok) {
      setError(payload.error ?? "Unable to load the team.")
      return null
    }

    return payload
  }, [])

  const loadMemberProfile = useCallback(async (memberId: string) => {
    const response = await fetch(`/api/team/members/${memberId}`, { cache: "no-store" })
    const payload = await readJson<TeamMemberProfileData & { error?: string }>(response)

    if (!response.ok) {
      setError(payload.error ?? "Unable to load the team member.")
      return null
    }

    return payload
  }, [])

  const value = useMemo<TeamDirectoryContextValue>(
    () => ({
      ...workspace,
      hydrated: !loading,
      loading,
      error,
      refreshWorkspace,
      createUser,
      updateUser,
      deleteUser,
      createTeam,
      updateTeam,
      createPosition,
      loadTeamDetail,
      loadMemberProfile,
      getDefaultUserDraft: createTeamUserDraft,
      getDefaultTeamDraft: createTeamDraft,
      getDefaultPositionDraft: createPositionDraft,
    }),
    [
      createPosition,
      createTeam,
      createUser,
      deleteUser,
      error,
      loadMemberProfile,
      loadTeamDetail,
      loading,
      refreshWorkspace,
      updateTeam,
      updateUser,
      workspace,
    ]
  )

  return (
    <TeamDirectoryContext.Provider value={value}>
      {children}
    </TeamDirectoryContext.Provider>
  )
}

export function useTeamDirectoryData() {
  const value = useContext(TeamDirectoryContext)

  if (!value) {
    throw new Error("useTeamDirectoryData must be used within TeamDataProvider")
  }

  return value
}
