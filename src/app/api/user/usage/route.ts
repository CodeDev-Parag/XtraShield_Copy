import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/user/usage
 *
 * Returns the current user's API usage stats and plan limits.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        plan: true,
        _count: {
          select: {
            scans: true,
            breachChecks: true,
            alerts: true,
            monitoredEmails: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const limits: Record<string, Record<string, number>> = {
      FREE: {
        emailScansPerDay: 10,
        passwordChecksPerDay: 50,
        phishingChecksPerDay: 20,
        scansPerDay: 5,
        monitoredEmails: 5,
      },
      PRO: {
        emailScansPerDay: 100,
        passwordChecksPerDay: 500,
        phishingChecksPerDay: 200,
        scansPerDay: 50,
        monitoredEmails: 50,
      },
      ENTERPRISE: {
        emailScansPerDay: 1000,
        passwordChecksPerDay: 5000,
        phishingChecksPerDay: 1000,
        scansPerDay: 500,
        monitoredEmails: 500,
      },
    };

    return NextResponse.json({
      plan: user.plan,
      limits: limits[user.plan] || limits.FREE,
      usage: {
        totalScans: user._count.scans,
        totalBreachChecks: user._count.breachChecks,
        totalAlerts: user._count.alerts,
        monitoredEmails: user._count.monitoredEmails,
      },
    });
  } catch (error) {
    console.error("Error fetching usage:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
