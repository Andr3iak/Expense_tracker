import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

@Injectable()
export class BalancesService {
    private prisma = new PrismaClient();

    // Получить балансы для группы
    async getByGroup(groupId: string) {
        // Получаем все расходы группы с участниками
        const expenses = await this.prisma.expense.findMany({
            where: { groupId },
            include: {
                participants: true,
            },
        });

        let total = 0;
        const userBalances: Record<number, number> = {};

        // Проходим по каждому расходу
        expenses.forEach(expense => {
            total += expense.amount;

            // Сумма, которую должен каждый участник
            const perPerson = expense.amount / expense.participants.length;

            // Тот, кто заплатил, получает "плюс" (ему должны)
            userBalances[expense.paidBy] =
                (userBalances[expense.paidBy] || 0) + expense.amount;

            // Каждый участник должен заплатить свою долю (минус)
            expense.participants.forEach(participant => {
                userBalances[participant.userId] =
                    (userBalances[participant.userId] || 0) - perPerson;
            });
        });

        // Преобразуем в массив долгов
        const debts = Object.entries(userBalances)
            .filter(([, balance]) => Math.abs(balance) > 0.01)
            .map(([userId, balance]) => ({
                userId: Number(userId),
                amount: balance,
            }));

        return { total, debts };
    }
}