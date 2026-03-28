"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  ListTodo,
  Calendar,
  Sparkles,
  Plus,
  ChevronRight,
  CheckCircle2,
  Clock,
  Camera,
} from "lucide-react"

type DashboardTask = {
  id: number
  title: string
  completed: boolean
  category: string
}

const initialTodayTasks: DashboardTask[] = [
  { id: 1, title: "Finish Q2 report presentation", completed: false, category: "Work" },
  { id: 2, title: "Review team performance docs", completed: true, category: "Work" },
  { id: 3, title: "Send client proposal", completed: false, category: "Work" },
  { id: 4, title: "Prep client call talking points", completed: false, category: "Meetings" },
  { id: 5, title: "Clear priority inbox items", completed: false, category: "Admin" },
]

const todaySchedule = [
  { time: "9:00 AM", title: "Deep work: Report", duration: "2h", type: "focus" },
  { time: "11:00 AM", title: "Team standup", duration: "30m", type: "meeting" },
  { time: "2:00 PM", title: "Client call", duration: "1h", type: "meeting" },
  { time: "3:30 PM", title: "Review & emails", duration: "1h", type: "admin" },
]

const aiInsight =
  "Your mornings are strongest. Try clearing your hardest task before noon."

export default function DashboardPage() {
  const [todayTasks, setTodayTasks] = useState(initialTodayTasks)
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [addTaskMode, setAddTaskMode] = useState<"options" | "manual">("options")
  const [manualTaskTitle, setManualTaskTitle] = useState("")

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  })

  const closeAddTask = () => {
    setAddTaskOpen(false)
    setAddTaskMode("options")
    setManualTaskTitle("")
  }

  const openAddTask = () => {
    setAddTaskOpen(true)
    setAddTaskMode("options")
    setManualTaskTitle("")
  }

  const toggleTask = (taskId: number) => {
    setTodayTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    )
  }

  const handleManualTaskAdd = () => {
    const title = manualTaskTitle.trim()

    if (!title) {
      return
    }

    setTodayTasks((current) => [
      ...current,
      {
        id: Date.now(),
        title,
        completed: false,
        category: "Today",
      },
    ])
    closeAddTask()
  }

  return (
    <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-6">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
          {greeting()}, Sarah
        </h1>
        <p className="text-muted-foreground mt-1">{todayLabel}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Tasks Section */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-foreground">Today&apos;s Tasks</h2>
              </div>
              <Link href="/app/planner" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                Open planner
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {todayTasks.map((task) => (
                <div 
                  key={task.id}
                  className={`flex items-start sm:items-center gap-4 p-4 rounded-lg transition-colors ${
                    task.completed ? 'bg-herb/5' : 'bg-background hover:bg-muted/50'
                  }`}
                >
                  <button 
                    onClick={() => toggleTask(task.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      task.completed 
                        ? 'border-herb bg-herb' 
                        : 'border-border hover:border-primary'
                    }`}
                  >
                    {task.completed && <CheckCircle2 className="w-4 h-4 text-herb-foreground" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {task.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{task.category}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-foreground">Today&apos;s Schedule</h2>
              </div>
              <Link href="/app/calendar" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                Full calendar
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {todaySchedule.map((item, index) => (
                <div 
                  key={index}
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-lg ${
                    item.type === 'focus' 
                      ? 'bg-celeste/20' 
                      : item.type === 'meeting' 
                        ? 'bg-marigold/10' 
                        : 'bg-muted'
                  }`}
                >
                  <div className="w-full sm:w-20 text-sm font-medium text-foreground/70 shrink-0">
                    {item.time}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground">{item.title}</div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground sm:justify-end">
                    <Clock className="w-4 h-4" />
                    {item.duration}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Add Task */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-3">
              <Plus className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Add Task</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Add a task manually or capture a photo to turn notes into action.
            </p>
            <Button onClick={openAddTask} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Add Task
            </Button>
          </div>

          {/* AI Insight */}
          <div className="bg-primary/5 rounded-xl border border-primary/10 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-marigold" />
              <h2 className="font-semibold text-foreground">AI Insight</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {aiInsight}
            </p>
          </div>

          {/* Continue Where You Left Off */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="font-semibold text-foreground mb-4">Continue</h2>
            <div className="space-y-3">
              <Link 
                href="/app/planner"
                className="block p-3 bg-background rounded-lg hover:bg-muted transition-colors"
              >
                <div className="text-sm font-medium text-foreground">Daily Planner</div>
                <div className="text-xs text-muted-foreground">Last edited 2h ago</div>
              </Link>
              <Link 
                href="/app/kanban"
                className="block p-3 bg-background rounded-lg hover:bg-muted transition-colors"
              >
                <div className="text-sm font-medium text-foreground">Work Board</div>
                <div className="text-xs text-muted-foreground">3 tasks in progress</div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={addTaskOpen} onOpenChange={(open) => {
        if (!open) {
          closeAddTask()
          return
        }

        setAddTaskOpen(true)
      }}>
        <DialogContent className="sm:max-w-md">
          {addTaskMode === "options" ? (
            <>
              <DialogHeader>
                <DialogTitle>Add a task</DialogTitle>
                <DialogDescription>
                  Choose how you want to bring something into today&apos;s list.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-3">
                <button
                  onClick={() => setAddTaskMode("manual")}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/40"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Manual add</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Type a task directly into today&apos;s list.
                    </p>
                  </div>
                </button>

                <Link
                  href="/app/capture"
                  onClick={closeAddTask}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/40"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Capture photo</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Snap a page and turn notes into tasks.
                    </p>
                  </div>
                </Link>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Manual add</DialogTitle>
                <DialogDescription>
                  Add a task directly to today&apos;s task list.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <Input
                  autoFocus
                  value={manualTaskTitle}
                  onChange={(event) => setManualTaskTitle(event.target.value)}
                  placeholder="What needs to be done today?"
                />

                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                  <Button variant="ghost" onClick={() => setAddTaskMode("options")}>
                    Back
                  </Button>
                  <div className="flex items-center justify-end gap-3">
                    <Button variant="ghost" onClick={closeAddTask}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleManualTaskAdd}
                      disabled={!manualTaskTitle.trim()}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Add Task
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
