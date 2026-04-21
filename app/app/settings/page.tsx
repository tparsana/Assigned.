"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"

import { useAssignedAccess } from "@/components/assigned-access-provider"
import { appConfig } from "@/lib/app-config"
import {
  getAssignedAccessLevelDescription,
  getAssignedAccessLevelLabel,
  getAssignedPermissionLabel,
} from "@/lib/assigned-access"
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
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Settings,
  User,
  Bell,
  Mail,
  Palette,
  Brain,
  Calendar,
  Shield,
  Download,
  ChevronRight,
  BarChart3,
  Moon,
  Sun,
  Monitor,
  Trash2,
  Upload,
} from "lucide-react"
import { useAssignedState } from "@/lib/assigned-store"
import { createClient } from "@/lib/supabase/client"

type SettingsTab = "profile" | "notifications" | "preferences" | "ai" | "integrations" | "access" | "privacy"

export default function SettingsPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const {
    profile,
    notifications,
    preferences,
    ai,
    integrations,
    privacy,
    updateProfile,
    updateNotificationSetting,
    updatePreferences,
    updateAISetting,
    setIntegrationConnected,
    setPrivacySetting,
    exportState,
    resetState,
  } = useAssignedState()
  const {
    profile: accessProfile,
    accessLevel,
    isAdmin,
    organization,
    onboardingCompleted,
    permissions,
    bootstrapAvailable,
    team,
    position,
    projects: assignedProjects,
    awaitingAssignment,
    can,
    updateAccountProfile,
    submitAdminAccessCode,
  } = useAssignedAccess()
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile")
  const createdClickCountRef = useRef(0)
  const createdClickResetRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const previewAreaRef = useRef<HTMLDivElement | null>(null)
  const dragStateRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)
  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false)
  const [isPreparingAvatar, setIsPreparingAvatar] = useState(false)
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null)
  const [pendingImageDimensions, setPendingImageDimensions] = useState<{ width: number; height: number } | null>(null)
  const [displayedImageRect, setDisplayedImageRect] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)
  const [cropRect, setCropRect] = useState<{ x: number; y: number; size: number } | null>(null)
  const [adminBootstrapOpen, setAdminBootstrapOpen] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileStatus, setProfileStatus] = useState("")
  const [adminSecret, setAdminSecret] = useState("")
  const [accessStatus, setAccessStatus] = useState("")
  const [isUpdatingAccess, setIsUpdatingAccess] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  const tabs = [
    { id: "profile" as SettingsTab, label: "Profile", icon: User },
    { id: "notifications" as SettingsTab, label: "Notifications", icon: Bell },
    { id: "preferences" as SettingsTab, label: "Preferences", icon: Palette },
    { id: "ai" as SettingsTab, label: "AI Settings", icon: Brain },
    { id: "integrations" as SettingsTab, label: "Integrations", icon: Calendar },
    { id: "access" as SettingsTab, label: "Access", icon: Shield },
    { id: "privacy" as SettingsTab, label: "Privacy & Data", icon: Shield },
  ]

  const downloadExport = () => {
    const blob = new Blob([exportState()], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = appConfig.exports.stateFileName
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const themeValue = (theme ?? "system") as "light" | "dark" | "system"
  const profileName = `${profile.firstName} ${profile.lastName}`.trim()

  useEffect(() => {
    return () => {
      if (pendingImageUrl) {
        URL.revokeObjectURL(pendingImageUrl)
      }
    }
  }, [pendingImageUrl])

  useEffect(() => {
    return () => {
      if (createdClickResetRef.current) {
        window.clearTimeout(createdClickResetRef.current)
      }
    }
  }, [])

  const getContainImageSize = (
    naturalWidth: number,
    naturalHeight: number,
    viewportWidth: number,
    viewportHeight: number
  ) => {
    const baseScale = Math.min(viewportWidth / naturalWidth, viewportHeight / naturalHeight)
    return {
      width: naturalWidth * baseScale,
      height: naturalHeight * baseScale,
    }
  }

  const clampCropRect = (
    rect: { x: number; y: number; size: number },
    imageRect: { width: number; height: number }
  ) => {
    return {
      ...rect,
      x: Math.min(Math.max(0, rect.x), Math.max(0, imageRect.width - rect.size)),
      y: Math.min(Math.max(0, rect.y), Math.max(0, imageRect.height - rect.size)),
    }
  }

  const closeAvatarEditor = () => {
    setAvatarEditorOpen(false)
    setIsPreparingAvatar(false)
    if (pendingImageUrl) {
      URL.revokeObjectURL(pendingImageUrl)
      setPendingImageUrl(null)
    }
    setPendingImageDimensions(null)
    setDisplayedImageRect(null)
    setCropRect(null)
    dragStateRef.current = null
  }

  const prepareAvatarPreview = async (file: File) => {
    const rawUrl = URL.createObjectURL(file)

    try {
      const image = new Image()
      image.src = rawUrl

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve()
        image.onerror = () => reject(new Error("Unable to load selected image."))
      })

      const maxDimension = 1800
      const longestSide = Math.max(image.naturalWidth, image.naturalHeight)
      const scale = longestSide > maxDimension ? maxDimension / longestSide : 1
      const width = Math.max(1, Math.round(image.naturalWidth * scale))
      const height = Math.max(1, Math.round(image.naturalHeight * scale))

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext("2d")

      if (!context) {
        throw new Error("Unable to prepare selected image.")
      }

      context.drawImage(image, 0, 0, width, height)

      const previewBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
            return
          }

          reject(new Error("Unable to prepare selected image."))
        }, "image/jpeg", 0.92)
      })

      return {
        url: URL.createObjectURL(previewBlob),
        dimensions: { width, height },
      }
    } finally {
      URL.revokeObjectURL(rawUrl)
    }
  }

  const handleAvatarSelection = async (file: File | undefined | null) => {
    if (!file) {
      return
    }

    setIsPreparingAvatar(true)

    if (pendingImageUrl) {
      URL.revokeObjectURL(pendingImageUrl)
    }

    try {
      const preview = await prepareAvatarPreview(file)
      setPendingImageUrl(preview.url)
      setPendingImageDimensions(preview.dimensions)
      setDisplayedImageRect(null)
      setCropRect(null)
      setAvatarEditorOpen(true)
    } finally {
      setIsPreparingAvatar(false)
    }
  }

  const saveAvatar = async () => {
    if (!pendingImageUrl || !displayedImageRect || !cropRect || !pendingImageDimensions) {
      return
    }

    const image = new Image()
    image.src = pendingImageUrl

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error("Unable to load selected image."))
    })

    const canvasSize = 512
    const sourceScale = image.naturalWidth / displayedImageRect.width
    const sourceX = cropRect.x * sourceScale
    const sourceY = cropRect.y * sourceScale
    const sourceSize = cropRect.size * sourceScale
    const canvas = document.createElement("canvas")
    canvas.width = canvasSize
    canvas.height = canvasSize
    const context = canvas.getContext("2d")

    if (!context) {
      return
    }

    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      canvasSize,
      canvasSize
    )

    updateProfile({ avatarUrl: canvas.toDataURL("image/webp", 0.92) })
    closeAvatarEditor()
  }

  const handleSaveProfile = async () => {
    setIsSavingProfile(true)
    setProfileStatus("")

    const result = await updateAccountProfile({
      firstName: profile.firstName.trim(),
      lastName: profile.lastName.trim(),
      timezone: profile.timezone,
      avatarUrl: profile.avatarUrl,
    })

    setIsSavingProfile(false)
    setProfileStatus(result.error ?? "Profile saved.")
  }

  const handleAdminAccessSubmit = async () => {
    setIsUpdatingAccess(true)
    setAccessStatus("")

    const result = await submitAdminAccessCode(adminSecret)

    setIsUpdatingAccess(false)
    setAccessStatus(
      result.error
        ? result.error
        : "Admin access claimed for this account."
    )

    if (!result.error) {
      setAdminSecret("")
    }
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm("Delete your Assigned account? This removes your access, profile, and workspace state. You would need to sign up again and be re-assigned to return.")) {
      return
    }

    setIsDeletingAccount(true)
    setProfileStatus("")

    const response = await fetch("/api/access/account", {
      method: "DELETE",
    })
    const payload = await response.json().catch(() => ({})) as { error?: string }

    if (!response.ok) {
      setIsDeletingAccount(false)
      setProfileStatus(payload.error ?? "Unable to delete your account.")
      return
    }

    await resetState()
    await supabase.auth.signOut().catch(() => undefined)
    router.replace("/auth/signin")
    router.refresh()
  }

  const handleCuriouslyCreatedClick = () => {
    if (createdClickResetRef.current) {
      window.clearTimeout(createdClickResetRef.current)
    }

    createdClickCountRef.current += 1

    if (createdClickCountRef.current >= 5) {
      createdClickCountRef.current = 0
      setAdminBootstrapOpen(true)
      return
    }

    createdClickResetRef.current = window.setTimeout(() => {
      createdClickCountRef.current = 0
      createdClickResetRef.current = null
    }, 1400)
  }

  useEffect(() => {
    if (!avatarEditorOpen || !pendingImageDimensions) {
      return
    }

    const syncPreview = () => {
      const previewArea = previewAreaRef.current
      if (!previewArea) {
        return
      }

      const containedSize = getContainImageSize(
        pendingImageDimensions.width,
        pendingImageDimensions.height,
        previewArea.clientWidth,
        previewArea.clientHeight
      )
      const nextImageRect = {
        x: (previewArea.clientWidth - containedSize.width) / 2,
        y: (previewArea.clientHeight - containedSize.height) / 2,
        width: containedSize.width,
        height: containedSize.height,
      }

      setDisplayedImageRect(nextImageRect)
      setCropRect((current) => {
        const defaultSize = Math.max(140, Math.min(containedSize.width, containedSize.height) * 0.42)
        const nextRect =
          current ?? {
            x: (containedSize.width - defaultSize) / 2,
            y: (containedSize.height - defaultSize) / 2,
            size: defaultSize,
          }

        return clampCropRect(
          {
            ...nextRect,
            size: Math.min(nextRect.size, containedSize.width, containedSize.height),
          },
          containedSize
        )
      })
    }

    const frame = window.requestAnimationFrame(syncPreview)
    window.addEventListener("resize", syncPreview)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener("resize", syncPreview)
    }
  }, [avatarEditorOpen, pendingImageDimensions])

  return (
    <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
          <Settings className="w-7 h-7" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <nav className="bg-card rounded-xl border border-border p-2 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="lg:col-span-3">
          {activeTab === "profile" && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Profile Settings</h2>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  void handleAvatarSelection(event.target.files?.[0])
                  event.currentTarget.value = ""
                }}
              />

              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <div className="relative h-20 w-20 overflow-hidden rounded-full border border-border bg-background">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profileName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary">
                      <span className="text-2xl font-semibold text-primary-foreground">
                        {profile.firstName[0]}{profile.lastName[0]}
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border"
                      disabled={isPreparingAvatar}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {isPreparingAvatar
                        ? "Preparing..."
                        : profile.avatarUrl
                          ? "Change Photo"
                          : "Select Photo"}
                    </Button>
                    {profile.avatarUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => updateProfile({ avatarUrl: null })}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload an image, then drag the square to choose your avatar crop.
                  </p>
                </div>
              </div>

              <Dialog
                open={avatarEditorOpen}
                onOpenChange={(open) => {
                  if (!open) {
                    closeAvatarEditor()
                    return
                  }

                  setAvatarEditorOpen(true)
                }}
              >
                <DialogContent className="overflow-hidden border-[#2A2A2A] bg-[#0E0E0E] p-0 text-white shadow-2xl sm:max-w-[640px]">
                  <DialogHeader className="border-b border-white/10 px-6 py-5">
                    <DialogTitle className="text-white">Edit profile photo</DialogTitle>
                    <DialogDescription className="text-white/60">
                      Drag the square to choose the part of the photo you want as your avatar.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="px-6 py-6">
                    <div
                      ref={previewAreaRef}
                      className="relative mx-auto h-[460px] w-full max-w-[420px] overflow-hidden rounded-[18px] bg-black"
                    >
                      {pendingImageUrl && (
                        <>
                          <img
                            src={pendingImageUrl}
                            alt="Selected profile"
                            className={`absolute select-none ${displayedImageRect ? "" : "inset-0 h-full w-full object-contain"}`}
                            style={
                              displayedImageRect
                                ? {
                                    left: displayedImageRect.x,
                                    top: displayedImageRect.y,
                                    width: displayedImageRect.width,
                                    height: displayedImageRect.height,
                                  }
                                : undefined
                            }
                            draggable={false}
                            onLoad={(event) => {
                              setPendingImageDimensions({
                                width: event.currentTarget.naturalWidth,
                                height: event.currentTarget.naturalHeight,
                              })
                            }}
                          />
                          {displayedImageRect && cropRect && (
                            <>
                              <div className="pointer-events-none absolute inset-0 bg-black/20" />
                              <div
                                className="pointer-events-none absolute border-2 border-dashed border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.42)]"
                                style={{
                                  left: displayedImageRect.x + cropRect.x,
                                  top: displayedImageRect.y + cropRect.y,
                                  width: cropRect.size,
                                  height: cropRect.size,
                                }}
                              >
                                {[
                                  "left-[-5px] top-[-5px]",
                                  "right-[-5px] top-[-5px]",
                                  "left-[-5px] bottom-[-5px]",
                                  "right-[-5px] bottom-[-5px]",
                                ].map((position) => (
                                  <span
                                    key={position}
                                    className={`absolute h-[10px] w-[10px] border border-white bg-black/60 ${position}`}
                                  />
                                ))}
                              </div>
                              <button
                                type="button"
                                className="absolute cursor-move"
                                style={{
                                  left: displayedImageRect.x + cropRect.x,
                                  top: displayedImageRect.y + cropRect.y,
                                  width: cropRect.size,
                                  height: cropRect.size,
                                }}
                                onPointerDown={(event) => {
                                  event.currentTarget.setPointerCapture(event.pointerId)
                                  dragStateRef.current = {
                                    pointerId: event.pointerId,
                                    startX: event.clientX,
                                    startY: event.clientY,
                                    originX: cropRect.x,
                                    originY: cropRect.y,
                                  }
                                }}
                                onPointerMove={(event) => {
                                  const dragState = dragStateRef.current
                                  if (!dragState || dragState.pointerId !== event.pointerId || !displayedImageRect || !cropRect) {
                                    return
                                  }

                                  setCropRect(
                                    clampCropRect(
                                      {
                                        x: dragState.originX + (event.clientX - dragState.startX),
                                        y: dragState.originY + (event.clientY - dragState.startY),
                                        size: cropRect.size,
                                      },
                                      displayedImageRect
                                    )
                                  )
                                }}
                                onPointerUp={(event) => {
                                  if (dragStateRef.current?.pointerId === event.pointerId) {
                                    dragStateRef.current = null
                                  }
                                }}
                                onPointerCancel={() => {
                                  dragStateRef.current = null
                                }}
                              />
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <DialogFooter className="border-t border-white/10 px-6 py-5">
                    <Button variant="ghost" onClick={closeAvatarEditor}>
                      Cancel
                    </Button>
                    <Button
                      onClick={saveAvatar}
                      className="bg-white text-black hover:bg-white/90"
                    >
                      Set Avatar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-foreground">First Name</Label>
                    <Input
                      id="firstName"
                      value={profile.firstName}
                      onChange={(event) => updateProfile({ firstName: event.target.value })}
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-foreground">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profile.lastName}
                      onChange={(event) => updateProfile({ lastName: event.target.value })}
                      className="bg-background border-border"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    className="bg-background border-border"
                    readOnly
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Email is managed through Supabase auth and stays read-only here.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone" className="text-foreground">Timezone</Label>
                  <select
                    id="timezone"
                    value={profile.timezone}
                    onChange={(event) => updateProfile({ timezone: event.target.value })}
                    className="w-full h-10 px-3 bg-background border border-border rounded-md text-foreground"
                  >
                    <option value="America/Phoenix">Arizona</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="Europe/Berlin">Central European Time</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border flex justify-end">
                <div className="flex items-center gap-3">
                  {profileStatus ? (
                    <span className={`text-sm ${profileStatus === "Profile saved." ? "text-muted-foreground" : "text-destructive"}`}>
                      {profileStatus}
                    </span>
                  ) : null}
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={isSavingProfile}
                    onClick={() => void handleSaveProfile()}
                  >
                    {isSavingProfile ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Notification Settings</h2>

              <div className="space-y-6">
                {[
                  {
                    key: "dailyPlanningReminder" as const,
                    title: "Daily Planning Reminder",
                    description: "Get reminded each morning to plan your day",
                  },
                  {
                    key: "taskDueReminders" as const,
                    title: "Task Due Reminders",
                    description: "Get notified before tasks are due",
                  },
                  {
                    key: "weeklyReviewReminder" as const,
                    title: "Weekly Review Reminder",
                    description: "Sunday evening reminder to complete your review",
                  },
                  {
                    key: "emailDigest" as const,
                    title: "Email Digest",
                    description: "Weekly summary of your productivity",
                  },
                ].map((item, index, all) => (
                  <div
                    key={item.key}
                    className={`flex items-center justify-between py-4 ${index < all.length - 1 ? "border-b border-border" : ""}`}
                  >
                    <div>
                      <div className="font-medium text-foreground">{item.title}</div>
                      <div className="text-sm text-muted-foreground">{item.description}</div>
                    </div>
                    <Switch
                      checked={notifications[item.key]}
                      onCheckedChange={(checked) => updateNotificationSetting(item.key, checked)}
                      aria-label={item.title}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Workspace Preferences</h2>

              <div className="space-y-8">
                <div>
                  <Label className="text-foreground mb-3 block">Theme</Label>
                  <div className="flex gap-3">
                    {[
                      { id: "light" as const, label: "Light", icon: Sun },
                      { id: "dark" as const, label: "Dark", icon: Moon },
                      { id: "system" as const, label: "System", icon: Monitor },
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setTheme(option.id)}
                        className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                          themeValue === option.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <option.icon className="w-5 h-5" />
                        <span className="font-medium text-foreground">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-foreground mb-3 block">Default Planning Method</Label>
                  <select
                    value={preferences.defaultPlanningMethod}
                    onChange={(event) =>
                      updatePreferences({
                        defaultPlanningMethod: event.target.value as typeof preferences.defaultPlanningMethod,
                      })
                    }
                    className="w-full h-10 px-3 bg-background border border-border rounded-md text-foreground"
                  >
                    <option value="top3">Top 3 Method</option>
                    <option value="ivylee">Ivy Lee Method</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="none">None</option>
                  </select>
                </div>

                <div>
                  <Label className="text-foreground mb-3 block">Work Hours</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Start</Label>
                      <Input
                        type="time"
                        value={preferences.workHours.start}
                        onChange={(event) =>
                          updatePreferences({
                            workHours: { ...preferences.workHours, start: event.target.value },
                          })
                        }
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">End</Label>
                      <Input
                        type="time"
                        value={preferences.workHours.end}
                        onChange={(event) =>
                          updatePreferences({
                            workHours: { ...preferences.workHours, end: event.target.value },
                          })
                        }
                        className="bg-background border-border"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-foreground mb-3 block">Start of Week</Label>
                  <select
                    value={preferences.startOfWeek}
                    onChange={(event) =>
                      updatePreferences({
                        startOfWeek: event.target.value as typeof preferences.startOfWeek,
                      })
                    }
                    className="w-full h-10 px-3 bg-background border border-border rounded-md text-foreground"
                  >
                    <option value="Sunday">Sunday</option>
                    <option value="Monday">Monday</option>
                  </select>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-4">
                  <div className="pr-4">
                    <div className="font-medium text-foreground">Minimal Mode</div>
                    <div className="text-sm text-muted-foreground">
                      Collapse the app into one quiet task page with simple list management.
                    </div>
                  </div>
                  <Switch
                    checked={preferences.minimalMode}
                    onCheckedChange={(checked) => updatePreferences({ minimalMode: checked })}
                    aria-label="Minimal Mode"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "ai" && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">AI Settings</h2>

              <div className="space-y-6">
                {[
                  {
                    key: "taskSuggestions" as const,
                    title: "AI Task Suggestions",
                    description: "Get smart suggestions based on your patterns",
                  },
                  {
                    key: "autoCategorization" as const,
                    title: "Auto-categorization",
                    description: "Automatically suggest categories for new tasks",
                  },
                  {
                    key: "smartDueDates" as const,
                    title: "Smart Due Dates",
                    description: "AI suggests when tasks should be completed",
                  },
                  {
                    key: "weeklyInsights" as const,
                    title: "Weekly Insights",
                    description: "AI-generated productivity insights",
                  },
                ].map((item, index, all) => (
                  <div
                    key={item.key}
                    className={`flex items-center justify-between py-4 ${index < all.length - 1 ? "border-b border-border" : ""}`}
                  >
                    <div>
                      <div className="font-medium text-foreground">{item.title}</div>
                      <div className="text-sm text-muted-foreground">{item.description}</div>
                    </div>
                    <Switch
                      checked={ai[item.key]}
                      onCheckedChange={(checked) => updateAISetting(item.key, checked)}
                      aria-label={item.title}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "integrations" && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Integrations</h2>

              <div className="space-y-4">
                {[
                  { key: "googleCalendar" as const, name: "Google Calendar" },
                  { key: "appleCalendar" as const, name: "Apple Calendar" },
                  { key: "outlook" as const, name: "Outlook" },
                ].map((integration) => (
                  <div key={integration.key} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{integration.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {integrations[integration.key] ? "Connected" : "Not connected"}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border"
                      onClick={() => setIntegrationConnected(integration.key, !integrations[integration.key])}
                    >
                      {integrations[integration.key] ? "Disconnect" : "Connect"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "access" && (
            <div className="space-y-6">
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-6">Access & Permissions</h2>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-border bg-background p-4">
                    <div className="text-sm text-muted-foreground">Organization</div>
                    <div className="mt-1 font-medium text-foreground">{organization?.name ?? "Samaya"}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-4">
                    <div className="text-sm text-muted-foreground">Access Level</div>
                    <div className="mt-1 font-medium text-foreground">{getAssignedAccessLevelLabel(accessLevel)}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-4">
                    <div className="text-sm text-muted-foreground">Assignment State</div>
                    <div className="mt-1 font-medium text-foreground">{awaitingAssignment ? "Awaiting assignment" : "Assigned"}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-4">
                    <div className="text-sm text-muted-foreground">Onboarding</div>
                    <div className="mt-1 font-medium text-foreground">{onboardingCompleted ? "Completed" : "Pending"}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-4">
                    <div className="text-sm text-muted-foreground">Bootstrap Admin</div>
                    <div className="mt-1 font-medium text-foreground">
                      {bootstrapAvailable ? "Available until first admin is claimed" : "Locked after first admin"}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-border bg-background p-4">
                    <div className="text-sm text-muted-foreground">Team</div>
                    <div className="mt-1 font-medium text-foreground">{team?.label ?? "Awaiting assignment"}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-4">
                    <div className="text-sm text-muted-foreground">Position</div>
                    <div className="mt-1 font-medium text-foreground">{position?.label ?? "Awaiting assignment"}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-4">
                    <div className="text-sm text-muted-foreground">Projects / Sites</div>
                    <div className="mt-1 font-medium text-foreground">
                      {assignedProjects.length > 0 ? assignedProjects.map((project) => project.name).join(", ") : "Awaiting assignment"}
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-xl border border-border bg-background p-4">
                  <div className="text-sm font-medium text-foreground">Access description</div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {getAssignedAccessLevelDescription(accessLevel)}
                  </div>
                </div>

                <div className="mt-6">
                  <div className="text-sm font-medium text-foreground">Current permissions</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {permissions.map((permission) => (
                      <span
                        key={permission}
                        className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground"
                      >
                        {getAssignedPermissionLabel(permission)}
                      </span>
                    ))}
                    {permissions.length === 0 ? (
                      <span className="text-sm text-muted-foreground">No permissions assigned yet.</span>
                    ) : null}
                  </div>
                </div>

                {accessStatus ? (
                  <p className={`mt-4 text-sm ${accessStatus.includes("claimed") ? "text-muted-foreground" : "text-destructive"}`}>
                    {accessStatus}
                  </p>
                ) : null}
              </div>

              {can("edit_users") && (
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-foreground">Organization Management</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Team assignment, position management, project assignment, and access changes now live in the Team workspace.
                      </p>
                    </div>
                  </div>
                  <Button className="mt-6" asChild>
                    <Link href="/app/team">Open Team Management</Link>
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="space-y-6">
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-6">Privacy & Data</h2>

                <div className="space-y-4">
                  <Button variant="outline" className="w-full justify-between border-border h-auto py-4" onClick={downloadExport}>
                    <div className="flex items-center gap-3">
                      <Download className="w-5 h-5 text-foreground" />
                      <div className="text-left">
                        <div className="font-medium text-foreground">Export Data</div>
                        <div className="text-sm text-muted-foreground">Download your local data as JSON</div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </Button>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-foreground" />
                      <div>
                        <div className="font-medium text-foreground">Usage Analytics</div>
                        <div className="text-sm text-muted-foreground">Allow anonymous usage metrics on this device</div>
                      </div>
                    </div>
                    <Switch
                      checked={privacy.allowAnalytics}
                      onCheckedChange={(checked) => setPrivacySetting("allowAnalytics", checked)}
                      aria-label="Usage Analytics"
                    />
                  </div>

                  <Button variant="outline" className="h-auto w-full justify-between border-border py-4" asChild>
                    <Link href="/app/analytics">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="h-5 w-5 text-foreground" />
                        <div className="text-left">
                          <div className="font-medium text-foreground">Open Analytics</div>
                          <div className="text-sm text-muted-foreground">
                            View deeper trends and historical patterns when you need them.
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="bg-destructive/5 rounded-xl border border-destructive/20 p-6">
                <h3 className="font-semibold text-destructive mb-2">Danger Zone</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Reset your server-backed workspace state, or permanently delete your Assigned account and start over from scratch later if needed.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (window.confirm("Reset your Assigned workspace state? This clears the synced workspace and cached offline copy for this account.")) {
                        void resetState()
                      }
                    }}
                  >
                    Reset Workspace State
                  </Button>
                  <Button
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive/10"
                    disabled={isDeletingAccount}
                    onClick={() => {
                      void handleDeleteAccount()
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isDeletingAccount ? "Deleting Account..." : "Delete My Account"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={adminBootstrapOpen} onOpenChange={setAdminBootstrapOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Admin Bootstrap</DialogTitle>
            <DialogDescription>
              Enter the secret code to claim the first admin account. This path closes permanently after one admin exists.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Label htmlFor="admin-secret-code" className="text-foreground">
              Secret code
            </Label>
            <Input
              id="admin-secret-code"
              type="password"
              value={adminSecret}
              onChange={(event) => setAdminSecret(event.target.value)}
              placeholder="Enter the admin access code"
              className="bg-background border-border"
            />
            {accessStatus ? (
              <p className={`text-sm ${accessStatus.includes("claimed") ? "text-muted-foreground" : "text-destructive"}`}>
                {accessStatus}
              </p>
            ) : null}
            {!bootstrapAvailable ? (
              <p className="text-sm text-muted-foreground">
                Admin bootstrap is no longer available because this organization already has an admin.
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setAdminBootstrapOpen(false)}>
              Close
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isUpdatingAccess || !adminSecret.trim() || !bootstrapAvailable}
              onClick={() => void handleAdminAccessSubmit()}
            >
              {isUpdatingAccess ? "Updating..." : "Claim Admin Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
        <span
          onClick={handleCuriouslyCreatedClick}
          className="cursor-default"
        >
          Curiously Created
        </span>{" "}
        by{" "}
        <a
          href="https://solo.to/tparsana"
          target="_blank"
          rel="noreferrer"
          className="text-foreground underline underline-offset-4 transition-colors hover:text-primary"
        >
          Tanish Parsana
        </a>
        .
      </div>
    </div>
  )
}
