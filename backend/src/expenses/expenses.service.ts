import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async getExpensesByGroup(groupId: string) {
    const expenses = await this.prisma.expense.findMany({
      where: { groupId },
      include: {
        paidByUser: true,
        participants: { include: { user: true } },
      },
      orderBy: { date: 'desc' },
    });

    return expenses.map((exp) => ({
      id: exp.id,
      groupId: exp.groupId,
      amount: exp.amount,
      description: exp.description,
      paidBy: exp.paidBy,
      paidByName: exp.paidByUser.username ?? `User ${exp.paidBy}`,
      participants: exp.participants.map((p) => ({
        userId: p.userId,
        username: p.user.username,
      })),
      date: exp.date.toISOString(),
    }));
  }

  async createExpense(
    groupId: string,
    amount: number,
    description: string,
    paidBy: number,
    participantIds: number[],
  ) {
    if (!amount || amount <= 0) throw new BadRequestException('amount must be positive');
    if (!description?.trim()) throw new BadRequestException('description is required');
    if (!paidBy) throw new BadRequestException('paidBy is required');

    // Проверяем, что группа существует
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    // Проверяем, что плательщик — участник группы
    const payerMembership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: paidBy } },
    });
    if (!payerMembership) {
      throw new BadRequestException('paidBy user is not a member of this group');
    }

    // Плательщик всегда входит в участников расхода
    const allParticipants = [...new Set([...participantIds, paidBy])];

    const expense = await this.prisma.expense.create({
      data: {
        groupId,
        amount,
        description,
        paidBy,
        participants: {
          create: allParticipants.map((userId) => ({ userId })),
        },
      },
      include: {
        participants: { include: { user: true } },
        paidByUser: true,
      },
    });

    return {
      id: expense.id,
      groupId: expense.groupId,
      amount: expense.amount,
      description: expense.description,
      paidBy: expense.paidBy,
      paidByName: expense.paidByUser.username ?? `User ${expense.paidBy}`,
      participants: expense.participants.map((p) => ({
        userId: p.userId,
        username: p.user.username,
      })),
      date: expense.date.toISOString(),
    };
  }
}