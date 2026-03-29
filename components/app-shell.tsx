"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import { AddTaskDialog } from "@/components/add-task-dialog"
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
import { useTaskedState } from "@/lib/tasked-store"
import {
  LayoutDashboard,
  CalendarDays,
  Calendar,
  LayoutGrid,
  FolderOpen,
  BookOpen,
  Settings,
  Plus,
  Bell,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
} from "lucide-react"

const sidebarItems = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/planner", label: "Daily Planner", icon: CalendarDays },
  { href: "/app/calendar", label: "Calendar", icon: Calendar },
  { href: "/app/kanban", label: "Kanban", icon: LayoutGrid },
  { href: "/app/lists", label: "Lists", icon: FolderOpen },
  { href: "/app/review", label: "Weekly Review", icon: BookOpen },
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
  const { profile, preferences, todayKey, hydrated } = useTaskedState()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const isMinimalMode = hydrated && preferences.minimalMode

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

    if (pathname !== "/app" && pathname !== "/app/settings" && pathname !== "/app/capture") {
      router.replace("/app")
    }
  }, [isMinimalMode, pathname, router])

  const topBarMessage = pathname === "/app" ? motivationalQuotes[quoteIndex] : today
  const initials = `${profile.firstName?.[0] ?? "U"}${profile.lastName?.[0] ?? ""}`.trim()
  const minimalHeading =
    pathname === "/app/settings"
      ? "Settings"
      : pathname === "/app/capture"
        ? "Capture"
        : "All tasks, less noise"

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

  return (
    <div className="min-h-screen bg-background flex">
      {!isMinimalMode && (
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border">
        <div className="p-6">
          <Link href="/app" className="text-2xl font-semibold tracking-tight text-sidebar-foreground">
            Tasked.
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href))
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
              <Link href="/app" className="text-2xl font-semibold tracking-tight text-sidebar-foreground">
                Tasked.
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="text-sidebar-foreground">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 px-4 space-y-1">
              {sidebarItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href))
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

      <div className="flex-1 flex flex-col min-h-screen">
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
                <Link href="/app" className="text-xl font-semibold tracking-tight text-foreground">
                  Tasked.
                </Link>
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
                  {pathname !== "/app" ? (
                    <Button variant="outline" className="border-border" asChild>
                      <Link href="/app">Back to Tasks</Link>
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
                  <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-marigold rounded-full" />
                  </button>
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

        <main className="flex-1">{children}</main>

        {!isMinimalMode && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border px-2 py-2 z-40">
          <div className="flex items-center justify-around">
            {[
              { href: "/app", icon: LayoutDashboard, label: "Home" },
              { href: "/app/planner", icon: CalendarDays, label: "Plan" },
              { href: "/app/lists", icon: FolderOpen, label: "Lists" },
              { href: "/app/kanban", icon: LayoutGrid, label: "Board" },
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
