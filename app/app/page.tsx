"use client"

import { DashboardHome } from "@/components/dashboard-home"
import { MinimalWorkspace } from "@/components/minimal-workspace"
import { useTaskedState } from "@/lib/tasked-store"

export default function DashboardPage() {
  const { hydrated, preferences } = useTaskedState()

  if (hydrated && preferences.minimalMode) {
    return <MinimalWorkspace />
  }

  return <DashboardHome />
}
