import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) { }

  async getGroupsByUser(userId: number) {
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
      // Баланс считается отдельным эндпоинтом /balances, здесь заглушка.
      balance: 0,
    }));
  }

  async createGroup(name: string, icon: string | undefined, userId: number) {
    // Создаём группу и сразу добавляем создателя как участника — атомарная операция.
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
      },
    });
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async addMember(groupId: string, userId: number) {
    // upsert вместо create — повторный вызов не упадёт с ошибкой уникальности.
    return this.prisma.groupMember.upsert({
      where: { groupId_userId: { groupId, userId } },
      create: { groupId, userId },
      update: {},
    });
  }
}
