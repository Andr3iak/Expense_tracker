import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async upsertUser(telegramId: number | string, username?: string) {
    const tgId = BigInt(telegramId);
    return this.prisma.user.upsert({
      where: { telegramId: tgId },
      update: { username: username ?? null },
      create: { telegramId: tgId, username: username ?? null },
    });
  }

  async findByTelegramId(telegramId: number | string) {
    return this.prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
    });
  }

  // Все пользователи приложения — для страницы приглашения участников
  async getAllUsers() {
    return this.prisma.user.findMany({
      orderBy: { id: 'asc' },
    });
  }
}