import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

@Injectable()
export class ExpensesService {
    private prisma = new PrismaClient();

    // Получить все расходы группы
    async getByGroup(groupId: string) {
        return this.prisma.expense.findMany({
            where: { groupId },
            include: {
                paidByUser: {
                    select: { id: true, username: true, telegramId: true },
                },
                participants: {
                    include: {
                        user: {
                            select: { id: true, username: true, telegramId: true },
                        },
                    },
                },
            },
            orderBy: { date: 'desc' },
        });
    }

    // Создать новый расход
    async create(
        groupId: string,
        data: {
            amount: number;
            description: string;
            paidBy: number;
            participantIds: number[]; // массив ID участников
        },
    ) {
        return this.prisma.expense.create({
            data: {
                groupId,
                amount: data.amount,
                description: data.description,
                paidBy: data.paidBy,
                date: new Date(),
                // Создаём записи в ExpenseParticipant для каждого участника
                participants: {
                    create: data.participantIds.map(userId => ({
                        userId,
                    })),
                },
            },
            include: {
                paidByUser: {
                    select: { id: true, username: true, telegramId: true },
                },
                participants: {
                    include: {
                        user: {
                            select: { id: true, username: true, telegramId: true },
                        },
                    },
                },
            },
        });
    }
}