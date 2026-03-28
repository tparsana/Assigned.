"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, CheckCircle2 } from "lucide-react"

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate loading then redirect to onboarding
    setTimeout(() => {
      window.location.href = '/onboarding'
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10">
            <Link href="/" className="text-2xl font-semibold tracking-tight text-foreground">
              Tasked.
            </Link>
          </div>

          <h1 className="text-2xl font-semibold text-foreground mb-2">Create your account</h1>
          <p className="text-muted-foreground mb-8">Start planning with clarity today</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
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
                  className="h-12 bg-card border-border focus:border-primary pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create Account"}
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

      {/* Right side - Visual */}
      <div className="hidden lg:flex flex-1 bg-primary items-center justify-center p-12">
        <div className="max-w-md">
          <div className="text-4xl font-semibold text-primary-foreground mb-8">
            Why Tasked.?
          </div>
          <ul className="space-y-4">
            {[
              "AI-powered task capture from photos",
              "Multiple planning methods in one app",
              "Clean, calm interface for daily use",
              "Insights that help you improve",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
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
