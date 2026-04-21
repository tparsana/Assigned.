import { redirect } from "next/navigation"

import { ASSIGNED_DASHBOARD_PATH } from "@/lib/assigned-navigation"
import { canAccessAssignedDashboard } from "@/lib/assigned-navigation"
import { getAssignedAccessContext } from "@/lib/server/assigned-access"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardAliasPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const access = await getAssignedAccessContext(user)

  redirect(
    canAccessAssignedDashboard(access.accessLevel)
      ? ASSIGNED_DASHBOARD_PATH
      : "/my-tasks"
  )
}
