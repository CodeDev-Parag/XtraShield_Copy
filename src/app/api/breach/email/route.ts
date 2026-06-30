import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { scanEmailBreaches } from "@/lib/breach";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email query parameter is required." },
        { status: 400 }
      );
    }

    const { breaches, isMock } = await scanEmailBreaches(email);

    // Persist a BreachCheck row when an authenticated user runs the scan.
    // Public/anonymous callers skip this; their result is still returned.
    const session = await auth();
    if (session?.user?.id) {
      try {
        await db.breachCheck.create({
          data: {
            userId: session.user.id,
            email: email.toLowerCase().trim(),
            breachCount: breaches.length,
            breaches: JSON.stringify(breaches),
          },
        });
      } catch (dbError) {
        console.error("Failed to persist BreachCheck:", dbError);
        // Don't fail the whole request — scan result is more important.
      }
    }

    return NextResponse.json({ breaches, isMock });
  } catch (error: any) {
    console.error("Email Checker API route error:", error);
    return NextResponse.json(
      { error: "Failed to process request due to a server error." },
      { status: 500 }
    );
  }
}