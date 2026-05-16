import { execSync } from 'child_process';

const testDbUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

if (!testDbUrl) {
  console.error('TEST_DATABASE_URL or DATABASE_URL must be set');
  process.exit(1);
}

execSync('pnpm prisma migrate deploy', {
  env: { ...process.env, DATABASE_URL: testDbUrl },
  stdio: 'inherit',
});
