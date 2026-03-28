"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  Trophy,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  ChevronRight,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Target,
  Plus
} from "lucide-react"

const wins = [
  "Completed Q2 report ahead of deadline",
  "Successfully onboarded 2 new team members",
  "Closed the Acme Corp deal",
]

const completedTasks = [
  { title: "Finish Q2 report presentation", category: "Work" },
  { title: "Review team performance docs", category: "Work" },
  { title: "Schedule team meeting", category: "Work" },
  { title: "Update LinkedIn profile", category: "Personal" },
  { title: "Submit expense report", category: "Work" },
]

const unfinishedTasks = [
  { title: "Research competitor pricing", category: "Work", reason: "Deprioritized" },
  { title: "Book flights for conference", category: "Personal", reason: "Waiting on dates" },
]

const overdueTasks = [
  { title: "Send quarterly newsletter", category: "Work", daysOverdue: 3 },
]

const reflectionPrompts = [
  "What was your biggest win this week?",
  "What challenged you the most?",
  "What would you do differently?",
  "What are you grateful for?",
]

const aiSuggestions = [
  "Consider batching your email responses - you spent 4h on emails this week",
  "Your focus time dropped on Thursday and Friday. Plan for energy dips.",
  "You completed 92% of your Top 3 tasks. Keep up the momentum!",
]

export default function WeeklyReviewPage() {
  const [currentPrompt, setCurrentPrompt] = useState(0)
  const [reflection, setReflection] = useState("")
  const [priorities, setPriorities] = useState<string[]>([])
  const [newPriority, setNewPriority] = useState("")

  const addPriority = () => {
    if (newPriority.trim() && priorities.length < 5) {
      setPriorities([...priorities, newPriority.trim()])
      setNewPriority("")
    }
  }

  const removePriority = (index: number) => {
    setPriorities(priorities.filter((_, i) => i !== index))
  }

  return (
    <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
            <BookOpen className="w-7 h-7" />
            Weekly Review
          </h1>
          <p className="text-muted-foreground mt-1">
            Week of March 18 - 24, 2026
          </p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          Complete Review
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Wins Section */}
          <div className="bg-herb/10 rounded-xl border border-herb/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-herb/20 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-herb" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Wins This Week</h2>
                <p className="text-sm text-muted-foreground">Celebrate your achievements</p>
              </div>
            </div>
            <div className="space-y-3">
              {wins.map((win, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-card rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-herb mt-0.5" />
                  <span className="text-foreground">{win}</span>
                </div>
              ))}
              <button className="w-full p-3 border-2 border-dashed border-herb/30 rounded-lg text-herb hover:bg-herb/10 transition-colors flex items-center justify-center gap-2 text-sm">
                <Plus className="w-4 h-4" />
                Add a win
              </button>
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Completed Tasks</h2>
                  <p className="text-sm text-muted-foreground">{completedTasks.length} tasks done</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {completedTasks.map((task, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-herb" />
                    <span className="text-foreground text-sm">{task.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{task.category}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Unfinished & Overdue */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Unfinished</h2>
                  <p className="text-sm text-muted-foreground">{unfinishedTasks.length} tasks</p>
                </div>
              </div>
              <div className="space-y-3">
                {unfinishedTasks.map((task, i) => (
                  <div key={i} className="p-3 bg-muted/50 rounded-lg">
                    <div className="font-medium text-foreground text-sm">{task.title}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">{task.category}</span>
                      <span className="text-xs text-marigold">{task.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-destructive/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Overdue</h2>
                  <p className="text-sm text-muted-foreground">{overdueTasks.length} tasks need attention</p>
                </div>
              </div>
              <div className="space-y-3">
                {overdueTasks.map((task, i) => (
                  <div key={i} className="p-3 bg-destructive/5 rounded-lg border border-destructive/10">
                    <div className="font-medium text-foreground text-sm">{task.title}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">{task.category}</span>
                      <span className="text-xs text-destructive">{task.daysOverdue} days overdue</span>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full border-border">
                  Reschedule All
                </Button>
              </div>
            </div>
          </div>

          {/* Reflection */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-celeste/30 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Reflection</h2>
                <p className="text-sm text-muted-foreground">Take a moment to reflect</p>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                {reflectionPrompts.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPrompt(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === currentPrompt ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                ))}
              </div>
              <p className="text-foreground font-medium mb-3">{reflectionPrompts[currentPrompt]}</p>
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Write your thoughts..."
                className="w-full h-24 p-4 bg-muted/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="flex justify-between">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setCurrentPrompt(Math.max(0, currentPrompt - 1))}
                disabled={currentPrompt === 0}
              >
                Previous
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setCurrentPrompt(Math.min(reflectionPrompts.length - 1, currentPrompt + 1))}
                disabled={currentPrompt === reflectionPrompts.length - 1}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Week Stats */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="font-semibold text-foreground mb-4">Week at a Glance</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tasks completed</span>
                <span className="font-medium text-foreground">42/51</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-herb rounded-full" style={{ width: '82%' }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Top 3 completion</span>
                <span className="font-medium text-herb">92%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Focus hours logged</span>
                <span className="font-medium text-foreground">21.5h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Planning streak</span>
                <span className="font-medium text-herb">21 days</span>
              </div>
            </div>
          </div>

          {/* Next Week Priorities */}
          <div className="bg-primary/5 rounded-xl border border-primary/10 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Next Week Priorities</h2>
            </div>
            <div className="space-y-2 mb-4">
              {priorities.map((priority, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-card rounded-lg">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm text-foreground">{priority}</span>
                  <button 
                    onClick={() => removePriority(i)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            {priorities.length < 5 && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addPriority()}
                  placeholder="Add a priority..."
                  className="flex-1 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <Button size="sm" onClick={addPriority} className="bg-primary text-primary-foreground">
                  Add
                </Button>
              </div>
            )}
          </div>

          {/* AI Suggestions */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-marigold" />
              <h2 className="font-semibold text-foreground">AI Suggestions</h2>
            </div>
            <div className="space-y-3">
              {aiSuggestions.map((suggestion, i) => (
                <div key={i} className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-foreground">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
