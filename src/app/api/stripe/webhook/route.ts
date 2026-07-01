import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import type Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/stripe/webhook
 *
 * Stripe webhook receiver. Verifies signature, then handles:
 * - checkout.session.completed
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 *
 * Configure this URL in your Stripe webhook dashboard.
 */
export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not set on the server." },
      { status: 500 }
    );
  }

  const stripe = getStripe()!;
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("Stripe webhook signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(stripe, checkoutSession);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      default:
        // Silently ignore other events
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe webhook handler error:", message);
    return NextResponse.json(
      { error: `Webhook handler failed: ${message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(
  stripe: Stripe,
  session: Stripe.Checkout.Session
) {
  const userId =
    session.metadata?.userId ??
    session.client_reference_id ??
    (typeof session.customer === "string" ? null : null);
  if (!userId) {
    console.warn("checkout.session.completed with no userId metadata");
    return;
  }

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  if (customerId) {
    await db.user.update({
      where: { id: userId },
      data: {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId ?? undefined,
      },
    });
  }

  // Pull the subscription so we know period end + price
  if (subscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      await applySubscription(sub);
    } catch (err) {
      console.error("Failed to retrieve subscription:", err);
    }
  }
}

async function handleSubscriptionChange(sub: Stripe.Subscription) {
  await applySubscription(sub);
}

async function applySubscription(sub: Stripe.Subscription) {
  const userId = sub.metadata?.userId;
  if (!userId) {
    console.warn("Subscription missing userId metadata, skipping.");
    return;
  }

  const isActive = ["active", "trialing"].includes(sub.status);
  const priceId = sub.items.data[0]?.price.id ?? null;

  await db.user.update({
    where: { id: userId },
    data: {
      stripeCustomerId:
        typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: getSubscriptionPeriodEnd(sub),
      plan: isActive ? "PRO" : "FREE",
    },
  });
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const userId = sub.metadata?.userId;
  if (!userId) return;
  await db.user.update({
    where: { id: userId },
    data: {
      plan: "FREE",
      stripeSubscriptionId: null,
      stripePriceId: null,
    },
  });
}

/**
 * `current_period_end` was removed from the publicly typed Subscription API in
 * newer Stripe SDK versions. Read it from the subscription items instead.
 */
function getSubscriptionPeriodEnd(sub: Stripe.Subscription): Date {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const legacyEnd = (sub as any).current_period_end;
  if (typeof legacyEnd === "number") {
    return new Date(legacyEnd * 1000);
  }
  const itemEnd = sub.items.data[0]?.current_period_end;
  if (typeof itemEnd === "number") {
    return new Date(itemEnd * 1000);
  }
  // Fallback: one month from now.
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}
