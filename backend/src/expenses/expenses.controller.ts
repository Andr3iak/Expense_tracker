import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ExpensesService } from './expenses.service';

@Controller('groups/:groupId/expenses')
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Get()
  getByGroup(@Param('groupId') groupId: string) {
    return this.expensesService.getExpensesByGroup(groupId);
  }

  @Post()
  create(
    @Param('groupId') groupId: string,
    @Body() body: {
      amount: number;
      description: string;
      category?: string;
      paidBy: number;
      participantIds: number[];
    },
  ) {
    return this.expensesService.createExpense(
      groupId,
      body.amount,
      body.description,
      body.category ?? 'other',
      body.paidBy,
      body.participantIds,
    );
  }
}

// Отдельный контроллер для списка категорий
import { Controller as Ctrl, Get as G } from '@nestjs/common';

@Ctrl('categories')
export class CategoriesController {
  constructor(private expensesService: ExpensesService) {}

  @G()
  getAll() {
    return this.expensesService.getCategories();
  }
}