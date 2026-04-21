import { ProjectDetailPageView } from "@/components/workspace/project-detail-page"
import { getProjectDetailData } from "@/lib/server/assigned-workspace"
import { createClient } from "@/lib/supabase/server"

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const data = await getProjectDetailData(user, projectId)

  return <ProjectDetailPageView data={data} />
}
