import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

/**
 * POST /api/proxy/breach/password
 *
 * Proxied password breach check with rate limiting.
 * The server forwards only the 5-char SHA-1 prefix — passwords never leave the client.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const hashPrefix = typeof body.hashPrefix === "string" ? body.hashPrefix.trim() : "";

    if (!hashPrefix || hashPrefix.length !== 5) {
      return NextResponse.json(
        { error: "hashPrefix must be exactly 5 characters of a SHA-1 hash." },
        { status: 400 }
      );
    }

    // Rate limit check
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });
    const plan = user?.plan || "FREE";
    const rateLimit = checkRateLimit(session.user.id, "breach/password", plan);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Upgrade your plan for higher limits.",
          resetAt: rateLimit.resetAt,
        },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimit),
        }
      );
    }

    // Forward to PwnedPasswords API
    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${hashPrefix.toUpperCase()}`,
      {
        method: "GET",
        headers: { "User-Agent": "XtraShield-Security-App" },
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to query breach password API" },
        { status: response.status }
      );
    }

    const textData = await response.text();

    return new NextResponse(textData, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
        ...getRateLimitHeaders(rateLimit),
      },
    });
  } catch (error: any) {
    console.error("Proxy breach password error:", error);
    return NextResponse.json(
      { error: "Failed to process request." },
      { status: 500 }
    );
  }
}
