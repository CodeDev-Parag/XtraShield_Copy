import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * GET/POST /api/user/upgrade — legacy placeholder.
 *
 * Now that Stripe Checkout drives upgrades, this endpoint only exists for
 * backward compatibility. It simply 302s to /api/stripe/checkout which either
 * makes the user a Stripe customer or returns 503 if Stripe isn't configured.
 * The settings page now calls /api/stripe/checkout directly.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const origin =
    req.headers.get("origin") ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000";

  // Forward to checkout endpoint via internal call would be cleanest, but
  // simpler to 302 to a server-side redirect.
  return NextResponse.redirect(new URL("/api/stripe/checkout", origin), {
    status: 307,
  });
}

/**
 * DELETE — previously triggered downgrade. Now handled via Stripe Billing
 * Portal so the subscription state changes only when Stripe confirms it.
 */
export async function DELETE() {
  return NextResponse.json(
    {
      error:
        "Downgrade is now handled via the Stripe Billing Portal. Open your subscription settings to cancel.",
    },
    { status: 410 } // 410 Gone
  );
}
