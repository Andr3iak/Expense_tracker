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
    // net[userId] > 0 → пользователю должны; < 0 → пользователь должен
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

    // Алгоритм минимизации транзакций: разбиваем на должников и кредиторов,
    // жадно закрываем долги.
    const creditors: { userId: number; amount: number }[] = [];
    const debtors: { userId: number; amount: number }[] = [];

    for (const [userIdStr, balance] of Object.entries(net)) {
      const userId = Number(userIdStr);
      const rounded = Math.round(balance * 100) / 100;
      if (rounded > 0.01) creditors.push({ userId, amount: rounded });
      else if (rounded < -0.01) debtors.push({ userId, amount: Math.abs(rounded) });
    }

    // Транзакции вида: debtor должен заплатить creditor сумму amount
    const transactions: { from: number; to: number; amount: number; fromName: string; toName: string }[] = [];

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
        fromName: userNames[debt.userId],
        toName: userNames[cred.userId],
      });

      cred.amount -= settleAmount;
      debt.amount -= settleAmount;

      if (cred.amount < 0.01) ci++;
      if (debt.amount < 0.01) di++;
    }

    // Сырые балансы по каждому участнику (для отображения в UI)
    const balances = Object.entries(net)
      .map(([userId, balance]) => ({
        userId: Number(userId),
        balance: Math.round(balance * 100) / 100,
        userName: userNames[Number(userId)],
      }))
      .filter((b) => Math.abs(b.balance) > 0.01);

    return {
      total: Math.round(total * 100) / 100,
      balances,
      // transactions: кто кому сколько должен перевести для погашения всех долгов
      transactions,
    };
  }
}