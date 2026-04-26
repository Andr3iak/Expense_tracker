import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers() {
    const users = await this.prisma.user.findMany({ orderBy: { id: 'asc' } });
    return users.map((u) => ({
      id: u.id,
      telegramId: Number(u.telegramId),
      username: u.username,
      firstName: u.firstName,
    }));
  }

  async upsertUser(telegramId: number, username?: string, firstName?: string) {
    // Telegram ID может превышать Number.MAX_SAFE_INTEGER, поэтому в схеме BigInt.
    return this.prisma.user.upsert({
      where: { telegramId: BigInt(telegramId) },
      update: { username: username ?? null, firstName: firstName ?? null },
      create: { telegramId: BigInt(telegramId), username: username ?? null, firstName: firstName ?? null },
    });
  }
}
