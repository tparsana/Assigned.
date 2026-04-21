"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

import type { WorkspaceMemberOption } from "@/lib/task-data"
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
import { Textarea } from "@/components/ui/textarea"

type CreateProjectDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  members: WorkspaceMemberOption[]
}

async function readJson<T>(response: Response) {
  return (await response.json().catch(() => ({}))) as T
}

export function CreateProjectDialog({ open, onOpenChange, members }: CreateProjectDialogProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    name: "",
    description: "",
    locationText: "",
    status: "planning",
    leadUserId: "",
    startDate: "",
    endDate: "",
  })

  useEffect(() => {
    if (!open) {
      return
    }

    setError("")
    setForm({
      name: "",
      description: "",
      locationText: "",
      status: "planning",
      leadUserId: "",
      startDate: "",
      endDate: "",
    })
  }, [open])

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("Project name is required.")
      return
    }

    setSaving(true)
    setError("")

    const response = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: form.name.trim(),
        description: form.description.trim() || null,
        locationText: form.locationText.trim() || null,
        status: form.status,
        leadUserId: form.leadUserId || null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      }),
    })
    const result = await readJson<{ error?: string }>(response)
    setSaving(false)

    if (!response.ok) {
      setError(result.error ?? "Unable to create the project.")
      return
    }

    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
          <DialogDescription>Projects are optional shared contexts for groups of tasks.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Project name</label>
            <Input
              autoFocus
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Antarvan"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Description</label>
            <Textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Short summary of what this project covers."
              className="min-h-28"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Location</label>
              <Input
                value={form.locationText}
                onChange={(event) => setForm((current) => ({ ...current, locationText: event.target.value }))}
                placeholder="Pune office, Ahmedabad, remote, etc."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Status</label>
              <select
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="handover">Handover</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-1">
              <label className="text-sm font-medium text-foreground">Lead</label>
              <select
                value={form.leadUserId}
                onChange={(event) => setForm((current) => ({ ...current, leadUserId: event.target.value }))}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
              >
                <option value="">No lead yet</option>
                {members.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Start date</label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">End date</label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
              />
            </div>
          </div>

          {error ? <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div> : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
