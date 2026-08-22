/**
 * Server-only authorization guards.
 *
 * SECURITY BOUNDARY: every guard re-reads the user's role and status from the
 * database. JWT claims are never trusted for authorization — a deactivated or
 * demoted user is cut off immediately, not at their next token refresh.
 *
 * Use the `require*` variants in server components (they redirect) and the
 * `getAction*` variants inside server actions (they return null so the action
 * can render a form error instead of a redirect).
 */
import "server-only";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";

export type AuthUser = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: "OWNER" | "ADMIN" | "OPERATOR";
};

const ADMIN_ROLES = ["OWNER", "ADMIN"] as const;

function isAdminRole(role: AuthUser["role"]): boolean {
  return (ADMIN_ROLES as readonly string[]).includes(role);
}

/**
 * Resolve the current session against the database.
 * Returns null when unauthenticated, when the user record is gone, or when
 * status is no longer ACTIVE. Best-effort clears the stale session cookie.
 */
export async function getSessionUser(): Promise<AuthUser | null> {
  const session = await auth();
  const tokenId = (session?.user as unknown as { id?: string } | undefined)?.id;
  if (!tokenId || !session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: tokenId },
    select: { id: true, name: true, phone: true, email: true, role: true, status: true },
  });
  if (!user || user.status !== "ACTIVE") {
    // Cookie mutation is only permitted in actions/route handlers; during
    // render this throws — swallow it, the DB check above already denies access.
    try {
      await signOut({ redirect: false });
    } catch {}
    return null;
  }
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
  };
}

/** Page guard: any authenticated, ACTIVE user. Redirects to /login otherwise. */
export async function requireActiveUser(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** Page guard: OWNER/ADMIN with an ACTIVE account. */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireActiveUser();
  if (!isAdminRole(user.role)) redirect("/operator/today");
  return user;
}

/** Action guard: any authenticated, ACTIVE user; null on failure. */
export async function getActionUser(): Promise<AuthUser | null> {
  return getSessionUser();
}

/** Action guard: OWNER/ADMIN with an ACTIVE account; null on failure. */
export async function getActionAdmin(): Promise<AuthUser | null> {
  const user = await getSessionUser();
  if (!user || !isAdminRole(user.role)) return null;
  return user;
}

/**
 * Assignment scope helper: does this operator have an ACTIVE assignment for
 * the given machine (and optionally job site)?
 */
export async function hasActiveAssignment(
  userId: string,
  machineId: string,
  jobSiteId?: string | null
): Promise<boolean> {
  const assignment = await prisma.assignment.findFirst({
    where: {
      operatorId: userId,
      machineId,
      status: "ACTIVE",
      ...(jobSiteId ? { jobSiteId } : {}),
    },
    select: { id: true },
  });
  return assignment !== null;
}

/**
 * All ACTIVE assignments (with machine + job site) for a user, newest first.
 * Used to scope operator UI lists and submission checks to assigned resources.
 */
/** Page guard: require an ACTIVE assignment for this operator + machine.
 *  Server-only DB check; OWNER/ADMIN bypass scope. Redirects if not assigned. */
export async function requireAssignedOperator(machineId: string, jobSiteId?: string | null): Promise<AuthUser> {
  const user = await requireActiveUser();
  if (user.role !== "OPERATOR") return user;
  const ok = await hasActiveAssignment(user.id, machineId, jobSiteId ?? undefined);
  if (!ok) redirect("/operator/today?error=not_assigned");
  return user;
}

/** Action helper: returns error string if not assigned, null if ok. */
export async function assertAssignedOperator(userId: string, machineId: string, jobSiteId?: string | null): Promise<string | null> {
  const ok = await hasActiveAssignment(userId, machineId, jobSiteId ?? undefined);
  return ok ? null : "You are not actively assigned to this machine. Ask your admin for an assignment.";
}

export async function getActiveAssignments(userId: string) {
  return prisma.assignment.findMany({
    where: { operatorId: userId, status: "ACTIVE" },
    include: { machine: true, jobSite: true },
    orderBy: { assignedAt: "desc" },
  });
}
