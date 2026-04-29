<<<<<<< HEAD
import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
=======
import { Controller, Get, Post, Param, Body, Query, BadRequestException } from '@nestjs/common';
>>>>>>> main
import { GroupsService } from './groups.service';

@Controller('groups')
export class GroupsController {
  constructor(private groupsService: GroupsService) {}

  @Get()
  getAll(@Query('userId') userId: string) {
    const id = parseInt(userId, 10);
    if (isNaN(id)) throw new BadRequestException('userId must be a number');
    return this.groupsService.getGroupsByUser(id);
  }

  @Post()
  create(@Body() body: { name: string; icon?: string; userId: number }) {
    if (!body.name?.trim()) throw new BadRequestException('name is required');
    if (!body.userId) throw new BadRequestException('userId is required');
    return this.groupsService.createGroup(body.name, body.icon, body.userId);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.groupsService.getGroupById(id);
  }

  // Добавить участника по внутреннему userId
  @Post(':id/members')
  addMember(@Param('id') groupId: string, @Body() body: { userId: number }) {
    if (!body.userId) throw new BadRequestException('userId is required');
    return this.groupsService.addMember(groupId, body.userId);
  }

<<<<<<< HEAD
  @Delete(':id/members/:userId')
  removeMember(@Param('id') groupId: string, @Param('userId') userId: string) {
    return this.groupsService.removeMember(groupId, parseInt(userId, 10));
  }

  @Patch(':id')
  updateGroup(@Param('id') id: string, @Body() body: { name?: string; icon?: string }) {
    return this.groupsService.updateGroup(id, body);
  }
}
=======

  @Post(':id/join')
  joinByInvite(
    @Param('id') groupId: string,
    @Body() body: { telegramId: number | string; username?: string },
  ) {
    if (!body.telegramId) throw new BadRequestException('telegramId is required');
    return this.groupsService.addMemberByTelegramId(groupId, body.telegramId, body.username);
  }

  // Отдаёт данные группы для превью инвайт-страницы (без авторизации)
  @Get(':id/invite-preview')
  getInvitePreview(@Param('id') id: string) {
    return this.groupsService.getGroupById(id);
  }
}
>>>>>>> main
