"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Camera,
  Upload,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  Edit2,
  Trash2,
  FolderOpen,
  Calendar,
  AlertCircle,
  Loader2,
  Plus,
  X,
} from "lucide-react"
import { format } from "date-fns"
import { formatTaskDateLabel, useTaskedState } from "@/lib/tasked-store"

type CaptureState = "idle" | "uploading" | "processing" | "review"
const LIFE_LIST_ID = "__life__"

interface ExtractedTask {
  id: number
  title: string
  suggestedListId: string
  suggestedDate: string | null
  confidence: number
  selected: boolean
}

export default function CapturePage() {
  const { addTask, addList, lists, todayKey } = useTaskedState()
  const cameraInputRef = useRef<HTMLInputElement | null>(null)
  const uploadInputRef = useRef<HTMLInputElement | null>(null)
  const [state, setState] = useState<CaptureState>("idle")
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTask[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [manualTaskTitle, setManualTaskTitle] = useState("")
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [editingTaskTitle, setEditingTaskTitle] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const startProcessing = async (file: File) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setErrorMessage("")
    const nextPreviewUrl = URL.createObjectURL(file)
    setPreviewUrl(nextPreviewUrl)
    setState("uploading")
    window.setTimeout(async () => {
      setState("processing")
      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append(
          "lists",
          JSON.stringify(lists.map((list) => ({ id: list.id, name: list.name })))
        )
        formData.append("today", format(new Date(), "yyyy-MM-dd"))

        const response = await fetch("/api/capture/analyze", {
          method: "POST",
          body: formData,
        })
        const payload = (await response.json()) as {
          error?: string
          tasks?: Array<{
            title: string
            suggestedListId: string
            suggestedDate: string | null
            confidence: number
          }>
        }

        if (!response.ok) {
          throw new Error(payload.error ?? "Task extraction failed.")
        }

        setExtractedTasks(
          (payload.tasks ?? []).map((task, index) => ({
            id: Date.now() + index,
            ...task,
            selected: true,
          }))
        )
        setState("review")
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Task extraction failed.")
        URL.revokeObjectURL(nextPreviewUrl)
        setPreviewUrl(null)
        setExtractedTasks([])
        setState("idle")
      }
    }, 700)
  }

  const onSelectFile = (file: File | undefined | null) => {
    if (!file) {
      return
    }

    void startProcessing(file)
  }

  const toggleTask = (id: number) => {
    setExtractedTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, selected: !task.selected } : task
      )
    )
  }

  const removeTask = (id: number) => {
    setExtractedTasks((current) => current.filter((task) => task.id !== id))
  }

  const saveReviewedTasks = () => {
    let lifeListId = lists.find((list) => list.name.trim().toLowerCase() === "life")?.id ?? null

    extractedTasks
      .filter((task) => task.selected)
      .forEach((task) => {
        if (task.suggestedListId === LIFE_LIST_ID && !lifeListId) {
          lifeListId = addList("Life")
        }

        addTask({
          title: task.title,
          listId: task.suggestedListId === LIFE_LIST_ID ? lifeListId ?? "" : task.suggestedListId,
          plannedDate: task.suggestedDate,
          dueDate: task.suggestedDate,
          boardColumn: task.suggestedDate === todayKey ? "today" : "waiting",
          source: "image",
          priority: "none",
        })
      })

    resetCapture()
  }

  const resetCapture = () => {
    setState("idle")
    setExtractedTasks([])
    setManualTaskTitle("")
    setEditingTaskId(null)
    setEditingTaskTitle("")
    setErrorMessage("")
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  const addManualExtractedTask = () => {
    const title = manualTaskTitle.trim()
    if (!title) {
      return
    }

    setExtractedTasks((current) => [
      ...current,
      {
        id: Date.now(),
        title,
        suggestedListId: lists[0]?.id ?? "",
        suggestedDate: format(new Date(), "yyyy-MM-dd"),
        confidence: 100,
        selected: true,
      },
    ])
    setManualTaskTitle("")
  }

  const startEditingTask = (task: ExtractedTask) => {
    setEditingTaskId(task.id)
    setEditingTaskTitle(task.title)
  }

  const saveEditedTask = (taskId: number) => {
    const title = editingTaskTitle.trim()
    if (!title) {
      return
    }

    setExtractedTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, title } : task
      )
    )
    setEditingTaskId(null)
    setEditingTaskTitle("")
  }

  const updateSuggestedList = (taskId: number, suggestedListId: string) => {
    setExtractedTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, suggestedListId } : task))
    )
  }

  return (
    <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
          <Camera className="w-7 h-7" />
          Capture
        </h1>
        <p className="text-muted-foreground mt-1">
          Turn photos of handwritten notes into reviewable tasks
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => onSelectFile(event.target.files?.[0])}
      />
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => onSelectFile(event.target.files?.[0])}
      />

      {state === "idle" && (
        <div className="max-w-2xl mx-auto">
          <div
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
            onDragOver={(event) => {
              event.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(event) => {
              event.preventDefault()
              setDragActive(false)
              onSelectFile(event.dataTransfer.files?.[0])
            }}
          >
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Camera className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Upload your notes</h2>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Take a photo or upload an image of your handwritten notes, then review and edit the extracted tasks before adding them.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 sm:min-w-[180px]"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="w-5 h-5 mr-2" />
                Take Photo
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-border sm:min-w-[180px]"
                onClick={() => uploadInputRef.current?.click()}
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Image
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-6">
              Supports JPG, PNG, and HEIC files up to 10MB
            </p>
          </div>

          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {[
              { title: "Clear handwriting", desc: "Write clearly for best review results" },
              { title: "Good lighting", desc: "Make sure the page is evenly lit" },
              { title: "Review before adding", desc: "Only selected tasks will be added" },
            ].map((tip, index) => (
              <div key={index} className="p-4 bg-card rounded-xl border border-border">
                <h3 className="font-medium text-foreground text-sm">{tip.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(state === "uploading" || state === "processing") && (
        <div className="max-w-md mx-auto text-center py-16">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {state === "uploading" ? "Uploading image..." : "Extracting tasks..."}
          </h2>
          <p className="text-muted-foreground">
            {state === "uploading"
              ? "Please wait while the image is prepared."
              : "Building a reviewable set of tasks from your note."}
          </p>
        </div>
      )}

      {state === "review" && (
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Uploaded Image</h2>
              <Button variant="ghost" size="sm" onClick={resetCapture}>
                <X className="w-4 h-4 mr-1" />
                Remove
              </Button>
            </div>
            <div className="aspect-[4/3] bg-muted rounded-lg overflow-hidden relative">
              {previewUrl ? (
                <Image src={previewUrl} alt="Uploaded notes" fill className="object-cover" />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <span className="text-sm text-muted-foreground">Handwritten notes image</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-marigold" />
                <h2 className="font-semibold text-foreground">Review Tasks</h2>
              </div>
              <span className="text-sm text-muted-foreground">
                {extractedTasks.filter((task) => task.selected).length} selected
              </span>
            </div>

            <div className="space-y-3 mb-6">
              {extractedTasks.map((task) => {
                const list =
                  task.suggestedListId === LIFE_LIST_ID
                    ? { name: "Life" }
                    : lists.find((value) => value.id === task.suggestedListId)

                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      task.selected
                        ? "bg-primary/5 border-primary/20"
                        : "bg-muted/50 border-border"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors mt-0.5 ${
                          task.selected
                            ? "border-primary bg-primary"
                            : "border-border"
                        }`}
                      >
                        {task.selected && (
                          <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                        )}
                      </button>
                      <div className="flex-1">
                        {editingTaskId === task.id ? (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Input
                              value={editingTaskTitle}
                              onChange={(event) => setEditingTaskTitle(event.target.value)}
                              className="h-8"
                            />
                            <Button size="sm" variant="outline" className="border-border" onClick={() => saveEditedTask(task.id)}>
                              Save
                            </Button>
                          </div>
                        ) : (
                          <div className="font-medium text-foreground text-sm">{task.title}</div>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-celeste/30 rounded text-xs text-foreground">
                            <FolderOpen className="w-3 h-3" />
                            {list?.name ?? "No list"}
                          </span>
                          {task.suggestedDate && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs text-foreground">
                              <Calendar className="w-3 h-3" />
                              {formatTaskDateLabel(task.suggestedDate)}
                            </span>
                          )}
                          {task.confidence < 80 && (
                            <span className="inline-flex items-center gap-1 text-xs text-marigold">
                              <AlertCircle className="w-3 h-3" />
                              {task.confidence}% confidence
                            </span>
                          )}
                        </div>
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                          <label className="text-xs font-medium text-muted-foreground">List</label>
                          <select
                            value={task.suggestedListId}
                            onChange={(event) => updateSuggestedList(task.id, event.target.value)}
                            className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
                          >
                            {lists.map((listOption) => (
                              <option key={listOption.id} value={listOption.id}>
                                {listOption.name}
                              </option>
                            ))}
                            <option value={LIFE_LIST_ID}>Life</option>
                          </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditingTask(task)}
                          className="p-1.5 text-muted-foreground hover:text-foreground rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeTask(task.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}

              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  value={manualTaskTitle}
                  onChange={(event) => setManualTaskTitle(event.target.value)}
                  placeholder="Add one more task manually"
                />
                <Button variant="outline" className="border-border" onClick={addManualExtractedTask}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add task
                </Button>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3">
              <Button
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={saveReviewedTasks}
                disabled={extractedTasks.filter((task) => task.selected).length === 0}
              >
                Add Selected Tasks
              </Button>
              <Button variant="outline" className="border-border sm:flex-none" onClick={resetCapture}>
                Capture Another
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
