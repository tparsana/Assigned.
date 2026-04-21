import Link from "next/link"
import { redirect } from "next/navigation"
import { Building2, Clock3, Users } from "lucide-react"

import { DashboardPageView } from "@/components/workspace/dashboard-page"
import { Button } from "@/components/ui/button"
import { canAccessAssignedDashboard, ASSIGNED_MY_TASKS_PATH } from "@/lib/assigned-navigation"
import { getAssignedAccessContext } from "@/lib/server/assigned-access"
import { getDashboardData } from "@/lib/server/assigned-workspace"
import { createClient } from "@/lib/supabase/server"

function AwaitingAssignmentState({ organizationName }: { organizationName: string }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8">
      <div className="rounded-[32px] border border-border/80 bg-card p-8 shadow-[0_1px_0_rgba(17,24,39,0.02)]">
        <div className="max-w-2xl">
          <div className="inline-flex rounded-full border border-border bg-background px-4 py-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Awaiting Assignment
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground">
            Your workspace is ready. Your company placement is not set yet.
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            You’ve completed signup for {organizationName}, but an admin still needs to assign your team,
            position, and project access before the collaborative workspace is fully active.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Team",
                description: "An admin will place you into the right group such as Site Operations, Finance, or Leadership.",
                icon: Users,
              },
              {
                title: "Position",
                description: "Your job title stays separate from permissions so the organization stays clean and flexible.",
                icon: Building2,
              },
              {
                title: "Projects",
                description: "Project visibility turns on once your assignments are connected.",
                icon: Clock3,
              },
            ].map((item) => (
              <div key={item.title} className="rounded-3xl border border-border bg-background p-5">
                <div className="w-fit rounded-2xl bg-primary/10 p-3 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="mt-4 font-medium text-foreground">{item.title}</div>
                <div className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/app/settings">Review my profile</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/app/team">Open Team Directory</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const access = await getAssignedAccessContext(user)

  if (!canAccessAssignedDashboard(access.accessLevel)) {
    redirect(ASSIGNED_MY_TASKS_PATH)
  }

  if (access.awaitingAssignment) {
    return <AwaitingAssignmentState organizationName={access.organization?.name ?? "Assigned"} />
  }

  const data = await getDashboardData(user)
  return <DashboardPageView data={data} />
}
