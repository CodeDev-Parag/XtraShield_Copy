import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateApiKey } from "@/lib/api-key";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const newKey = generateApiKey();

    const apiKeyRecord = await db.apiKey.upsert({
      where: { userId: session.user.id },
      update: {
        key: newKey,
        createdAt: new Date(),
      },
      create: {
        userId: session.user.id,
        key: newKey,
      },
    });

    return NextResponse.json({
      message: "API key regenerated successfully",
      apiKey: apiKeyRecord.key,
    });
  } catch (error) {
    console.error("Error regenerating API key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
