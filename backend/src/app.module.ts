import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { GroupsModule } from './groups/groups.module';
import { ExpensesModule } from './expenses/expenses.module';
import { BalancesModule } from './balances/balances.module';

@Module({
  imports: [PrismaModule, UsersModule, GroupsModule, ExpensesModule, BalancesModule],
})
export class AppModule {}
