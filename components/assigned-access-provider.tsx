"use client"

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

import {
  createEmptyAssignedAccessSnapshot,
  type AssignedAccessLevel,
  type AssignedAccessSnapshot,
  type AssignedAccountProfile,
  type AssignedPermission,
} from "@/lib/assigned-access"
import { createClient } from "@/lib/supabase/client"

type AssignedAccessContextValue = AssignedAccessSnapshot & {
  loading: boolean
  user: User | null
  can: (permission: AssignedPermission) => boolean
  refreshAccess: () => Promise<void>
  updateAccountProfile: (
    patch: Partial<Omit<AssignedAccountProfile, "userId" | "email" | "displayName">>
  ) => Promise<{ error?: string }>
  completeOnboarding: (input: {
    firstName: string
    lastName: string
    phone: string | null
    timezone: string
    avatarUrl?: string | null
  }) => Promise<{ error?: string }>
  submitAdminAccessCode: (secret: string) => Promise<{ error?: string }>
}

const AssignedAccessContext = createContext<AssignedAccessContextValue | null>(null)

function isAbortLikeError(error: unknown) {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String(error.message)
      : ""

  return message.includes("AbortError") || message.includes("Lock was stolen")
}

function normalizeSnapshot(payload: Partial<AssignedAccessSnapshot> | null | undefined): AssignedAccessSnapshot {
  const fallback = createEmptyAssignedAccessSnapshot()

  return {
    ...fallback,
    ...payload,
    profile: {
      ...fallback.profile,
      ...(payload?.profile ?? {}),
    },
    permissions: Array.isArray(payload?.permissions) ? payload.permissions : fallback.permissions,
    projects: Array.isArray(payload?.projects) ? payload.projects : fallback.projects,
  }
}

async function readJson<T>(response: Response) {
  return (await response.json().catch(() => ({}))) as T
}

export function AssignedAccessProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), [])
  const [snapshot, setSnapshot] = useState<AssignedAccessSnapshot>(createEmptyAssignedAccessSnapshot)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const currentUserRef = useRef<User | null>(null)
  const refreshPromiseRef = useRef<Promise<void> | null>(null)

  const refreshAccess = useCallback(async () => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current
    }

    const refreshPromise = (async () => {
      const currentUser = currentUserRef.current

      if (!currentUser) {
        setSnapshot(createEmptyAssignedAccessSnapshot())
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        const response = await fetch("/api/access/me", { cache: "no-store" })
        const payload = await readJson<AssignedAccessSnapshot & { error?: string }>(response)

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load access.")
        }

        setSnapshot(normalizeSnapshot(payload))
      } catch (error) {
        if (!isAbortLikeError(error)) {
          console.error("Unable to refresh Assigned access.", error)
        }
      } finally {
        setLoading(false)
      }
    })()

    refreshPromiseRef.current = refreshPromise

    try {
      await refreshPromise
    } finally {
      if (refreshPromiseRef.current === refreshPromise) {
        refreshPromiseRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    let active = true

    void supabase.auth.getUser().then(({ data }) => {
      if (!active) {
        return
      }

      currentUserRef.current = data.user ?? null
      setUser(data.user ?? null)

      if (!data.user) {
        setLoading(false)
        return
      }

      void refreshAccess()
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      currentUserRef.current = session?.user ?? null
      setUser(session?.user ?? null)

      if (!session?.user) {
        setSnapshot(createEmptyAssignedAccessSnapshot())
        setLoading(false)
        return
      }

      void refreshAccess()
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [refreshAccess, supabase])

  const updateAccountProfile = useCallback(
    async (patch: Partial<Omit<AssignedAccountProfile, "userId" | "email" | "displayName">>) => {
      const response = await fetch("/api/access/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patch),
      })

      const payload = await readJson<{ error?: string }>(response)

      if (!response.ok) {
        return { error: payload.error ?? "Unable to update your profile." }
      }

      await refreshAccess()
      return {}
    },
    [refreshAccess]
  )

  const completeOnboarding = useCallback(
    async (input: {
      firstName: string
      lastName: string
      phone: string | null
      timezone: string
      avatarUrl?: string | null
    }) => {
      const response = await fetch("/api/access/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      })

      const payload = await readJson<{ error?: string }>(response)

      if (!response.ok) {
        return { error: payload.error ?? "Unable to finish onboarding." }
      }

      await refreshAccess()
      return {}
    },
    [refreshAccess]
  )

  const submitAdminAccessCode = useCallback(
    async (secret: string) => {
      const response = await fetch("/api/access/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ secret }),
      })

      const payload = await readJson<{ error?: string }>(response)

      if (!response.ok) {
        return { error: payload.error ?? "Unable to claim admin access." }
      }

      await refreshAccess()
      return {}
    },
    [refreshAccess]
  )

  const contextValue = useMemo<AssignedAccessContextValue>(
    () => ({
      ...snapshot,
      loading,
      user,
      can: (permission) => snapshot.permissions.includes(permission),
      refreshAccess,
      updateAccountProfile,
      completeOnboarding,
      submitAdminAccessCode,
    }),
    [
      completeOnboarding,
      loading,
      refreshAccess,
      snapshot,
      submitAdminAccessCode,
      updateAccountProfile,
      user,
    ]
  )

  return (
    <AssignedAccessContext.Provider value={contextValue}>
      {children}
    </AssignedAccessContext.Provider>
  )
}

export function useAssignedAccess() {
  const value = useContext(AssignedAccessContext)

  if (!value) {
    throw new Error("useAssignedAccess must be used within AssignedAccessProvider")
  }

  return value
}
