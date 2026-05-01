import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const EXPENSE_CATEGORIES = [
  { id: 'food',      label: 'Еда',        emoji: '🍽️' },
  { id: 'drinks',    label: 'Напитки',    emoji: '🍺' },
  { id: 'transport', label: 'Транспорт',  emoji: '🚕' },
  { id: 'travel',    label: 'Путешествие',emoji: '✈️' },
  { id: 'housing',   label: 'Жильё',      emoji: '🏠' },
  { id: 'shopping',  label: 'Покупки',    emoji: '🛒' },
  { id: 'entertainment', label: 'Развлечения', emoji: '🎬' },
  { id: 'health',    label: 'Здоровье',   emoji: '💊' },
  { id: 'other',     label: 'Другое',     emoji: '📦' },
];

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
    category: string,
    paidBy: number,
    participantIds: number[],
  ) {
    if (!amount || amount <= 0) throw new BadRequestException('amount must be positive');
    if (!description?.trim()) throw new BadRequestException('description is required');
    if (!paidBy) throw new BadRequestException('paidBy is required');

    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    const payerMembership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: paidBy } },
    });
    if (!payerMembership) {
      throw new BadRequestException('paidBy user is not a member of this group');
    }

    const allParticipants = [...new Set([...participantIds, paidBy])];

    const expense = await this.prisma.expense.create({
      data: {
        groupId,
        amount,
        description,
        category: category || 'other',
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
      category: expense.category,
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