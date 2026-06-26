import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const alerts = await db.alert.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50 // Limit to latest 50 alerts
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error("Error retrieving alerts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
