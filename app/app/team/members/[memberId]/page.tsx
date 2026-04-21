import { TeamMemberProfilePage } from "@/components/team/team-member-profile-page"

export default async function TeamMemberRoutePage({
  params,
}: {
  params: Promise<{ memberId: string }>
}) {
  const { memberId } = await params

  return <TeamMemberProfilePage memberId={memberId} />
}
