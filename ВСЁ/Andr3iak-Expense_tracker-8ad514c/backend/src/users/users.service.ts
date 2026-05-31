import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}


  
  async upsertUser(telegramId: number | string, username?: string, firstName?: string) {
    const tgId = BigInt(telegramId);
    return this.prisma.user.upsert({
      where: { telegramId: tgId },
      update: { username: username ?? null, firstName: firstName ?? null },
      create: { telegramId: tgId, username: username ?? null, firstName: firstName ?? null },
    });
  }

  async findByTelegramId(telegramId: number | string) {
    return this.prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
    });
  }

  async getAllUsers() {
    return this.prisma.user.findMany({ orderBy: { id: 'asc' } });
  }

  // Возвращает только тех пользователей, с которыми userId состоит в общих группах
  async getKnownUsers(userId: number) {
    const myGroupIds = await this.prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true },
    });
    if (myGroupIds.length === 0) return [];

    const knownMembers = await this.prisma.groupMember.findMany({
      where: {
        groupId: { in: myGroupIds.map((m) => m.groupId) },
        userId: { not: userId },
      },
      include: { user: true },
      distinct: ['userId'],
    });

    return knownMembers.map((m) => ({
      id: m.user.id,
      telegramId: Number(m.user.telegramId),
      username: m.user.username,
      firstName: m.user.firstName,
    }));
  }
}