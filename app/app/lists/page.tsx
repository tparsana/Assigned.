"use client"

import { useMemo, useState } from "react"

import { AddTaskDialog } from "@/components/add-task-dialog"
import { TaskEditorDialog } from "@/components/task-editor-dialog"
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
  Pencil,
  Trash2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  formatTaskDueChipLabel,
  getTaskListStats,
  getTaskPriorityBadgeClass,
  getTaskPriorityBadgeStyle,
  useTaskedState,
  type ListIcon,
  type Task,
} from "@/lib/tasked-store"

const listIconMap: Record<ListIcon, typeof Briefcase> = {
  briefcase: Briefcase,
  "graduation-cap": GraduationCap,
  user: User,
  search: Search,
  home: Home,
  calendar: Calendar,
  folder: FolderOpen,
}

export default function ListsPage() {
  const { lists, tasks, toggleTask, addList, deleteTask } = useTaskedState()
  const [selectedList, setSelectedList] = useState<string | null>(null)
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [newListOpen, setNewListOpen] = useState(false)
  const [newListName, setNewListName] = useState("")
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const listStats = useMemo(() => getTaskListStats(tasks, lists), [lists, tasks])
  const selectedListData = listStats.find((list) => list.id === selectedList) ?? null

  const createList = () => {
    const trimmed = newListName.trim()
    if (!trimmed) {
      return
    }

    const createdId = addList(trimmed)
    setSelectedList(createdId)
    setNewListName("")
    setNewListOpen(false)
  }

  const handleDeleteTask = (task: Task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) {
      return
    }

    deleteTask(task.id)
  }

  return (
    <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-6">
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
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setNewListOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New List
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className={`${selectedList ? "hidden lg:block" : ""} ${selectedList ? "lg:col-span-1" : "lg:col-span-3"}`}>
          <div className={`grid ${selectedList ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"} gap-4`}>
            {listStats.map((list) => {
              const Icon = listIconMap[list.icon]

              return (
                <div
                  key={list.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedList(list.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      setSelectedList(list.id)
                    }
                  }}
                  className={`bg-card rounded-xl border border-border p-5 text-left hover:shadow-sm transition-all ${
                    selectedList === list.id ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${list.colorClassName} flex items-center justify-center`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <button
                      type="button"
                      className="p-1 text-muted-foreground hover:text-foreground rounded"
                      onClick={(event) => event.stopPropagation()}
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
                      style={{ width: `${list.completionRate}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {selectedListData && (
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl border border-border">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setSelectedList(null)}
                      className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" />
                    </button>
                    <div className={`w-12 h-12 rounded-xl ${selectedListData.colorClassName} flex items-center justify-center`}>
                      {(() => {
                        const Icon = listIconMap[selectedListData.icon]
                        return <Icon className="w-6 h-6" />
                      })()}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">{selectedListData.name}</h2>
                      <p className="text-sm text-muted-foreground">
                        {selectedListData.completedCount} of {selectedListData.taskCount} completed
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="border-border" onClick={() => setAddTaskOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              </div>

              <div className="p-4">
                <div className="space-y-2">
                  {selectedListData.tasks.length === 0 ? (
                    <div className="p-6 rounded-lg bg-background text-center text-sm text-muted-foreground">
                      No tasks in this list yet.
                    </div>
                  ) : (
                    selectedListData.tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`group flex items-center gap-4 p-4 rounded-lg transition-colors ${
                          task.completed ? "bg-herb/5" : "bg-background hover:bg-muted/50"
                        }`}
                      >
                        <button
                          onClick={() => toggleTask(task.id)}
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
                        <div className="ml-auto flex items-center gap-2 lg:hidden">
                          {task.priority !== "none" ? (
                            <span
                              className={`rounded px-2 py-0.5 text-xs ${getTaskPriorityBadgeClass(task.priority)}`}
                              style={getTaskPriorityBadgeStyle(task.priority)}
                            >
                              {task.priority}
                            </span>
                          ) : null}
                          {task.dueDate || task.plannedDate ? (
                            <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                              {formatTaskDueChipLabel(task.dueDate ?? task.plannedDate)}
                            </span>
                          ) : null}
                          <button
                            type="button"
                            aria-label={`Edit ${task.title}`}
                            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                            onClick={() => setEditingTask(task)}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${task.title}`}
                            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-card hover:text-destructive"
                            onClick={() => handleDeleteTask(task)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="relative ml-auto hidden min-w-[10rem] lg:block">
                          <div className="flex items-center justify-end gap-2 transition-transform duration-200 ease-out group-hover:-translate-x-[4.5rem]">
                            {task.priority !== "none" ? (
                              <span
                                className={`rounded px-2 py-0.5 text-xs ${getTaskPriorityBadgeClass(task.priority)}`}
                                style={getTaskPriorityBadgeStyle(task.priority)}
                              >
                                {task.priority}
                              </span>
                            ) : null}
                            {task.dueDate || task.plannedDate ? (
                              <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                                {formatTaskDueChipLabel(task.dueDate ?? task.plannedDate)}
                              </span>
                            ) : null}
                          </div>

                          <div className="pointer-events-none absolute right-0 top-1/2 flex -translate-y-1/2 items-center gap-1 opacity-0 transition-all duration-200 ease-out group-hover:pointer-events-auto group-hover:opacity-100">
                            <button
                              type="button"
                              aria-label={`Edit ${task.title}`}
                              className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                              onClick={() => setEditingTask(task)}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Delete ${task.title}`}
                              className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-card hover:text-destructive"
                              onClick={() => handleDeleteTask(task)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <AddTaskDialog
        open={addTaskOpen}
        onOpenChange={setAddTaskOpen}
        defaultListId={selectedListData?.id}
        title={selectedListData ? `Add task to ${selectedListData.name}` : "Add task"}
        description="Create a task directly inside this list."
      />

      <TaskEditorDialog
        task={editingTask}
        open={Boolean(editingTask)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingTask(null)
          }
        }}
      />

      <Dialog open={newListOpen} onOpenChange={setNewListOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a new list</DialogTitle>
            <DialogDescription>
              Add a new area to organize tasks across the app.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">List name</label>
            <Input
              autoFocus
              value={newListName}
              onChange={(event) => setNewListName(event.target.value)}
              placeholder="For example: Finance"
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewListOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createList} disabled={!newListName.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Create List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
