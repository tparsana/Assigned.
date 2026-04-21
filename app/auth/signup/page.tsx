"use client"

import Link from "next/link"
import { useMemo, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, CheckCircle2 } from "lucide-react"

import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { buildAuthCallbackUrl } from "@/lib/auth-config"
import { createClient } from "@/lib/supabase/client"

export default function SignUpPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [showPassword, setShowPassword] = useState(false)
  const [activeMethod, setActiveMethod] = useState<"password" | "google" | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setInfo("")
    setActiveMethod("password")

    const trimmedName = name.trim()
    const [firstName = "", ...rest] = trimmedName.split(/\s+/)
    const lastName = rest.join(" ")

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: buildAuthCallbackUrl("/onboarding"),
        data: {
          full_name: trimmedName,
          first_name: firstName,
          last_name: lastName,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setActiveMethod(null)
      return
    }

    if (!data.session) {
      setInfo("Check your email to confirm your account and continue to onboarding.")
      setActiveMethod(null)
      return
    }

    router.replace("/onboarding")
    router.refresh()
  }

  const handleGoogleSignUp = async () => {
    setError("")
    setInfo("")
    setActiveMethod("google")

    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: buildAuthCallbackUrl("/onboarding"),
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

  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10">
            <BrandMark href="/" className="text-2xl text-foreground" />
          </div>

          <h1 className="text-2xl font-semibold text-foreground mb-2">Create your Assigned account</h1>
          <p className="text-muted-foreground mb-8">
            Start with Samaya&apos;s internal workspace and grow from there.
          </p>

          <Button
            type="button"
            variant="outline"
            className="h-12 w-full justify-center gap-3 border-border bg-card"
            onClick={handleGoogleSignUp}
            disabled={activeMethod !== null}
          >
            {activeMethod === "google" ? "Redirecting to Google..." : "Continue with Google"}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-[0.28em]">
              <span className="bg-background px-3 text-muted-foreground">or sign up with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="h-12 bg-card border-border focus:border-primary"
              />
            </div>

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
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
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
              <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {info && <p className="text-sm text-muted-foreground">{info}</p>}

            <Button
              type="submit"
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
              disabled={activeMethod !== null}
            >
              {activeMethod === "password" ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="mt-6 text-xs text-muted-foreground text-center">
            By creating an account, you agree to our{" "}
            <Link href="#" className="text-foreground hover:underline">Terms</Link>
            {" "}and{" "}
            <Link href="#" className="text-foreground hover:underline">Privacy Policy</Link>
          </p>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/signin" className="text-foreground hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-primary items-center justify-center p-12">
        <div className="max-w-md">
          <div className="text-4xl font-semibold text-primary-foreground mb-8">
            Why Assigned?
          </div>
          <ul className="space-y-4">
            {[
              "A single operations workspace for projects, teams, and assignments",
              "Flexible planning views that can evolve into collaborative workflows",
              "AI-assisted capture for notes, lists, and incoming requests",
              "Google auth and email auth both flow through Supabase now",
            ].map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-celeste mt-0.5" />
                <span className="text-primary-foreground/90">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
