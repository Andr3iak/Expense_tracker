import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BalancesService {
  constructor(private prisma: PrismaService) {}

  async getBalancesByGroup(groupId: string) {
    const expenses = await this.prisma.expense.findMany({
      where: { groupId },
      include: {
        participants: { include: { user: true } },
        paidByUser: true,
      },
    });

    let total = 0;
    const userBalances: Record<number, number> = {};
    const userNames: Record<number, string> = {};

    for (const exp of expenses) {
      total += exp.amount;
      const perPerson = exp.amount / exp.participants.length;

      // Плательщик получает кредит на полную сумму расхода.
      userBalances[exp.paidBy] = (userBalances[exp.paidBy] ?? 0) + exp.amount;
      userNames[exp.paidBy] = exp.paidByUser.username ?? `User ${exp.paidBy}`;

      // Каждый участник накапливает долг за свою долю.
      for (const p of exp.participants) {
        userBalances[p.userId] = (userBalances[p.userId] ?? 0) - perPerson;
        userNames[p.userId] = p.user.username ?? `User ${p.userId}`;
      }
    }

    // Итог: положительный баланс — юзеру должны, отрицательный — юзер должен.
    const debts = Object.entries(userBalances)
      .filter(([, balance]) => Math.abs(balance) > 0.01)
      .map(([userId, balance]) => ({
        userId: Number(userId),
        amount: Math.round(balance * 100) / 100,
        userName: userNames[Number(userId)],
      }));

    return { total: Math.round(total * 100) / 100, debts };
  }
}
