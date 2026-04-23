import { Controller, Get, Param } from '@nestjs/common';
import { BalancesService } from './balances.service';

@Controller('groups/:groupId/balances')
export class BalancesController {
  constructor(private balancesService: BalancesService) {}

  @Get()
  getByGroup(@Param('groupId') groupId: string) {
    return this.balancesService.getBalancesByGroup(groupId);
  }
}
