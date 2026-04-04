"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"

import { Calendar, CheckCircle2, ChevronRight, ListTodo } from "lucide-react"

import { DayTimeline, buildCompactHours } from "@/components/day-timeline"
import { getScheduledBlocksForDate, getTasksForDate, useTaskedState } from "@/lib/tasked-store"

const FULL_DAY_HOURS = Array.from({ length: 24 }, (_, index) => index)

export function DashboardHome() {
  const { profile, tasks, scheduleBlocks, todayKey, toggleTask } = useTaskedState()
  const [now, setNow] = useState(() => new Date())
  const [isDesktop, setIsDesktop] = useState(false)
  const [taskCardHeight, setTaskCardHeight] = useState<number | null>(null)
  const taskCardRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)")
    const syncDesktop = () => setIsDesktop(mediaQuery.matches)
    syncDesktop()
    mediaQuery.addEventListener("change", syncDesktop)

    return () => mediaQuery.removeEventListener("change", syncDesktop)
  }, [])

  useEffect(() => {
    if (!taskCardRef.current) {
      return
    }

    const element = taskCardRef.current
    const syncHeight = () => setTaskCardHeight(element.getBoundingClientRect().height)
    syncHeight()

    const observer = new ResizeObserver(syncHeight)
    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  const greeting = () => {
    const hour = now.getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  const todayLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  })

  const todayTasks = useMemo(
    () =>
      getTasksForDate(tasks, todayKey).sort((left, right) => {
        if (left.completed === right.completed) {
          return (left.estimatedMinutes ?? 0) - (right.estimatedMinutes ?? 0)
        }

        return left.completed ? 1 : -1
      }),
    [tasks, todayKey]
  )
  const todaySchedule = useMemo(
    () => getScheduledBlocksForDate(scheduleBlocks, todayKey),
    [scheduleBlocks, todayKey]
  )
  const mobileHours = useMemo(
    () => (todaySchedule.length === 0 ? buildCompactHours(now.getHours()) : FULL_DAY_HOURS),
    [now, todaySchedule.length]
  )
  const desktopHours = useMemo(() => {
    if (todaySchedule.length === 0 && taskCardHeight !== null && taskCardHeight < 560) {
      return buildCompactHours(now.getHours())
    }

    return FULL_DAY_HOURS
  }, [now, taskCardHeight, todaySchedule.length])

  return (
    <div className="px-4 py-6 pb-24 lg:px-8 lg:pb-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
          {greeting()}, {profile.firstName}
        </h1>
        <p className="mt-1 text-muted-foreground">{todayLabel}</p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div ref={taskCardRef} className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-foreground">Today&apos;s Tasks</h2>
              </div>
              <Link
                href="/app/planner"
                className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                Open planner
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {todayTasks.length === 0 ? (
                <div className="rounded-lg bg-background p-6 text-center">
                  <p className="text-sm text-muted-foreground">Nothing is planned for today yet.</p>
                </div>
              ) : (
                todayTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-start gap-4 rounded-lg p-4 transition-colors sm:items-center ${
                      task.completed ? "bg-herb/5" : "bg-background hover:bg-muted/50"
                    }`}
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                        task.completed ? "border-herb bg-herb" : "border-border hover:border-primary"
                      }`}
                    >
                      {task.completed ? <CheckCircle2 className="h-4 w-4 text-herb-foreground" /> : null}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div
                        className={`font-medium ${
                          task.completed ? "text-muted-foreground line-through" : "text-foreground"
                        }`}
                      >
                        {task.title}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {task.estimatedMinutes ? `${task.estimatedMinutes} min` : "No estimate"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div>
          <div
            className="flex flex-col rounded-xl border border-border bg-card p-6"
            style={isDesktop && taskCardHeight ? { height: `${taskCardHeight}px` } : undefined}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-foreground">Today&apos;s Schedule</h2>
              </div>
              <Link
                href="/app/calendar"
                className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                Full calendar
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="lg:hidden">
              <DayTimeline
                blocks={todaySchedule}
                hours={mobileHours}
                now={now}
                showCurrentTime
                showEmptyHint={todaySchedule.length === 0}
                scrollHeightClassName="h-[320px]"
              />
            </div>

            <div className="hidden min-h-0 flex-1 lg:block">
              <DayTimeline
                blocks={todaySchedule}
                hours={desktopHours}
                now={now}
                showCurrentTime
                showEmptyHint={todaySchedule.length === 0 && desktopHours !== FULL_DAY_HOURS}
                scrollHeightClassName="h-full"
                autoScroll
                fillParent
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
