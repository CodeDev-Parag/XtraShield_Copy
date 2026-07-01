import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

/**
 * POST /api/stripe/portal
 *
 * Opens a Stripe customer portal session so users can cancel or update their
 * subscription without leaving Stripe's hosted UI.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isStripeConfigured()) {
      return NextResponse.json(
        {
          error:
            "Stripe is not configured on this server. Cancel directly from your account settings.",
        },
        { status: 503 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true },
    });
    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No active Stripe customer for this account." },
        { status: 404 }
      );
    }

    const origin =
      req.headers.get("origin") ??
      process.env.NEXTAUTH_URL ??
      "http://localhost:3000";

    const portalSession = await getStripe()!.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${origin}/settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe portal error:", message);
    return NextResponse.json(
      { error: `Failed to open billing portal: ${message}` },
      { status: 500 }
    );
  }
}
