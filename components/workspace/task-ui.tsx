"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { CalendarDays, MessageSquare, Paperclip, SquareCheckBig, User2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  formatCompactDate,
  getProjectStatusLabel,
  getTaskPriorityLabel,
  getTaskStatusLabel,
  type TaskProjectSummary,
  type TaskSummary,
} from "@/lib/task-data"

export function PersonAvatar({
  name,
  avatarUrl,
  className = "h-8 w-8",
}: {
  name: string
  avatarUrl: string | null
  className?: string
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")

  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className={`${className} rounded-full object-cover`} />
  }

  return (
    <div className={`${className} flex items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary`}>
      {initials || "A"}
    </div>
  )
}

export function StatusBadge({ status }: { status: TaskSummary["status"] }) {
  const className =
    status === "done"
      ? "bg-emerald-100 text-emerald-700"
      : status === "in_progress"
        ? "bg-sky-100 text-sky-700"
        : status === "on_hold"
          ? "bg-amber-100 text-amber-800"
          : "bg-zinc-100 text-zinc-700"

  return <Badge className={className}>{getTaskStatusLabel(status)}</Badge>
}

export function PriorityBadge({ priority }: { priority: TaskSummary["priority"] }) {
  if (!priority) {
    return null
  }

  const className =
    priority === "high"
      ? "bg-rose-100 text-rose-700"
      : priority === "medium"
        ? "bg-orange-100 text-orange-700"
        : "bg-violet-100 text-violet-700"

  return <Badge className={className}>{getTaskPriorityLabel(priority)}</Badge>
}

export function ProjectBadge({ task }: { task: TaskSummary }) {
  if (!task.project) {
    return null
  }

  return (
    <Badge className="bg-slate-100 text-slate-700">
      {task.project.name}
      {task.project.locationText ? ` · ${task.project.locationText}` : ""}
    </Badge>
  )
}

export function CategoryBadge({ category }: { category: string }) {
  return <Badge className="bg-primary/10 text-primary">{category}</Badge>
}

export function TaskCard({
  task,
  compact = false,
  actions,
}: {
  task: TaskSummary
  compact?: boolean
  actions?: ReactNode
}) {
  return (
    <div className="rounded-3xl border border-border/80 bg-card p-4 shadow-[0_1px_0_rgba(15,23,42,0.03)] transition-colors hover:border-border">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link href={`/app/tasks/${task.id}`} className="block">
            <div className="line-clamp-2 text-base font-medium text-foreground">{task.title}</div>
          </Link>
          {!compact && task.description ? (
            <div className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{task.description}</div>
          ) : null}
        </div>
        <StatusBadge status={task.status} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <CategoryBadge category={task.category} />
        <ProjectBadge task={task} />
        <PriorityBadge priority={task.priority} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <PersonAvatar name={task.assignee.fullName} avatarUrl={task.assignee.avatarUrl} className="h-7 w-7" />
          <span>{task.assignee.fullName}</span>
        </div>
        {task.dueDate ? (
          <div className={`flex items-center gap-1 ${task.isOverdue ? "text-destructive" : ""}`}>
            <CalendarDays className="h-4 w-4" />
            <span>{formatCompactDate(task.dueDate)}</span>
          </div>
        ) : null}
      </div>

      {!compact && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/70 pt-4 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <SquareCheckBig className="h-3.5 w-3.5" />
              {task.checklist.completed}/{task.checklist.total}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              {task.commentCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <Paperclip className="h-3.5 w-3.5" />
              {task.attachmentCount}
            </span>
          </div>
          {actions}
        </div>
      )}
    </div>
  )
}

export function SummaryCard({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: number
  tone?: "default" | "success" | "warning" | "danger"
}) {
  const accent =
    tone === "success"
      ? "bg-emerald-500/12 text-emerald-700"
      : tone === "warning"
        ? "bg-amber-500/12 text-amber-700"
        : tone === "danger"
          ? "bg-rose-500/12 text-rose-700"
          : "bg-slate-500/10 text-slate-700"

  return (
    <div className="rounded-3xl border border-border/80 bg-card p-5">
      <div className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${accent}`}>{label}</div>
      <div className="mt-4 text-3xl font-semibold text-foreground">{value}</div>
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/70 p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <User2 className="h-5 w-5" />
      </div>
      <div className="mt-4 text-lg font-medium text-foreground">{title}</div>
      <div className="mt-2 text-sm leading-6 text-muted-foreground">{description}</div>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export function InlineOpenTaskButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      Open
    </Button>
  )
}

export function ProjectStatusBadge({ status }: { status: TaskProjectSummary["status"] }) {
  const className =
    status === "active"
      ? "bg-emerald-100 text-emerald-700"
      : status === "planning"
        ? "bg-sky-100 text-sky-700"
        : status === "on_hold"
          ? "bg-amber-100 text-amber-800"
          : "bg-slate-100 text-slate-700"

  return <Badge className={className}>{getProjectStatusLabel(status)}</Badge>
}
