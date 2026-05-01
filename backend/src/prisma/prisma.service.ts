import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { join } from 'path';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const isTest = process.env.NODE_ENV === 'test';
    const dbName = isTest ? 'test.db' : 'dev.db';
    // __dirname points to dist/src/prisma — four levels up lands at the backend root,
    // matching where `prisma migrate deploy` places dev.db (relative to the project root).
    const dbPath = join(__dirname, '..', '..', '..', '..', dbName);
    
    console.log(`Using database: ${dbPath} (${isTest ? 'test' : 'development'} mode)`);
    
    const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'test') {
      const tablenames = await this.$queryRaw<
        Array<{ name: string }>
      >`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_migrations';`;

      for (const { name } of tablenames) {
        await this.$executeRawUnsafe(`DELETE FROM "${name}";`);
        await this.$executeRawUnsafe(`DELETE FROM sqlite_sequence WHERE name='${name}';`);
      }
    }
  }
}
