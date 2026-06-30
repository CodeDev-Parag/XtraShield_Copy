import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * POST /api/user/upgrade
 *
 * Phase 1: directly flip the user's plan to PRO in the DB. No Stripe, no email.
 * Phase 6 will swap this for a Stripe Checkout redirect — at that point this
 * route will become a webhook receiver only and the button in the UI will
 * redirect to /api/stripe/checkout.
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updated = await db.user.update({
      where: { id: session.user.id },
      data: { plan: "PRO" },
      select: { id: true, plan: true },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("Failed to upgrade user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/upgrade/downgrade — companion route to let the seeded admin
 * roll back to FREE without going through DB tooling.
 */
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updated = await db.user.update({
      where: { id: session.user.id },
      data: { plan: "FREE" },
      select: { id: true, plan: true },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("Failed to downgrade user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}