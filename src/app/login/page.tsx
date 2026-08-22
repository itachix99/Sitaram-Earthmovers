"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", { identifier, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Invalid phone/email or password");
      toast.error("Login failed — check credentials");
      return;
    }
    toast.success("Welcome back");
    // fetch session to decide redirect
    const sessRes = await fetch("/api/auth/session");
    const sess = await sessRes.json();
    const role = sess?.user?.role;
    if (role === "OPERATOR") router.push("/operator/today");
    else router.push("/admin/dashboard");
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-between bg-[var(--charcoal)] text-white p-10 relative overflow-hidden">
        {/* charcoal pane is always dark — no toggle needed here */}
        <div>
          <Logo light />
          <div className="mt-16 max-w-md">
            <h1 className="text-4xl font-extrabold tracking-tight leading-none">
              Powering<br />Every Move
            </h1>
            <p className="mt-4 text-white/70 leading-relaxed">
              Sign in to monitor your fleet, track hour-meters, fuel and job sites. Built for owners and operators in the field.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-xl font-bold">12</p>
                <p className="text-xs uppercase tracking-widest text-white/60">Machines</p>
              </div>
              <div className="rounded-xl bg-[var(--sitaram-yellow)] p-4 text-[var(--charcoal)]">
                <p className="text-xl font-bold">7</p>
                <p className="text-xs uppercase tracking-widest opacity-70">Working</p>
              </div>
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-xl font-bold">3</p>
                <p className="text-xs uppercase tracking-widest text-white/60">Sites</p>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-white/40">© {new Date().getFullYear()} Sitaram Earthmovers</p>
        <div className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-[var(--sitaram-yellow)]/10 blur-3xl" />
      </div>

      <div className="flex flex-col justify-center px-6 py-10 bg-background relative">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <div className="mx-auto w-full max-w-sm">
          <div className="md:hidden mb-8">
            <Logo />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Welcome back</CardTitle>
              <CardDescription>Sign in with phone or email + password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier">Phone or Email</Label>
                  <Input id="identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="+91 98765 43210 or you@company.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
                </div>
                {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-300 border border-red-200 dark:bg-red-500/10 dark:border-red-500/25 dark:text-red-300 rounded-lg p-2">{error}</p>}
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </CardContent>
          </Card>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Access is role-based. Contact the owner if you need an account.
          </p>
        </div>
      </div>
    </div>
  );
}