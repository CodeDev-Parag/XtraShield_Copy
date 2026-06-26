import { defineConfig } from "@prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // In Prisma 7, relative paths in prisma.config.ts are resolved relative to the config file (root).
    // To place dev.db in prisma/dev.db (like older versions of Prisma), we map file:./dev.db to file:./prisma/dev.db.
    url: process.env.DATABASE_URL === "file:./dev.db" 
      ? "file:./prisma/dev.db" 
      : (process.env.DATABASE_URL || "file:./prisma/dev.db"),
  },
})
