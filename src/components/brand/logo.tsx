import { cn } from "@/lib/utils";

export function Logo({ collapsed, className, light }: { collapsed?: boolean; className?: string; light?: boolean }) {
  if (collapsed) {
    return (
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--sitaram-yellow)] text-[var(--charcoal)]", className)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M3 16L8 10L11 13L14 9L21 16H3Z" fill="currentColor" />
          <rect x="3" y="17" width="18" height="2" rx="1" fill="currentColor" opacity="0.9" />
          <circle cx="7.5" cy="12" r="1.3" fill="white" />
        </svg>
      </div>
    );
  }
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--sitaram-yellow)] text-[var(--charcoal)] shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M3 16L8 10L11 13L14 9L21 16H3Z" fill="currentColor" />
          <rect x="3" y="17" width="18" height="2" rx="1" fill="currentColor" opacity="0.9" />
          <circle cx="7.5" cy="12" r="1.3" fill="white" />
        </svg>
      </div>
      <div className="leading-none">
        <div className={cn("text-[15px] font-extrabold tracking-tight", light ? "text-white" : "text-foreground")}>
          Sitaram
        </div>
        <div className={cn("text-[10px] font-semibold tracking-[0.18em] uppercase", light ? "text-white/70" : "text-muted-foreground")}>
          Earthmovers
        </div>
      </div>
    </div>
  );
}

export function LogoMark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M3 16L8 10L11 13L14 9L21 16H3Z" fill="currentColor" />
      <rect x="3" y="17" width="18" height="2" rx="1" fill="currentColor" opacity="0.9" />
    </svg>
  );
}
