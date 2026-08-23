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
    <div className="min-h-screen max-w-full overflow-x-clip bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
      <header className="sticky top-0 z-30 flex h-14 w-full max-w-full min-w-0 items-center justify-between gap-2 border-b bg-card px-3 sm:px-4 overflow-x-clip">
        <div className="min-w-0 shrink-0"><Logo /></div>
        <div className="flex min-w-0 items-center gap-1 sm:gap-2 shrink-0">
          <span className="hidden sm:inline text-xs text-muted-foreground">{name} • {role}</span>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/dashboard">Owner View →</Link>
          </Button>
          <ThemeToggle size="sm" />
          <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>Sign out</Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[640px] min-w-0 p-4 md:p-6 overflow-x-clip">{children}</main>
      <OperatorNav />
    </div>
  );
}
