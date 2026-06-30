import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { scanEmailBreaches } from "@/lib/breach";

const createSchema = z.object({
  email: z.string().email("Invalid email address"),
});

/** GET /api/monitored-emails — list all monitored emails for the current user */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await db.monitoredEmail.findMany({
      where: { userId: session.user.id },
      orderBy: { addedAt: "desc" },
    });

    // Parse the JSON `breaches` column so the client gets a plain array.
    const emails = rows.map((r) => ({
      ...r,
      breaches: parseBreaches(r.breaches),
    }));

    return NextResponse.json({ emails });
  } catch (error) {
    console.error("Failed to list monitored emails:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/** POST /api/monitored-emails — add a new email to the watch list */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const email = parsed.data.email.toLowerCase().trim();

    // Dedupe per user.
    const existing = await db.monitoredEmail.findUnique({
      where: { userId_email: { userId: session.user.id, email } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "This email is already on your watch list." },
        { status: 409 }
      );
    }

    // Run an immediate first scan so the user sees breaches without waiting.
    const { breaches, isMock } = await scanEmailBreaches(email);

    const row = await db.monitoredEmail.create({
      data: {
        userId: session.user.id,
        email,
        breachCount: breaches.length,
        breaches: JSON.stringify(breaches),
        lastChecked: new Date(),
      },
    });

    // If breaches are found, drop an Alert into the user's feed.
    if (breaches.length > 0) {
      try {
        await db.alert.create({
          data: {
            userId: session.user.id,
            type: "NEW_BREACH",
            severity: breaches.length >= 3 ? "HIGH" : "MEDIUM",
            title: `Email Watch List: ${breaches.length} breach(es) found for ${email}`,
            description: `${email} appears in ${breaches.length} known data leak(s) including: ${breaches
              .slice(0, 3)
              .map((b) => b.name)
              .join(", ")}.`,
            metadata: JSON.stringify({ email, isMock, sources: breaches.map((b) => b.name) }),
          },
        });
      } catch (alertError) {
        console.error("Failed to create NEW_BREACH alert:", alertError);
      }
    }

    return NextResponse.json(
      {
        email: {
          ...row,
          breaches,
          isMock,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "This email is already on your watch list." },
        { status: 409 }
      );
    }
    console.error("Failed to add monitored email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function parseBreaches(raw: unknown): any[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return Array.isArray(raw) ? raw : [];
}