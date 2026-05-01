import { Controller, Post, Get, Param, Body, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('upsert')
  async upsert(
    @Body() body: { telegramId: number | string; username?: string; firstName?: string },
  ) {
    const user = await this.usersService.upsertUser(body.telegramId, body.username ?? body.firstName);
    return {
      id: user.id,
      telegramId: Number(user.telegramId),
      username: user.username,
      firstName: user.username,
    };
  }

  @Get()
  async getAll() {
    const users = await this.usersService.getAllUsers();
    return users.map((u) => ({
      id: u.id,
      telegramId: Number(u.telegramId),
      username: u.username,
      firstName: u.username,
    }));
  }

  @Get('by-telegram/:telegramId')
  async getByTelegramId(@Param('telegramId') telegramId: string) {
    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user) throw new NotFoundException('User not found');
    return {
      id: user.id,
      telegramId: Number(user.telegramId),
      username: user.username,
      firstName: user.username,
    };
  }
}