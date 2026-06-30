import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';
import { generateApiKey } from '../src/lib/api-key';

const dbPath = path.resolve(process.cwd(), 'prisma', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  const demoEmail = 'admin@xtrashield.io';

  const existingUser = await prisma.user.findUnique({
    where: { email: demoEmail }
  });

  if (!existingUser) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        email: demoEmail,
        name: 'Secured User',
        password: hashedPassword,
        plan: 'FREE',
      }
    });

    await prisma.apiKey.create({
      data: {
        userId: user.id,
        name: 'XtraShield Agent Key',
        key: generateApiKey(),
      }
    });

    console.log('Created demo user:', user.email);
  } else {
    const existingKey = await prisma.apiKey.findUnique({
      where: { userId: existingUser.id },
    });

    if (!existingKey) {
      await prisma.apiKey.create({
        data: {
          userId: existingUser.id,
          name: 'XtraShield Agent Key',
          key: generateApiKey(),
        },
      });
      console.log('Created demo API key for:', existingUser.email);
    } else if (!existingKey.key.startsWith('xtra_')) {
      await prisma.apiKey.update({
        where: { id: existingKey.id },
        data: { key: generateApiKey() },
      });
      console.log('Regenerated legacy demo API key for:', existingUser.email);
    }

    console.log('Demo user already exists:', existingUser.email);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
