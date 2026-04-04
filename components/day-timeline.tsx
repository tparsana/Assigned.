"use client"

import { useEffect, useMemo, useRef, useState, type DragEvent } from "react"

import { format } from "date-fns"
import { Brain, Clock, Coffee, Users, X } from "lucide-react"

import { formatTimeLabel, type ScheduleBlock } from "@/lib/tasked-store"

const DEFAULT_ROW_HEIGHT = 64

function hourLabel(hour: number) {
  if (hour === 0) return "12 AM"
  if (hour === 12) return "12 PM"
  return hour > 12 ? `${hour - 12} PM` : `${hour} AM`
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number)
  return hours * 60 + minutes
}

function minutesToTime(value: number) {
  const hours = Math.floor(value / 60)
  const minutes = value % 60
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}

function getBlockIcon(type: ScheduleBlock["type"]) {
  switch (type) {
    case "focus":
      return Brain
    case "meeting":
      return Users
    case "break":
      return Coffee
    default:
      return Clock
  }
}

function getBlockTone(type: ScheduleBlock["type"]) {
  switch (type) {
    case "focus":
      return "bg-celeste/45 border-celeste/70"
    case "meeting":
      return "bg-marigold/15 border-marigold/50"
    case "break":
    case "buffer":
      return "bg-muted border-border"
    default:
      return "bg-primary/10 border-primary/30"
  }
}

export function buildCompactHours(currentHour: number) {
  const start = Math.max(0, currentHour - 2)
  const end = Math.min(23, currentHour + 2)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

type DayTimelineProps = {
  blocks: ScheduleBlock[]
  hours: number[]
  now: Date
  showCurrentTime: boolean
  showEmptyHint?: boolean
  scrollHeightClassName?: string
  autoScroll?: boolean
  fillParent?: boolean
  onDropTaskAtTime?: (taskId: string, startTime: string) => void
  onUnscheduleTask?: (taskId: string) => void
  onDeleteBlock?: (blockId: string) => void
}

export function DayTimeline({
  blocks,
  hours,
  now,
  showCurrentTime,
  showEmptyHint = false,
  scrollHeightClassName = "max-h-[420px]",
  autoScroll = false,
  fillParent = false,
  onDropTaskAtTime,
  onUnscheduleTask,
  onDeleteBlock,
}: DayTimelineProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [dropPreviewMinutes, setDropPreviewMinutes] = useState<number | null>(null)
  const visibleStartHour = hours[0] ?? 0
  const visibleEndHour = hours[hours.length - 1] ?? 23
  const visibleStartMinutes = visibleStartHour * 60
  const visibleEndMinutes = (visibleEndHour + 1) * 60
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const currentOffset = useMemo(() => {
    if (!showCurrentTime) {
      return null
    }

    if (currentMinutes < visibleStartMinutes || currentMinutes > visibleEndMinutes) {
      return null
    }

    return ((currentMinutes - visibleStartMinutes) / 60) * DEFAULT_ROW_HEIGHT
  }, [currentMinutes, showCurrentTime, visibleEndMinutes, visibleStartMinutes])
  const currentTimeLabel = format(now, "HH:mm")

  useEffect(() => {
    if (!autoScroll || !scrollRef.current) {
      return
    }

    const viewport = scrollRef.current
    const firstBlock = blocks[0]
    const firstBlockOffset = firstBlock
      ? ((Math.max(timeToMinutes(firstBlock.startTime), visibleStartMinutes) - visibleStartMinutes) / 60) *
        DEFAULT_ROW_HEIGHT
      : null
    const targetOffset = currentOffset ?? firstBlockOffset ?? 0

    viewport.scrollTo({
      top: Math.max(0, targetOffset - viewport.clientHeight / 2),
      behavior: "smooth",
    })
  }, [autoScroll, blocks, currentOffset, visibleStartMinutes])

  const getDropMinutesFromClientY = (clientY: number) => {
    if (!scrollRef.current || !contentRef.current) {
      return null
    }

    const rect = contentRef.current.getBoundingClientRect()
    const rawOffset = clientY - rect.top + scrollRef.current.scrollTop
    const unclampedMinutes = visibleStartMinutes + (rawOffset / DEFAULT_ROW_HEIGHT) * 60
    const snappedMinutes = Math.round(unclampedMinutes / 15) * 15
    const clampedMinutes = Math.min(
      Math.max(snappedMinutes, visibleStartMinutes),
      visibleEndMinutes - 15
    )

    return clampedMinutes
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!onDropTaskAtTime) {
      return
    }

    const taskId = event.dataTransfer.getData("text/task-id")
    if (!taskId) {
      return
    }

    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
    setDropPreviewMinutes(getDropMinutesFromClientY(event.clientY))
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    if (!onDropTaskAtTime) {
      return
    }

    const taskId = event.dataTransfer.getData("text/task-id")
    if (!taskId) {
      return
    }

    event.preventDefault()
    const dropMinutes = getDropMinutesFromClientY(event.clientY)
    setDropPreviewMinutes(null)

    if (dropMinutes === null) {
      return
    }

    onDropTaskAtTime(taskId, minutesToTime(dropMinutes))
  }

  return (
    <div className={fillParent ? "flex h-full min-h-0 flex-col gap-3" : "space-y-3"}>
      {showEmptyHint ? (
        <p className="text-xs text-muted-foreground">
          Nothing is scheduled yet. Showing the hours around right now.
        </p>
      ) : null}

      <div className={`overflow-hidden rounded-xl border border-border bg-background ${fillParent ? "min-h-0 flex-1" : ""}`}>
        <div
          ref={scrollRef}
          className={`overflow-y-auto ${scrollHeightClassName}`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragLeave={() => setDropPreviewMinutes(null)}
        >
          <div
            ref={contentRef}
            className="relative"
            style={{ height: `${hours.length * DEFAULT_ROW_HEIGHT}px` }}
          >
            {hours.map((hour, index) => (
              <div
                key={hour}
                className="absolute left-0 right-0 flex border-t border-border/80"
                style={{ top: `${index * DEFAULT_ROW_HEIGHT}px` }}
              >
                <div className="w-16 shrink-0 bg-background/95 px-2 py-2 text-[11px] text-muted-foreground backdrop-blur">
                  {hourLabel(hour)}
                </div>
                <div className="flex-1" />
              </div>
            ))}

            <div className="absolute left-16 right-3 top-0">
              {blocks.map((block) => {
                const startMinutes = timeToMinutes(block.startTime)
                const endMinutes = timeToMinutes(block.endTime)

                if (endMinutes <= visibleStartMinutes || startMinutes >= visibleEndMinutes) {
                  return null
                }

                const top =
                  ((Math.max(startMinutes, visibleStartMinutes) - visibleStartMinutes) / 60) *
                  DEFAULT_ROW_HEIGHT
                const height =
                  ((Math.min(endMinutes, visibleEndMinutes) - Math.max(startMinutes, visibleStartMinutes)) /
                    60) *
                  DEFAULT_ROW_HEIGHT
                const Icon = getBlockIcon(block.type)

                return (
                  <div
                    key={block.id}
                    className={`absolute left-0 right-0 rounded-lg border p-3 shadow-sm ${getBlockTone(block.type)}`}
                    style={{ top: `${top}px`, height: `${Math.max(height, 36)}px` }}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-foreground/70" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-foreground">{block.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatTimeLabel(block.startTime)} - {formatTimeLabel(block.endTime)}
                        </div>
                      </div>
                      {block.taskId && onUnscheduleTask ? (
                        <button
                          onClick={() => onUnscheduleTask(block.taskId!)}
                          className="rounded p-1 text-muted-foreground hover:text-foreground"
                          aria-label="Unschedule task"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      ) : null}
                      {!block.taskId && onDeleteBlock ? (
                        <button
                          onClick={() => onDeleteBlock(block.id)}
                          className="rounded p-1 text-muted-foreground hover:text-foreground"
                          aria-label="Remove block"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>

            {dropPreviewMinutes !== null ? (
              <div
                className="pointer-events-none absolute left-0 right-0 z-10"
                style={{
                  top: `${((dropPreviewMinutes - visibleStartMinutes) / 60) * DEFAULT_ROW_HEIGHT}px`,
                }}
              >
                <div className="flex items-center">
                  <div className="h-0.5 flex-1 border-t border-dashed border-primary/70" />
                </div>
              </div>
            ) : null}

            {currentOffset !== null ? (
              <div
                className="pointer-events-none absolute left-0 right-0 z-10"
                style={{ top: `${currentOffset}px` }}
              >
                <div className="relative flex items-center">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 rounded bg-background px-1 text-[11px] font-medium leading-none text-destructive">
                    {currentTimeLabel}
                  </div>
                  <div className="h-2.5 w-2.5 rounded-full bg-destructive" />
                  <div className="h-0.5 flex-1 bg-destructive" />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
