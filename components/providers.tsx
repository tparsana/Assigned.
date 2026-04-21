"use client"

import { useEffect, type ReactNode } from "react"

import { AssignedAccessProvider, useAssignedAccess } from "@/components/assigned-access-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { AssignedStateProvider, useAssignedState } from "@/lib/assigned-store"

function AssignedProfileBridge() {
  const { profile, loading } = useAssignedAccess()
  const { hydrated, updateProfile } = useAssignedState()

  useEffect(() => {
    if (loading || !hydrated || !profile.userId) {
      return
    }

    updateProfile({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      timezone: profile.timezone,
      avatarUrl: profile.avatarUrl,
    })
  }, [
    hydrated,
    loading,
    profile.avatarUrl,
    profile.email,
    profile.firstName,
    profile.lastName,
    profile.timezone,
    profile.userId,
    updateProfile,
  ])

  return null
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AssignedAccessProvider>
        <AssignedStateProvider>
          <AssignedProfileBridge />
          {children}
        </AssignedStateProvider>
      </AssignedAccessProvider>
    </ThemeProvider>
  )
}
