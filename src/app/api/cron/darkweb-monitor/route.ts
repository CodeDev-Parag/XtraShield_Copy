import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scanEmailBreaches } from "@/lib/breach";

/**
 * GET /api/cron/darkweb-monitor
 *
 * Vercel cron job endpoint — runs every hour to rescan monitored emails.
 * Protected by CRON_SECRET env var (Vercel sends this header automatically).
 *
 * Set up in vercel.json:
 * {
 *   "crons": [{ "path": "/api/cron/darkweb-monitor", "schedule": "0 * * * *" }]
 * }
 */
export async function GET(req: NextRequest) {
  // Verify this is a legitimate cron request from Vercel
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const monitoredEmails = await db.monitoredEmail.findMany({
      where: { alertOn: true },
    });

    let scanned = 0;
    let newBreaches = 0;
    let alertsCreated = 0;

    for (const m of monitoredEmails) {
      try {
        const { breaches } = await scanEmailBreaches(m.email);
        const newBreachCount = breaches.length;
        const oldBreachCount = m.breachCount;

        // Update the monitored email record
        await db.monitoredEmail.update({
          where: { id: m.id },
          data: {
            breachCount: newBreachCount,
            breaches: breaches as any,
            lastChecked: new Date(),
          },
        });

        scanned++;

        // Create alert if new breaches found
        if (newBreachCount > oldBreachCount) {
          newBreaches += newBreachCount - oldBreachCount;

          await db.alert.create({
            data: {
              userId: m.userId,
              type: "NEW_BREACH",
              severity: newBreachCount >= 3 ? "HIGH" : "MEDIUM",
              title: `New breach detected for ${m.email}`,
              description: `Re-scan found ${newBreachCount - oldBreachCount} new leak(s). Total: ${newBreachCount}.`,
              metadata: JSON.stringify({ email: m.email, sources: breaches.map((b) => b.name) }),
            },
          });
          alertsCreated++;
        }
      } catch (err) {
        console.error(`Failed to scan ${m.email}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      scanned,
      totalMonitored: monitoredEmails.length,
      newBreaches,
      alertsCreated,
    });
  } catch (error: any) {
    console.error("Dark web monitor cron failed:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
