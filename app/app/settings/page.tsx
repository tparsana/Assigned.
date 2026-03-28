"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Moon,
  Sun,
  Monitor
} from "lucide-react"

type SettingsTab = "profile" | "notifications" | "preferences" | "ai" | "integrations" | "privacy"

const tabs = [
  { id: "profile" as SettingsTab, label: "Profile", icon: User },
  { id: "notifications" as SettingsTab, label: "Notifications", icon: Bell },
  { id: "preferences" as SettingsTab, label: "Preferences", icon: Palette },
  { id: "ai" as SettingsTab, label: "AI Settings", icon: Brain },
  { id: "integrations" as SettingsTab, label: "Integrations", icon: Calendar },
  { id: "privacy" as SettingsTab, label: "Privacy & Data", icon: Shield },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile")
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light")

  return (
    <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-6">
      {/* Header */}
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
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <nav className="bg-card rounded-xl border border-border p-2 space-y-1">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* Profile */}
          {activeTab === "profile" && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Profile Settings</h2>
              
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-2xl font-semibold text-primary-foreground">SC</span>
                </div>
                <div>
                  <Button variant="outline" size="sm" className="border-border">
                    Change Photo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">JPG or PNG. Max 2MB.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-foreground">First Name</Label>
                    <Input
                      id="firstName"
                      defaultValue="Sarah"
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-foreground">Last Name</Label>
                    <Input
                      id="lastName"
                      defaultValue="Chen"
                      className="bg-background border-border"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue="sarah@example.com"
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone" className="text-foreground">Timezone</Label>
                  <select className="w-full h-10 px-3 bg-background border border-border rounded-md text-foreground">
                    <option>Pacific Time (PT)</option>
                    <option>Eastern Time (ET)</option>
                    <option>Central European Time (CET)</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border flex justify-end">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === "notifications" && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Notification Settings</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between py-4 border-b border-border">
                  <div>
                    <div className="font-medium text-foreground">Daily Planning Reminder</div>
                    <div className="text-sm text-muted-foreground">Get reminded each morning to plan your day</div>
                  </div>
                  <label className="relative inline-flex cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors">
                      <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-card rounded-full transition-transform peer-checked:translate-x-5" />
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-4 border-b border-border">
                  <div>
                    <div className="font-medium text-foreground">Task Due Reminders</div>
                    <div className="text-sm text-muted-foreground">Get notified before tasks are due</div>
                  </div>
                  <label className="relative inline-flex cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors">
                      <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-card rounded-full transition-transform peer-checked:translate-x-5" />
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-4 border-b border-border">
                  <div>
                    <div className="font-medium text-foreground">Weekly Review Reminder</div>
                    <div className="text-sm text-muted-foreground">Sunday evening reminder to complete your review</div>
                  </div>
                  <label className="relative inline-flex cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors">
                      <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-card rounded-full transition-transform peer-checked:translate-x-5" />
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-4">
                  <div>
                    <div className="font-medium text-foreground">Email Digest</div>
                    <div className="text-sm text-muted-foreground">Weekly summary of your productivity</div>
                  </div>
                  <label className="relative inline-flex cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors">
                      <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-card rounded-full transition-transform peer-checked:translate-x-5" />
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Preferences */}
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
                    ].map(option => (
                      <button
                        key={option.id}
                        onClick={() => setTheme(option.id)}
                        className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                          theme === option.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/30'
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
                  <select className="w-full h-10 px-3 bg-background border border-border rounded-md text-foreground">
                    <option>Top 3 Method</option>
                    <option>Ivy Lee Method</option>
                    <option>Time Blocking</option>
                    <option>Kanban</option>
                  </select>
                </div>

                <div>
                  <Label className="text-foreground mb-3 block">Work Hours</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Start</Label>
                      <Input type="time" defaultValue="09:00" className="bg-background border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">End</Label>
                      <Input type="time" defaultValue="17:00" className="bg-background border-border" />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-foreground mb-3 block">Start of Week</Label>
                  <select className="w-full h-10 px-3 bg-background border border-border rounded-md text-foreground">
                    <option>Sunday</option>
                    <option>Monday</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* AI Settings */}
          {activeTab === "ai" && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">AI Settings</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between py-4 border-b border-border">
                  <div>
                    <div className="font-medium text-foreground">AI Task Suggestions</div>
                    <div className="text-sm text-muted-foreground">Get smart suggestions based on your patterns</div>
                  </div>
                  <label className="relative inline-flex cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors">
                      <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-card rounded-full transition-transform peer-checked:translate-x-5" />
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-4 border-b border-border">
                  <div>
                    <div className="font-medium text-foreground">Auto-categorization</div>
                    <div className="text-sm text-muted-foreground">Automatically suggest categories for new tasks</div>
                  </div>
                  <label className="relative inline-flex cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors">
                      <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-card rounded-full transition-transform peer-checked:translate-x-5" />
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-4 border-b border-border">
                  <div>
                    <div className="font-medium text-foreground">Smart Due Dates</div>
                    <div className="text-sm text-muted-foreground">AI suggests when tasks should be completed</div>
                  </div>
                  <label className="relative inline-flex cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors">
                      <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-card rounded-full transition-transform peer-checked:translate-x-5" />
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-4">
                  <div>
                    <div className="font-medium text-foreground">Weekly Insights</div>
                    <div className="text-sm text-muted-foreground">AI-generated productivity insights</div>
                  </div>
                  <label className="relative inline-flex cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors">
                      <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-card rounded-full transition-transform peer-checked:translate-x-5" />
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Integrations */}
          {activeTab === "integrations" && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Integrations</h2>
              
              <div className="space-y-4">
                {[
                  { name: "Google Calendar", status: "Connect", connected: false },
                  { name: "Apple Calendar", status: "Connect", connected: false },
                  { name: "Outlook", status: "Connect", connected: false },
                  { name: "Notion", status: "Coming soon", connected: false, disabled: true },
                  { name: "Slack", status: "Coming soon", connected: false, disabled: true },
                ].map((integration, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{integration.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {integration.connected ? "Connected" : "Not connected"}
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant={integration.disabled ? "ghost" : "outline"}
                      size="sm"
                      disabled={integration.disabled}
                      className={integration.disabled ? "text-muted-foreground" : "border-border"}
                    >
                      {integration.status}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Privacy */}
          {activeTab === "privacy" && (
            <div className="space-y-6">
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-6">Privacy & Data</h2>
                
                <div className="space-y-4">
                  <Button variant="outline" className="w-full justify-between border-border h-auto py-4">
                    <div className="flex items-center gap-3">
                      <Download className="w-5 h-5 text-foreground" />
                      <div className="text-left">
                        <div className="font-medium text-foreground">Export Data</div>
                        <div className="text-sm text-muted-foreground">Download all your data as JSON</div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </Button>

                  <Button variant="outline" className="w-full justify-between border-border h-auto py-4">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-foreground" />
                      <div className="text-left">
                        <div className="font-medium text-foreground">Privacy Settings</div>
                        <div className="text-sm text-muted-foreground">Manage data collection preferences</div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </Button>
                </div>
              </div>

              <div className="bg-destructive/5 rounded-xl border border-destructive/20 p-6">
                <h3 className="font-semibold text-destructive mb-2">Danger Zone</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Permanently delete your account and all associated data.
                </p>
                <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
                  Delete Account
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
