"use client"

import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  BookOpen,
  Trophy,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Target,
  Plus,
} from "lucide-react"
import {
  formatTaskDateLabel,
  getCompletionRate,
  getOverdueTasks,
  getTaskListName,
  getTasksCompletedThisWeek,
  getWeekRangeLabel,
  useTaskedState,
} from "@/lib/tasked-store"

const reflectionPrompts = [
  "What was your biggest win this week?",
  "What challenged you the most?",
  "What would you do differently?",
  "What are you grateful for?",
]

export default function WeeklyReviewPage() {
  const {
    tasks,
    lists,
    review,
    preferences,
    addReviewWin,
    removeReviewWin,
    setReviewReflection,
    addNextWeekPriority,
    removeNextWeekPriority,
    completeWeeklyReview,
  } = useTaskedState()

  const [currentPrompt, setCurrentPrompt] = useState(0)
  const [newWin, setNewWin] = useState("")
  const [newPriority, setNewPriority] = useState("")

  const weekStartsOn = preferences.startOfWeek === "Monday" ? 1 : 0
  const completedTasks = useMemo(
    () => getTasksCompletedThisWeek(tasks, weekStartsOn),
    [tasks, weekStartsOn]
  )
  const overdueTasks = useMemo(() => getOverdueTasks(tasks), [tasks])
  const unfinishedTasks = useMemo(
    () => tasks.filter((task) => !task.completed && task.plannedDate),
    [tasks]
  )
  const reflection = review.reflections[reflectionPrompts[currentPrompt]] ?? ""
  const taskCompletionRate = getCompletionRate(tasks)

  return (
    <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
            <BookOpen className="w-7 h-7" />
            Weekly Review
          </h1>
          <p className="text-muted-foreground mt-1">
            Week of {getWeekRangeLabel(weekStartsOn)}
          </p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={completeWeeklyReview}>
          Complete Review
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-herb/10 rounded-xl border border-herb/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-herb/20 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-herb" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Wins This Week</h2>
                <p className="text-sm text-muted-foreground">Save the moments worth keeping</p>
              </div>
            </div>
            <div className="space-y-3">
              {review.wins.map((win, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-card rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-herb mt-0.5" />
                  <span className="flex-1 text-foreground">{win}</span>
                  <button onClick={() => removeReviewWin(index)} className="text-muted-foreground hover:text-destructive">
                    ×
                  </button>
                </div>
              ))}
              <div className="flex flex-col sm:flex-row gap-3">
                <Input value={newWin} onChange={(event) => setNewWin(event.target.value)} placeholder="Add a win" />
                <Button
                  variant="outline"
                  className="border-herb/30 text-herb hover:bg-herb/10"
                  onClick={() => {
                    addReviewWin(newWin)
                    setNewWin("")
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add a win
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Completed Tasks</h2>
                <p className="text-sm text-muted-foreground">{completedTasks.length} finished this week</p>
              </div>
            </div>
            <div className="space-y-2">
              {completedTasks.length === 0 ? (
                <div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  No completed tasks logged for this week yet.
                </div>
              ) : (
                completedTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-herb" />
                      <span className="text-foreground text-sm">{task.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{getTaskListName(lists, task.listId)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Unfinished</h2>
                  <p className="text-sm text-muted-foreground">{unfinishedTasks.length} active tasks</p>
                </div>
              </div>
              <div className="space-y-3">
                {unfinishedTasks.length === 0 ? (
                  <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                    You cleared the board.
                  </div>
                ) : (
                  unfinishedTasks.slice(0, 4).map((task) => (
                    <div key={task.id} className="p-3 bg-muted/50 rounded-lg">
                      <div className="font-medium text-foreground text-sm">{task.title}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">{getTaskListName(lists, task.listId)}</span>
                        <span className="text-xs text-marigold">
                          {task.plannedDate ? formatTaskDateLabel(task.plannedDate) : "Unplanned"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
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
                {overdueTasks.length === 0 ? (
                  <div className="p-3 bg-destructive/5 rounded-lg border border-destructive/10 text-sm text-muted-foreground">
                    Nothing is overdue right now.
                  </div>
                ) : (
                  overdueTasks.map((task) => (
                    <div key={task.id} className="p-3 bg-destructive/5 rounded-lg border border-destructive/10">
                      <div className="font-medium text-foreground text-sm">{task.title}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">{getTaskListName(lists, task.listId)}</span>
                        <span className="text-xs text-destructive">
                          {task.dueDate ? formatTaskDateLabel(task.dueDate) : "Overdue"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-celeste/30 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Reflection</h2>
                <p className="text-sm text-muted-foreground">Save what you learned this week</p>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                {reflectionPrompts.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPrompt(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentPrompt ? "bg-primary" : "bg-border"
                    }`}
                  />
                ))}
              </div>
              <p className="text-foreground font-medium mb-3">{reflectionPrompts[currentPrompt]}</p>
              <textarea
                value={reflection}
                onChange={(event) => setReviewReflection(reflectionPrompts[currentPrompt], event.target.value)}
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

        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="font-semibold text-foreground mb-4">Week at a Glance</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tasks completed</span>
                <span className="font-medium text-foreground">{completedTasks.length}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-herb rounded-full" style={{ width: `${taskCompletionRate}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completion rate</span>
                <span className="font-medium text-herb">{taskCompletionRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Open reflections</span>
                <span className="font-medium text-foreground">
                  {Object.values(review.reflections).filter(Boolean).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Review status</span>
                <span className="font-medium text-herb">
                  {review.completedAt ? "Completed" : "In progress"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 rounded-xl border border-primary/10 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Next Week Priorities</h2>
            </div>
            <div className="space-y-2 mb-4">
              {review.nextWeekPriorities.map((priority, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-card rounded-lg">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-sm text-foreground">{priority}</span>
                  <button onClick={() => removeNextWeekPriority(index)} className="text-muted-foreground hover:text-destructive">
                    ×
                  </button>
                </div>
              ))}
            </div>
            {review.nextWeekPriorities.length < 5 && (
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newPriority}
                  onChange={(event) => setNewPriority(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), addNextWeekPriority(newPriority), setNewPriority(""))}
                  placeholder="Add a priority..."
                  className="bg-card"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    addNextWeekPriority(newPriority)
                    setNewPriority("")
                  }}
                  className="bg-primary text-primary-foreground"
                >
                  Add
                </Button>
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-marigold" />
              <h2 className="font-semibold text-foreground">AI Suggestions</h2>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-foreground">
                  Your best weeks have fewer overdue tasks. Clean those up before loading new work.
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-foreground">
                  Carry only two or three priorities into next week to keep your plan realistic.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
