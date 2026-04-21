import { TeamDetailPage } from "@/components/team/team-detail-page"

export default async function TeamDetailRoutePage({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  const { teamId } = await params

  return <TeamDetailPage teamId={teamId} />
}
