import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  if (!stripeInstance) {
    stripeInstance = new Stripe(secretKey, {
      typescript: true,
      appInfo: {
        name: "XtraShield",
        version: "0.1.0",
      },
    });
  }
  return stripeInstance;
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

/**
 * Plans served by Stripe checkout. The price ID is configurable via env so
 * live/test products don't have to be hard-coded.
 */
export interface StripePlan {
  id: "pro";
  name: string;
  description: string;
  priceLookupKey?: string;
  amountCents: number;
  currency: string;
}

export const PRO_PLAN: StripePlan = {
  id: "pro",
  name: "XtraShield PRO",
  description:
    "PRO gives you higher rate limits, automated email breach monitoring, and priority cron scanning.",
  priceLookupKey: "xtrashield_pro_monthly",
  amountCents: 1900,
  currency: "usd",
};

export async function findOrCreateCustomer(
  stripe: Stripe,
  params: { email: string; existingCustomerId?: string | null; userId: string }
): Promise<Stripe.Customer> {
  if (params.existingCustomerId) {
    try {
      const existing = await stripe.customers.retrieve(params.existingCustomerId);
      if (!existing.deleted) return existing as Stripe.Customer;
    } catch {
      // fall through and create a new one
    }
  }
  return stripe.customers.create({
    email: params.email,
    metadata: { userId: params.userId },
  });
}
