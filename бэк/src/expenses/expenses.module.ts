import { Module } from '@nestjs/common';
import { ExpensesController, CategoriesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';

@Module({
  controllers: [ExpensesController, CategoriesController],
  providers: [ExpensesService],
})
export class ExpensesModule {}