import { redirect } from "next/navigation"

import { SignInForm } from "@/components/auth/sign-in-form"
import { createClient } from "@/lib/supabase/server"

export default async function SignInPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/app")
  }

  return <SignInForm />
}
