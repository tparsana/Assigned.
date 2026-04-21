import { NextResponse } from "next/server"

import { deleteOwnAssignedAccount } from "@/lib/server/assigned-access"
import { createClient } from "@/lib/supabase/server"

export async function DELETE() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  try {
    await deleteOwnAssignedAccount(user)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete your account." },
      { status: user ? 400 : 401 }
    )
  }
}
