import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { z } from "zod"

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const result = registerSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, password, name } = result.data

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 400 }
      )
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create the user and generate an API key in a transaction
    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          name,
          plan: "FREE",
        },
      })

      // Generate an API Key for the user
      await tx.apiKey.create({
        data: {
          userId: newUser.id,
          // key will default to cuid() automatically
        },
      })

      return newUser
    })

    // Return success but omit password
    return NextResponse.json(
      {
        message: "User registered successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
