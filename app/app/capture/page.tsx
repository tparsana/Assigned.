"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
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
  X
} from "lucide-react"

type CaptureState = "idle" | "uploading" | "processing" | "review"

interface ExtractedTask {
  id: number
  title: string
  suggestedCategory: string
  suggestedDate: string | null
  confidence: number
  selected: boolean
}

const sampleExtractedTasks: ExtractedTask[] = [
  { id: 1, title: "Call supplier about order delay", suggestedCategory: "Work", suggestedDate: "Today", confidence: 95, selected: true },
  { id: 2, title: "Send invoice to Acme Corp", suggestedCategory: "Work", suggestedDate: "Tomorrow", confidence: 88, selected: true },
  { id: 3, title: "Prepare Q2 budget report", suggestedCategory: "Work", suggestedDate: "This week", confidence: 92, selected: true },
  { id: 4, title: "Book flights for conference", suggestedCategory: "Personal", suggestedDate: "Next week", confidence: 72, selected: true },
]

export default function CapturePage() {
  const [state, setState] = useState<CaptureState>("idle")
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTask[]>([])
  const [dragActive, setDragActive] = useState(false)

  const handleUpload = () => {
    setState("uploading")
    setTimeout(() => {
      setState("processing")
      setTimeout(() => {
        setExtractedTasks(sampleExtractedTasks)
        setState("review")
      }, 2000)
    }, 1500)
  }

  const toggleTask = (id: number) => {
    setExtractedTasks(prev => prev.map(t => 
      t.id === id ? { ...t, selected: !t.selected } : t
    ))
  }

  const removeTask = (id: number) => {
    setExtractedTasks(prev => prev.filter(t => t.id !== id))
  }

  const saveToInbox = () => {
    const selected = extractedTasks.filter(t => t.selected)
    // In a real app, this would save to the database
    alert(`${selected.length} tasks saved to inbox!`)
    setState("idle")
    setExtractedTasks([])
  }

  const resetCapture = () => {
    setState("idle")
    setExtractedTasks([])
  }

  return (
    <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
          <Camera className="w-7 h-7" />
          Capture
        </h1>
        <p className="text-muted-foreground mt-1">
          Turn photos of handwritten notes into structured tasks
        </p>
      </div>

      {state === "idle" && (
        <div className="max-w-2xl mx-auto">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => { e.preventDefault(); setDragActive(false); handleUpload() }}
          >
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Camera className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Upload your notes
            </h2>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Take a photo or upload an image of your handwritten notes, and AI will extract tasks for you
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleUpload}
              >
                <Camera className="w-5 h-5 mr-2" />
                Take Photo
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-border"
                onClick={handleUpload}
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Image
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-6">
              Supports JPG, PNG, and HEIC files up to 10MB
            </p>
          </div>

          {/* Tips */}
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {[
              { title: "Clear handwriting", desc: "Write clearly for best results" },
              { title: "Good lighting", desc: "Ensure the image is well-lit" },
              { title: "One topic per note", desc: "Separate tasks work better" },
            ].map((tip, i) => (
              <div key={i} className="p-4 bg-card rounded-xl border border-border">
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
            {state === "uploading" ? "Uploading image..." : "Processing with AI..."}
          </h2>
          <p className="text-muted-foreground">
            {state === "uploading" 
              ? "Please wait while we upload your image" 
              : "Extracting tasks from your handwritten notes"
            }
          </p>
        </div>
      )}

      {state === "review" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Image Preview */}
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Uploaded Image</h2>
              <Button variant="ghost" size="sm" onClick={resetCapture}>
                <X className="w-4 h-4 mr-1" />
                Remove
              </Button>
            </div>
            <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <span className="text-sm text-muted-foreground">Handwritten notes image</span>
              </div>
            </div>
          </div>

          {/* Extracted Tasks */}
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-marigold" />
                <h2 className="font-semibold text-foreground">Extracted Tasks</h2>
              </div>
              <span className="text-sm text-muted-foreground">
                {extractedTasks.filter(t => t.selected).length} selected
              </span>
            </div>

            <div className="space-y-3 mb-6">
              {extractedTasks.map(task => (
                <div
                  key={task.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    task.selected 
                      ? 'bg-primary/5 border-primary/20' 
                      : 'bg-muted/50 border-border'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors mt-0.5 ${
                        task.selected 
                          ? 'border-primary bg-primary' 
                          : 'border-border'
                      }`}
                    >
                      {task.selected && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                    </button>
                    <div className="flex-1">
                      <div className="font-medium text-foreground text-sm">
                        {task.title}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-celeste/30 rounded text-xs text-foreground">
                          <FolderOpen className="w-3 h-3" />
                          {task.suggestedCategory}
                        </span>
                        {task.suggestedDate && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs text-foreground">
                            <Calendar className="w-3 h-3" />
                            {task.suggestedDate}
                          </span>
                        )}
                        {task.confidence < 80 && (
                          <span className="inline-flex items-center gap-1 text-xs text-marigold">
                            <AlertCircle className="w-3 h-3" />
                            {task.confidence}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 text-muted-foreground hover:text-foreground rounded">
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
              ))}

              <button className="w-full p-3 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors flex items-center justify-center gap-2 text-sm">
                <Plus className="w-4 h-4" />
                Add task manually
              </button>
            </div>

            <div className="flex items-center gap-3">
              <Button 
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={saveToInbox}
                disabled={extractedTasks.filter(t => t.selected).length === 0}
              >
                Save to Inbox
              </Button>
              <Button 
                variant="outline" 
                className="border-border"
                onClick={resetCapture}
              >
                Capture Another
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
