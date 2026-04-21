import { NextResponse } from "next/server"

import type { Json } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("assigned_user_states")
    .select("state")
    .eq("user_id", user.id)
    .maybeSingle<{ state: Json }>()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    state: data?.state ?? null,
  })
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 })
  }

  const payload = await request.json().catch(() => null) as { state?: Json } | null

  if (!payload || payload.state === undefined) {
    return NextResponse.json({ error: "Invalid state payload." }, { status: 400 })
  }

  const { error } = await supabase
    .from("assigned_user_states")
    .upsert(
      {
        user_id: user.id,
        state: payload.state,
      },
      { onConflict: "user_id" }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 })
  }

  const { error } = await supabase
    .from("assigned_user_states")
    .delete()
    .eq("user_id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
