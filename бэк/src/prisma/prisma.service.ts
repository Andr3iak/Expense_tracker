import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    await this.expenseParticipant.deleteMany();
    await this.expense.deleteMany();
    await this.groupSettlement.deleteMany();
    await this.groupInvitation.deleteMany();
    await this.groupMember.deleteMany();
    await this.group.deleteMany();
    await this.user.deleteMany();
  }
}