import { TeamDetailPage } from "@/components/team/team-detail-page"
import { getTeamDetail } from "@/lib/server/assigned-team"
import { createClient } from "@/lib/supabase/server"

export default async function TeamDetailRoutePage({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  const { teamId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const initialDetail = await getTeamDetail(user, teamId)

  return <TeamDetailPage teamId={teamId} initialDetail={initialDetail} />
}
