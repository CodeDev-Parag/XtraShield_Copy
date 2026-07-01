import NextAuth from "next-auth";
import { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { db } from "./db";
import { authConfig } from "./auth.config";
import bcrypt from "bcryptjs";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      plan: string;
    } & DefaultSession["user"];
  }
}

/**
 * Full NextAuth setup used by the API route handlers (Node runtime only).
 *
 * No PrismaAdapter — NextAuth v5 (beta.31) has a known incompatibility
 * between PrismaAdapter and the Credentials provider when used together
 * with JWT sessions. The adapter tries to manage the user record for
 * OAuth flows, but intercepts Credentials authorize() and breaks it.
 *
 * Instead we persist Google-OAuth users manually inside the `signIn`
 * callback, so we keep database-backed accounts and sessions without
 * importing the conflicting adapter.
 */
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  basePath: "/api/auth",
  providers: [
    Google({
      clientId: googleClientId!,
      clientSecret: googleClientSecret!,
    }),
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const { email, password } = credentials as {
          email: string;
          password: string;
        };

        try {
          const user = await db.user.findUnique({ where: { email } });
          if (!user || !user.password) return null;

          const valid = await bcrypt.compare(password, user.password);
          if (!valid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            plan: user.plan,
          };
        } catch (error) {
          console.error("Credentials authorize error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    /**
     * Persist Google-OAuth users into Turso via Prisma at first sign-in.
     * Returns true so NextAuth proceeds with the OAuth flow.
     */
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;
      if (!user?.email) return false;

      try {
        const existing = await db.user.findUnique({
          where: { email: user.email },
        });
        if (!existing) {
          const newUser = await db.user.create({
            data: {
              email: user.email,
              name: user.name ?? profile?.name ?? null,
              image: user.image ?? null,
              plan: "FREE",
            },
          });
          await db.account.create({
            data: {
              userId: newUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token ?? null,
              refresh_token: account.refresh_token ?? null,
              expires_at:
                typeof account.expires_at === "number" ? account.expires_at : null,
              token_type: account.token_type ?? null,
              scope: account.scope ?? null,
              id_token: account.id_token ?? null,
              session_state:
                typeof account.session_state === "string"
                  ? account.session_state
                  : null,
            },
          });
        } else {
          await db.account.upsert({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
            update: {
              access_token: account.access_token ?? null,
              refresh_token: account.refresh_token ?? null,
              expires_at:
                typeof account.expires_at === "number" ? account.expires_at : null,
              token_type: account.token_type ?? null,
              scope: account.scope ?? null,
              id_token: account.id_token ?? null,
            },
            create: {
              userId: existing.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token ?? null,
              refresh_token: account.refresh_token ?? null,
              expires_at:
                typeof account.expires_at === "number" ? account.expires_at : null,
              token_type: account.token_type ?? null,
              scope: account.scope ?? null,
              id_token: account.id_token ?? null,
            },
          });
        }
      } catch (error) {
        console.error("Failed to persist OAuth user:", error);
        return false;
      }
      return true;
    },
    /**
     * Map the just-persisted user into the token so the session callback
     * can attach id + plan.
     */
    async jwt({ token, user, account }) {
      if (user) {
        token.id = (user as { id?: string }).id ?? token.sub;
        token.plan = (user as { plan?: string }).plan ?? "FREE";
      }
      // Persist a fresh DB lookup on OAuth login so plan is current.
      if (account?.provider === "google" && user?.email) {
        try {
          const dbUser = await db.user.findUnique({
            where: { email: user.email },
            select: { id: true, plan: true },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.plan = dbUser.plan;
          }
        } catch (error) {
          console.error("jwt callback post-OAuth lookup failed:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id as string) ?? token.sub ?? "";
        session.user.plan = (token.plan as string) ?? "FREE";
      }
      return session;
    },
  },
  logger: {
    error(error) {
      console.error("[NEXTAUTH-ERROR]", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    },
    warn(code) {
      console.warn("[NEXTAUTH-WARN]", code);
    },
    debug() {},
  },
});
