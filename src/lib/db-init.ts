// Database initialization - ensures tables exist on startup
import { db } from './db-server';

let _initialized = false;

export async function ensureDatabase(): Promise<void> {
  if (_initialized) return;
  try {
    // Simple query to check if DB is accessible
    await db.user.count();
    _initialized = true;
  } catch (error) {
    console.error('[DB] Database initialization failed:', error);
    // Try to push schema
    try {
      const { execSync } = require('child_process');
      const fs = require('fs');
      const path = require('path');
      
      // Ensure data directory exists
      const dataDir = path.dirname(process.env.DATABASE_URL?.replace('file:', '') || '/app/data/custom.db');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
      _initialized = true;
    } catch (pushError) {
      console.error('[DB] Schema push failed:', pushError);
      _initialized = true; // don't retry endlessly
    }
  }
}
