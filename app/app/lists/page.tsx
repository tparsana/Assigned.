"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  FolderOpen,
  Plus,
  Briefcase,
  GraduationCap,
  User,
  Search,
  Home,
  Calendar,
  ChevronRight,
  MoreHorizontal,
  CheckCircle2,
  Circle
} from "lucide-react"

interface TaskList {
  id: string
  name: string
  icon: typeof Briefcase
  color: string
  taskCount: number
  completedCount: number
}

interface Task {
  id: number
  title: string
  completed: boolean
  dueDate?: string
  priority: "high" | "medium" | "low"
}

const lists: TaskList[] = [
  { id: "work", name: "Work", icon: Briefcase, color: "bg-primary/10 text-primary", taskCount: 12, completedCount: 8 },
  { id: "class", name: "Class", icon: GraduationCap, color: "bg-celeste/30 text-foreground", taskCount: 6, completedCount: 4 },
  { id: "personal", name: "Personal", icon: User, color: "bg-herb/10 text-herb", taskCount: 5, completedCount: 2 },
  { id: "job-search", name: "Job Search", icon: Search, color: "bg-marigold/10 text-marigold", taskCount: 8, completedCount: 3 },
  { id: "home", name: "Home & Errands", icon: Home, color: "bg-muted text-foreground", taskCount: 4, completedCount: 1 },
  { id: "this-week", name: "This Week", icon: Calendar, color: "bg-primary/10 text-primary", taskCount: 15, completedCount: 9 },
]

const workTasks: Task[] = [
  { id: 1, title: "Finish Q2 report presentation", completed: false, dueDate: "Today", priority: "high" },
  { id: 2, title: "Review team performance docs", completed: true, priority: "medium" },
  { id: 3, title: "Send client proposal", completed: false, dueDate: "Tomorrow", priority: "high" },
  { id: 4, title: "Update project timeline", completed: false, priority: "medium" },
  { id: 5, title: "Schedule team meeting", completed: true, priority: "low" },
  { id: 6, title: "Research competitor pricing", completed: false, priority: "low" },
]

export default function ListsPage() {
  const [selectedList, setSelectedList] = useState<string | null>(null)
  const [tasks, setTasks] = useState(workTasks)

  const selectedListData = lists.find(l => l.id === selectedList)

  const toggleTask = (taskId: number) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ))
  }

  return (
    <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
            <FolderOpen className="w-7 h-7" />
            Lists & Projects
          </h1>
          <p className="text-muted-foreground mt-1">
            Organize tasks by area of your life
          </p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          New List
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Lists Grid */}
        <div className={`${selectedList ? 'hidden lg:block' : ''} lg:col-span-${selectedList ? '1' : '3'}`}>
          <div className={`grid ${selectedList ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'} gap-4`}>
            {lists.map(list => {
              const Icon = list.icon
              const completionRate = Math.round((list.completedCount / list.taskCount) * 100)
              return (
                <button
                  key={list.id}
                  onClick={() => setSelectedList(list.id)}
                  className={`bg-card rounded-xl border border-border p-5 text-left hover:shadow-sm transition-all ${
                    selectedList === list.id ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${list.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <button 
                      className="p-1 text-muted-foreground hover:text-foreground rounded"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{list.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {list.completedCount}/{list.taskCount} tasks completed
                  </p>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-herb rounded-full transition-all"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* List Detail View */}
        {selectedList && (
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl border border-border">
              {/* Detail Header */}
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setSelectedList(null)}
                      className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" />
                    </button>
                    {selectedListData && (
                      <>
                        <div className={`w-12 h-12 rounded-xl ${selectedListData.color} flex items-center justify-center`}>
                          <selectedListData.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-foreground">{selectedListData.name}</h2>
                          <p className="text-sm text-muted-foreground">
                            {selectedListData.completedCount} of {selectedListData.taskCount} completed
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="border-border">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              </div>

              {/* Tasks */}
              <div className="p-4">
                <div className="space-y-2">
                  {tasks.map(task => (
                    <div
                      key={task.id}
                      className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
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
                      <div className="flex-1">
                        <div className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {task.title}
                        </div>
                        {task.dueDate && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Due: {task.dueDate}
                          </div>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        task.priority === 'high' 
                          ? 'bg-destructive/10 text-destructive' 
                          : task.priority === 'medium'
                            ? 'bg-marigold/10 text-marigold'
                            : 'bg-muted text-muted-foreground'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
