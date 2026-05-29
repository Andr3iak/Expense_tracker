import { Controller, Post, Get, Param, Body, Query, NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('upsert')
  async upsert(
    @Body() body: { telegramId: number | string; username?: string; firstName?: string },
  ) {
    // Передаём username и firstName раздельно — не теряем имя
    const user = await this.usersService.upsertUser(
      body.telegramId,
      body.username,
      body.firstName,
    );
    return {
      id: user.id,
      telegramId: Number(user.telegramId),
      username: user.username,
      firstName: user.firstName, // ← было user.username
    };
  }

  @Get()
  async getAll() {
    const users = await this.usersService.getAllUsers();
    return users.map((u) => ({
      id: u.id,
      telegramId: Number(u.telegramId),
      username: u.username,
      firstName: u.firstName, // ← было u.username
    }));
  }

  @Get('known')
  async getKnown(@Query('userId') userId: string) {
    const id = parseInt(userId, 10);
    if (isNaN(id)) throw new BadRequestException('userId must be a number');
    return this.usersService.getKnownUsers(id);
  }

  @Get('by-telegram/:telegramId')
  async getByTelegramId(@Param('telegramId') telegramId: string) {
    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user) throw new NotFoundException('User not found');
    return {
      id: user.id,
      telegramId: Number(user.telegramId),
      username: user.username,
      firstName: user.firstName, // ← было user.username
    };
  }
}