"use client"

import type { ReactNode } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  availabilityLabel,
  getAccessBadgeLabel,
  getWorkloadLevel,
  type AvailabilityStatus,
  type MemberStatus,
  type TeamDefinition,
  type TeamMemberSummary,
  type WorkloadLevel,
} from "@/lib/team-data"

type MemberAvatarProps = {
  member: Pick<TeamMemberSummary, "fullName" | "avatarUrl">
  className?: string
}

type TeamBadgeProps = {
  team: Pick<TeamDefinition, "name" | "color">
}

type RoleBadgeProps = {
  accessLevel: TeamMemberSummary["accessLevel"]
}

type AvailabilityBadgeProps = {
  availability: AvailabilityStatus
  status: MemberStatus
}

type WorkloadIndicatorProps = {
  level: WorkloadLevel
  compact?: boolean
}

type StatCardProps = {
  label: string
  value: ReactNode
  helper?: ReactNode
  tone?: "neutral" | "success" | "warning" | "danger"
}

export function MemberAvatar({ member, className }: MemberAvatarProps) {
  const initials = member.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((value) => value.charAt(0).toUpperCase())
    .join("")

  return (
    <Avatar className={cn("size-12 border border-border/70", className)}>
      {member.avatarUrl ? <AvatarImage src={member.avatarUrl} alt={member.fullName} /> : null}
      <AvatarFallback className="bg-muted text-sm font-medium text-foreground">
        {initials || "A"}
      </AvatarFallback>
    </Avatar>
  )
}

export function TeamBadge({ team }: TeamBadgeProps) {
  return (
    <Badge
      variant="outline"
      className="border-transparent bg-muted/70 text-foreground"
      style={{ backgroundColor: `${team.color}14`, color: team.color }}
    >
      {team.name}
    </Badge>
  )
}

export function RoleBadge({ accessLevel }: RoleBadgeProps) {
  const className =
    accessLevel === "admin"
      ? "border-transparent bg-foreground text-background"
      : accessLevel === "team_lead"
        ? "border-transparent bg-primary/12 text-primary"
        : accessLevel === "external"
          ? "border-transparent bg-muted text-muted-foreground"
          : "border-border bg-background text-muted-foreground"

  return (
    <Badge variant="outline" className={cn("capitalize", className)}>
      {getAccessBadgeLabel(accessLevel)}
    </Badge>
  )
}

export function AvailabilityBadge({ availability, status }: AvailabilityBadgeProps) {
  if (status === "inactive") {
    return (
      <Badge variant="outline" className="border-border bg-background text-muted-foreground">
        Inactive
      </Badge>
    )
  }

  const className =
    availability === "available"
      ? "border-transparent bg-[#E6F5EC] text-[#1F7A53]"
      : availability === "busy"
        ? "border-transparent bg-[#FDF1D7] text-[#A86A12]"
        : "border-transparent bg-[#EEF2F7] text-[#596A80]"

  return (
    <Badge variant="outline" className={className}>
      {availabilityLabel(availability)}
    </Badge>
  )
}

function getWorkloadTone(level: WorkloadLevel) {
  switch (level) {
    case "light":
      return { dot: "bg-[#1F7A53]", text: "text-[#1F7A53]" }
    case "medium":
      return { dot: "bg-[#A86A12]", text: "text-[#A86A12]" }
    case "heavy":
      return { dot: "bg-[#C44949]", text: "text-[#C44949]" }
    default:
      return { dot: "bg-foreground/40", text: "text-foreground" }
  }
}

export function WorkloadIndicator({ level, compact = false }: WorkloadIndicatorProps) {
  const tone = getWorkloadTone(level)
  const label = level === "light" ? "Light" : level === "medium" ? "Medium" : "Heavy"

  return (
    <div className={cn("inline-flex items-center gap-2", tone.text, compact ? "text-xs" : "text-sm")}>
      <span className={cn("rounded-full", tone.dot, compact ? "size-2" : "size-2.5")} />
      <span className="font-medium">{label}</span>
    </div>
  )
}

export function MemberWorkloadIndicator({ member, compact = false }: { member: TeamMemberSummary; compact?: boolean }) {
  return <WorkloadIndicator level={getWorkloadLevel(member)} compact={compact} />
}

export function StatCard({ label, value, helper, tone = "neutral" }: StatCardProps) {
  const toneClass =
    tone === "success"
      ? "bg-[#E6F5EC]"
      : tone === "warning"
        ? "bg-[#FDF1D7]"
        : tone === "danger"
          ? "bg-[#F8E7E7]"
          : "bg-muted/40"

  return (
    <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-[0_1px_0_rgba(17,24,39,0.02)]">
      <div className={cn("mb-3 inline-flex rounded-2xl px-3 py-1 text-xs font-medium text-muted-foreground", toneClass)}>
        {label}
      </div>
      <div className="text-3xl font-semibold tracking-tight text-foreground">{value}</div>
      {helper ? <div className="mt-2 text-sm text-muted-foreground">{helper}</div> : null}
    </div>
  )
}

export function SoftSection({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("rounded-[28px] border border-border/80 bg-card p-6 shadow-[0_1px_0_rgba(17,24,39,0.02)]", className)}>
      {children}
    </div>
  )
}
