import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateApiKey } from "@/lib/api-key";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let apiKeyRecord = await db.apiKey.findUnique({
      where: { userId: session.user.id },
    });

    if (!apiKeyRecord) {
      apiKeyRecord = await db.apiKey.create({
        data: { userId: session.user.id, key: generateApiKey() },
      });
    } else if (!apiKeyRecord.key.startsWith("xtra_")) {
      apiKeyRecord = await db.apiKey.update({
        where: { id: apiKeyRecord.id },
        data: { key: generateApiKey() },
      });
    }

    return NextResponse.json({ apiKey: apiKeyRecord.key });
  } catch (error) {
    console.error("Error retrieving API key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
