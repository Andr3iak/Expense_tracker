import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async upsertUser(telegramId: number, username?: string) {
    // Telegram ID может превышать Number.MAX_SAFE_INTEGER, поэтому в схеме BigInt.
    // JS-число безопасно конвертируется в BigInt для Prisma-запроса.
    return this.prisma.user.upsert({
      where: { telegramId: BigInt(telegramId) },
      update: { username: username ?? null },
      create: { telegramId: BigInt(telegramId), username: username ?? null },
    });
  }
}
