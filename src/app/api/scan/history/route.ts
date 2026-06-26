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

    // Query scan history from database
    const scans = await db.systemScan.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ scans });
  } catch (error) {
    console.error("Error retrieving scan history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
