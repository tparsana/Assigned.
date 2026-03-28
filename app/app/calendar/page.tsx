"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  GripVertical,
  Coffee,
  Brain,
  Users,
  AlertCircle
} from "lucide-react"

type ViewMode = "day" | "week"

interface TimeBlock {
  id: number
  title: string
  startTime: string
  endTime: string
  type: "focus" | "meeting" | "break" | "buffer" | "admin"
  color: string
}

interface UnscheduledTask {
  id: number
  title: string
  estimatedTime: string
  category: string
  priority: "high" | "medium" | "low"
  dueDate?: string
}

const timeBlocks: TimeBlock[] = [
  { id: 1, title: "Deep Work: Q2 Report", startTime: "09:00", endTime: "11:00", type: "focus", color: "bg-celeste/50 border-celeste" },
  { id: 2, title: "Team Standup", startTime: "11:00", endTime: "11:30", type: "meeting", color: "bg-marigold/20 border-marigold/50" },
  { id: 3, title: "Lunch Break", startTime: "12:00", endTime: "13:00", type: "break", color: "bg-muted border-border" },
  { id: 4, title: "Client Call", startTime: "14:00", endTime: "15:00", type: "meeting", color: "bg-marigold/20 border-marigold/50" },
  { id: 5, title: "Buffer", startTime: "15:00", endTime: "15:30", type: "buffer", color: "bg-muted border-border" },
  { id: 6, title: "Review & Emails", startTime: "15:30", endTime: "17:00", type: "admin", color: "bg-primary/10 border-primary/30" },
]

const unscheduledTasks: UnscheduledTask[] = [
  { id: 1, title: "Send client proposal", estimatedTime: "1h", category: "Work", priority: "high", dueDate: "Today" },
  { id: 2, title: "Review team docs", estimatedTime: "45m", category: "Work", priority: "medium" },
  { id: 3, title: "Update project timeline", estimatedTime: "30m", category: "Work", priority: "low" },
  { id: 4, title: "Research new tools", estimatedTime: "1h", category: "Work", priority: "low" },
]

const hours = Array.from({ length: 12 }, (_, i) => i + 8) // 8 AM to 7 PM

export default function CalendarPage() {
  const [view, setView] = useState<ViewMode>("day")
  const [currentDate, setCurrentDate] = useState(new Date())

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getBlockStyle = (block: TimeBlock) => {
    const startHour = parseInt(block.startTime.split(':')[0])
    const startMinutes = parseInt(block.startTime.split(':')[1])
    const endHour = parseInt(block.endTime.split(':')[0])
    const endMinutes = parseInt(block.endTime.split(':')[1])
    
    const startPosition = (startHour - 8) * 80 + (startMinutes / 60) * 80
    const duration = ((endHour - startHour) * 60 + (endMinutes - startMinutes)) / 60 * 80
    
    return {
      top: `${startPosition}px`,
      height: `${duration}px`,
    }
  }

  const getBlockIcon = (type: TimeBlock["type"]) => {
    switch (type) {
      case "focus": return Brain
      case "meeting": return Users
      case "break": return Coffee
      default: return Clock
    }
  }

  return (
    <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
            <Calendar className="w-7 h-7" />
            Time Blocking
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              className="border-border"
              onClick={() => setCurrentDate(d => new Date(d.setDate(d.getDate() - 1)))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="px-4 py-2 bg-card border border-border rounded-lg min-w-[200px] text-center">
              <span className="font-medium text-foreground">{formatDate(currentDate)}</span>
            </div>
            <Button 
              variant="outline" 
              size="icon"
              className="border-border"
              onClick={() => setCurrentDate(d => new Date(d.setDate(d.getDate() + 1)))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            <button
              onClick={() => setView("day")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === "day" 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setView("week")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === "week" 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Unscheduled Tasks Panel */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <div className="bg-card rounded-xl border border-border p-4 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Unscheduled</h2>
              <span className="text-sm text-muted-foreground">{unscheduledTasks.length}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Drag tasks to the calendar to schedule them
            </p>
            <div className="space-y-2">
              {unscheduledTasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 bg-background rounded-lg border border-border cursor-grab hover:shadow-sm transition-shadow"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground text-sm truncate">
                      {task.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {task.estimatedTime}
                      </span>
                      {task.dueDate && (
                        <span className="flex items-center gap-1 text-xs text-marigold">
                          <AlertCircle className="w-3 h-3" />
                          {task.dueDate}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4 text-muted-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Time Grid */}
            <div className="relative" style={{ height: `${hours.length * 80}px` }}>
              {/* Hour Lines */}
              {hours.map((hour, index) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 border-t border-border flex"
                  style={{ top: `${index * 80}px` }}
                >
                  <div className="w-16 md:w-20 px-2 py-2 text-xs text-muted-foreground bg-muted/30">
                    {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                  </div>
                  <div className="flex-1" />
                </div>
              ))}

              {/* Time Blocks */}
              <div className="absolute left-16 md:left-20 right-4 top-0">
                {timeBlocks.map(block => {
                  const Icon = getBlockIcon(block.type)
                  return (
                    <div
                      key={block.id}
                      className={`absolute left-0 right-0 ${block.color} border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow`}
                      style={getBlockStyle(block)}
                    >
                      <div className="flex items-start gap-2">
                        <Icon className="w-4 h-4 text-foreground/70 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground text-sm truncate">
                            {block.title}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {block.startTime} - {block.endTime}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Current Time Indicator */}
              <div 
                className="absolute left-16 md:left-20 right-0 flex items-center z-10"
                style={{ top: '160px' }} // Example position for 10 AM
              >
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <div className="flex-1 h-0.5 bg-destructive" />
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-celeste/50 border border-celeste" />
              <span className="text-muted-foreground">Focus Time</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-marigold/20 border border-marigold/50" />
              <span className="text-muted-foreground">Meeting</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted border border-border" />
              <span className="text-muted-foreground">Break / Buffer</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary/10 border border-primary/30" />
              <span className="text-muted-foreground">Admin</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
