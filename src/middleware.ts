import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

/**
 * Middleware uses the Edge-safe authConfig directly (no Prisma/bcrypt).
 * It protects dashboard pages AND protected API routes.
 */
const { auth } = NextAuth(authConfig);

const protectedPageRoutes = [
  "/dashboard",
  "/scanner",
  "/email",
  "/password",
  "/network",
  "/phishing",
  "/ssl",
  "/dark-web",
  "/reports",
  "/settings",
];

const protectedApiPrefixes = [
  "/api/alerts",
  "/api/scan/history",
  "/api/user/api-key",
  "/api/user/usage",
  "/api/monitored-emails",
  "/api/user/preferences",
  "/api/stripe",
  "/api/proxy/breach",
  "/api/proxy/phishing",
];

export async function middleware(request: Request) {
  const session = await auth();
  const { pathname } = new URL(request.url);

  const isProtectedPage = protectedPageRoutes.some((r) => pathname === r || pathname.startsWith(`${r}/`));
  const isProtectedApi = protectedApiPrefixes.some((r) => pathname === r || pathname.startsWith(`${r}/`));

  if ((isProtectedPage || isProtectedApi) && !session?.user?.id) {
    // For API routes, return 401 directly; for pages, redirect to /login.
    if (isProtectedApi) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized. Please sign in." }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/scanner/:path*",
    "/email/:path*",
    "/password/:path*",
    "/network/:path*",
    "/phishing/:path*",
    "/ssl/:path*",
    "/dark-web/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/api/alerts/:path*",
    "/api/scan/history/:path*",
    "/api/user/api-key/:path*",
    "/api/user/usage/:path*",
    "/api/monitored-emails/:path*",
    "/api/user/preferences/:path*",
    "/api/stripe/:path*",
    "/api/proxy/breach/:path*",
    "/api/proxy/phishing/:path*",
  ],
};