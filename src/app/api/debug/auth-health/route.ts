import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const googleId = process.env.GOOGLE_CLIENT_ID;
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET;
  const authSecret = process.env.AUTH_SECRET;
  const nextAuthUrl = process.env.NEXTAUTH_URL;

  return NextResponse.json({
    GOOGLE_CLIENT_ID: googleId
      ? `${googleId.substring(0, 10)}...(${googleId.length} chars)`
      : "MISSING",
    GOOGLE_CLIENT_SECRET: googleSecret
      ? `set (${googleSecret.length} chars)`
      : "MISSING",
    AUTH_SECRET: authSecret ? `set (${authSecret.length} chars)` : "MISSING",
    NEXTAUTH_URL: nextAuthUrl || "MISSING",
    googleProviderEnabled: !!(googleId && googleSecret),
  });
}
