"use client"

import { useMemo, useState } from "react"

import { addDays, format, startOfDay, subDays } from "date-fns"

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
  ChevronRight,
} from "lucide-react"
import { getCompletionRate, useTaskedState } from "@/lib/tasked-store"

type RangeMode = "week" | "month"

export default function AnalyticsPage() {
  const { tasks, lists } = useTaskedState()
  const [range, setRange] = useState<RangeMode>("week")

  const weeklyData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => subDays(startOfDay(new Date()), 6 - index))

    return days.map((day) => {
      const dayKey = format(day, "yyyy-MM-dd")
      const completed = tasks.filter((task) => task.completedAt === dayKey).length
      const total = tasks.filter((task) => task.plannedDate === dayKey || task.completedAt === dayKey).length

      return {
        day: format(day, "EEE"),
        completed,
        total,
      }
    })
  }, [tasks])

  const totalCompleted = weeklyData.reduce((sum, day) => sum + day.completed, 0)
  const totalTasks = Math.max(weeklyData.reduce((sum, day) => sum + day.total, 0), 1)
  const completionRate = Math.round((totalCompleted / totalTasks) * 100)
  const maxCompleted = Math.max(...weeklyData.map((day) => Math.max(day.total, 1)))

  const categoryBreakdown = useMemo(
    () =>
      lists.map((list) => {
        const categoryTasks = tasks.filter((task) => task.listId === list.id)
        const completed = categoryTasks.filter((task) => task.completed).length

        return {
          name: list.name,
          completed,
          total: categoryTasks.length,
          color: list.colorClassName.includes("primary")
            ? "bg-primary"
            : list.colorClassName.includes("herb")
              ? "bg-herb"
              : list.colorClassName.includes("marigold")
                ? "bg-marigold"
                : "bg-celeste",
        }
      }),
    [lists, tasks]
  )

  const captureStats = useMemo(() => {
    const sourceCounts = {
      manual: tasks.filter((task) => task.source === "manual").length,
      image: tasks.filter((task) => task.source === "image").length,
      imported: tasks.filter((task) => task.source === "imported").length,
      voice: tasks.filter((task) => task.source === "voice").length,
    }
    const total = Object.values(sourceCounts).reduce((sum, value) => sum + value, 0) || 1

    return [
      { source: "Manual", count: sourceCounts.manual, percentage: Math.round((sourceCounts.manual / total) * 100) },
      { source: "Photo", count: sourceCounts.image, percentage: Math.round((sourceCounts.image / total) * 100) },
      { source: "Import", count: sourceCounts.imported, percentage: Math.round((sourceCounts.imported / total) * 100) },
      { source: "Voice", count: sourceCounts.voice, percentage: Math.round((sourceCounts.voice / total) * 100) },
    ]
  }, [tasks])

  const doneTasks = tasks.filter((task) => task.completed)
  const top3Tasks = tasks.filter((task) => task.plannedDate === format(new Date(), "yyyy-MM-dd")).slice(0, 3)
  const top3CompletionRate = getCompletionRate(top3Tasks)
  const focusTaskCount = tasks.filter((task) => task.estimatedMinutes && task.estimatedMinutes >= 60).length
  const averageFocusTime = focusTaskCount === 0
    ? 0
    : Math.round(
        tasks
          .filter((task) => task.estimatedMinutes && task.estimatedMinutes >= 60)
          .reduce((sum, task) => sum + (task.estimatedMinutes ?? 0), 0) /
          focusTaskCount
      )

  return (
    <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
            <BarChart3 className="w-7 h-7" />
            Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Track how your real task flow is moving
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={`border-border ${range === "week" ? "bg-muted" : ""}`}
            onClick={() => setRange("week")}
          >
            This Week
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`border-border ${range === "month" ? "bg-muted" : ""}`}
            onClick={() => setRange("month")}
          >
            This Month
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5 text-primary" />
          </div>
          <div className="text-3xl font-semibold text-foreground">{doneTasks.length}</div>
          <div className="text-sm text-muted-foreground">Tasks completed</div>
          <div className="flex items-center gap-1 mt-2 text-herb text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>{totalCompleted} completed this week</span>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="w-10 h-10 rounded-lg bg-herb/10 flex items-center justify-center mb-3">
            <Target className="w-5 h-5 text-herb" />
          </div>
          <div className="text-3xl font-semibold text-foreground">{completionRate}%</div>
          <div className="text-sm text-muted-foreground">Weekly completion rate</div>
          <div className="flex items-center gap-1 mt-2 text-herb text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>{top3CompletionRate}% of today’s top tasks done</span>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="w-10 h-10 rounded-lg bg-marigold/10 flex items-center justify-center mb-3">
            <Calendar className="w-5 h-5 text-marigold" />
          </div>
          <div className="text-3xl font-semibold text-herb">{range === "week" ? totalCompleted : doneTasks.length}</div>
          <div className="text-sm text-muted-foreground">{range === "week" ? "Week output" : "All-time output"}</div>
          <div className="flex items-center gap-1 mt-2 text-muted-foreground text-sm">
            <span>{tasks.filter((task) => !task.completed).length} tasks still active</span>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="w-10 h-10 rounded-lg bg-celeste/30 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-foreground" />
          </div>
          <div className="text-3xl font-semibold text-foreground">{averageFocusTime}m</div>
          <div className="text-sm text-muted-foreground">Avg focus block size</div>
          <div className="flex items-center gap-1 mt-2 text-destructive text-sm">
            <TrendingDown className="w-4 h-4" />
            <span>{focusTaskCount} tasks estimated 1h+</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-6">Weekly Progress</h2>
          <div className="flex items-end justify-between gap-2 h-48">
            {weeklyData.map((day) => (
              <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center gap-1" style={{ height: "160px" }}>
                  <div
                    className="w-full max-w-12 bg-primary/20 rounded-t-lg relative"
                    style={{ height: `${(Math.max(day.total, 1) / maxCompleted) * 100}%` }}
                  >
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-lg"
                      style={{ height: `${day.total === 0 ? 0 : (day.completed / day.total) * 100}%` }}
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
              <span className="text-sm text-muted-foreground">Planned</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-4">Today’s Priorities</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Completion Rate</span>
                <span className="text-sm font-medium text-foreground">{top3CompletionRate}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-herb rounded-full" style={{ width: `${top3CompletionRate}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Tasks planned today</span>
                <span className="text-sm font-medium text-foreground">{top3Tasks.length}</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((top3Tasks.length / 5) * 100, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-4">By Category</h2>
          <div className="space-y-4">
            {categoryBreakdown.map((category) => (
              <div key={category.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-foreground">{category.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {category.completed}/{category.total}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${category.color}`}
                    style={{
                      width: `${category.total === 0 ? 0 : (category.completed / category.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Camera className="w-5 h-5 text-foreground" />
            <h2 className="font-semibold text-foreground">Capture Sources</h2>
          </div>
          <div className="space-y-3">
            {captureStats.map((stat) => (
              <div key={stat.source} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{stat.source}</span>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${stat.percentage}%` }} />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {stat.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-primary/5 rounded-xl border border-primary/10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-marigold" />
            <h2 className="font-semibold text-foreground">AI Insights</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-card rounded-lg border border-border">
              <p className="text-sm text-foreground mb-2">
                Tasks with estimates over an hour are where most of your completion energy is going.
              </p>
              <Button variant="link" size="sm" className="h-auto p-0 text-primary">
                Review in planner
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border">
              <p className="text-sm text-foreground mb-2">
                Photo capture is contributing {captureStats[1]?.percentage ?? 0}% of your incoming tasks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
