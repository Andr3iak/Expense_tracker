import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('upsert')
  async upsert(@Body() body: { telegramId: number; username?: string; firstName?: string }) {
    const user = await this.usersService.upsertUser(body.telegramId, body.username);
    // BigInt не сериализуется в JSON, возвращаем как Number.
    return {
      id: user.id,
      telegramId: Number(user.telegramId),
      username: user.username,
    };
  }
}
