"use client"

import { useEffect, useState } from "react"

import type { PositionDraft, TeamDefinition } from "@/lib/team-data"
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

type CreatePositionModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  teams: TeamDefinition[]
  initialDraft: PositionDraft
  onSave: (draft: PositionDraft) => void
}

export function CreatePositionModal({
  open,
  onOpenChange,
  teams,
  initialDraft,
  onSave,
}: CreatePositionModalProps) {
  const [draft, setDraft] = useState<PositionDraft>(initialDraft)

  useEffect(() => {
    if (open) {
      setDraft(initialDraft)
    }
  }, [initialDraft, open])

  const submitDisabled = !draft.name.trim() || !draft.teamId

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Position</DialogTitle>
          <DialogDescription>
            Add a reusable job title to one team so future member assignments stay structured.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="position-name">Position Name</Label>
            <Input
              id="position-name"
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="Site Engineer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position-team">Team</Label>
            <select
              id="position-team"
              value={draft.teamId ?? ""}
              onChange={(event) => setDraft((current) => ({ ...current, teamId: event.target.value || null }))}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">Select team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="position-description">Description</Label>
            <Textarea
              id="position-description"
              value={draft.description}
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              placeholder="Responsible for site coordination, execution follow-through, and reporting."
              className="min-h-28"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(draft)
              onOpenChange(false)
            }}
            disabled={submitDisabled}
          >
            Create Position
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
