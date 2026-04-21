"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"

import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { buildAuthCallbackUrl } from "@/lib/auth-config"
import { createClient } from "@/lib/supabase/client"

export function SignInForm({ message }: { message?: string }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [showPassword, setShowPassword] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [activeMethod, setActiveMethod] = useState<"password" | "google" | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [info, setInfo] = useState(message ?? "")

  useEffect(() => {
    setInfo(message ?? "")
  }, [message])

  useEffect(() => {
    let active = true

    void supabase.auth.getUser().then(({ data }) => {
      if (!active) {
        return
      }

      if (data.user) {
        router.replace("/app")
        router.refresh()
        return
      }

      setIsCheckingSession(false)
    })

    return () => {
      active = false
    }
  }, [router, supabase])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setInfo("")
    setActiveMethod("password")

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setActiveMethod(null)
      return
    }

    router.replace("/app")
    router.refresh()
  }

  const handleGoogleSignIn = async () => {
    setError("")
    setInfo("")
    setActiveMethod("google")

    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: buildAuthCallbackUrl("/app"),
      },
    })

    if (oauthError) {
      setError(oauthError.message)
      setActiveMethod(null)
      return
    }

    if (data.url) {
      window.location.assign(data.url)
      return
    }

    setActiveMethod(null)
  }

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            <div className="mb-10">
              <BrandMark href="/" className="text-2xl text-foreground" />
            </div>

            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <div className="text-lg font-medium text-foreground">Opening your workspace...</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Checking this device and restoring your session.
              </p>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex flex-1 bg-primary items-center justify-center p-12">
          <div className="max-w-md text-center">
            <div className="text-5xl font-semibold text-primary-foreground mb-6">
              Work stays aligned
            </div>
            <p className="text-primary-foreground/80 text-lg">
              Assigned keeps Samaya&apos;s projects, teams, and daily follow-through moving through one shared system.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10">
            <BrandMark href="/" className="text-2xl text-foreground" />
          </div>

          <h1 className="text-2xl font-semibold text-foreground mb-2">Sign in to Assigned</h1>
          <p className="text-muted-foreground mb-8">
            Access Samaya&apos;s task and assignment workspace.
          </p>

          <Button
            type="button"
            variant="outline"
            className="h-12 w-full justify-center gap-3 border-border bg-card"
            onClick={handleGoogleSignIn}
            disabled={activeMethod !== null}
          >
            {activeMethod === "google" ? "Redirecting to Google..." : "Continue with Google"}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-[0.28em]">
              <span className="bg-background px-3 text-muted-foreground">or use email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="h-12 bg-card border-border focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="h-12 bg-card border-border focus:border-primary pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {info && <p className="text-sm text-muted-foreground">{info}</p>}

            <Button
              type="submit"
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
              disabled={activeMethod !== null}
            >
              {activeMethod === "password" ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup" className="text-foreground hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-primary items-center justify-center p-12">
        <div className="max-w-md">
          <div className="text-5xl font-semibold text-primary-foreground mb-6">
            Supabase auth is back
          </div>
          <div className="space-y-4 text-primary-foreground/85">
            {[
              "Email and password auth run through Supabase.",
              "Google OAuth is available from the same sign-in screen.",
              "The app shell and state sync stay aligned with the new Supabase project.",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 px-4 py-4">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
