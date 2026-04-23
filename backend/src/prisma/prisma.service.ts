import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // schema.prisma не содержит url — он задан в prisma.config.ts только для CLI.
    // Передаём URL явно, чтобы PrismaClient знал путь к БД во время выполнения.
    super({ datasourceUrl: 'file:./dev.db' });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
