import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl && tursoToken) {
    // eslint-disable-next-line no-eval
    const { PrismaLibSql } = eval('require')('@prisma/adapter-libsql');
    const adapter = new PrismaLibSql({ url: tursoUrl, authToken: tursoToken });
    return new PrismaClient({ adapter });
  }

  // Local SQLite fallback — hidden from Turbopack
  // eslint-disable-next-line no-eval
  const { PrismaBetterSqlite3 } = eval('require')('@prisma/adapter-better-sqlite3');
  const path = require('path');
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
