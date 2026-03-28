"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Inbox,
  CalendarDays,
  Calendar,
  LayoutGrid,
  FolderOpen,
  Camera,
  BarChart3,
  BookOpen,
  Settings,
  Plus,
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
  User
} from "lucide-react"

const sidebarItems = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/inbox", label: "Inbox", icon: Inbox, badge: 5 },
  { href: "/app/planner", label: "Daily Planner", icon: CalendarDays },
  { href: "/app/calendar", label: "Calendar", icon: Calendar },
  { href: "/app/kanban", label: "Kanban", icon: LayoutGrid },
  { href: "/app/lists", label: "Lists", icon: FolderOpen },
  { href: "/app/capture", label: "Capture", icon: Camera },
  { href: "/app/analytics", label: "Analytics", icon: BarChart3 },
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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [quoteIndex, setQuoteIndex] = useState(0)

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  })

  useEffect(() => {
    const interval = window.setInterval(() => {
      setQuoteIndex((current) => (current + 1) % motivationalQuotes.length)
    }, 7000)

    return () => window.clearInterval(interval)
  }, [])

  const topBarMessage = pathname === "/app" ? motivationalQuotes[quoteIndex] : today

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border">
        <div className="p-6">
          <Link href="/app" className="text-2xl font-semibold tracking-tight text-sidebar-foreground">
            Tasked.
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/app' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-foreground'
                    : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 bg-marigold text-marigold-foreground rounded-full text-xs font-medium">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 mt-auto">
          <Button
            onClick={() => setQuickAddOpen(true)}
            className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 rounded-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Quick Add
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
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
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-foreground'
                        : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 bg-marigold rounded-full text-xs font-medium text-foreground">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-foreground"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="min-w-0">
                <div className="text-sm text-muted-foreground truncate">{topBarMessage}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted">
                <Search className="w-5 h-5" />
              </button>
              <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-marigold rounded-full" />
              </button>
              <button className="flex items-center gap-2 p-2 text-foreground rounded-lg hover:bg-muted transition-colors">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border px-2 py-2 z-40">
          <div className="flex items-center justify-around">
            {[
              { href: "/app", icon: LayoutDashboard, label: "Home" },
              { href: "/app/inbox", icon: Inbox, label: "Inbox" },
              { href: "/app/planner", icon: CalendarDays, label: "Plan" },
              { href: "/app/capture", icon: Camera, label: "Capture" },
              { href: "/app/kanban", icon: LayoutGrid, label: "Board" },
            ].map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-xs">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>

      {/* Quick Add Modal */}
      {quickAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setQuickAddOpen(false)}
          />
          <div className="relative bg-card rounded-2xl border border-border shadow-lg w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Quick Add Task</h2>
            <input
              type="text"
              placeholder="What needs to be done?"
              autoFocus
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <div className="flex items-center gap-2 mt-4">
              <Button variant="outline" size="sm" className="text-muted-foreground">
                Today
              </Button>
              <Button variant="outline" size="sm" className="text-muted-foreground">
                Work
              </Button>
              <Button variant="outline" size="sm" className="text-muted-foreground">
                Priority
              </Button>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={() => setQuickAddOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Add Task
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
