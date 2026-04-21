import type { ReactNode } from "react"

import { TeamDataProvider } from "@/components/team/team-data-provider"
import { getTeamWorkspace } from "@/lib/server/assigned-team"
import { createClient } from "@/lib/supabase/server"

export default async function TeamLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const initialData = await getTeamWorkspace(user)

  return <TeamDataProvider initialData={initialData}>{children}</TeamDataProvider>
}
