"use client"

import { useMemo, useState } from "react"
import { CheckCircle2, FolderOpen, Plus } from "lucide-react"

import { AddTaskDialog } from "@/components/add-task-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { formatTaskDateLabel, useTaskedState } from "@/lib/tasked-store"

type TaskFilter = "all" | "unassigned" | string

export function MinimalWorkspace() {
  const { tasks, lists, toggleTask, addList } = useTaskedState()
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [newListOpen, setNewListOpen] = useState(false)
  const [newListName, setNewListName] = useState("")
  const [selectedFilter, setSelectedFilter] = useState<TaskFilter>("all")

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((left, right) => {
      if (left.completed !== right.completed) {
        return left.completed ? 1 : -1
      }

      const leftDate = left.plannedDate ?? left.dueDate ?? "9999-99-99"
      const rightDate = right.plannedDate ?? right.dueDate ?? "9999-99-99"
      if (leftDate !== rightDate) {
        return leftDate.localeCompare(rightDate)
      }

      return left.title.localeCompare(right.title)
    })
  }, [tasks])

  const filteredTasks = sortedTasks.filter((task) => {
    if (selectedFilter === "all") {
      return true
    }

    if (selectedFilter === "unassigned") {
      return !task.listId
    }

    return task.listId === selectedFilter
  })

  const unassignedCount = tasks.filter((task) => !task.listId).length
  const openCount = tasks.filter((task) => !task.completed).length

  const createList = () => {
    const trimmed = newListName.trim()
    if (!trimmed) {
      return
    }

    const createdId = addList(trimmed)
    setSelectedFilter(createdId)
    setNewListName("")
    setNewListOpen(false)
  }

  return (
    <div className="px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex flex-col gap-5 sm:gap-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Tasks</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {openCount === 0
                ? "A quiet workspace for whatever matters next."
                : `${openCount} open ${openCount === 1 ? "task" : "tasks"} in one simple list.`}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                onClick={() => setSelectedFilter("all")}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  selectedFilter === "all"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:bg-muted"
                }`}
              >
                All
              </button>
              {lists.map((list) => {
                const taskCount = tasks.filter((task) => task.listId === list.id).length

                return (
                  <button
                    key={list.id}
                    onClick={() => setSelectedFilter(list.id)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      selectedFilter === list.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:bg-muted"
                    }`}
                  >
                    {list.name}
                    <span className="ml-2 text-xs opacity-70">{taskCount}</span>
                  </button>
                )
              })}
              {unassignedCount > 0 && (
                <button
                  onClick={() => setSelectedFilter("unassigned")}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    selectedFilter === "unassigned"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  No list
                  <span className="ml-2 text-xs opacity-70">{unassignedCount}</span>
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" className="w-full border-border sm:w-auto" onClick={() => setNewListOpen(true)}>
                <FolderOpen className="mr-2 h-4 w-4" />
                New List
              </Button>
              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
                onClick={() => setAddTaskOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-border bg-card">
          {filteredTasks.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="text-sm text-muted-foreground">
                {tasks.length === 0
                  ? "No tasks yet. Add one and keep the workspace light."
                  : "No tasks match this list yet."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredTasks.map((task) => {
                const list = lists.find((value) => value.id === task.listId)
                const dateLabel = formatTaskDateLabel(task.plannedDate ?? task.dueDate)

                return (
                  <div key={task.id} className="flex items-start gap-3 px-4 py-4 sm:gap-4 sm:px-5 sm:py-5">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                        task.completed
                          ? "border-herb bg-herb"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {task.completed && <CheckCircle2 className="h-4 w-4 text-herb-foreground" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className={`font-medium ${task.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {task.title}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="rounded-full bg-muted px-2 py-1">
                          {list?.name ?? "No list"}
                        </span>
                        {(task.plannedDate || task.dueDate) && (
                          <span className="rounded-full bg-muted px-2 py-1">{dateLabel}</span>
                        )}
                        <span
                          className={`rounded-full px-2 py-1 ${
                            task.priority === "high"
                              ? "bg-destructive/10 text-destructive"
                              : task.priority === "medium"
                                ? "bg-marigold/10 text-marigold"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <AddTaskDialog
        open={addTaskOpen}
        onOpenChange={setAddTaskOpen}
        defaultListId={selectedFilter === "all" || selectedFilter === "unassigned" ? undefined : selectedFilter}
        title="Add task"
        description="Keep this workspace simple: capture the next thing and move on."
      />

      <Dialog open={newListOpen} onOpenChange={setNewListOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a new list</DialogTitle>
            <DialogDescription>
              Add another list without leaving minimal mode.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">List name</label>
            <Input
              autoFocus
              value={newListName}
              onChange={(event) => setNewListName(event.target.value)}
              placeholder="For example: Personal"
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
