import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Find the user's API key
    let apiKeyRecord = await db.apiKey.findUnique({
      where: { userId: session.user.id }
    })

    // If it doesn't exist for some reason, create it
    if (!apiKeyRecord) {
      apiKeyRecord = await db.apiKey.create({
        data: {
          userId: session.user.id
        }
      })
    }

    return NextResponse.json({ apiKey: apiKeyRecord.key })
  } catch (error) {
    console.error("Error retrieving API key:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
