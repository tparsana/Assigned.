"use client"

import Link from "next/link"
import { useState } from "react"
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Camera,
  CheckCircle2,
  ClipboardList,
  LayoutGrid,
  Menu,
  Users,
  X,
} from "lucide-react"

import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import { appConfig } from "@/lib/app-config"

const foundationItems = [
  {
    title: "Capture work fast",
    description: "Start from notes, photos, or direct task entry so work does not disappear into texts, calls, or memory.",
    icon: Camera,
  },
  {
    title: "Sort into usable views",
    description: "Move between list, calendar, planner, and board views without rebuilding the same work twice.",
    icon: LayoutGrid,
  },
  {
    title: "Run the day clearly",
    description: "Keep the existing planning engine productive now while the richer collaborative features are added next.",
    icon: ClipboardList,
  },
  {
    title: "Keep it modular",
    description: "The UI and config surface are being cleaned so branding, workflows, and permissions stay easy to adapt as the product grows.",
    icon: Building2,
  },
]

const roadmapItems = [
  "Team assignments with owners and due accountability",
  "Access-aware workspaces for employees, team leads, and admins",
  "Job and site context layered onto tasks and handoffs",
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden border-b border-border bg-[radial-gradient(circle_at_top_left,rgba(171,204,255,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(238,191,102,0.16),transparent_26%),linear-gradient(180deg,#fafaff_0%,#f4f7fb_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(142,175,255,0.16),transparent_30%),radial-gradient(circle_at_top_right,rgba(236,191,102,0.11),transparent_24%),linear-gradient(180deg,#000000_0%,#050505_55%,#000000_100%)]">
        <nav className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-md dark:border-white/8 dark:bg-black/80">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <BrandMark className="text-2xl text-foreground" />

            <div className="hidden items-center gap-8 md:flex">
              <Link href="#foundation" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Foundation
              </Link>
              <Link href="#roadmap" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Roadmap
              </Link>
              <Link href="#access" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Access
              </Link>
            </div>

            <div className="hidden items-center gap-4 md:flex">
              <Link href="/auth/signin">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="rounded-full px-6">Open Workspace</Button>
              </Link>
            </div>

            <button
              type="button"
              className="text-foreground md:hidden"
              onClick={() => setMobileMenuOpen((current) => !current)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {mobileMenuOpen ? (
            <div className="space-y-4 border-t border-border bg-background/95 px-6 py-4 backdrop-blur-md md:hidden dark:border-white/8 dark:bg-black/95">
              <Link href="#foundation" className="block text-sm text-muted-foreground">
                Foundation
              </Link>
              <Link href="#roadmap" className="block text-sm text-muted-foreground">
                Roadmap
              </Link>
              <Link href="#access" className="block text-sm text-muted-foreground">
                Access
              </Link>
              <div className="flex flex-col gap-2 pt-2">
                <Link href="/auth/signin">
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="w-full">Open Workspace</Button>
                </Link>
              </div>
            </div>
          ) : null}
        </nav>

        <section className="relative px-6 pb-20 pt-32">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <div className="inline-flex items-center rounded-full border border-border bg-background/85 px-4 py-2 text-sm text-muted-foreground shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70">
                Collaborative task assignment, planning, and follow-through.
              </div>
              <h1 className="mt-8 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight text-foreground md:text-7xl">
                Assigned gives teams one clear place to assign work, track progress, and stay aligned.
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
                Assigned combines collaborative task management, personal execution views, team visibility, projects, and calendars in one workspace that stays clean, fast, and easy to extend.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link href="/auth/signup">
                  <Button size="lg" className="h-12 rounded-full px-8 text-base">
                    Open Assigned
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#foundation">
                  <Button size="lg" variant="outline" className="h-12 rounded-full border-foreground/15 bg-background/70 px-8 text-base dark:border-white/12 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]">
                    See the foundation
                  </Button>
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-sm text-muted-foreground">
                {[
                  "Collaborative task assignment built in",
                  "Project-linked work when you need it",
                  "Clean, modular UI ready to evolve",
                ].map((item) => (
                  <div key={item} className="rounded-full border border-border bg-background/80 px-4 py-2 dark:border-white/8 dark:bg-white/[0.03] dark:text-white/75">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 -translate-x-4 translate-y-4 rounded-[2rem] bg-primary/8 blur-3xl dark:bg-white/[0.04]" />
              <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_25px_80px_rgba(28,28,28,0.08)] dark:border-white/10 dark:bg-[#050505] dark:shadow-[0_35px_90px_rgba(0,0,0,0.6)]">
                <div className="border-b border-border bg-background/75 px-6 py-4 dark:border-white/8 dark:bg-white/[0.03]">
                  <div className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                    Assigned Workspace Snapshot
                  </div>
                </div>
                <div className="grid gap-4 p-6">
                  <div className="rounded-2xl border border-border bg-background p-5 dark:border-white/8 dark:bg-white/[0.02]">
                    <div className="mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <div className="text-sm font-medium text-foreground">Shared priorities</div>
                    </div>
                    <div className="space-y-3">
                      {[
                        "Confirm vendor delivery window for tomorrow",
                        "Review team handoffs before the afternoon check-in",
                        "Close pending approvals and unblock active work",
                      ].map((item, index) => (
                        <div key={item} className="flex items-start gap-3 rounded-xl bg-card px-3 py-3 dark:bg-white/[0.03]">
                          <div className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${index === 0 ? "border-herb bg-herb/10 dark:border-white/15 dark:bg-white/[0.08]" : "border-border dark:border-white/10"}`}>
                            {index === 0 ? <CheckCircle2 className="h-4 w-4 text-herb" /> : null}
                          </div>
                          <div className="text-sm text-foreground">{item}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-celeste/20 p-5 dark:border-white/8 dark:bg-white/[0.03]">
                      <div className="mb-3 flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-foreground" />
                        <div className="text-sm font-medium text-foreground">Today&apos;s cadence</div>
                      </div>
                      <div className="space-y-2 text-sm text-foreground/80">
                        <div>9:00 AM planning review</div>
                        <div>11:30 AM owner follow-ups</div>
                        <div>4:00 PM progress check</div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-marigold/10 p-5 dark:border-white/8 dark:bg-white/[0.02]">
                      <div className="mb-3 flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-foreground" />
                        <div className="text-sm font-medium text-foreground">What stays connected</div>
                      </div>
                      <div className="space-y-2 text-sm text-foreground/80">
                        <div>Tasks, teams, and projects</div>
                        <div>Permissions and access control</div>
                        <div>Calendar and workload visibility</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section id="foundation" className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Foundation First
            </div>
            <h2 className="mt-4 text-3xl font-semibold text-foreground md:text-5xl">
              The current job is to make Assigned easier to trust, extend, and re-skin.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              That means reducing old project coupling now, while keeping the working planner intact until the deeper collaboration features land.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {foundationItems.map((item) => (
              <div key={item.title} className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm">
                <item.icon className="h-8 w-8 text-primary" />
                <h3 className="mt-6 text-xl font-semibold text-foreground">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-card px-6 py-20 dark:bg-[#040404]">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <div className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Product Direction
            </div>
            <h2 className="mt-4 text-3xl font-semibold text-foreground md:text-5xl">
              Assigned is built to keep work clear without making the workflow heavy.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              The product keeps task assignment, personal execution, project context, and team visibility tightly connected while staying modular enough to reshape later without another rebuild.
            </p>
          </div>

          <div className="grid gap-4">
            {[
              "Supabase configuration is centralized so swapping projects and environments is straightforward.",
              "Google auth can be enabled through one flag once the provider is configured in Supabase.",
              "Branding is pulled into shared config so Assigned can keep evolving without another full sweep later.",
            ].map((item) => (
              <div key={item} className="flex items-start gap-4 rounded-2xl border border-border bg-background px-5 py-5 dark:border-white/8 dark:bg-white/[0.03]">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-herb" />
                <div className="text-sm leading-6 text-foreground">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="roadmap" className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Next Phase
            </div>
            <h2 className="mt-4 text-3xl font-semibold text-foreground md:text-5xl">
              The roadmap keeps Assigned practical before it gets complicated.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              These are the next logical layers as the core workspace continues to harden.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {roadmapItems.map((item, index) => (
              <div key={item} className="rounded-[1.75rem] border border-border bg-card p-6">
                <div className="text-sm font-medium text-muted-foreground">0{index + 1}</div>
                <div className="mt-4 text-xl font-semibold text-foreground">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="access" className="bg-card px-6 py-24 dark:bg-[#040404]">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold text-foreground md:text-5xl">
            Ready to run work through Assigned?
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Assigned is designed to keep tasks, teams, projects, and day-to-day execution in one cleaner workspace.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/auth/signup">
              <Button size="lg" className="h-14 rounded-full px-10 text-lg">
                Open Assigned
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button size="lg" variant="outline" className="h-14 rounded-full px-10 text-lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <BrandMark className="text-2xl text-foreground" />
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              {appConfig.productDescription}
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            &copy; 2026 {appConfig.productName}.
          </div>
        </div>
      </footer>
    </div>
  )
}
