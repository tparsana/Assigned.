import { NextResponse } from "next/server"

import { getAssignedAccessContext } from "@/lib/server/assigned-access"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const snapshot = await getAssignedAccessContext(user)
  return NextResponse.json(snapshot)
}
