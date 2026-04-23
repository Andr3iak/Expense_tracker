import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ExpensesService } from './expenses.service';

// Маршруты вложены в группу: /api/groups/:groupId/expenses
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
    @Body() body: { amount: number; description: string; paidBy: number; participantIds: number[] },
  ) {
    return this.expensesService.createExpense(
      groupId,
      body.amount,
      body.description,
      body.paidBy,
      body.participantIds,
    );
  }
}
