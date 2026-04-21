import { redirect } from "next/navigation"

import { AppShell } from "@/components/app-shell"
import { getCurrentUserAccess } from "@/lib/supabase/access"
import { createClient } from "@/lib/supabase/server"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/signin")
  }

  const { profile } = await getCurrentUserAccess(supabase, user)

  if (!profile?.onboarding_completed) {
    redirect("/onboarding")
  }

  return <AppShell>{children}</AppShell>
}
