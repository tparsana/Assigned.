"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  Camera, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Calendar, 
  LayoutGrid, 
  ListOrdered, 
  Target,
  BarChart3,
  Menu,
  X
} from "lucide-react"

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-semibold tracking-tight text-foreground">
            Tasked.
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#methods" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Methods
            </Link>
            <Link href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Testimonials
            </Link>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <Link href="/auth/signin">
              <Button variant="ghost" className="text-foreground">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6">
                Get Started
              </Button>
            </Link>
          </div>

          <button 
            className="md:hidden text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-t border-border px-6 py-4 space-y-4">
            <Link href="#features" className="block text-sm text-muted-foreground">Features</Link>
            <Link href="#methods" className="block text-sm text-muted-foreground">Methods</Link>
            <Link href="#testimonials" className="block text-sm text-muted-foreground">Testimonials</Link>
            <div className="flex flex-col gap-2 pt-4">
              <Link href="/auth/signin">
                <Button variant="outline" className="w-full">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="w-full bg-primary text-primary-foreground">Get Started</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-foreground leading-[1.1] text-balance">
              Turn handwritten chaos into clear daily action
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              A sophisticated planning system for thoughtful, ambitious people who want order without rigidity. Capture, organize, and execute with calm clarity.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 h-12 text-base">
                  Start Planning Free
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="rounded-full px-8 h-12 text-base border-foreground/20">
                  See How It Works
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="mt-16 relative">
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="bg-primary/5 p-8 md:p-12">
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Top 3 Preview Card */}
                  <div className="bg-card rounded-xl p-6 border border-border">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium text-foreground">Top 3 Today</span>
                    </div>
                    <div className="space-y-3">
                      {["Finish project proposal", "Review team updates", "Prepare for meeting"].map((task, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-background rounded-lg">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${i === 0 ? 'border-herb bg-herb/10' : 'border-border'}`}>
                            {i === 0 && <CheckCircle2 className="w-4 h-4 text-herb" />}
                          </div>
                          <span className={`text-sm ${i === 0 ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{task}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Schedule Preview Card */}
                  <div className="bg-card rounded-xl p-6 border border-border">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium text-foreground">Today&apos;s Schedule</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { time: "9:00", task: "Deep work block", color: "bg-celeste" },
                        { time: "11:00", task: "Team standup", color: "bg-marigold/30" },
                        { time: "14:00", task: "Review & respond", color: "bg-celeste" },
                      ].map((item, i) => (
                        <div key={i} className={`flex items-center gap-3 p-3 ${item.color} rounded-lg`}>
                          <span className="text-xs font-medium text-foreground/70 w-12">{item.time}</span>
                          <span className="text-sm text-foreground">{item.task}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Stats Card */}
                  <div className="bg-card rounded-xl p-6 border border-border">
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium text-foreground">This Week</span>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Tasks Completed</span>
                          <span className="text-sm font-medium text-foreground">24/28</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-herb rounded-full" style={{ width: '85%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Top 3 Rate</span>
                          <span className="text-sm font-medium text-foreground">92%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: '92%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Planning Streak</span>
                          <span className="text-sm font-medium text-herb">12 days</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="features" className="py-20 px-6 bg-card">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
              A workflow that flows
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              From scattered thoughts to focused action in four simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Capture",
                description: "Snap a photo of handwritten notes or quickly type tasks. AI extracts and structures everything.",
                icon: Camera,
              },
              {
                step: "02",
                title: "Sort",
                description: "Review AI suggestions or manually organize. Assign to lists, set priorities, add context.",
                icon: LayoutGrid,
              },
              {
                step: "03",
                title: "Plan",
                description: "Choose your method: Top 3, Time Blocking, Ivy Lee, or Kanban. Build your perfect day.",
                icon: ListOrdered,
              },
              {
                step: "04",
                title: "Execute",
                description: "Focus on what matters. Track progress, reflect on wins, and build momentum.",
                icon: Target,
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="text-6xl font-bold text-border/50 mb-4">{item.step}</div>
                <div className="p-6 bg-background rounded-xl border border-border">
                  <item.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform translate-x-1/2">
                    <ArrowRight className="w-6 h-6 text-border" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planning Methods Section */}
      <section id="methods" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
              Four methods, one system
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Switch between planning styles based on your day, your mood, or your workload
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Top 3 Method",
                description: "Focus on three high-impact tasks. Simple, powerful, proven. Perfect for busy days when you need ruthless prioritization.",
                icon: Target,
                color: "bg-primary/5 border-primary/10",
                iconColor: "text-primary",
              },
              {
                title: "Time Blocking",
                description: "Map your tasks to specific time slots. Visualize your day, protect focus time, and stay realistic about capacity.",
                icon: Calendar,
                color: "bg-celeste/30 border-celeste/50",
                iconColor: "text-primary",
              },
              {
                title: "Ivy Lee Method",
                description: "Six tasks, ranked by importance. Work through them in order. A century-old technique that still delivers.",
                icon: ListOrdered,
                color: "bg-herb/10 border-herb/20",
                iconColor: "text-herb",
              },
              {
                title: "Kanban Board",
                description: "Visual workflow management. Drag tasks through stages: Inbox, Today, Doing, Waiting, Done.",
                icon: LayoutGrid,
                color: "bg-marigold/10 border-marigold/20",
                iconColor: "text-marigold",
              },
            ].map((method, index) => (
              <div 
                key={index} 
                className={`p-8 rounded-2xl border ${method.color} hover:shadow-sm transition-shadow`}
              >
                <method.icon className={`w-10 h-10 ${method.iconColor} mb-4`} />
                <h3 className="text-xl font-semibold text-foreground mb-2">{method.title}</h3>
                <p className="text-muted-foreground">{method.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Capture Section */}
      <section className="py-20 px-6 bg-card">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-marigold/10 text-marigold rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                AI-Powered
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-6">
                From photo to plan in seconds
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Snap a picture of your handwritten notes, meeting whiteboard, or sticky note chaos. Our AI extracts tasks, suggests priorities, and structures everything for you.
              </p>
              <ul className="space-y-4">
                {[
                  "Handwriting recognition that actually works",
                  "Smart date and priority detection",
                  "Automatic categorization suggestions",
                  "One-tap approval or easy editing",
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-herb" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-background rounded-2xl border border-border p-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-[3/4] bg-muted rounded-xl flex items-center justify-center">
                  <div className="text-center p-4">
                    <Camera className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <span className="text-sm text-muted-foreground">Handwritten Note</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="text-xs font-medium text-muted-foreground mb-2">Extracted Tasks</div>
                  {["Call supplier about order", "Send invoice to client", "Prepare Q2 report", "Book travel for conf"].map((task, i) => (
                    <div key={i} className="p-3 bg-card border border-border rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border-2 border-primary/30" />
                        <span className="text-sm text-foreground">{task}</span>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <span className="text-xs px-2 py-0.5 bg-celeste/30 rounded text-foreground/70">Work</span>
                        {i === 0 && <span className="text-xs px-2 py-0.5 bg-marigold/20 rounded text-marigold">Due soon</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="bg-card rounded-2xl border border-border p-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 bg-background rounded-xl">
                    <div className="text-3xl font-semibold text-foreground mb-1">156</div>
                    <div className="text-sm text-muted-foreground">Tasks this month</div>
                    <div className="mt-3 flex items-center gap-2 text-herb text-sm">
                      <span>+23%</span>
                      <span className="text-muted-foreground">vs last month</span>
                    </div>
                  </div>
                  <div className="p-4 bg-background rounded-xl">
                    <div className="text-3xl font-semibold text-foreground mb-1">94%</div>
                    <div className="text-sm text-muted-foreground">Completion rate</div>
                    <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-herb rounded-full" style={{ width: '94%' }} />
                    </div>
                  </div>
                  <div className="p-4 bg-background rounded-xl">
                    <div className="text-3xl font-semibold text-herb mb-1">21</div>
                    <div className="text-sm text-muted-foreground">Day streak</div>
                    <div className="mt-3 flex gap-1">
                      {[1,2,3,4,5,6,7].map(i => (
                        <div key={i} className="w-3 h-3 rounded-full bg-herb" />
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-background rounded-xl">
                    <div className="text-3xl font-semibold text-foreground mb-1">4.2h</div>
                    <div className="text-sm text-muted-foreground">Avg focus time</div>
                    <div className="mt-3 text-xs text-muted-foreground">
                      Best day: Friday
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-6">
                Insights that inspire action
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Track your productivity patterns, celebrate wins, and identify areas for growth. Not just data—meaningful reflection.
              </p>
              <ul className="space-y-4">
                {[
                  "Weekly completion trends",
                  "Category-based insights",
                  "Planning streak tracking",
                  "AI-generated suggestions",
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-herb" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-6 bg-card">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
              Trusted by thoughtful planners
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "Finally, an app that doesn't try to do everything. Tasked. does planning perfectly. My mornings are calm now.",
                name: "Sarah Chen",
                role: "Product Designer",
              },
              {
                quote: "The AI capture feature is magic. I photograph my meeting notes and have structured tasks in seconds.",
                name: "Marcus Thompson",
                role: "Startup Founder",
              },
              {
                quote: "I've tried every productivity app. This is the first one that feels as elegant as paper but more powerful.",
                name: "Emily Rodriguez",
                role: "Graduate Student",
              },
            ].map((testimonial, index) => (
              <div key={index} className="p-8 bg-background rounded-2xl border border-border">
                <p className="text-foreground mb-6 text-pretty">&ldquo;{testimonial.quote}&rdquo;</p>
                <div>
                  <div className="font-medium text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-semibold text-foreground mb-6 text-balance">
            Ready for clarity?
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            Join thousands of thoughtful planners who&apos;ve found their system. Start free, upgrade when you&apos;re ready.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-10 h-14 text-lg">
                Start Planning Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            No credit card required. Free forever for basic use.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-semibold text-foreground mb-4">Tasked.</div>
              <p className="text-sm text-muted-foreground">
                A sophisticated planning system for thoughtful, ambitious people.
              </p>
            </div>
            <div>
              <div className="text-sm font-medium text-foreground mb-4">Product</div>
              <ul className="space-y-3">
                {["Features", "Methods", "Pricing", "Updates"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-sm font-medium text-foreground mb-4">Resources</div>
              <ul className="space-y-3">
                {["Blog", "Help Center", "Community", "Templates"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-sm font-medium text-foreground mb-4">Company</div>
              <ul className="space-y-3">
                {["About", "Careers", "Privacy", "Terms"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              &copy; 2026 Tasked. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Twitter
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                LinkedIn
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                GitHub
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
