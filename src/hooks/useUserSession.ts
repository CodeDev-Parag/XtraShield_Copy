"use client";

import { useSession } from "next-auth/react";

export type UserPlan = "FREE" | "PRO" | "ENTERPRISE";

export interface UserSessionState {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    plan: UserPlan;
  } | null;
  plan: UserPlan;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Thin wrapper over `useSession()` that exposes the plan in a typed,
 * UI-friendly shape and normalizes missing values to FREE.
 *
 * Why a wrapper: the Session type in next-auth v5 beta puts arbitrary
 * fields under `user` only when the jwt+session callbacks forward them;
 * without this wrapper every page has to repeat the null-safety dance.
 */
export function useUserSession(): UserSessionState {
  const { data, status } = useSession();
  const raw = data?.user as
    | { id?: string; plan?: string }
    | undefined;

  const plan: UserPlan =
    raw?.plan === "PRO" || raw?.plan === "ENTERPRISE"
      ? (raw.plan as UserPlan)
      : "FREE";

  return {
    user: data?.user
      ? {
          id: raw?.id ?? "",
          name: data.user.name,
          email: data.user.email,
          image: data.user.image,
          plan,
        }
      : null,
    plan,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
  };
}