import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST() {
  try {
    // Check if tables already exist
    const tables = await db.$queryRawUnsafe<{name: string}[]>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='User'"
    );

    if (tables.length > 0) {
      return NextResponse.json({ message: "Database already initialized." });
    }

    // Create all tables
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL,
        "name" TEXT,
        "password" TEXT,
        "image" TEXT,
        "plan" TEXT NOT NULL DEFAULT 'FREE',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        "stripeCustomerId" TEXT,
        "stripeSubscriptionId" TEXT,
        "stripePriceId" TEXT,
        "stripeCurrentPeriodEnd" DATETIME
      );
    `);

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Account" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "provider" TEXT NOT NULL,
        "providerAccountId" TEXT NOT NULL,
        "refresh_token" TEXT,
        "access_token" TEXT,
        "expires_at" INTEGER,
        "token_type" TEXT,
        "scope" TEXT,
        "id_token" TEXT,
        "session_state" TEXT,
        CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Session" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "sessionToken" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "expires" DATETIME NOT NULL,
        CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SystemScan" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "platform" TEXT NOT NULL,
        "osName" TEXT,
        "osVersion" TEXT,
        "kernelVersion" TEXT,
        "hostname" TEXT,
        "overallScore" INTEGER,
        "networkScore" INTEGER,
        "processScore" INTEGER,
        "softwareScore" INTEGER,
        "permissionScore" INTEGER,
        "openPorts" JSONB,
        "runningProcesses" JSONB,
        "installedSoftware" JSONB,
        "permissionIssues" JSONB,
        "networkInterfaces" JSONB,
        "vulnerabilities" JSONB,
        "agentVersion" TEXT,
        "scanDuration" INTEGER,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SystemScan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );
    `);

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "BreachCheck" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "breachCount" INTEGER NOT NULL DEFAULT 0,
        "breaches" JSONB,
        "checkedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "BreachCheck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );
    `);

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "MonitoredEmail" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "isVerified" BOOLEAN NOT NULL DEFAULT false,
        "lastChecked" DATETIME,
        "breachCount" INTEGER NOT NULL DEFAULT 0,
        "breaches" JSONB,
        "alertOn" BOOLEAN NOT NULL DEFAULT true,
        "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "MonitoredEmail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );
    `);

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Alert" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "severity" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "isRead" BOOLEAN NOT NULL DEFAULT false,
        "metadata" JSONB,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );
    `);

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ApiKey" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "key" TEXT NOT NULL,
        "name" TEXT NOT NULL DEFAULT 'XtraShield Agent Key',
        "lastUsed" DATETIME,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );
    `);

    // Create indexes
    await db.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`);
    await db.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId")`);
    await db.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken")`);
    await db.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "MonitoredEmail_userId_email_key" ON "MonitoredEmail"("userId", "email")`);
    await db.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "ApiKey_userId_key" ON "ApiKey"("userId")`);
    await db.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "ApiKey_key_key" ON "ApiKey"("key")`);

    // Add Stripe columns if migrating from older schema
    const userColumns = await db.$queryRawUnsafe<{name: string}[]>(
      `PRAGMA table_info("User")`
    );
    const columnNames = new Set(userColumns.map((c) => c.name));
    const stripeColumns = [
      "stripeCustomerId",
      "stripeSubscriptionId",
      "stripePriceId",
      "stripeCurrentPeriodEnd",
    ];
    for (const col of stripeColumns) {
      if (!columnNames.has(col)) {
        await db.$executeRawUnsafe(
          `ALTER TABLE "User" ADD COLUMN "${col}" TEXT`
        );
      }
    }
    await db.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "User_stripeCustomerId_key" ON "User"("stripeCustomerId") WHERE "stripeCustomerId" IS NOT NULL`
    );
    await db.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId") WHERE "stripeSubscriptionId" IS NOT NULL`
    );

    return NextResponse.json({ message: "Database tables created successfully." });
  } catch (error: any) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: error?.message || "Setup failed" },
      { status: 500 }
    );
  }
}
