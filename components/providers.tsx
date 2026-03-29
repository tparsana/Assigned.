"use client"

import type { ReactNode } from "react"

import { ThemeProvider } from "@/components/theme-provider"
import { TaskedStateProvider } from "@/lib/tasked-store"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TaskedStateProvider>{children}</TaskedStateProvider>
    </ThemeProvider>
  )
}
