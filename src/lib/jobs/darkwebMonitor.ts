import { db } from '@/lib/db';
import { scanEmailBreaches } from '@/lib/breach';
import type { Prisma } from '@prisma/client';

/**
 * Background job to periodically rescan all monitored emails for new breaches.
 * This runs on the server side (Node.js) and should be started once per server process.
 * In a production deployment with multiple instances (e.g. Vercel), consider using a
 * centralized cron service (e.g. Vercel Cron Jobs) instead of an in-process timer.
 */
export class DarkWebMonitor {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private readonly intervalMs = 60 * 60 * 1000; // 1 hour

  /** Start the monitoring job if not already running. */
  start() {
    if (this.isRunning) return;
    this.timer = setInterval(() => {
      this.runScan().catch(err => {
        console.error('Dark web monitor scan failed:', err);
      });
    }, this.intervalMs);
    // Run immediately on start
    this.runScan().catch(err => {
      console.error('Dark web monitor initial scan failed:', err);
    });
    this.isRunning = true;
    console.log('Dark web monitor started');
  }

  /** Stop the monitoring job. */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log('Dark web monitor stopped');
  }

  /** Perform one scan cycle: for each monitored email with alertOn=true, rescan via the breach check function. */
  private async runScan() {
    try {
      // Fetch all monitored emails that have alertOn enabled
      const monitoredEmails = await db.monitoredEmail.findMany({
        where: {
          alertOn: true
        }
      });

      for (const m of monitoredEmails) {
        // Rescan this email via the breach check function.
        const { breaches, isMock } = await scanEmailBreaches(m.email);
        const newBreachCount = breaches.length;
        const oldBreachCount = m.breachCount;

        if (newBreachCount > oldBreachCount) {
          // New breaches found: update the monitored email and create an alert.
          await db.monitoredEmail.update({
            where: { id: m.id },
            data: {
              breachCount: newBreachCount,
              breaches: breaches as unknown as Prisma.InputJsonValue,
              lastChecked: new Date()
            }
          });

          // Create a NEW_BREACH alert.
          await db.alert.create({
            data: {
              userId: m.userId,
              type: 'NEW_BREACH',
              severity: newBreachCount >= 3 ? 'HIGH' : 'MEDIUM',
              title: `New breach detected for ${m.email}`,
              description: `Re-scanning ${m.email} found ${newBreachCount - oldBreachCount} new leak(s). Total known breaches: ${newBreachCount}.`,
              metadata: { email: m.email, isMock }
            }
          });
        } else {
          // No new breaches, but we still update the lastChecked and breachCount (in case it decreased? shouldn't happen)
          await db.monitoredEmail.update({
            where: { id: m.id },
            data: {
              breachCount: newBreachCount,
              breaches: breaches as unknown as Prisma.InputJsonValue,
              lastChecked: new Date()
            }
          });
        }
      }
    } catch (err) {
      console.error('Error in dark web monitor scan:', err);
      throw err;
    }
  }
}

// Create a singleton instance
export const darkWebMonitor = new DarkWebMonitor();
