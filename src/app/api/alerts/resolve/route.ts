import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { alertId } = await request.json();

    if (!alertId) {
      return NextResponse.json(
        { error: "Missing alertId parameter" },
        { status: 400 }
      );
    }

    const updatedAlert = await db.alert.update({
      where: { 
        id: alertId,
        userId: session.user.id // safety check to ensure it belongs to the user
      },
      data: { isRead: true }
    });

    return NextResponse.json({ success: true, alert: updatedAlert });
  } catch (error: any) {
    console.error("Error resolving alert:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
