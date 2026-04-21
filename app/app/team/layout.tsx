import type { ReactNode } from "react"

import { TeamDataProvider } from "@/components/team/team-data-provider"

export default function TeamLayout({ children }: { children: ReactNode }) {
  return <TeamDataProvider>{children}</TeamDataProvider>
}
