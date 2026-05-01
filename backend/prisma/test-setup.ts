import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { join } from 'path';

async function setupTestDb() {
  const dbPath = join(process.cwd(), 'test.db');
  const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
  const prisma = new PrismaClient({ adapter });
  
  try {
    // Применяем миграции
    console.log('Applying migrations to test database...');
    execSync('npx prisma migrate deploy', { 
      env: { ...process.env, DATABASE_URL: `file:${dbPath}` },
      stdio: 'inherit' 
    });
    console.log('Test database ready!');
  } catch (error) {
    console.error('Failed to setup test database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupTestDb();