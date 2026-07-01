import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getStripe,
  isStripeConfigured,
  PRO_PLAN,
  findOrCreateCustomer,
} from "@/lib/stripe";

/**
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout session for the PRO plan. The user is redirected
 * to Stripe's hosted checkout page; on success, the webhook flips their plan
 * to PRO.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isStripeConfigured()) {
      return NextResponse.json(
        {
          error:
            "Stripe is not configured on this server. Add STRIPE_SECRET_KEY to enable billing.",
        },
        { status: 503 }
      );
    }

    const stripe = getStripe()!;

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        stripeCustomerId: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const origin =
      req.headers.get("origin") ??
      process.env.NEXTAUTH_URL ??
      "http://localhost:3000";

    // Look up a configured price ID or create an inline price.
    // Using inline ad-hoc price keeps this self-contained — no Stripe dashboard
    // setup required for testing.
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: user.email,
      client_reference_id: user.id,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: PRO_PLAN.currency,
            unit_amount: PRO_PLAN.amountCents,
            recurring: { interval: "month" },
            product_data: {
              name: PRO_PLAN.name,
              description: PRO_PLAN.description,
            },
          },
        },
      ],
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing/cancel`,
      metadata: { userId: user.id },
      subscription_data: {
        metadata: { userId: user.id },
      },
    });

    if (!checkoutSession.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Stripe checkout error:", message);
    return NextResponse.json(
      { error: `Failed to create checkout session: ${message}` },
      { status: 500 }
    );
  }
}
