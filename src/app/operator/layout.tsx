"use client";
import { OperatorNav } from "@/components/layout/operator-nav";
import { Logo } from "@/components/brand/logo";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const name = (session?.user?.name as string) || "Operator";
  const role = (session?.user as unknown as { role: string })?.role || "OPERATOR";
  return (
    <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card px-4">
        <Logo />
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs text-muted-foreground">{name} • {role}</span>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/dashboard">Owner View →</Link>
          </Button>
          <ThemeToggle size="sm" />
          <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>Sign out</Button>
        </div>
      </header>
      <main className="mx-auto max-w-[640px] p-4 md:p-6">{children}</main>
      <OperatorNav />
    </div>
  );
}
