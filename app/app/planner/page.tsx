"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Target,
  ListOrdered,
  Shuffle,
  CheckCircle2,
  Circle,
  GripVertical,
  Plus,
  ChevronRight,
  Clock,
  Star,
  Sparkles,
  ArrowRight,
  RefreshCw
} from "lucide-react"

type PlanningMode = "top3" | "ivylee" | "hybrid"

interface Task {
  id: number
  title: string
  completed: boolean
  category: string
  priority: "high" | "medium" | "low"
  estimatedTime?: string
}

const top3Tasks: Task[] = [
  { id: 1, title: "Finish Q2 report presentation", completed: false, category: "Work", priority: "high", estimatedTime: "2h" },
  { id: 2, title: "Review team performance docs", completed: true, category: "Work", priority: "high", estimatedTime: "45m" },
  { id: 3, title: "Send client proposal", completed: false, category: "Work", priority: "high", estimatedTime: "1h" },
]

const otherTasks: Task[] = [
  { id: 4, title: "Reply to emails", completed: false, category: "Work", priority: "medium", estimatedTime: "30m" },
  { id: 5, title: "Update project timeline", completed: false, category: "Work", priority: "medium", estimatedTime: "20m" },
  { id: 6, title: "Research new tools", completed: true, category: "Work", priority: "low", estimatedTime: "1h" },
]

const ivyLeeTasks: Task[] = [
  { id: 1, title: "Finish Q2 report presentation", completed: false, category: "Work", priority: "high", estimatedTime: "2h" },
  { id: 2, title: "Review team performance docs", completed: true, category: "Work", priority: "high", estimatedTime: "45m" },
  { id: 3, title: "Send client proposal", completed: false, category: "Work", priority: "high", estimatedTime: "1h" },
  { id: 4, title: "Reply to emails", completed: false, category: "Work", priority: "medium", estimatedTime: "30m" },
  { id: 5, title: "Update project timeline", completed: false, category: "Work", priority: "medium", estimatedTime: "20m" },
  { id: 6, title: "Research new tools", completed: false, category: "Work", priority: "low", estimatedTime: "1h" },
]

export default function PlannerPage() {
  const [mode, setMode] = useState<PlanningMode>("top3")
  const [tasks, setTasks] = useState({
    top3: top3Tasks,
    other: otherTasks,
    ivylee: ivyLeeTasks,
  })

  const toggleTask = (listKey: "top3" | "other" | "ivylee", taskId: number) => {
    setTasks(prev => ({
      ...prev,
      [listKey]: prev[listKey].map(t => 
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ),
    }))
  }

  const completedTop3 = tasks.top3.filter(t => t.completed).length
  const completedIvyLee = tasks.ivylee.filter(t => t.completed).length

  return (
    <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Daily Planner</h1>
          <p className="text-muted-foreground mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center bg-muted rounded-lg p-1">
          <button
            onClick={() => setMode("top3")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === "top3" 
                ? "bg-card text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Target className="w-4 h-4" />
            Top 3
          </button>
          <button
            onClick={() => setMode("ivylee")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === "ivylee" 
                ? "bg-card text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            Ivy Lee
          </button>
          <button
            onClick={() => setMode("hybrid")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === "hybrid" 
                ? "bg-card text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Shuffle className="w-4 h-4" />
            Hybrid
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Planning Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top 3 Mode */}
          {(mode === "top3" || mode === "hybrid") && (
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">Top 3 Priorities</h2>
                    <p className="text-sm text-muted-foreground">
                      {completedTop3}/3 completed
                    </p>
                  </div>
                </div>
                <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-herb rounded-full transition-all"
                    style={{ width: `${(completedTop3 / 3) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {tasks.top3.map((task, index) => (
                  <div
                    key={task.id}
                    className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                      task.completed 
                        ? "bg-herb/5 border border-herb/20" 
                        : index === tasks.top3.findIndex(t => !t.completed)
                          ? "bg-primary/5 border border-primary/20"
                          : "bg-background border border-border"
                    }`}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                      {index + 1}
                    </div>
                    <button
                      onClick={() => toggleTask("top3", task.id)}
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${
                        task.completed 
                          ? "border-herb bg-herb" 
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {task.completed && <CheckCircle2 className="w-5 h-5 text-herb-foreground" />}
                    </button>
                    <div className="flex-1">
                      <div className={`font-medium ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {task.title}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">{task.category}</span>
                        {task.estimatedTime && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {task.estimatedTime}
                          </span>
                        )}
                      </div>
                    </div>
                    {index === tasks.top3.findIndex(t => !t.completed) && !task.completed && (
                      <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium">
                        Current
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ivy Lee Mode */}
          {mode === "ivylee" && (
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <ListOrdered className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">Ivy Lee Method</h2>
                    <p className="text-sm text-muted-foreground">
                      {completedIvyLee}/6 tasks completed
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="border-border">
                  <GripVertical className="w-4 h-4 mr-2" />
                  Reorder
                </Button>
              </div>

              <div className="space-y-2">
                {tasks.ivylee.map((task, index) => {
                  const isCurrentTask = index === tasks.ivylee.findIndex(t => !t.completed)
                  return (
                    <div
                      key={task.id}
                      className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                        task.completed 
                          ? "bg-herb/5" 
                          : isCurrentTask
                            ? "bg-primary/5 border-2 border-primary/30"
                            : "bg-background hover:bg-muted/50"
                      }`}
                    >
                      <div className="cursor-grab text-muted-foreground hover:text-foreground">
                        <GripVertical className="w-5 h-5" />
                      </div>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
                        task.completed 
                          ? "bg-herb text-herb-foreground" 
                          : isCurrentTask
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                      }`}>
                        {task.completed ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                      </div>
                      <button
                        onClick={() => toggleTask("ivylee", task.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          task.completed 
                            ? "border-herb bg-herb" 
                            : "border-border hover:border-primary"
                        }`}
                      >
                        {task.completed && <CheckCircle2 className="w-4 h-4 text-herb-foreground" />}
                      </button>
                      <div className="flex-1">
                        <div className={`font-medium ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {task.title}
                        </div>
                      </div>
                      {task.estimatedTime && (
                        <span className="text-sm text-muted-foreground">{task.estimatedTime}</span>
                      )}
                      {isCurrentTask && !task.completed && (
                        <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Focus
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Other Tasks (Top 3 & Hybrid modes) */}
          {(mode === "top3" || mode === "hybrid") && (
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground">Other Tasks</h2>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Task
                </Button>
              </div>
              <div className="space-y-2">
                {tasks.other.map(task => (
                  <div
                    key={task.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-background hover:bg-muted/50 transition-colors"
                  >
                    <button
                      onClick={() => toggleTask("other", task.id)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        task.completed 
                          ? "border-herb bg-herb" 
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {task.completed && <CheckCircle2 className="w-3 h-3 text-herb-foreground" />}
                    </button>
                    <span className={`flex-1 ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {task.title}
                    </span>
                    <span className="text-xs text-muted-foreground">{task.category}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bonus Task */}
          <div className="bg-celeste/20 rounded-xl border border-celeste/30 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Star className="w-5 h-5 text-foreground" />
              <h2 className="font-semibold text-foreground">Life / Admin Task</h2>
            </div>
            <div className="flex items-center gap-4 p-3 bg-card rounded-lg">
              <Circle className="w-5 h-5 text-border" />
              <span className="text-foreground">Schedule dentist appointment</span>
              <span className="text-xs text-muted-foreground ml-auto">Personal</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Focus Mode Card */}
          <div className="bg-primary rounded-xl p-6 text-primary-foreground">
            <h3 className="font-semibold mb-2">Focus Mode</h3>
            <p className="text-primary-foreground/80 text-sm mb-4">
              Start a focused work session on your current task
            </p>
            <Button 
              variant="secondary"
              className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            >
              Start Focus Session
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* AI Suggestions */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-marigold" />
              <h3 className="font-semibold text-foreground">AI Suggestions</h3>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Your Q2 report is due tomorrow. Consider making it your #1 priority.</p>
              <p>You tend to be most productive before noon. Schedule deep work early.</p>
            </div>
          </div>

          {/* End of Day Reflection */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">End of Day</h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start border-border">
                <RefreshCw className="w-4 h-4 mr-2" />
                Move unfinished to tomorrow
              </Button>
              <Button variant="outline" className="w-full justify-start border-border">
                <ArrowRight className="w-4 h-4 mr-2" />
                Start tomorrow&apos;s plan
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
