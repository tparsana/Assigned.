import { TeamMemberProfilePage } from "@/components/team/team-member-profile-page"
import { getTeamMemberProfile } from "@/lib/server/assigned-team"
import { createClient } from "@/lib/supabase/server"

export default async function TeamMemberRoutePage({
  params,
}: {
  params: Promise<{ memberId: string }>
}) {
  const { memberId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const initialDetail = await getTeamMemberProfile(user, memberId)

  return <TeamMemberProfilePage memberId={memberId} initialDetail={initialDetail} />
}
