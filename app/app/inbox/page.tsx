"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Inbox,
  Camera,
  Mic,
  FileText,
  CheckCircle2,
  X,
  Edit2,
  FolderOpen,
  Calendar,
  AlertCircle,
  Sparkles,
  Filter,
  ChevronDown,
  Trash2
} from "lucide-react"

type TaskSource = "manual" | "image" | "voice" | "imported"
type TaskStatus = "pending" | "approved" | "discarded"

interface InboxTask {
  id: number
  title: string
  source: TaskSource
  suggestedCategory: string
  suggestedDate: string | null
  confidence: number
  rawText?: string
  status: TaskStatus
  isNew: boolean
}

const initialTasks: InboxTask[] = [
  {
    id: 1,
    title: "Call supplier about order delay",
    source: "image",
    suggestedCategory: "Work",
    suggestedDate: "Today",
    confidence: 95,
    rawText: "Call supplier - order delay",
    status: "pending",
    isNew: true,
  },
  {
    id: 2,
    title: "Send invoice to Acme Corp",
    source: "image",
    suggestedCategory: "Work",
    suggestedDate: "Tomorrow",
    confidence: 88,
    rawText: "Invoice - Acme",
    status: "pending",
    isNew: true,
  },
  {
    id: 3,
    title: "Prepare Q2 budget report",
    source: "manual",
    suggestedCategory: "Work",
    suggestedDate: "This week",
    confidence: 100,
    status: "pending",
    isNew: false,
  },
  {
    id: 4,
    title: "Book flights for conference",
    source: "image",
    suggestedCategory: "Personal",
    suggestedDate: "Next week",
    confidence: 72,
    rawText: "Flights - conf",
    status: "pending",
    isNew: true,
  },
  {
    id: 5,
    title: "Review team performance docs",
    source: "imported",
    suggestedCategory: "Work",
    suggestedDate: null,
    confidence: 100,
    status: "pending",
    isNew: false,
  },
]

const sourceIcon = {
  manual: FileText,
  image: Camera,
  voice: Mic,
  imported: FolderOpen,
}

const sourceLabel = {
  manual: "Manual",
  image: "Photo",
  voice: "Voice",
  imported: "Import",
}

export default function InboxPage() {
  const [tasks, setTasks] = useState<InboxTask[]>(initialTasks)
  const [filter, setFilter] = useState<TaskSource | "all">("all")

  const filteredTasks = tasks.filter(task => {
    if (filter === "all") return task.status === "pending"
    return task.source === filter && task.status === "pending"
  })

  const approveTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: "approved" as TaskStatus } : t))
  }

  const discardTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: "discarded" as TaskStatus } : t))
  }

  const approveAll = () => {
    setTasks(prev => prev.map(t => t.status === "pending" ? { ...t, status: "approved" as TaskStatus } : t))
  }

  const pendingCount = tasks.filter(t => t.status === "pending").length
  const newFromCapture = tasks.filter(t => t.source === "image" && t.isNew && t.status === "pending").length

  return (
    <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
            <Inbox className="w-7 h-7" />
            Inbox
          </h1>
          <p className="text-muted-foreground mt-1">
            {pendingCount} tasks waiting to be organized
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="border-border text-foreground"
            onClick={approveAll}
            disabled={pendingCount === 0}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Approve All
          </Button>
        </div>
      </div>

      {/* New from Capture Banner */}
      {newFromCapture > 0 && (
        <div className="bg-marigold/10 border border-marigold/20 rounded-xl p-4 mb-6 flex items-center gap-4">
          <div className="w-10 h-10 bg-marigold/20 rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-marigold" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-foreground">
              {newFromCapture} new tasks from your latest capture
            </div>
            <div className="text-sm text-muted-foreground">
              Review AI-extracted tasks and approve or edit them
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          className={filter === "all" ? "bg-primary text-primary-foreground" : "border-border"}
        >
          All
        </Button>
        {(["manual", "image", "voice", "imported"] as TaskSource[]).map(source => {
          const Icon = sourceIcon[source]
          const count = tasks.filter(t => t.source === source && t.status === "pending").length
          return (
            <Button
              key={source}
              variant={filter === source ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(source)}
              className={filter === source ? "bg-primary text-primary-foreground" : "border-border"}
            >
              <Icon className="w-4 h-4 mr-2" />
              {sourceLabel[source]}
              {count > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-background/20 rounded text-xs">
                  {count}
                </span>
              )}
            </Button>
          )
        })}
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <div className="w-16 h-16 bg-herb/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-herb" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Inbox Zero!</h3>
          <p className="text-muted-foreground">
            All tasks have been processed. Great work!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map(task => {
            const SourceIcon = sourceIcon[task.source]
            return (
              <div
                key={task.id}
                className="bg-card rounded-xl border border-border p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* Source indicator */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    task.source === "image" ? "bg-marigold/10" : "bg-muted"
                  }`}>
                    <SourceIcon className={`w-5 h-5 ${
                      task.source === "image" ? "text-marigold" : "text-muted-foreground"
                    }`} />
                  </div>

                  {/* Task content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-medium text-foreground">
                          {task.title}
                        </h3>
                        {task.rawText && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Original: &ldquo;{task.rawText}&rdquo;
                          </p>
                        )}
                      </div>
                      {task.isNew && (
                        <span className="px-2 py-0.5 bg-marigold/20 text-marigold rounded text-xs font-medium">
                          New
                        </span>
                      )}
                    </div>

                    {/* Suggestions */}
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-celeste/30 rounded-lg">
                        <FolderOpen className="w-4 h-4 text-foreground/70" />
                        <span className="text-sm text-foreground">{task.suggestedCategory}</span>
                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                      </div>
                      {task.suggestedDate && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
                          <Calendar className="w-4 h-4 text-foreground/70" />
                          <span className="text-sm text-foreground">{task.suggestedDate}</span>
                          <ChevronDown className="w-3 h-3 text-muted-foreground" />
                        </div>
                      )}
                      {task.source === "image" && task.confidence < 80 && (
                        <div className="flex items-center gap-1.5 text-marigold text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{task.confidence}% confidence</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        size="sm"
                        onClick={() => approveTask(task.id)}
                        className="bg-herb text-herb-foreground hover:bg-herb/90"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border"
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => discardTask(task.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
