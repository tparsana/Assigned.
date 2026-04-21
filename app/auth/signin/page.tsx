import { redirect } from "next/navigation"

import { SignInForm } from "@/components/auth/sign-in-form"
import { getAssignedHomePath } from "@/lib/assigned-navigation"
import { getAssignedAccessContext } from "@/lib/server/assigned-access"
import { getCurrentUserAccess } from "@/lib/supabase/access"
import { createClient } from "@/lib/supabase/server"

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { error } = await searchParams

  if (user) {
    const { profile } = await getCurrentUserAccess(supabase, user)
    if (!profile?.onboarding_completed) {
      redirect("/onboarding")
    }

    const access = await getAssignedAccessContext(user)
    redirect(getAssignedHomePath(access.accessLevel))
  }

  return <SignInForm message={error} />
}
