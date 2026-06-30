import { defineConfig } from "@prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.TURSO_DATABASE_URL
      ? `${process.env.TURSO_DATABASE_URL}?authToken=${process.env.TURSO_AUTH_TOKEN}`
      : (process.env.DATABASE_URL === "file:./dev.db"
        ? "file:./prisma/dev.db"
        : (process.env.DATABASE_URL || "file:./prisma/dev.db")),
  },
})
