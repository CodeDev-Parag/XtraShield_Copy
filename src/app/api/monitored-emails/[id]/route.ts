import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { scanEmailBreaches } from "@/lib/breach";

const patchSchema = z.object({
  alertOn: z.boolean().optional(),
  isVerified: z.boolean().optional(),
});

/** PATCH /api/monitored-emails/[id] — toggle alertOn / isVerified */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const updated = await db.monitoredEmail.update({
      where: { id, userId: session.user.id },
      data: parsed.data,
    });

    return NextResponse.json({ email: updated });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("Failed to patch monitored email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/** DELETE /api/monitored-emails/[id] — remove from watch list */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await db.monitoredEmail.delete({
      where: { id, userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("Failed to delete monitored email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/** PUT /api/monitored-emails/[id] — re-scan a single email against breach database */
export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await db.monitoredEmail.findUnique({
      where: { id, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { breaches, isMock } = await scanEmailBreaches(existing.email);
    const previousCount = existing.breachCount;
    const updated = await db.monitoredEmail.update({
      where: { id, userId: session.user.id },
      data: {
        breachCount: breaches.length,
        breaches: JSON.stringify(breaches),
        lastChecked: new Date(),
      },
    });

    // If the breach count grew, drop a NEW_BREACH alert.
    if (breaches.length > previousCount) {
      try {
        await db.alert.create({
          data: {
            userId: session.user.id,
            type: "NEW_BREACH",
            severity: "HIGH",
            title: `New breach detected for ${existing.email}`,
            description: `Re-scanning ${existing.email} found ${
              breaches.length - previousCount
            } additional leak(s). Total known breaches: ${breaches.length}.`,
            metadata: JSON.stringify({ email: existing.email, isMock }),
          },
        });
      } catch (alertError) {
        console.error("Failed to create NEW_BREACH alert on re-scan:", alertError);
      }
    }

    return NextResponse.json({
      email: { ...updated, breaches, isMock },
      previousCount,
    });
  } catch (error) {
    console.error("Failed to re-scan monitored email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}