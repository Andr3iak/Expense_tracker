import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BalancesService {
  constructor(private prisma: PrismaService) {}

  async getBalancesByGroup(groupId: string) {
    const [expenses, settlements] = await Promise.all([
      this.prisma.expense.findMany({
        where: { groupId },
        include: {
          participants: { include: { user: true } },
          paidByUser: true,
        },
      }),
      // Загружаем записи об оплатах — они корректируют чистый баланс
      this.prisma.groupSettlement.findMany({ where: { groupId } }),
    ]);

    let total = 0;
    const net: Record<number, number> = {};
    const userNames: Record<number, string> = {};

    for (const exp of expenses) {
      total += exp.amount;
      const count = exp.participants.length;
      if (count === 0) continue;
      const perPerson = exp.amount / count;

      const payerId = exp.paidBy;
      userNames[payerId] = exp.paidByUser.username ?? `User ${payerId}`;
      net[payerId] = (net[payerId] ?? 0) + exp.amount;

      for (const p of exp.participants) {
        userNames[p.userId] = p.user.username ?? `User ${p.userId}`;
        net[p.userId] = (net[p.userId] ?? 0) - perPerson;
      }
    }

    // Применяем оплаты: fromUser заплатил toUser → долг fromUser уменьшается, кредит toUser уменьшается
    for (const s of settlements) {
      net[s.fromUserId] = (net[s.fromUserId] ?? 0) + s.amount;
      net[s.toUserId] = (net[s.toUserId] ?? 0) - s.amount;
    }

    // Алгоритм минимизации транзакций
    const creditors: { userId: number; amount: number }[] = [];
    const debtors: { userId: number; amount: number }[] = [];

    for (const [userIdStr, balance] of Object.entries(net)) {
      const userId = Number(userIdStr);
      const rounded = Math.round(balance * 100) / 100;
      if (rounded > 0.01) creditors.push({ userId, amount: rounded });
      else if (rounded < -0.01) debtors.push({ userId, amount: Math.abs(rounded) });
    }

    const transactions: {
      from: number; to: number; amount: number; fromName: string; toName: string;
    }[] = [];

    let ci = 0;
    let di = 0;
    while (ci < creditors.length && di < debtors.length) {
      const cred = creditors[ci];
      const debt = debtors[di];
      const settleAmount = Math.min(cred.amount, debt.amount);
      transactions.push({
        from: debt.userId,
        to: cred.userId,
        amount: Math.round(settleAmount * 100) / 100,
        fromName: userNames[debt.userId] ?? `User ${debt.userId}`,
        toName: userNames[cred.userId] ?? `User ${cred.userId}`,
      });
      cred.amount -= settleAmount;
      debt.amount -= settleAmount;
      if (cred.amount < 0.01) ci++;
      if (debt.amount < 0.01) di++;
    }

    const balances = Object.entries(net)
      .map(([userId, balance]) => ({
        userId: Number(userId),
        balance: Math.round(balance * 100) / 100,
        userName: userNames[Number(userId)] ?? `User ${userId}`,
      }))
      .filter((b) => Math.abs(b.balance) > 0.01);

    const debts = balances.map((b) => ({
      userId: b.userId,
      amount: b.balance,
      userName: b.userName,
    }));

    return {
      total: Math.round(total * 100) / 100,
      debts,
      balances,
      transactions,
    };
  }

  async createSettlement(groupId: string, fromUserId: number, toUserId: number, amount: number) {
    const settlement = await this.prisma.groupSettlement.create({
      data: { groupId, fromUserId, toUserId, amount },
    });
    return { id: settlement.id, groupId, fromUserId, toUserId, amount };
  }
}
