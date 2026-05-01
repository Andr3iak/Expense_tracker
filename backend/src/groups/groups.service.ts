import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async getGroupsByUser(userId: number) {
    if (!userId || isNaN(userId)) return [];
    const memberships = await this.prisma.groupMember.findMany({
      where: { userId },
      include: { group: { include: { _count: { select: { members: true } } } } },
    });
    return memberships
      .filter((m) => !m.group.archived)
      .map((m) => ({
        id: m.group.id, name: m.group.name, icon: m.group.icon ?? '📁',
        membersCount: m.group._count.members, lastActivity: m.group.createdAt, balance: 0,
      }));
  }

  async getArchivedGroupsByUser(userId: number) {
    const memberships = await this.prisma.groupMember.findMany({
      where: { userId },
      include: { group: { include: { _count: { select: { members: true } } } } },
    });
    return memberships
      .filter((m) => m.group.archived)
      .map((m) => ({
        id: m.group.id, name: m.group.name, icon: m.group.icon ?? '📁',
        membersCount: m.group._count.members, lastActivity: m.group.createdAt,
        archivedAt: m.group.archivedAt, balance: 0,
      }));
  }

  async createGroup(name: string, icon: string | undefined, userId: number) {
    const group = await this.prisma.group.create({
      data: { name, icon: icon ?? null, members: { create: { userId } } },
      include: { _count: { select: { members: true } } },
    });
    return {
      id: group.id, name: group.name, icon: group.icon ?? '📁',
      membersCount: group._count.members, lastActivity: group.createdAt, balance: 0,
    };
  }

  async getGroupById(groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { members: { include: { user: true } }, _count: { select: { members: true } } },
    });
    if (!group) throw new NotFoundException('Group not found');
    return {
      id: group.id, name: group.name, icon: group.icon ?? '📁',
      membersCount: group._count.members, lastActivity: group.createdAt,
      archived: group.archived, archivedAt: group.archivedAt,
      members: group.members.map((m) => ({
        id: m.user.id,
        telegramId: Number(m.user.telegramId),
        username: m.user.username,
        userId: m.user.id,
        user: {
          firstName: m.user.username, // в БД нет firstName — используем username
          username: m.user.username,
        },
      })),
    };
  }

  async updateGroup(groupId: string, userId: number, data: { name?: string; icon?: string }) {
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!membership) throw new ForbiddenException('You are not a member of this group');
    const group = await this.prisma.group.update({
      where: { id: groupId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.icon !== undefined && { icon: data.icon }),
      },
      include: { _count: { select: { members: true } } },
    });
    return {
      id: group.id, name: group.name, icon: group.icon ?? '📁',
      membersCount: group._count.members, lastActivity: group.createdAt, balance: 0,
    };
  }

  async deleteGroup(groupId: string, userId: number) {
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!membership) throw new ForbiddenException('You are not a member of this group');
    const expenses = await this.prisma.expense.findMany({ where: { groupId } });
    const expenseIds = expenses.map((e) => e.id);
    await this.prisma.expenseParticipant.deleteMany({ where: { expenseId: { in: expenseIds } } });
    await this.prisma.expense.deleteMany({ where: { groupId } });
    await this.prisma.groupMember.deleteMany({ where: { groupId } });
    await this.prisma.group.delete({ where: { id: groupId } });
    return { id: groupId, deleted: true };
  }

  async archiveGroup(groupId: string, userId: number) {
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!membership) throw new ForbiddenException('You are not a member of this group');
    const group = await this.prisma.group.update({
      where: { id: groupId },
      data: { archived: true, archivedAt: new Date() },
    });
    return { id: group.id, archived: group.archived, archivedAt: group.archivedAt };
  }

  async unarchiveGroup(groupId: string, userId: number) {
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!membership) throw new ForbiddenException('You are not a member of this group');
    const group = await this.prisma.group.update({
      where: { id: groupId },
      data: { archived: false, archivedAt: null },
    });
    return { id: group.id, archived: group.archived };
  }

  async addMember(groupId: string, userId: number) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    await this.prisma.groupMember.upsert({
      where: { groupId_userId: { groupId, userId } },
      create: { groupId, userId }, update: {},
    });
    return { groupId, userId };
  }

  async removeMember(groupId: string, userId: number) {
    await this.prisma.groupMember.deleteMany({ where: { groupId, userId } });
    return { groupId, userId, removed: true };
  }

  async addMemberByTelegramId(groupId: string, telegramId: number | string, username?: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');
    const user = await this.prisma.user.upsert({
      where: { telegramId: BigInt(telegramId) },
      update: { username: username ?? undefined },
      create: { telegramId: BigInt(telegramId), username: username ?? null },
    });
    await this.prisma.groupMember.upsert({
      where: { groupId_userId: { groupId, userId: user.id } },
      create: { groupId, userId: user.id }, update: {},
    });
    return { groupId, userId: user.id };
  }
}