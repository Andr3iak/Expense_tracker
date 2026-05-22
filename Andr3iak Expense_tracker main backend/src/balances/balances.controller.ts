import { Controller, Get, Post, Param, Body, BadRequestException } from '@nestjs/common';
import { BalancesService } from './balances.service';

@Controller('groups/:groupId/balances')
export class BalancesController {
  constructor(private balancesService: BalancesService) {}

  @Get()
  getByGroup(@Param('groupId') groupId: string) {
    return this.balancesService.getBalancesByGroup(groupId);
  }

  // Записывает факт оплаты долга — следующий GET /balances уже покажет скорректированные цифры
  @Post('settlements')
  createSettlement(
    @Param('groupId') groupId: string,
    @Body() body: { fromUserId: number; toUserId: number; amount: number },
  ) {
    if (!body.fromUserId || !body.toUserId || !body.amount) {
      throw new BadRequestException('fromUserId, toUserId and amount are required');
    }
    return this.balancesService.createSettlement(groupId, body.fromUserId, body.toUserId, body.amount);
  }
}
