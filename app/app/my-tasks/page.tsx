import { MyTasksPageView } from "@/components/workspace/my-tasks-page"
import { getMyTasksData } from "@/lib/server/assigned-workspace"
import { createClient } from "@/lib/supabase/server"

export default async function MyTasksPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const data = await getMyTasksData(user)

  return <MyTasksPageView data={data} />
}
