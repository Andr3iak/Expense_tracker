import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

@Injectable()
export class GroupsService {
    private prisma = new PrismaClient();

    async getAll() {
        return this.prisma.group.findMany({
            include: {
                members: true,
                expenses: true,
            },
        });
    }

    async getById(id: string) {
        return this.prisma.group.findUnique({
            where: { id },
            include: {
                members: true,
                expenses: true,
            },
        });
    }

    async create(data: { name: string; icon?: string; createdBy: number }) {
        return this.prisma.group.create({
            data: {
                name: data.name,
                icon: data.icon || '👥',
                createdBy: data.createdBy,
            },
        });
    }
}
