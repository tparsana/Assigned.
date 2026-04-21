"use client"

import { useEffect, useState } from "react"

import type { ProjectSite, TeamDraft, TeamMemberSummary } from "@/lib/team-data"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type CreateTeamModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  members: TeamMemberSummary[]
  projects: ProjectSite[]
  initialDraft: TeamDraft
  onSave: (draft: TeamDraft) => void
}

export function CreateTeamModal({
  open,
  onOpenChange,
  mode,
  members,
  projects,
  initialDraft,
  onSave,
}: CreateTeamModalProps) {
  const [draft, setDraft] = useState<TeamDraft>(initialDraft)

  useEffect(() => {
    if (open) {
      setDraft(initialDraft)
    }
  }, [initialDraft, open])

  const handleProjectToggle = (projectId: string) => {
    setDraft((current) => ({
      ...current,
      defaultProjectIds: current.defaultProjectIds.includes(projectId)
        ? current.defaultProjectIds.filter((value) => value !== projectId)
        : [...current.defaultProjectIds, projectId],
    }))
  }

  const handleSave = () => {
    onSave({
      ...draft,
      name: draft.name.trim(),
      description: draft.description.trim(),
      parentDepartment: draft.parentDepartment.trim(),
      icon: draft.icon.trim(),
      color: draft.color.trim(),
    })
    onOpenChange(false)
  }

  const submitDisabled = !draft.name.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Team" : "Edit Team"}</DialogTitle>
          <DialogDescription>
            Define the organizational group, its lead, default projects, and visual identity.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="team-name">Team Name</Label>
            <Input
              id="team-name"
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="Site Operations"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-lead">Team Lead</Label>
            <select
              id="team-lead"
              value={draft.leadUserId ?? ""}
              onChange={(event) => setDraft((current) => ({ ...current, leadUserId: event.target.value || null }))}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">Unassigned</option>
              {members
                .filter((member) => member.status === "active" && member.accessLevel !== "external")
                .map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.fullName}
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="team-description">Description</Label>
            <Textarea
              id="team-description"
              value={draft.description}
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              placeholder="Runs site execution and day-to-day coordination."
              className="min-h-28"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-parent">Parent Department</Label>
            <Input
              id="team-parent"
              value={draft.parentDepartment}
              onChange={(event) => setDraft((current) => ({ ...current, parentDepartment: event.target.value }))}
              placeholder="Operations"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="team-color">Team Color</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="team-color"
                  type="color"
                  value={draft.color}
                  onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value }))}
                  className="h-10 w-14 p-1"
                />
                <Input
                  value={draft.color}
                  onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value }))}
                  placeholder="#1f7a53"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="team-icon">Team Icon</Label>
              <Input
                id="team-icon"
                value={draft.icon}
                onChange={(event) => setDraft((current) => ({ ...current, icon: event.target.value }))}
                placeholder="hard-hat"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Default Projects / Sites</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {projects.map((project) => (
              <label
                key={project.id}
                className="flex items-start gap-3 rounded-2xl border border-border bg-muted/20 px-4 py-3 text-sm text-foreground"
              >
                <input
                  type="checkbox"
                  checked={draft.defaultProjectIds.includes(project.id)}
                  onChange={() => handleProjectToggle(project.id)}
                  className="mt-1"
                />
                <span>
                  <span className="block font-medium">{project.name}</span>
                  <span className="text-muted-foreground">{project.locationText ?? "Project"}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={submitDisabled}>
            {mode === "create" ? "Create Team" : "Save Team"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
