import { Controller, Post, Get, Param, Body, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('upsert')
  async upsert(
    @Body() body: { telegramId: number | string; username?: string; firstName?: string },
  ) {
    const user = await this.usersService.upsertUser(body.telegramId, body.username);
    return {
      id: user.id,
      telegramId: Number(user.telegramId),
      username: user.username,
    };
  }

  // Нужен для инвайт-ссылки: фронтенд получает пользователя по telegramId
  // и затем вызывает POST /groups/:id/members
  @Get('by-telegram/:telegramId')
  async getByTelegramId(@Param('telegramId') telegramId: string) {
    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user) throw new NotFoundException('User not found');
    return {
      id: user.id,
      telegramId: Number(user.telegramId),
      username: user.username,
    };
  }
}