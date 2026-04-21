import { CalendarPageView } from "@/components/workspace/calendar-page"
import { getCalendarData } from "@/lib/server/assigned-workspace"
import { createClient } from "@/lib/supabase/server"

export default async function CalendarPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const data = await getCalendarData(user)

  return <CalendarPageView data={data} />
}
