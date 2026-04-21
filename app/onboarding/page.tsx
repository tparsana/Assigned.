"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, CheckCircle2, Clock3, Phone, UserRound } from "lucide-react"

import { useAssignedAccess } from "@/components/assigned-access-provider"
import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function OnboardingPage() {
  const router = useRouter()
  const {
    loading,
    onboardingCompleted,
    profile,
    completeOnboarding,
  } = useAssignedAccess()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [timezone, setTimezone] = useState("America/Phoenix")
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setFirstName(profile.firstName)
    setLastName(profile.lastName)
    setPhone(profile.phone ?? "")
    setTimezone(profile.timezone || "America/Phoenix")
  }, [profile.firstName, profile.lastName, profile.phone, profile.timezone])

  useEffect(() => {
    if (!loading && onboardingCompleted) {
      router.replace("/app")
    }
  }, [loading, onboardingCompleted, router])

  const profileName = useMemo(
    () => `${firstName} ${lastName}`.trim(),
    [firstName, lastName]
  )

  const handleSubmit = async () => {
    setIsSaving(true)
    setError("")

    const result = await completeOnboarding({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() || null,
      timezone,
    })

    setIsSaving(false)

    if (result.error) {
      setError(result.error)
      return
    }

    router.replace("/app")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center">
          <div className="text-lg font-medium text-foreground">Preparing onboarding...</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Loading your workspace and account details.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <BrandMark href="/" className="text-2xl text-foreground" />
          <div className="text-sm text-muted-foreground">Basic profile setup</div>
        </div>
      </header>

      <main className="px-6 py-12">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_0.88fr]">
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                Finish your Assigned setup
              </h1>
              <p className="mt-3 max-w-2xl text-base text-muted-foreground">
                Everyone joins the same way. Access level, team, position, and project assignments are handled later by admins.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-border/80 bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">You start as an employee</div>
                    <div className="text-sm text-muted-foreground">No permission guessing during signup</div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border/80 bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <Clock3 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Awaiting assignment is expected</div>
                    <div className="text-sm text-muted-foreground">Admins can place you into the org later</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-border/80 bg-card p-6 shadow-[0_1px_0_rgba(17,24,39,0.02)]">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium text-foreground">What happens next</div>
                  <div className="text-sm text-muted-foreground">
                    After this, you’ll enter the workspace. If your team, position, or projects aren’t assigned yet, Assigned will show a clean awaiting-assignment state.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-border/80 bg-card p-6 shadow-[0_1px_0_rgba(17,24,39,0.02)]">
            <div className="mb-6">
              <div className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Profile</div>
              <div className="mt-2 text-2xl font-semibold text-foreground">
                {profileName || profile.email || "Assigned user"}
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First Name</Label>
                  <Input
                    id="first-name"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    placeholder="Tanish"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input
                    id="last-name"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    placeholder="Parsana"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile.email} disabled readOnly />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+91 98765 00000"
                    className="pl-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-foreground"
                >
                  <option value="America/Phoenix">Arizona</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="Asia/Kolkata">India Standard Time</option>
                </select>
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <Button
                className="h-12 w-full rounded-xl"
                onClick={() => void handleSubmit()}
                disabled={isSaving || !firstName.trim()}
              >
                {isSaving ? "Finishing setup..." : "Enter Assigned"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
