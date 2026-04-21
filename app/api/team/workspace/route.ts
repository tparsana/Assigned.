import { NextResponse } from "next/server"

import { getTeamWorkspace } from "@/lib/server/assigned-team"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  try {
    const data = await getTeamWorkspace(user)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load the team workspace." },
      { status: user ? 400 : 401 }
    )
  }
}
