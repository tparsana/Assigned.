"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Briefcase,
  GraduationCap,
  User,
  Search,
  Home,
  Heart,
  Target,
  Calendar,
  ListOrdered,
  LayoutGrid,
  Clock,
  Bell,
  Sparkles
} from "lucide-react"
import { useTaskedState } from "@/lib/tasked-store"

const steps = [
  { id: 1, title: "Areas", description: "What areas do you want to organize?" },
  { id: 2, title: "Methods", description: "Which planning styles do you prefer?" },
  { id: 3, title: "Schedule", description: "When do you typically work?" },
  { id: 4, title: "Goals", description: "What brings you to Tasked.?" },
]

const areas = [
  { id: "work", label: "Work", icon: Briefcase },
  { id: "class", label: "Class / School", icon: GraduationCap },
  { id: "personal", label: "Personal", icon: User },
  { id: "job-search", label: "Job Search", icon: Search },
  { id: "home", label: "Home / Errands", icon: Home },
  { id: "health", label: "Health / Wellness", icon: Heart },
]

const methods = [
  { id: "top3", label: "Top 3 Method", description: "Focus on 3 high-impact tasks", icon: Target },
  { id: "timeblock", label: "Time Blocking", description: "Map tasks to time slots", icon: Calendar },
  { id: "ivylee", label: "Ivy Lee Method", description: "6 ranked tasks, work in order", icon: ListOrdered },
  { id: "kanban", label: "Kanban Board", description: "Visual workflow stages", icon: LayoutGrid },
]

const goals = [
  "Get more focused during work",
  "Stop forgetting tasks",
  "Better manage multiple projects",
  "Build consistent daily habits",
  "Reduce overwhelm and stress",
  "Improve work-life balance",
]

export default function OnboardingPage() {
  const router = useRouter()
  const { addList, lists, updateNotificationSetting, updatePreferences } = useTaskedState()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [selectedMethods, setSelectedMethods] = useState<string[]>(["top3"])
  const [workHours, setWorkHours] = useState({ start: "09:00", end: "17:00" })
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const toggleArea = (id: string) => {
    setSelectedAreas(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  const toggleMethod = (id: string) => {
    setSelectedMethods(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev => 
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    )
  }

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    } else {
      setIsLoading(true)
      window.setTimeout(() => {
        const existingListNames = new Set(lists.map((list) => list.name.toLowerCase()))

        selectedAreas.forEach((areaId) => {
          const area = areas.find((value) => value.id === areaId)
          if (!area) {
            return
          }

          const nextListName = area.label.replace(" / ", " & ")
          if (!existingListNames.has(nextListName.toLowerCase())) {
            addList(nextListName)
          }
        })

        updatePreferences({
          defaultPlanningMethod:
            selectedMethods[0] === "timeblock"
              ? "time-blocking"
              : selectedMethods[0] === "kanban"
                ? "kanban"
                : selectedMethods[0] === "ivylee"
                  ? "ivylee"
                  : "top3",
          workHours,
        })
        updateNotificationSetting("dailyPlanningReminder", true)
        router.replace("/app")
      }, 350)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1: return selectedAreas.length > 0
      case 2: return selectedMethods.length > 0
      case 3: return true
      case 4: return selectedGoals.length > 0
      default: return true
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="text-2xl font-semibold tracking-tight text-foreground">
            Tasked.
          </div>
          <div className="text-sm text-muted-foreground">
            Step {currentStep} of {steps.length}
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-muted h-1">
        <div 
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${(currentStep / steps.length) * 100}%` }}
        />
      </div>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          {/* Step 1: Areas */}
          {currentStep === 1 && (
            <div>
              <h1 className="text-3xl font-semibold text-foreground mb-2 text-center">
                What areas do you want to organize?
              </h1>
              <p className="text-muted-foreground text-center mb-10">
                Select all that apply. You can always add more later.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {areas.map((area) => (
                  <button
                    key={area.id}
                    onClick={() => toggleArea(area.id)}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${
                      selectedAreas.includes(area.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30 bg-card'
                    }`}
                  >
                    <area.icon className={`w-6 h-6 mb-3 ${selectedAreas.includes(area.id) ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className={`font-medium ${selectedAreas.includes(area.id) ? 'text-foreground' : 'text-foreground'}`}>
                      {area.label}
                    </div>
                    {selectedAreas.includes(area.id) && (
                      <CheckCircle2 className="w-5 h-5 text-primary absolute top-3 right-3" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Methods */}
          {currentStep === 2 && (
            <div>
              <h1 className="text-3xl font-semibold text-foreground mb-2 text-center">
                Which planning styles do you prefer?
              </h1>
              <p className="text-muted-foreground text-center mb-10">
                Select at least one. You can switch between methods anytime.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {methods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => toggleMethod(method.id)}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${
                      selectedMethods.includes(method.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30 bg-card'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <method.icon className={`w-8 h-8 ${selectedMethods.includes(method.id) ? 'text-primary' : 'text-muted-foreground'}`} />
                      {selectedMethods.includes(method.id) && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="mt-4 font-medium text-foreground">
                      {method.label}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {method.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Schedule */}
          {currentStep === 3 && (
            <div>
              <h1 className="text-3xl font-semibold text-foreground mb-2 text-center">
                When do you typically work?
              </h1>
              <p className="text-muted-foreground text-center mb-10">
                This helps us suggest better time blocks for your day.
              </p>
              <div className="max-w-md mx-auto space-y-8">
                <div className="flex items-center gap-6">
                  <div className="flex-1">
                    <Label htmlFor="start" className="text-foreground mb-2 block">
                      Start time
                    </Label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="start"
                        type="time"
                        value={workHours.start}
                        onChange={(e) => setWorkHours({ ...workHours, start: e.target.value })}
                        className="h-14 pl-12 bg-card border-border text-lg"
                      />
                    </div>
                  </div>
                  <div className="text-muted-foreground mt-6">to</div>
                  <div className="flex-1">
                    <Label htmlFor="end" className="text-foreground mb-2 block">
                      End time
                    </Label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="end"
                        type="time"
                        value={workHours.end}
                        onChange={(e) => setWorkHours({ ...workHours, end: e.target.value })}
                        className="h-14 pl-12 bg-card border-border text-lg"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-celeste/20 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Bell className="w-5 h-5 text-foreground mt-0.5" />
                    <div>
                      <div className="font-medium text-foreground mb-1">Daily planning reminder</div>
                      <div className="text-sm text-muted-foreground">
                        We&apos;ll send you a gentle reminder each morning to plan your day.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Goals */}
          {currentStep === 4 && (
            <div>
              <h1 className="text-3xl font-semibold text-foreground mb-2 text-center">
                What brings you to Tasked.?
              </h1>
              <p className="text-muted-foreground text-center mb-10">
                This helps us personalize your experience.
              </p>
              <div className="max-w-lg mx-auto space-y-3">
                {goals.map((goal) => (
                  <button
                    key={goal}
                    onClick={() => toggleGoal(goal)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between ${
                      selectedGoals.includes(goal)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30 bg-card'
                    }`}
                  >
                    <span className={selectedGoals.includes(goal) ? 'text-foreground' : 'text-foreground'}>
                      {goal}
                    </span>
                    {selectedGoals.includes(goal) && (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Preview Panel (Step 4 only) */}
          {currentStep === 4 && selectedGoals.length > 0 && (
            <div className="mt-10 p-6 bg-card rounded-xl border border-border">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-marigold" />
                <span className="font-medium text-foreground">Your workspace is ready</span>
              </div>
              <div className="text-sm text-muted-foreground mb-4">
                Based on your selections, we&apos;ll set up:
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedAreas.map(area => (
                  <span key={area} className="px-3 py-1 bg-celeste/30 rounded-full text-sm text-foreground capitalize">
                    {area.replace('-', ' ')}
                  </span>
                ))}
                {selectedMethods.map(method => (
                  <span key={method} className="px-3 py-1 bg-primary/10 rounded-full text-sm text-primary capitalize">
                    {method === 'top3' ? 'Top 3' : method === 'timeblock' ? 'Time Blocking' : method === 'ivylee' ? 'Ivy Lee' : 'Kanban'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="px-6 py-6 border-t border-border">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-2">
            {steps.map((step) => (
              <div 
                key={step.id}
                className={`w-2 h-2 rounded-full transition-colors ${
                  step.id === currentStep ? 'bg-primary' : step.id < currentStep ? 'bg-herb' : 'bg-border'
                }`}
              />
            ))}
          </div>
          <Button
            onClick={handleNext}
            disabled={!canProceed() || isLoading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? (
              "Setting up..."
            ) : currentStep === 4 ? (
              <>
                Finish Setup
                <Sparkles className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  )
}
