import { redirect } from "next/navigation"

export default function PlannerRedirectPage() {
  redirect("/app/my-tasks")
}
