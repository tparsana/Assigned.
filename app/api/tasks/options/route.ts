import { NextResponse } from "next/server"

import { getTaskFormOptions } from "@/lib/server/assigned-workspace"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  try {
    const data = await getTaskFormOptions(user)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load task form options." },
      { status: user ? 400 : 401 }
    )
  }
}
