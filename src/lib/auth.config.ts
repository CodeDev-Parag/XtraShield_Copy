import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config used by middleware.
 * Must NOT import Node-only modules (Prisma, bcrypt, better-sqlite3, etc.).
 * The full provider list (Credentials with DB lookup, Google with env vars)
 * lives in src/lib/auth.ts and is used by the API route handlers.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [], // populated in src/lib/auth.ts for the Node runtime only
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.plan = (user as { plan?: string }).plan;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.plan = token.plan as string;
      }
      return session;
    },
  },
  trustHost: true,
};