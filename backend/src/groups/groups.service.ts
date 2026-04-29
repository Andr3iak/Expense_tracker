import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async getGroupsByUser(userId: number) {
    if (!userId || isNaN(userId)) return [];

    const memberships = await this.prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            _count: { select: { members: true } },
          },
        },
      },
    });

    return memberships.map((m) => ({
      id: m.group.id,
      name: m.group.name,
      icon: m.group.icon ?? '📁',
      membersCount: m.group._count.members,
      lastActivity: m.group.createdAt,
      balance: 0,
    }));
  }

  async createGroup(name: string, icon: string | undefined, userId: number) {
    const group = await this.prisma.group.create({
      data: {
        name,
        icon: icon ?? null,
        members: {
          create: { userId },
        },
      },
      include: { _count: { select: { members: true } } },
    });

    return {
      id: group.id,
      name: group.name,
      icon: group.icon ?? '📁',
      membersCount: group._count.members,
      lastActivity: group.createdAt,
      balance: 0,
    };
  }

  async getGroupById(groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: { user: true },
        },
        _count: { select: { members: true } },
      },
    });
    if (!group) throw new NotFoundException('Group not found');

    return {
      id: group.id,
      name: group.name,
      icon: group.icon ?? '📁',
      membersCount: group._count.members,
      lastActivity: group.createdAt,
      members: group.members.map((m) => ({
        id: m.user.id,
        telegramId: Number(m.user.telegramId),
        username: m.user.username,
      })),
    };
  }

  // Добавление участника по внутреннему userId (используется напрямую)
  async addMember(groupId: string, userId: number) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // upsert — повторный вызов не упадёт с ошибкой уникальности
    const member = await this.prisma.groupMember.upsert({
      where: { groupId_userId: { groupId, userId } },
      create: { groupId, userId },
      update: {},
    });

    return {
      groupId: member.groupId,
      userId: member.userId,
      user: {
        id: user.id,
        telegramId: Number(user.telegramId),
        username: user.username,
      },
    };
  }

  // Добавление по telegramId — используется при переходе по инвайт-ссылке.
  // Если пользователь ещё не зарегистрирован — создаём его автоматически.
  async addMemberByTelegramId(
    groupId: string,
    telegramId: number | string,
    username?: string,
  ) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    // upsert пользователя — после перехода по ссылке он точно есть в Telegram
    
    const user = await this.prisma.user.upsert({
      where: { telegramId: BigInt(telegramId) },
      update: { username: username ?? undefined },
      create: { telegramId: BigInt(telegramId), username: username ?? null },
    });

    await this.prisma.groupMember.upsert({
      where: { groupId_userId: { groupId, userId: user.id } },
      create: { groupId, userId: user.id },
      update: {},
    });

    return {
      groupId,
      userId: user.id,
      user: {
        id: user.id,
        telegramId: Number(user.telegramId),
        username: user.username,
      },
    };
  }
}