import { TaskDetailPageView } from "@/components/workspace/task-detail-page"
import { getTaskDetailData } from "@/lib/server/assigned-workspace"
import { createClient } from "@/lib/supabase/server"

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>
}) {
  const { taskId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const data = await getTaskDetailData(user, taskId)

  return <TaskDetailPageView data={data} />
}
