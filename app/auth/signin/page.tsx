import { redirect } from "next/navigation"

import { SignInForm } from "@/components/auth/sign-in-form"
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
    redirect(profile?.onboarding_completed ? "/app" : "/onboarding")
  }

  return <SignInForm message={error} />
}
