"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import { AddTaskDialog } from "@/components/add-task-dialog"
import { useAssignedAccess } from "@/components/assigned-access-provider"
import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import {
  ASSIGNED_DASHBOARD_PATH,
  ASSIGNED_MY_TASKS_PATH,
  canAccessAssignedDashboard,
  getAssignedHomePath,
} from "@/lib/assigned-navigation"
import {
  formatPomodoroClock,
  getPomodoroModeLabel,
  getPomodoroRemainingSeconds,
  useAssignedState,
} from "@/lib/assigned-store"
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  BriefcaseBusiness,
  Settings,
  Plus,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  Users,
  Clock,
} from "lucide-react"

const sidebarItems = [
  { href: ASSIGNED_DASHBOARD_PATH, label: "Dashboard", icon: LayoutDashboard, requiresDashboard: true },
  { href: ASSIGNED_MY_TASKS_PATH, label: "My Tasks", icon: CheckSquare },
  { href: "/app/projects", label: "Projects", icon: BriefcaseBusiness },
  { href: "/app/team", label: "Team", icon: Users },
  { href: "/app/calendar", label: "Calendar", icon: Calendar },
  { href: "/app/settings", label: "Settings", icon: Settings },
]

const motivationalQuotes = [
  "Start with what matters",
  "Small steps real progress",
  "Clarity creates calm action",
  "Keep moving gently",
  "Finish the next thing",
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { accessLevel } = useAssignedAccess()
  const { profile, preferences, todayKey, hydrated, pomodoro } = useAssignedState()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [timerNow, setTimerNow] = useState(() => Date.now())
  const isMinimalMode = hydrated && preferences.minimalMode
  const isFocusPage = pathname === "/app/focus"
  const homePath = getAssignedHomePath(accessLevel)
  const hasDashboardAccess = canAccessAssignedDashboard(accessLevel)
  const visibleSidebarItems = sidebarItems.filter((item) => !item.requiresDashboard || hasDashboardAccess)

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  })

  useEffect(() => {
    const interval = window.setInterval(() => {
      setQuoteIndex((current) => (current + 1) % motivationalQuotes.length)
    }, 7000)

    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!isMinimalMode) {
      return
    }

    if (pathname !== homePath && pathname !== "/app/settings" && pathname !== "/app/capture") {
      router.replace(homePath)
    }
  }, [homePath, isMinimalMode, pathname, router])

  useEffect(() => {
    if (pomodoro.status !== "running") {
      return
    }

    setTimerNow(Date.now())
    const interval = window.setInterval(() => setTimerNow(Date.now()), 1000)

    return () => window.clearInterval(interval)
  }, [pomodoro.status])

  const topBarMessage = pathname === ASSIGNED_DASHBOARD_PATH ? motivationalQuotes[quoteIndex] : today
  const initials = `${profile.firstName?.[0] ?? "U"}${profile.lastName?.[0] ?? ""}`.trim()
  const minimalHeading =
    pathname === "/app/settings"
      ? "Settings"
      : pathname === "/app/capture"
        ? "Capture"
        : "All tasks, less noise"
  const focusRemaining = getPomodoroRemainingSeconds(pomodoro, timerNow)
  const focusHref = { pathname: "/app/focus", query: { from: pathname } }
  const focusButtonLabel =
    pomodoro.status === "running"
      ? formatPomodoroClock(focusRemaining)
      : pomodoro.status === "paused"
        ? "Resume focus"
        : "Focus"
  const focusButtonMeta =
    pomodoro.status === "idle"
      ? "Pomodoro"
      : pomodoro.status === "completed"
        ? `${getPomodoroModeLabel(pomodoro.mode)} ready`
        : getPomodoroModeLabel(pomodoro.mode)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await supabase.auth.signOut()
    router.replace("/auth/signin")
    router.refresh()
    setIsSigningOut(false)
  }

  const avatar = profile.avatarUrl ? (
    <img
      src={profile.avatarUrl}
      alt={`${profile.firstName} ${profile.lastName}`}
      className="h-8 w-8 rounded-full object-cover"
    />
  ) : (
    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shrink-0">
      <span className="text-sm font-medium text-primary-foreground">{initials}</span>
    </div>
  )

  const renderProfileMenu = (className: string, compact = false) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={className}>
          {avatar}
          {!compact && (
            <div className="min-w-0 flex-1 text-left">
              <div className="truncate text-sm font-medium text-foreground">
                {profile.firstName} {profile.lastName}
              </div>
              <div className="truncate text-xs text-muted-foreground">{profile.email}</div>
            </div>
          )}
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{profile.firstName} {profile.lastName}</DropdownMenuLabel>
        <DropdownMenuLabel className="pt-0 text-xs font-normal text-muted-foreground">
          {profile.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/app/settings">
            <User className="w-4 h-4" />
            Account settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          disabled={isSigningOut}
          onSelect={(event) => {
            event.preventDefault()
            void handleSignOut()
          }}
        >
          <LogOut className="w-4 h-4" />
          {isSigningOut ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
      </DropdownMenu>
  )

  if (isFocusPage) {
    return <div className="min-h-screen bg-background">{children}</div>
  }

  return (
    <div className="min-h-screen bg-background flex">
      {!isMinimalMode && (
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border">
        <div className="p-6">
          <BrandMark href={homePath} className="text-2xl text-sidebar-foreground" />
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {visibleSidebarItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== ASSIGNED_DASHBOARD_PATH && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto border-t border-sidebar-border p-4">
          {renderProfileMenu(
            "flex w-full items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/50 px-3 py-3 text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
          )}
        </div>
      </aside>
      )}

      {!isMinimalMode && sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-72 bg-sidebar flex flex-col">
            <div className="p-6 flex items-center justify-between">
              <BrandMark href={homePath} className="text-2xl text-sidebar-foreground" />
              <button onClick={() => setSidebarOpen(false)} className="text-sidebar-foreground">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 px-4 space-y-1">
              {visibleSidebarItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== ASSIGNED_DASHBOARD_PATH && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-foreground"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </aside>
        </div>
      )}

      <div className="flex-1 flex min-w-0 flex-col min-h-screen">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
          <div
            className={`flex h-16 items-center justify-between ${
              isMinimalMode ? "mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8" : "px-4 lg:px-8"
            }`}
          >
            <div className="flex items-center gap-4">
              {!isMinimalMode && (
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-foreground">
                  <Menu className="w-6 h-6" />
                </button>
              )}
              {isMinimalMode && (
                <BrandMark href={homePath} className="text-xl text-foreground" />
              )}
              <div className="min-w-0">
                <div className="text-sm text-muted-foreground truncate">
                  {isMinimalMode ? minimalHeading : topBarMessage}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isMinimalMode ? (
                <>
                  {pathname !== homePath ? (
                    <Button variant="outline" className="border-border" asChild>
                      <Link href={homePath}>Back to Tasks</Link>
                    </Button>
                  ) : null}
                </>
              ) : (
                <>
                  <button
                    onClick={() => setQuickAddOpen(true)}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
                    aria-label="Add task"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  <Link
                    href={focusHref}
                    className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-foreground shadow-xs transition-colors hover:bg-muted"
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        pomodoro.status === "running"
                          ? "bg-primary shadow-[0_0_0_4px_rgba(28,28,28,0.08)]"
                          : pomodoro.status === "completed"
                            ? "bg-herb"
                            : "bg-foreground/20"
                      }`}
                    />
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col items-start leading-none">
                      <span className="text-sm font-medium">{focusButtonLabel}</span>
                      <span className="text-[11px] text-muted-foreground">{focusButtonMeta}</span>
                    </div>
                  </Link>
                </>
              )}
              {isMinimalMode ? (
                renderProfileMenu("flex items-center gap-2 rounded-lg p-2 text-foreground transition-colors hover:bg-muted", true)
              ) : (
                <div className="lg:hidden">
                  {renderProfileMenu("flex items-center gap-2 rounded-lg p-2 text-foreground transition-colors hover:bg-muted", true)}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 min-w-0">{children}</main>

        {!isMinimalMode && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border px-2 py-2 z-40">
          <div className="flex items-center justify-around">
            {[
              ...(hasDashboardAccess ? [{ href: ASSIGNED_DASHBOARD_PATH, icon: LayoutDashboard, label: "Dashboard" }] : []),
              { href: ASSIGNED_MY_TASKS_PATH, icon: CheckSquare, label: "My Tasks" },
              { href: "/app/projects", icon: BriefcaseBusiness, label: "Projects" },
              { href: "/app/calendar", icon: Calendar, label: "Calendar" },
            ].map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-xs">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
        )}
      </div>

      <AddTaskDialog
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        defaultPlannedDate={todayKey}
        title="Quick add task"
        description="Create a task and drop it into today so you can keep moving."
      />
    </div>
  )
}
