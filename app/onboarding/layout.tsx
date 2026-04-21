import { redirect } from "next/navigation"

import { getAssignedHomePath } from "@/lib/assigned-navigation"
import { getAssignedAccessContext } from "@/lib/server/assigned-access"
import { getCurrentUserAccess } from "@/lib/supabase/access"
import { createClient } from "@/lib/supabase/server"

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/signin")
  }

  const { profile } = await getCurrentUserAccess(supabase, user)
  if (profile?.onboarding_completed) {
    const access = await getAssignedAccessContext(user)
    redirect(getAssignedHomePath(access.accessLevel))
  }

  return children
}
