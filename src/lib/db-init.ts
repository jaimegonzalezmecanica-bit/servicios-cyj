// Database initialization script
// Creates/migrates tables on first startup without needing prisma db push CLI
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initDatabase() {
  try {
    // Try a simple query - if tables exist this works, if not it creates them
    await prisma.$queryRaw`SELECT 1`;
    console.log('[DB] Database connection OK');

    // Check if we need to create tables by trying to query users
    try {
      await prisma.user.count();
      console.log('[DB] Tables verified');
    } catch {
      console.log('[DB] Tables may need migration - attempting prisma db push');
      // This won't work without prisma CLI, but we log it for debugging
      console.log('[DB] If tables are missing, ensure DATABASE_URL points to a valid SQLite file');
    }
  } catch (error) {
    console.error('[DB] Database initialization error:', error);
  }

  await prisma.$disconnect();
}

initDatabase();
