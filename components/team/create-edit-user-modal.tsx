"use client"

import { useEffect, useMemo, useState } from "react"

import { assignedAccessLevelDefinitions, type AssignedAccessLevel } from "@/lib/assigned-access"
import {
  getPositionsForTeam,
  type PositionDefinition,
  type ProjectSite,
  type TeamDefinition,
  type TeamMemberSummary,
  type TeamUserDraft,
} from "@/lib/team-data"
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

type CreateEditUserModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  teams: TeamDefinition[]
  members: TeamMemberSummary[]
  projects: ProjectSite[]
  positions: PositionDefinition[]
  initialDraft: TeamUserDraft
  onSave: (draft: TeamUserDraft) => void
  accessLevelOptions?: AssignedAccessLevel[]
  allowAccessEdits?: boolean
}

export function CreateEditUserModal({
  open,
  onOpenChange,
  mode,
  teams,
  members,
  projects,
  positions,
  initialDraft,
  onSave,
  accessLevelOptions = assignedAccessLevelDefinitions.map((item) => item.value),
  allowAccessEdits = true,
}: CreateEditUserModalProps) {
  const [draft, setDraft] = useState<TeamUserDraft>(initialDraft)

  useEffect(() => {
    if (open) {
      setDraft(initialDraft)
    }
  }, [initialDraft, open])

  const positionOptions = useMemo(
    () => getPositionsForTeam(draft.teamId, positions),
    [draft.teamId, positions]
  )

  useEffect(() => {
    if (!draft.teamId) {
      if (draft.positionId) {
        setDraft((current) => ({
          ...current,
          positionId: null,
        }))
      }
      return
    }

    if (draft.positionId && !positionOptions.some((position) => position.id === draft.positionId)) {
      setDraft((current) => ({
        ...current,
        positionId: positionOptions[0]?.id ?? null,
      }))
    }
  }, [draft.positionId, draft.teamId, positionOptions])

  const managerOptions = useMemo(
    () =>
      members.filter((member) => member.status === "active" && member.accessLevel !== "external"),
    [members]
  )

  const handleProjectToggle = (projectId: string) => {
    setDraft((current) => {
      const nextProjectIds = current.projectIds.includes(projectId)
        ? current.projectIds.filter((value) => value !== projectId)
        : [...current.projectIds, projectId]

      return {
        ...current,
        projectIds: nextProjectIds,
        primaryProjectId:
          current.primaryProjectId && nextProjectIds.includes(current.primaryProjectId)
            ? current.primaryProjectId
            : nextProjectIds[0] ?? null,
      }
    })
  }

  const handleSave = () => {
    onSave({
      ...draft,
      fullName: draft.fullName.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      avatarUrl: draft.avatarUrl.trim(),
    })
    onOpenChange(false)
  }

  const submitDisabled = !draft.fullName.trim() || !draft.email.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add User" : "Edit User"}</DialogTitle>
          <DialogDescription>
            Keep access level, team, and position separate so permissions and organization stay clean.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="user-name">Name</Label>
            <Input
              id="user-name"
              value={draft.fullName}
              onChange={(event) => setDraft((current) => ({ ...current, fullName: event.target.value }))}
              placeholder="Mukund Parsana"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              type="email"
              value={draft.email}
              onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
              placeholder="name@samaya.in"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-phone">Phone</Label>
            <Input
              id="user-phone"
              value={draft.phone}
              onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
              placeholder="+91 98765 00000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-avatar">Profile Photo</Label>
            <Input
              id="user-avatar"
              value={draft.avatarUrl}
              onChange={(event) => setDraft((current) => ({ ...current, avatarUrl: event.target.value }))}
              placeholder="Image URL"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-access-level">Access Level</Label>
            <select
              id="user-access-level"
              value={draft.accessLevel}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  accessLevel: event.target.value as AssignedAccessLevel,
                }))
              }
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
              disabled={!allowAccessEdits}
            >
              {accessLevelOptions.map((accessLevel) => (
                <option key={accessLevel} value={accessLevel}>
                  {assignedAccessLevelDefinitions.find((item) => item.value === accessLevel)?.label ?? accessLevel}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-team">Team</Label>
            <select
              id="user-team"
              value={draft.teamId ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  teamId: event.target.value || null,
                  positionId: null,
                }))
              }
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
              disabled={!allowAccessEdits}
            >
              <option value="">Awaiting assignment</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-position">Position</Label>
            <select
              id="user-position"
              value={draft.positionId ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  positionId: event.target.value || null,
                }))
              }
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
              disabled={!allowAccessEdits}
            >
              <option value="">Awaiting assignment</option>
              {positionOptions.map((position) => (
                <option key={position.id} value={position.id}>{position.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-manager">Manager / Team Lead</Label>
            <select
              id="user-manager"
              value={draft.managerUserId ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  managerUserId: event.target.value || null,
                }))
              }
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
              disabled={!allowAccessEdits}
            >
              <option value="">Unassigned</option>
              {managerOptions.map((manager) => (
                <option key={manager.userId} value={manager.userId}>
                  {manager.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-status">Status</Label>
            <select
              id="user-status"
              value={draft.status}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  status: event.target.value as TeamUserDraft["status"],
                }))
              }
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-availability">Availability</Label>
            <select
              id="user-availability"
              value={draft.availability}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  availability: event.target.value as TeamUserDraft["availability"],
                }))
              }
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Assigned Projects / Sites</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {projects.map((project) => (
              <label
                key={project.id}
                className="flex items-start gap-3 rounded-2xl border border-border bg-muted/20 px-4 py-3 text-sm text-foreground"
              >
                <input
                  type="checkbox"
                  checked={draft.projectIds.includes(project.id)}
                  onChange={() => handleProjectToggle(project.id)}
                  className="mt-1"
                />
                <span className="flex-1">
                  <span className="block font-medium">{project.name}</span>
                  <span className="text-muted-foreground">{project.locationText ?? "Project"}</span>
                  {draft.projectIds.includes(project.id) ? (
                    <button
                      type="button"
                      className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] ${
                        draft.primaryProjectId === project.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground"
                      }`}
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          primaryProjectId: project.id,
                        }))
                      }
                    >
                      {draft.primaryProjectId === project.id ? "Primary project" : "Make primary"}
                    </button>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="user-notes">Assignment Notes</Label>
          <Textarea
            id="user-notes"
            value={`Team: ${teams.find((team) => team.id === draft.teamId)?.name ?? "Awaiting assignment"}\nPosition: ${positions.find((position) => position.id === draft.positionId)?.name ?? "Awaiting assignment"}\nPrimary project: ${projects.find((project) => project.id === draft.primaryProjectId)?.name ?? "Not selected"}`}
            readOnly
            className="min-h-24 resize-none"
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={submitDisabled}>
            {mode === "create" ? "Create User" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
