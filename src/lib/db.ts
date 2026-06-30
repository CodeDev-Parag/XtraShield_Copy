import { PrismaClient } from '@prisma/client';
import path from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  // Production: use Turso (serverless SQLite)
  if (tursoUrl && tursoToken) {
    const { PrismaLibSQL } = require('@prisma/adapter-libsql');
    const adapter = new PrismaLibSQL({
      url: tursoUrl,
      authToken: tursoToken,
    });
    return new PrismaClient({ adapter });
  }

  // Development: use local SQLite via better-sqlite3
  const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
  let raw = process.env.DATABASE_URL || 'file:./prisma/dev.db';
  if (raw === 'file:./dev.db') raw = 'file:./prisma/dev.db';

  const dbPath = raw.startsWith('file:')
    ? path.resolve(process.cwd(), raw.replace(/^file:/, ''))
    : path.resolve(process.cwd(), 'prisma', 'dev.db');

  const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
