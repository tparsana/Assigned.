"use client"

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { addDays, format } from "date-fns"

import { AddTaskDialog } from "@/components/add-task-dialog"
import { TaskEditorDialog } from "@/components/task-editor-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import {
  LayoutGrid,
  MoreHorizontal,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
} from "lucide-react"
import {
  formatLongDateLabel,
  formatTaskDateLabel,
  getCompletedTaskAccentClass,
  getCompletedTaskAccentStyle,
  getDaysOverdue,
  getTasksForDate,
  getTaskPriorityBadgeClass,
  getTaskPriorityBadgeStyle,
  getTaskListName,
  useTaskedState,
  type BoardColumn,
  type Task,
  type TaskList,
} from "@/lib/tasked-store"

const columns: Array<{ id: BoardColumn; title: string; color: string; overlayColor: string }> = [
  { id: "today", title: "Today", color: "bg-primary/10", overlayColor: "bg-primary/80" },
  { id: "doing", title: "Doing", color: "bg-secondary", overlayColor: "bg-secondary/85" },
  { id: "done", title: "Done", color: "bg-muted/80", overlayColor: "bg-muted/85" },
  { id: "inbox", title: "Backlog", color: "bg-muted", overlayColor: "bg-muted/85" },
]

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

const desktopQuickActionOrder: BoardColumn[] = ["today", "doing", "done", "inbox"]

function getColumnAtPoint(x: number, y: number) {
  const target = document.elementFromPoint(x, y)
  const column = target?.closest<HTMLElement>("[data-kanban-column-id]")
  const columnId = column?.dataset.kanbanColumnId
  return columnId ? (columnId as BoardColumn) : null
}

function getColumnSurfaceClass(columnId: BoardColumn) {
  return columns.find((column) => column.id === columnId)?.overlayColor ?? "bg-muted/90"
}

function getColumnOverlayStyle(columnId: BoardColumn) {
  switch (columnId) {
    case "today":
      return { backgroundColor: "rgba(28, 28, 28, 0.18)" }
    case "doing":
      return { backgroundColor: "rgba(238, 240, 242, 0.84)" }
    case "done":
      return { backgroundColor: "rgba(236, 235, 228, 0.82)" }
    case "inbox":
      return { backgroundColor: "rgba(236, 235, 228, 0.88)" }
    default:
      return { backgroundColor: "rgba(236, 235, 228, 0.84)" }
  }
}

function TaskCard({
  task,
  columnId,
  compactView,
  lists,
  isMobile,
  revealed,
  isDragging,
  columnLabels,
  showQuickActions = true,
  onDragStart,
  onRevealChange,
  onEditTask,
  onMoveTask,
}: {
  task: Task
  columnId: BoardColumn
  compactView: boolean
  lists: TaskList[]
  isMobile: boolean
  revealed: boolean
  isDragging?: boolean
  columnLabels: Record<BoardColumn, string>
  showQuickActions?: boolean
  onDragStart?: (event: ReactPointerEvent<HTMLDivElement>) => void
  onRevealChange: (open: boolean) => void
  onEditTask: () => void
  onMoveTask: (columnId: BoardColumn) => void
}) {
  const isOverdue = Boolean(task.dueDate && !task.completed && getDaysOverdue(task.dueDate) > 0)
  const desktopQuickActionColumns = desktopQuickActionOrder.filter((value) => value !== columnId)

  const runTaskAction = (action: () => void) => {
    if (isMobile) {
      onRevealChange(false)
    }

    action()
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isMobile) {
      onDragStart?.(event)
    }
  }

  const handleCardClick = () => {
    if (!isMobile || !showQuickActions) {
      return
    }

    onRevealChange(!revealed)
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div
        data-slot="task-card"
        onPointerDown={handlePointerDown}
        onClick={handleCardClick}
        className={cn(
          "group relative cursor-grab touch-pan-y rounded-xl border border-border bg-background p-4 shadow-sm transition-all active:cursor-grabbing md:touch-none",
          isOverdue && "border-destructive/30",
          isDragging && "opacity-35 scale-[0.98]"
        )}
      >
        <div className="min-w-0">
          <div className="font-medium text-foreground text-sm leading-5">{task.title}</div>

          {!compactView && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {task.priority !== "none" ? (
                <span
                  className={`rounded-md px-2 py-0.5 text-xs ${getTaskPriorityBadgeClass(task.priority)}`}
                  style={getTaskPriorityBadgeStyle(task.priority)}
                >
                  {task.priority}
                </span>
              ) : null}
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
            <div
              className={`mt-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs ${getCompletedTaskAccentClass()}`}
              style={getCompletedTaskAccentStyle()}
            >
              <CheckCircle2 className="h-3 w-3" />
              Completed
            </div>
          )}

          {showQuickActions ? (
            <div
              className={cn(
                "pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl p-4 transition-opacity duration-200",
                isMobile
                  ? revealed
                    ? "opacity-100"
                    : "opacity-0"
                  : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
              )}
            >
              <div
                aria-hidden="true"
                className={cn("absolute inset-0 rounded-xl", getColumnSurfaceClass(columnId))}
                style={getColumnOverlayStyle(columnId)}
              />
              <div
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
                className="pointer-events-auto relative flex w-full flex-nowrap items-center justify-center gap-1.5"
              >
                {desktopQuickActionColumns.map((nextColumn) => (
                  <button
                    key={nextColumn}
                    type="button"
                    aria-label={`Move ${task.title} to ${columnLabels[nextColumn]}`}
                    className="inline-flex min-w-0 flex-1 items-center justify-center rounded-full border border-foreground/10 bg-background/95 px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-foreground/20 hover:bg-background hover:text-foreground"
                    onClick={(event) => {
                      event.stopPropagation()
                      runTaskAction(() => onMoveTask(nextColumn))
                    }}
                  >
                    {columnLabels[nextColumn]}
                  </button>
                ))}
                <button
                  type="button"
                  aria-label={`Edit ${task.title}`}
                  className="inline-flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full border border-foreground/10 bg-background/95 px-2 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:bg-background"
                  onClick={(event) => {
                    event.stopPropagation()
                    runTaskAction(onEditTask)
                  }}
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function KanbanPage() {
  const isMobile = useIsMobile()
  const { tasks, lists, todayKey, moveTaskToColumn } = useTaskedState()
  const [compactView, setCompactView] = useState(false)
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [targetColumn, setTargetColumn] = useState<BoardColumn>("today")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [revealedTaskId, setRevealedTaskId] = useState<string | null>(null)
  const [activeDrag, setActiveDrag] = useState<ActiveDragState | null>(null)
  const [hoverColumn, setHoverColumn] = useState<BoardColumn | null>(null)
  const dragStartRef = useRef<DragStartState | null>(null)
  const activeDragRef = useRef<ActiveDragState | null>(null)
  const hoverColumnRef = useRef<BoardColumn | null>(null)
  const currentDateKey = format(currentDate, "yyyy-MM-dd")
  const viewingToday = currentDateKey === todayKey
  const visibleTasks = useMemo(() => getTasksForDate(tasks, currentDateKey), [currentDateKey, tasks])
  const columnLabels = useMemo<Record<BoardColumn, string>>(
    () => ({
      today: viewingToday ? "Today" : "Planned",
      doing: "Doing",
      done: "Done",
      inbox: "Backlog",
    }),
    [viewingToday]
  )

  const tasksByColumn = useMemo(
    () =>
      columns.map((column) => ({
        ...column,
        title: columnLabels[column.id],
        tasks: visibleTasks.filter((task) => task.boardColumn === column.id),
      })),
    [columnLabels, visibleTasks]
  )

  const draggedTask = useMemo(
    () => (activeDrag ? visibleTasks.find((task) => task.id === activeDrag.taskId) ?? null : null),
    [activeDrag, visibleTasks]
  )
  const targetColumnLabel = tasksByColumn.find((column) => column.id === targetColumn)?.title ?? "board"

  useEffect(() => {
    setRevealedTaskId(null)
  }, [currentDateKey, isMobile])

  useEffect(() => {
    if (isMobile) {
      return
    }

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
  }, [isMobile, moveTaskToColumn])

  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-0 w-full min-w-0 max-w-full flex-col overflow-hidden px-4 py-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:px-8 lg:py-6 lg:pb-6">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-semibold text-foreground">
            <LayoutGrid className="h-7 w-7" />
            Kanban Board
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Drag tasks planned for {viewingToday ? "today" : formatLongDateLabel(currentDateKey)} between columns.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <div className="flex items-center justify-between gap-2 sm:justify-start">
            <Button
              variant="outline"
              size="icon"
              className="border-border"
              onClick={() => setCurrentDate((date) => addDays(date, -1))}
              aria-label="Previous day"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1 rounded-lg border border-border bg-card px-4 py-2 text-center sm:min-w-[220px] sm:flex-none">
              <span className="font-medium text-foreground">{formatLongDateLabel(currentDateKey)}</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="border-border"
              onClick={() => setCurrentDate((date) => addDays(date, 1))}
              aria-label="Next day"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="min-h-0 w-full min-w-0 max-w-full flex-1 overflow-hidden rounded-2xl border border-border bg-card/45 shadow-[0_30px_90px_-60px_rgba(28,28,28,0.45)] sm:rounded-[1.75rem]">
        <div className="h-full w-full overflow-x-auto overflow-y-auto overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch] p-3 sm:p-4">
          <div className="flex min-h-full w-max min-w-full snap-x snap-mandatory gap-3 sm:gap-4 md:snap-none">
          {tasksByColumn.map((column) => {
            const isActiveDropZone = hoverColumn === column.id

            return (
              <section
                key={column.id}
                data-kanban-column-id={column.id}
                className="flex w-[84vw] max-w-[19rem] flex-shrink-0 snap-start flex-col sm:w-[18rem] md:w-80 lg:w-[20rem]"
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          onSelect={() => {
                            setTargetColumn(column.id)
                            setAddTaskOpen(true)
                          }}
                        >
                          <Plus className="h-4 w-4" />
                          Add task
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setCompactView((current) => !current)}>
                          {compactView ? "Switch to expanded" : "Switch to compact"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {isActiveDropZone && (
                    <p className="mt-2 text-xs text-muted-foreground">Release to move here</p>
                  )}
                </div>

                <div
                  className={cn(
                    "min-h-[420px] flex-1 rounded-b-xl border border-t-0 border-border bg-card p-3 transition-colors",
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
                        isMobile={isMobile}
                        revealed={revealedTaskId === task.id}
                        isDragging={activeDrag?.taskId === task.id}
                        columnLabels={columnLabels}
                        onDragStart={(event: ReactPointerEvent<HTMLDivElement>) => {
                          if (isMobile) {
                            return
                          }

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
                        onRevealChange={(open) =>
                          setRevealedTaskId((current) => (open ? task.id : current === task.id ? null : current))
                        }
                        onEditTask={() => setEditingTask(task)}
                        onMoveTask={(nextColumn) => moveTaskToColumn(task.id, nextColumn)}
                      />
                    ))}

                    {column.tasks.length === 0 && (
                      <div
                        className={cn(
                          "rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground transition-colors",
                          isActiveDropZone && "border-primary/50 bg-background"
                        )}
                      >
                        <p>No tasks for this stage</p>
                        <p className="mt-1 text-xs">
                          Nothing from {viewingToday ? "today" : formatLongDateLabel(currentDateKey)} is sitting here yet.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )
          })}
          </div>
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
            isMobile={false}
            revealed={false}
            columnLabels={columnLabels}
            showQuickActions={false}
            onRevealChange={() => undefined}
            onEditTask={() => undefined}
            onMoveTask={() => undefined}
          />
        </div>
      ) : null}

      <AddTaskDialog
        open={addTaskOpen}
        onOpenChange={setAddTaskOpen}
        defaultBoardColumn={targetColumn}
        defaultPlannedDate={currentDateKey}
        title={`Add task to ${targetColumnLabel}`}
        description={`Create a task for ${viewingToday ? "today" : formatLongDateLabel(currentDateKey)} directly in this workflow stage.`}
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
    </div>
  )
}
