import Link from "next/link";
import { Compass } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted"><Compass className="h-8 w-8 text-muted-foreground" /></div>
      <Logo />
      <h1 className="text-xl font-bold tracking-tight">Page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">The page you are looking for does not exist or has been moved.</p>
      <Link href="/operator/today" className="mt-2 inline-flex h-11 items-center rounded-lg bg-[var(--charcoal)] px-6 text-sm font-semibold text-white hover:opacity-90">
        Go to Today&apos;s Assignment
      </Link>
    </main>
  );
}
