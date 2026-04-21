"use client"

import Link from "next/link"
import { useMemo, useState, type FormEvent } from "react"
import { ArrowLeft, Mail } from "lucide-react"

import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { buildAuthCallbackUrl } from "@/lib/auth-config"
import { createClient } from "@/lib/supabase/client"

export default function ForgotPasswordPage() {
  const supabase = useMemo(() => createClient(), [])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setIsLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: buildAuthCallbackUrl("/auth/update-password"),
    })

    setIsLoading(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setIsSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-10">
          <BrandMark href="/" className="text-2xl text-foreground" />
        </div>

        {!isSubmitted ? (
          <>
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>

            <h1 className="text-2xl font-semibold text-foreground mb-2">Reset your password</h1>
            <p className="text-muted-foreground mb-8">
              Enter your email and we&apos;ll send you a reset link for your Assigned account.
            </p>

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

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                type="submit"
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-herb/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-herb" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">Check your email</h1>
            <p className="text-muted-foreground mb-8">
              We&apos;ve sent password reset instructions to your email address.
            </p>
            <Link href="/auth/signin">
              <Button
                variant="outline"
                className="w-full h-12 border-border hover:bg-muted rounded-lg"
              >
                Return to Sign In
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
