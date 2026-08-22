import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { env } from "@/lib/env";
import { loginRateLimitKey, isLoginRateLimited, registerLoginFailure, clearLoginFailures } from "@/lib/rate-limit";

const credentialsSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(3),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // refresh once a day on activity
  },
  secret: env.AUTH_SECRET,
  trustHost: true,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        identifier: { label: "Phone or Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { identifier, password } = parsed.data;

        // Rate limit: 5 failed attempts per identifier+IP per 15 minutes.
        const forwarded = request instanceof Request ? request.headers.get("x-forwarded-for") : null;
        const ip = forwarded ? forwarded.split(",")[0].trim() : "local";
        const limitKey = loginRateLimitKey(identifier, ip);
        if (isLoginRateLimited(limitKey)) return null;

        const user = await prisma.user.findFirst({
          where: {
            OR: [{ phone: identifier }, { email: identifier }],
            status: "ACTIVE",
          },
        });
        if (!user) {
          registerLoginFailure(limitKey);
          return null;
        }
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          registerLoginFailure(limitKey);
          return null;
        }
        clearLoginFailures(limitKey);
        return {
          id: user.id,
          name: user.name,
          email: user.email ?? undefined,
          phone: user.phone,
          role: user.role,
        } as never;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as unknown as { role: string }).role;
        token.phone = (user as unknown as { phone: string }).phone;
        token.id = (user as unknown as { id: string }).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as unknown as { role: string }).role = token.role as string;
        (session.user as unknown as { phone: string }).phone = token.phone as string;
        (session.user as unknown as { id: string }).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
