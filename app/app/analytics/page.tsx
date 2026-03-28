"use client"

import { Button } from "@/components/ui/button"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle2,
  Calendar,
  Clock,
  Camera,
  Sparkles,
  ChevronRight
} from "lucide-react"

const weeklyData = [
  { day: "Mon", completed: 8, total: 10 },
  { day: "Tue", completed: 6, total: 8 },
  { day: "Wed", completed: 9, total: 9 },
  { day: "Thu", completed: 7, total: 10 },
  { day: "Fri", completed: 5, total: 7 },
  { day: "Sat", completed: 3, total: 4 },
  { day: "Sun", completed: 2, total: 3 },
]

const categoryBreakdown = [
  { name: "Work", completed: 42, total: 48, color: "bg-primary" },
  { name: "Personal", completed: 12, total: 15, color: "bg-herb" },
  { name: "Class", completed: 8, total: 10, color: "bg-celeste" },
  { name: "Home", completed: 5, total: 8, color: "bg-marigold" },
]

const captureStats = [
  { source: "Manual", count: 45, percentage: 56 },
  { source: "Photo", count: 28, percentage: 35 },
  { source: "Import", count: 7, percentage: 9 },
]

export default function AnalyticsPage() {
  const totalCompleted = weeklyData.reduce((sum, d) => sum + d.completed, 0)
  const totalTasks = weeklyData.reduce((sum, d) => sum + d.total, 0)
  const completionRate = Math.round((totalCompleted / totalTasks) * 100)
  const maxCompleted = Math.max(...weeklyData.map(d => d.total))

  return (
    <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
            <BarChart3 className="w-7 h-7" />
            Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your productivity and progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-border">
            This Week
          </Button>
          <Button variant="outline" size="sm" className="border-border">
            This Month
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="text-3xl font-semibold text-foreground">{totalCompleted}</div>
          <div className="text-sm text-muted-foreground">Tasks completed</div>
          <div className="flex items-center gap-1 mt-2 text-herb text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>+12% vs last week</span>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-herb/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-herb" />
            </div>
          </div>
          <div className="text-3xl font-semibold text-foreground">{completionRate}%</div>
          <div className="text-sm text-muted-foreground">Completion rate</div>
          <div className="flex items-center gap-1 mt-2 text-herb text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>+5% vs last week</span>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-marigold/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-marigold" />
            </div>
          </div>
          <div className="text-3xl font-semibold text-herb">21</div>
          <div className="text-sm text-muted-foreground">Day streak</div>
          <div className="flex items-center gap-1 mt-2 text-muted-foreground text-sm">
            <span>Personal best!</span>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-celeste/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-foreground" />
            </div>
          </div>
          <div className="text-3xl font-semibold text-foreground">4.2h</div>
          <div className="text-sm text-muted-foreground">Avg focus time</div>
          <div className="flex items-center gap-1 mt-2 text-destructive text-sm">
            <TrendingDown className="w-4 h-4" />
            <span>-8% vs last week</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Weekly Progress Chart */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-6">Weekly Progress</h2>
          <div className="flex items-end justify-between gap-2 h-48">
            {weeklyData.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center gap-1" style={{ height: '160px' }}>
                  <div 
                    className="w-full max-w-12 bg-primary/20 rounded-t-lg relative"
                    style={{ height: `${(day.total / maxCompleted) * 100}%` }}
                  >
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-lg"
                      style={{ height: `${(day.completed / day.total) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{day.day}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-primary" />
              <span className="text-sm text-muted-foreground">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-primary/20" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
          </div>
        </div>

        {/* Top 3 Performance */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-4">Top 3 Performance</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Completion Rate</span>
                <span className="text-sm font-medium text-foreground">92%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-herb rounded-full" style={{ width: '92%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Days with all 3 done</span>
                <span className="text-sm font-medium text-foreground">5/7</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '71%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Avg time to complete</span>
                <span className="text-sm font-medium text-foreground">2.5h</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-celeste rounded-full" style={{ width: '60%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-4">By Category</h2>
          <div className="space-y-4">
            {categoryBreakdown.map((cat, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-foreground">{cat.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {cat.completed}/{cat.total}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${cat.color}`}
                    style={{ width: `${(cat.completed / cat.total) * 100}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Capture Stats */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Camera className="w-5 h-5 text-foreground" />
            <h2 className="font-semibold text-foreground">Capture Sources</h2>
          </div>
          <div className="space-y-3">
            {captureStats.map((stat, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{stat.source}</span>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${stat.percentage}%` }} 
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {stat.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">AI suggestion acceptance</span>
              <span className="text-herb font-medium">87%</span>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-primary/5 rounded-xl border border-primary/10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-marigold" />
            <h2 className="font-semibold text-foreground">AI Insights</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-card rounded-lg border border-border">
              <p className="text-sm text-foreground mb-2">
                You complete 40% more tasks before noon. Consider front-loading your Top 3.
              </p>
              <Button variant="link" size="sm" className="h-auto p-0 text-primary">
                Apply to schedule
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border">
              <p className="text-sm text-foreground mb-2">
                Wednesday is your most productive day. Your streak is at 21 days!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
