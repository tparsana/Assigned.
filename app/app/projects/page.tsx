import { ProjectsPageView } from "@/components/workspace/projects-page"
import { getProjectsPageData } from "@/lib/server/assigned-workspace"
import { createClient } from "@/lib/supabase/server"

export default async function ProjectsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const data = await getProjectsPageData(user)

  return <ProjectsPageView data={data} />
}
