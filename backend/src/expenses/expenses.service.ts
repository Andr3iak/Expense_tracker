import { Injectable } from '@nestjs/common';
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
      participants: exp.participants.map((p) => p.userId),
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
    // Гарантируем, что плательщик входит в список участников, даже если фронтенд его не передал.
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
      include: { participants: true },
    });

    return {
      id: expense.id,
      groupId: expense.groupId,
      amount: expense.amount,
      description: expense.description,
      paidBy: expense.paidBy,
      participants: expense.participants.map((p) => p.userId),
      date: expense.date.toISOString(),
    };
  }
}
