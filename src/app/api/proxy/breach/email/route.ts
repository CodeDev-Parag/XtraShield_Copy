import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { scanEmailBreaches } from "@/lib/breach";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

/**
 * POST /api/proxy/breach/email
 *
 * Proxied email breach check with rate limiting.
 * The server's API key is used — users don't need their own.
 * Rate limited per user per plan.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    // Rate limit check
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });
    const plan = user?.plan || "FREE";
    const rateLimit = checkRateLimit(session.user.id, "breach/email", plan);

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

    // Use server's HIBP key (no user-provided key)
    const { breaches, isMock } = await scanEmailBreaches(email);

    // Persist BreachCheck row
    try {
      await db.breachCheck.create({
        data: {
          userId: session.user.id,
          email: email.toLowerCase(),
          breachCount: breaches.length,
          breaches: JSON.stringify(breaches),
        },
      });
    } catch (dbError) {
      console.error("Failed to persist BreachCheck:", dbError);
    }

    return NextResponse.json(
      { breaches, isMock },
      { headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error: any) {
    console.error("Proxy breach email error:", error);
    return NextResponse.json(
      { error: "Failed to process request." },
      { status: 500 }
    );
  }
}
