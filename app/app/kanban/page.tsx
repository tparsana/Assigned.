"use client"

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"

import { AddTaskDialog } from "@/components/add-task-dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  LayoutGrid,
  MoreHorizontal,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import {
  formatTaskDateLabel,
  getDaysOverdue,
  getTaskListName,
  useTaskedState,
  type BoardColumn,
  type Task,
  type TaskList,
} from "@/lib/tasked-store"

const columns: Array<{ id: BoardColumn; title: string; color: string }> = [
  { id: "inbox", title: "Backlog", color: "bg-muted" },
  { id: "today", title: "Today", color: "bg-primary/10" },
  { id: "doing", title: "Doing", color: "bg-secondary" },
  { id: "waiting", title: "Waiting", color: "bg-accent" },
  { id: "done", title: "Done", color: "bg-muted/80" },
]

const priorityColors = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-orange-500/10 text-orange-600 border-orange-200 dark:text-orange-300 dark:border-orange-400/30",
  low: "bg-muted text-muted-foreground border-border",
}

type DragStartState = {
  taskId: string
  columnId: BoardColumn
  pointerId: number
  startX: number
  startY: number
  offsetX: number
  offsetY: number
  width: number
  height: number
}

type ActiveDragState = {
  taskId: string
  columnId: BoardColumn
  pointerId: number
  x: number
  y: number
  offsetX: number
  offsetY: number
  width: number
  height: number
}

function getColumnAtPoint(x: number, y: number) {
  const target = document.elementFromPoint(x, y)
  const column = target?.closest<HTMLElement>("[data-kanban-column-id]")
  const columnId = column?.dataset.kanbanColumnId
  return columnId ? (columnId as BoardColumn) : null
}

function TaskCard({
  task,
  columnId,
  compactView,
  lists,
  isDragging,
  onDragStart,
}: {
  task: Task
  columnId: BoardColumn
  compactView: boolean
  lists: TaskList[]
  isDragging?: boolean
  onDragStart?: (event: ReactPointerEvent<HTMLDivElement>) => void
}) {
  const isOverdue = Boolean(task.dueDate && !task.completed && getDaysOverdue(task.dueDate) > 0)

  return (
    <div
      data-slot="task-card"
      onPointerDown={onDragStart}
      className={cn(
        "cursor-grab touch-none rounded-xl border border-border bg-background p-4 shadow-sm transition-all active:cursor-grabbing",
        isOverdue && "border-destructive/30",
        isDragging && "opacity-35 scale-[0.98]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-medium text-foreground text-sm leading-5">{task.title}</div>

          {!compactView && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`rounded-md border px-2 py-0.5 text-xs ${priorityColors[task.priority]}`}>
                {task.priority}
              </span>
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-foreground">
                {getTaskListName(lists, task.listId)}
              </span>
            </div>
          )}

          {!compactView && task.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {task.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {task.dueDate && (
            <div
              className={cn(
                "mt-3 flex items-center gap-1 text-xs",
                isOverdue ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {isOverdue ? <AlertCircle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
              {formatTaskDateLabel(task.dueDate)}
            </div>
          )}

          {columnId === "done" && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3" />
              Completed
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default function KanbanPage() {
  const { tasks, lists, moveTaskToColumn } = useTaskedState()
  const [compactView, setCompactView] = useState(false)
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [targetColumn, setTargetColumn] = useState<BoardColumn>("waiting")
  const [activeDrag, setActiveDrag] = useState<ActiveDragState | null>(null)
  const [hoverColumn, setHoverColumn] = useState<BoardColumn | null>(null)
  const dragStartRef = useRef<DragStartState | null>(null)
  const activeDragRef = useRef<ActiveDragState | null>(null)
  const hoverColumnRef = useRef<BoardColumn | null>(null)

  const tasksByColumn = useMemo(
    () =>
      columns.map((column) => ({
        ...column,
        tasks: tasks.filter((task) => task.boardColumn === column.id),
      })),
    [tasks]
  )

  const draggedTask = useMemo(
    () => (activeDrag ? tasks.find((task) => task.id === activeDrag.taskId) ?? null : null),
    [activeDrag, tasks]
  )

  useEffect(() => {
    const cleanupStyles = () => {
      document.body.style.userSelect = ""
      document.body.style.cursor = ""
    }

    const handlePointerMove = (event: PointerEvent) => {
      const pendingDrag = dragStartRef.current

      if (pendingDrag && event.pointerId !== pendingDrag.pointerId) {
        return
      }

      if (!activeDragRef.current && pendingDrag) {
        const movedX = event.clientX - pendingDrag.startX
        const movedY = event.clientY - pendingDrag.startY

        if (Math.hypot(movedX, movedY) < 8) {
          return
        }

        document.body.style.userSelect = "none"
        document.body.style.cursor = "grabbing"

        const nextDrag = {
          taskId: pendingDrag.taskId,
          columnId: pendingDrag.columnId,
          pointerId: pendingDrag.pointerId,
          x: event.clientX,
          y: event.clientY,
          offsetX: pendingDrag.offsetX,
          offsetY: pendingDrag.offsetY,
          width: pendingDrag.width,
          height: pendingDrag.height,
        }
        activeDragRef.current = nextDrag
        setActiveDrag(nextDrag)
        const nextHover = getColumnAtPoint(event.clientX, event.clientY) ?? pendingDrag.columnId
        hoverColumnRef.current = nextHover
        setHoverColumn(nextHover)
        return
      }

      if (!activeDragRef.current || event.pointerId !== activeDragRef.current.pointerId) {
        return
      }

      document.body.style.userSelect = "none"
      document.body.style.cursor = "grabbing"

      const nextDrag = {
        ...activeDragRef.current,
        x: event.clientX,
        y: event.clientY,
      }
      activeDragRef.current = nextDrag
      setActiveDrag(nextDrag)

      const nextHover = getColumnAtPoint(event.clientX, event.clientY)
      hoverColumnRef.current = nextHover
      setHoverColumn(nextHover)
    }

    const finishDrag = (event: PointerEvent) => {
      const pendingDrag = dragStartRef.current
      const currentDrag = activeDragRef.current

      if (pendingDrag && event.pointerId !== pendingDrag.pointerId) {
        return
      }

      if (currentDrag && event.pointerId !== currentDrag.pointerId) {
        return
      }

      const dropColumn =
        getColumnAtPoint(event.clientX, event.clientY) ??
        hoverColumnRef.current ??
        currentDrag?.columnId ??
        pendingDrag?.columnId

      if (currentDrag && dropColumn && dropColumn !== currentDrag.columnId) {
        moveTaskToColumn(currentDrag.taskId, dropColumn)
      }

      dragStartRef.current = null
      activeDragRef.current = null
      hoverColumnRef.current = null
      setActiveDrag(null)
      setHoverColumn(null)
      cleanupStyles()
    }

    const cancelDrag = () => {
      dragStartRef.current = null
      activeDragRef.current = null
      hoverColumnRef.current = null
      setActiveDrag(null)
      setHoverColumn(null)
      cleanupStyles()
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", finishDrag)
    window.addEventListener("pointercancel", cancelDrag)

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", finishDrag)
      window.removeEventListener("pointercancel", cancelDrag)
      cleanupStyles()
    }
  }, [moveTaskToColumn])

  return (
    <div className="h-full px-4 py-6 pb-24 lg:px-8 lg:pb-6">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-semibold text-foreground">
            <LayoutGrid className="h-7 w-7" />
            Kanban Board
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Drag tasks between columns to update the flow.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-lg bg-muted p-1">
            <button
              onClick={() => setCompactView(false)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                !compactView ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              Expanded
            </button>
            <button
              onClick={() => setCompactView(true)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                compactView ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              Compact
            </button>
          </div>
        </div>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-4 lg:mx-0 lg:px-0">
        <div className="flex gap-4 snap-x snap-mandatory">
          {tasksByColumn.map((column) => {
            const isActiveDropZone = hoverColumn === column.id

            return (
              <section
                key={column.id}
                data-kanban-column-id={column.id}
                className="w-[84vw] max-w-sm flex-shrink-0 snap-start md:w-80"
              >
                <div
                  className={cn(
                    `${column.color} rounded-t-xl border border-b-0 border-border px-4 py-3 transition-all`,
                    isActiveDropZone && "border-primary/50 shadow-sm"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{column.title}</h3>
                      <span className="rounded-full bg-background/60 px-2 py-0.5 text-xs text-muted-foreground">
                        {column.tasks.length}
                      </span>
                    </div>
                    <button className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                  {isActiveDropZone && (
                    <p className="mt-2 text-xs text-muted-foreground">Release to move here</p>
                  )}
                </div>

                <div
                  className={cn(
                    "min-h-[420px] rounded-b-xl border border-t-0 border-border bg-card p-3 transition-colors",
                    isActiveDropZone && "border-primary/50 bg-accent/60"
                  )}
                >
                  <div className="space-y-3">
                    {column.tasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        columnId={column.id}
                        compactView={compactView}
                        lists={lists}
                        isDragging={activeDrag?.taskId === task.id}
                        onDragStart={(event: ReactPointerEvent<HTMLDivElement>) => {
                          if (event.button !== 0) {
                            return
                          }

                          const cardElement = event.currentTarget
                          const rect = cardElement.getBoundingClientRect()

                          if (!rect) {
                            return
                          }

                          dragStartRef.current = {
                            taskId: task.id,
                            columnId: column.id,
                            pointerId: event.pointerId,
                            startX: event.clientX,
                            startY: event.clientY,
                            offsetX: event.clientX - rect.left,
                            offsetY: event.clientY - rect.top,
                            width: rect.width,
                            height: rect.height,
                          }

                          cardElement.setPointerCapture(event.pointerId)
                        }}
                      />
                    ))}

                    {column.tasks.length === 0 && (
                      <div
                        className={cn(
                          "rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground transition-colors",
                          isActiveDropZone && "border-primary/50 bg-background"
                        )}
                      >
                        <p>No tasks</p>
                        <p className="mt-1 text-xs">Drag a card here or add a new one.</p>
                      </div>
                    )}

                    <button
                      className="w-full rounded-lg border-2 border-dashed border-border p-3 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                      onClick={() => {
                        setTargetColumn(column.id)
                        setAddTaskOpen(true)
                      }}
                    >
                      Add Task
                    </button>
                  </div>
                </div>
              </section>
            )
          })}
        </div>
      </div>

      {activeDrag && draggedTask ? (
        <div
          className="pointer-events-none fixed left-0 top-0 z-50"
          style={{
            transform: `translate(${activeDrag.x - activeDrag.offsetX}px, ${activeDrag.y - activeDrag.offsetY}px) rotate(1deg)`,
            width: activeDrag.width,
          }}
        >
          <TaskCard
            task={draggedTask}
            columnId={activeDrag.columnId}
            compactView={compactView}
            lists={lists}
          />
        </div>
      ) : null}

      <AddTaskDialog
        open={addTaskOpen}
        onOpenChange={setAddTaskOpen}
        defaultBoardColumn={targetColumn}
        title={`Add task to ${columns.find((column) => column.id === targetColumn)?.title ?? "board"}`}
        description="Create a task directly in this workflow stage."
      />
    </div>
  )
}
