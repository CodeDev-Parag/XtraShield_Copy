import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { alertId } = await request.json();

    if (!alertId || typeof alertId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid alertId" },
        { status: 400 }
      );
    }

    const updatedAlert = await db.alert.update({
      where: {
        id: alertId,
        userId: session.user.id,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, alert: updatedAlert });
  } catch (error: any) {
    // P2025 = record not found; treat as 404 instead of 500
    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "Alert not found" },
        { status: 404 }
      );
    }
    console.error("Error resolving alert:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}