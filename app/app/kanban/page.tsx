"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  LayoutGrid,
  Plus,
  Filter,
  MoreHorizontal,
  Calendar,
  Tag,
  AlertCircle,
  CheckCircle2,
  Clock,
  GripVertical
} from "lucide-react"

interface KanbanTask {
  id: number
  title: string
  category: string
  priority: "high" | "medium" | "low"
  dueDate?: string
  tags?: string[]
  isOverdue?: boolean
}

interface Column {
  id: string
  title: string
  tasks: KanbanTask[]
  color: string
}

const initialColumns: Column[] = [
  {
    id: "inbox",
    title: "Inbox",
    color: "bg-muted",
    tasks: [
      { id: 1, title: "Research competitor pricing", category: "Work", priority: "low", tags: ["research"] },
      { id: 2, title: "Update LinkedIn profile", category: "Personal", priority: "low" },
    ]
  },
  {
    id: "today",
    title: "Today",
    color: "bg-primary/10",
    tasks: [
      { id: 3, title: "Finish Q2 report", category: "Work", priority: "high", dueDate: "Today", tags: ["urgent"] },
      { id: 4, title: "Review team docs", category: "Work", priority: "medium", dueDate: "Today" },
      { id: 5, title: "Send client proposal", category: "Work", priority: "high", dueDate: "Today" },
    ]
  },
  {
    id: "doing",
    title: "Doing",
    color: "bg-marigold/10",
    tasks: [
      { id: 6, title: "Prepare presentation slides", category: "Work", priority: "high", tags: ["in-progress"] },
    ]
  },
  {
    id: "waiting",
    title: "Waiting",
    color: "bg-celeste/30",
    tasks: [
      { id: 7, title: "Client feedback on design", category: "Work", priority: "medium" },
      { id: 8, title: "Approval from finance", category: "Work", priority: "medium", isOverdue: true, dueDate: "Yesterday" },
    ]
  },
  {
    id: "done",
    title: "Done",
    color: "bg-herb/10",
    tasks: [
      { id: 9, title: "Schedule team meeting", category: "Work", priority: "medium" },
      { id: 10, title: "Submit expense report", category: "Work", priority: "low" },
    ]
  },
]

const priorityColors = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-marigold/10 text-marigold border-marigold/20",
  low: "bg-muted text-muted-foreground border-border",
}

export default function KanbanPage() {
  const [columns, setColumns] = useState(initialColumns)
  const [compactView, setCompactView] = useState(false)

  return (
    <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-6 h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
            <LayoutGrid className="w-7 h-7" />
            Kanban Board
          </h1>
          <p className="text-muted-foreground mt-1">
            Drag and drop to organize your workflow
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="border-border">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="border-border">
            <Tag className="w-4 h-4 mr-2" />
            Labels
          </Button>
          <div className="flex items-center bg-muted rounded-lg p-1">
            <button
              onClick={() => setCompactView(false)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                !compactView 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground"
              }`}
            >
              Expanded
            </button>
            <button
              onClick={() => setCompactView(true)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                compactView 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground"
              }`}
            >
              Compact
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(column => (
          <div
            key={column.id}
            className="flex-shrink-0 w-72 md:w-80"
          >
            {/* Column Header */}
            <div className={`${column.color} rounded-t-xl px-4 py-3 border border-b-0 border-border`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{column.title}</h3>
                  <span className="px-2 py-0.5 bg-background/50 rounded-full text-xs text-muted-foreground">
                    {column.tasks.length}
                  </span>
                </div>
                <button className="p-1 text-muted-foreground hover:text-foreground rounded">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Column Content */}
            <div className="bg-card border border-t-0 border-border rounded-b-xl p-3 min-h-[400px]">
              <div className="space-y-3">
                {column.tasks.map(task => (
                  <div
                    key={task.id}
                    className={`bg-background rounded-lg border border-border p-4 cursor-grab hover:shadow-md transition-all group ${
                      task.isOverdue ? 'border-destructive/30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex-1 min-w-0">
                        {/* Task Title */}
                        <div className="font-medium text-foreground text-sm mb-2">
                          {task.title}
                        </div>

                        {/* Task Meta */}
                        {!compactView && (
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className={`px-2 py-0.5 rounded text-xs border ${priorityColors[task.priority]}`}>
                              {task.priority}
                            </span>
                            <span className="px-2 py-0.5 bg-celeste/30 rounded text-xs text-foreground">
                              {task.category}
                            </span>
                          </div>
                        )}

                        {/* Tags */}
                        {!compactView && task.tags && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {task.tags.map(tag => (
                              <span 
                                key={tag}
                                className="px-2 py-0.5 bg-muted rounded-full text-xs text-muted-foreground"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Due Date */}
                        {task.dueDate && (
                          <div className={`flex items-center gap-1 text-xs ${
                            task.isOverdue ? 'text-destructive' : 'text-muted-foreground'
                          }`}>
                            {task.isOverdue ? (
                              <AlertCircle className="w-3 h-3" />
                            ) : (
                              <Calendar className="w-3 h-3" />
                            )}
                            {task.dueDate}
                          </div>
                        )}

                        {/* Done indicator */}
                        {column.id === "done" && (
                          <div className="flex items-center gap-1 text-xs text-herb mt-2">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Empty State */}
                {column.tasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <p>No tasks</p>
                    <p className="text-xs mt-1">Drag tasks here or add new</p>
                  </div>
                )}

                {/* Add Task Button */}
                <button className="w-full p-3 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors flex items-center justify-center gap-2 text-sm">
                  <Plus className="w-4 h-4" />
                  Add Task
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add Column */}
        <div className="flex-shrink-0 w-72 md:w-80">
          <button className="w-full h-32 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />
            Add Column
          </button>
        </div>
      </div>
    </div>
  )
}
