import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Truck, Users, Fuel, Wrench, ArrowRight, ShieldCheck, Clock3 } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-[64px] max-w-6xl items-center justify-between px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/admin/dashboard">Open Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <div className="grid gap-10 md:grid-cols-2 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-semibold tracking-widest uppercase">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Machinery Management Platform — Live
            </div>
            <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight leading-[0.95]">
              Powering <span className="underline decoration-[var(--sitaram-yellow)] decoration-8 underline-offset-2">Every Move</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              Sitaram Earthmovers — Monitor JCBs, excavators, tippers &amp; cranes. Track hours, fuel, maintenance and job sites from one industrial command center.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/admin/dashboard">
                  View Owner Dashboard <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/operator/today">Operator App →</Link>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
            </div>
            <div className="mt-6 flex items-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> RBAC Secured</span>
              <span className="flex items-center gap-1.5"><Clock3 className="h-4 w-4" /> Hour-meter validated</span>
            </div>
          </div>

          {/* Industrial preview card */}
          <Card className="overflow-hidden border-[var(--charcoal)]/10">
            <div className="bg-[var(--charcoal)] px-6 py-4 text-white flex items-center justify-between">
              <div>
                <p className="text-xs tracking-widest uppercase text-white/60">Today&apos;s Fleet Status</p>
                <p className="text-lg font-bold">12 Machines • 3 Sites</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-[var(--sitaram-yellow)] flex items-center justify-center text-[var(--charcoal)]">
                <Truck className="h-5 w-5" />
              </div>
            </div>
            <CardContent className="grid grid-cols-3 gap-4 p-6">
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
                <p className="text-2xl font-bold text-emerald-700">7</p>
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700/70">Working</p>
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
                <p className="text-2xl font-bold text-amber-700">2</p>
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-700/70">Idle</p>
              </div>
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-center">
                <p className="text-2xl font-bold text-red-700">3</p>
                <p className="text-xs font-semibold uppercase tracking-widest text-red-700/70">Service</p>
              </div>
              <div className="col-span-3 rounded-lg bg-muted p-3 text-xs flex justify-between">
                <span>Today&apos;s hours</span> <span className="font-mono font-bold">64.8 h</span>
              </div>
              <div className="col-span-3 rounded-lg bg-muted p-3 text-xs flex justify-between">
                <span>Fuel today</span> <span className="font-mono font-bold">412 L • ₹38,740</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { icon: Truck, title: "Machinery", desc: "JCBs, excavators, tippers, cranes with hour-meter history" },
            { icon: Users, title: "Operators", desc: "Assignments, work sessions, daily reports" },
            { icon: Fuel, title: "Fuel & Costs", desc: "Litres/hour, cost tracking, efficiency alerts" },
            { icon: Wrench, title: "Maintenance", desc: "Hour-based service, breakdown queue" },
          ].map((f) => (
            <Card key={f.title}>
              <CardContent className="p-5">
                <div className="h-9 w-9 rounded-lg bg-[var(--sitaram-yellow)]/20 flex items-center justify-center mb-3">
                  <f.icon className="h-5 w-5" />
                </div>
                <p className="font-semibold">{f.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t bg-card py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Sitaram Earthmovers • Powering Every Move • Phase 1 — Foundation & Design System
      </footer>
    </div>
  );
}