import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const EXPENSE_CATEGORIES = [
  { id: 'food',          label: 'Еда',          emoji: '🍽️' },
  { id: 'drinks',        label: 'Напитки',       emoji: '🍺' },
  { id: 'transport',     label: 'Транспорт',     emoji: '🚕' },
  { id: 'travel',        label: 'Путешествие',   emoji: '✈️' },
  { id: 'housing',       label: 'Жильё',         emoji: '🏠' },
  { id: 'shopping',      label: 'Покупки',       emoji: '🛒' },
  { id: 'entertainment', label: 'Развлечения',   emoji: '🎬' },
  { id: 'health',        label: 'Здоровье',      emoji: '💊' },
  { id: 'other',         label: 'Другое',        emoji: '📦' },
];

interface SplitItem {
  userId: number;
  percent: number;
}

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  getCategories() {
    return EXPENSE_CATEGORIES;
  }

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
      category: exp.category,
      paidBy: exp.paidBy,
      paidByName: exp.paidByUser.firstName ?? exp.paidByUser.username ?? `User ${exp.paidBy}`,
      participants: exp.participants.map((p) => ({
        userId: p.userId,
        username: p.user.username,
        // Возвращаем процент если есть
        percent: (p as any).percent ?? null,
      })),
      date: exp.date.toISOString(),
    }));
  }

  async createExpense(
    groupId: string,
    amount: number,
    description: string,
    category: string,
    paidBy: number,
    participantIds: number[],
    splits?: SplitItem[],
  ) {
    if (!amount || amount <= 0) throw new BadRequestException('amount must be positive');
    if (!description?.trim()) throw new BadRequestException('description is required');
    if (!paidBy) throw new BadRequestException('paidBy is required');

    // Валидация процентов
    if (splits && splits.length > 0) {
      const totalPct = splits.reduce((sum, s) => sum + s.percent, 0);
      if (Math.abs(totalPct - 100) > 0.01) {
        throw new BadRequestException(`Splits must total 100%, got ${totalPct}%`);
      }
    }

    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    const payerMembership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: paidBy } },
    });
    if (!payerMembership) {
      throw new BadRequestException('paidBy user is not a member of this group');
    }

    const allParticipants = [...new Set([...participantIds, paidBy])];

    // Если есть splits — используем их для создания участников с процентами
    const participantsData = splits && splits.length > 0
      ? splits.map((s) => {
          const pctAmt = Math.round((amount * s.percent) / 100 * 100) / 100;
          return { userId: s.userId, percent: s.percent, amount: pctAmt };
        })
      : allParticipants.map((userId) => ({ userId }));

    const expense = await this.prisma.expense.create({
      data: {
        groupId,
        amount,
        description,
        category: category || 'other',
        paidBy,
        participants: {
          create: participantsData,
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
      category: expense.category,
      paidBy: expense.paidBy,
      paidByName: expense.paidByUser.firstName ?? expense.paidByUser.username ?? `User ${expense.paidBy}`,
      participants: expense.participants.map((p) => ({
        userId: p.userId,
        username: p.user.username,
        percent: (p as any).percent ?? null,
      })),
      date: expense.date.toISOString(),
    };
  }

  async updateExpense(
    groupId: string,
    expenseId: string,
    data: {
      amount?: number;
      description?: string;
      category?: string;
      paidBy?: number;
      participantIds?: number[];
      splits?: SplitItem[];
    },
  ) {
    const expense = await this.prisma.expense.findFirst({ where: { id: expenseId, groupId } });
    if (!expense) throw new NotFoundException('Expense not found');

    if (data.splits && data.splits.length > 0) {
      const totalPct = data.splits.reduce((sum, s) => sum + s.percent, 0);
      if (Math.abs(totalPct - 100) > 0.01) {
        throw new BadRequestException(`Splits must total 100%, got ${totalPct}%`);
      }
    }

    const updateData: Record<string, any> = {};
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.paidBy !== undefined) updateData.paidBy = data.paidBy;

    if (data.splits && data.splits.length > 0) {
      const amt = data.amount ?? expense.amount;
      await this.prisma.expenseParticipant.deleteMany({ where: { expenseId } });
      updateData.participants = {
        create: data.splits.map((s) => ({
          userId: s.userId,
          percent: s.percent,
          amount: Math.round((amt * s.percent) / 100 * 100) / 100,
        })),
      };
    } else if (data.participantIds !== undefined) {
      const effectivePaidBy = data.paidBy ?? expense.paidBy;
      const allParticipants = [...new Set([...data.participantIds, effectivePaidBy])];
      await this.prisma.expenseParticipant.deleteMany({ where: { expenseId } });
      updateData.participants = { create: allParticipants.map((userId) => ({ userId })) };
    }

    const updated = await this.prisma.expense.update({
      where: { id: expenseId },
      data: updateData,
      include: { participants: { include: { user: true } }, paidByUser: true },
    });

    return {
      id: updated.id,
      groupId: updated.groupId,
      amount: updated.amount,
      description: updated.description,
      category: updated.category,
      paidBy: updated.paidBy,
      paidByName: updated.paidByUser.firstName ?? updated.paidByUser.username ?? `User ${updated.paidBy}`,
      participants: updated.participants.map((p) => ({
        userId: p.userId,
        username: p.user.username,
        percent: (p as any).percent ?? null,
      })),
      date: updated.date.toISOString(),
    };
  }

  async deleteExpense(groupId: string, expenseId: string) {
    const expense = await this.prisma.expense.findFirst({ where: { id: expenseId, groupId } });
    if (!expense) throw new NotFoundException('Expense not found');
    await this.prisma.expenseParticipant.deleteMany({ where: { expenseId } });
    await this.prisma.expense.delete({ where: { id: expenseId } });
    return { deleted: true };
  }
}