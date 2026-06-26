import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import crypto from "crypto"

export async function POST() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const newKey = "xtra_" + crypto.randomBytes(24).toString("hex")

    // Update the API key (or create if somehow missing)
    const apiKeyRecord = await db.apiKey.upsert({
      where: { userId: session.user.id },
      update: { 
        key: newKey,
        createdAt: new Date(), // Reset creation date for new key
      },
      create: { 
        userId: session.user.id, 
        key: newKey 
      }
    })

    return NextResponse.json({ 
      message: "API key regenerated successfully",
      apiKey: apiKeyRecord.key 
    })
  } catch (error) {
    console.error("Error regenerating API key:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
