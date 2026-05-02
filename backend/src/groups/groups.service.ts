import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
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
  
  async addMemberByTelegramId(groupId: string, telegramId: number | string, username?: string, firstName?: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');
    const user = await this.prisma.user.upsert({
      where: { telegramId: BigInt(telegramId) },
      update: { username: username ?? undefined, firstName: firstName ?? undefined },
      create: { telegramId: BigInt(telegramId), username: username ?? null, firstName: firstName ?? null },
    });
    await this.prisma.groupMember.upsert({
      where: { groupId_userId: { groupId, userId: user.id } },
      create: { groupId, userId: user.id },
      update: {},
    });
    return { groupId, userId: user.id };
  }

  async removeMember(groupId: string, userId: number) {
    await this.prisma.groupMember.deleteMany({ where: { groupId, userId } });
    return { groupId, userId, removed: true };
  }

  // Создаёт приглашение вместо прямого добавления — пользователь сам решает, вступать или нет
  async createInvitation(groupId: string, userId: number, invitedById: number) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    const inviterMembership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: invitedById } },
    });
    if (!inviterMembership) throw new ForbiddenException('You are not a member of this group');

    const alreadyMember = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (alreadyMember) throw new BadRequestException('User is already a member');

    await this.prisma.groupInvitation.upsert({
      where: { groupId_userId: { groupId, userId } },
      create: { groupId, userId, invitedById, status: 'pending' },
      update: { status: 'pending', invitedById },
    });
    return { groupId, userId, status: 'pending' };
  }

  async getInvitationsForUser(userId: number) {
    const invitations = await this.prisma.groupInvitation.findMany({
      where: { userId, status: 'pending' },
      include: { group: true, invitedBy: true },
    });
    return invitations.map((inv) => ({
      id: inv.id,
      groupId: inv.groupId,
      groupName: inv.group.name,
      groupIcon: inv.group.icon ?? '📁',
      invitedByName: inv.invitedBy.firstName || inv.invitedBy.username || `User ${inv.invitedById}`,
      createdAt: inv.createdAt.toISOString(),
    }));
  }

  async acceptInvitation(invitationId: string, userId: number) {
    const inv = await this.prisma.groupInvitation.findUnique({ where: { id: invitationId } });
    if (!inv || inv.userId !== userId) throw new NotFoundException('Invitation not found');

    await this.prisma.$transaction([
      this.prisma.groupInvitation.update({ where: { id: invitationId }, data: { status: 'accepted' } }),
      this.prisma.groupMember.upsert({
        where: { groupId_userId: { groupId: inv.groupId, userId } },
        create: { groupId: inv.groupId, userId },
        update: {},
      }),
    ]);
    return { accepted: true, groupId: inv.groupId };
  }

  async rejectInvitation(invitationId: string, userId: number) {
    const inv = await this.prisma.groupInvitation.findUnique({ where: { id: invitationId } });
    if (!inv || inv.userId !== userId) throw new NotFoundException('Invitation not found');

    await this.prisma.groupInvitation.update({ where: { id: invitationId }, data: { status: 'rejected' } });
    return { rejected: true };
  }
}