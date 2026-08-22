import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Optimistic routing layer (Next.js Proxy — replaces deprecated middleware.ts).
 *
 * NOTE: This is a redirect optimization only, NOT the authorization boundary.
 * Real authorization happens server-side: every admin/operator page and every
 * mutating server action re-checks role + ACTIVE status against the database
 * via src/lib/auth-guards.ts. A stale or forged JWT may pass this proxy but
 * will never pass the database-backed guards.
 */
export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const role = (req.auth?.user as { role?: string } | undefined)?.role;
  const pathname = req.nextUrl.pathname;

  const isAdminRoute = pathname.startsWith("/admin");
  const isOperatorRoute = pathname.startsWith("/operator");
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/api/auth");

  // Public routes
  if (pathname === "/" || isAuthRoute) return NextResponse.next();

  if (!isLoggedIn && (isAdminRoute || isOperatorRoute)) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isLoggedIn && pathname === "/login") {
    // redirect based on role
    if (role === "OPERATOR") return NextResponse.redirect(new URL("/operator/today", req.nextUrl));
    return NextResponse.redirect(new URL("/admin/dashboard", req.nextUrl));
  }

  if (isAdminRoute && isLoggedIn) {
    if (role !== "OWNER" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/operator/today", req.nextUrl));
    }
  }

  if (isOperatorRoute && isLoggedIn) {
    // allow OPERATOR, OWNER, ADMIN to access operator (for demo)
    // but if you want strict, uncomment next lines:
    // if (role !== "OPERATOR") return NextResponse.redirect(new URL("/admin/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)"] 
};
