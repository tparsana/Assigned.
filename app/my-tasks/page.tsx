import { redirect } from "next/navigation"

import { ASSIGNED_MY_TASKS_PATH } from "@/lib/assigned-navigation"

export default function MyTasksAliasPage() {
  redirect(ASSIGNED_MY_TASKS_PATH)
}
