import { Controller, Get, Post, Patch, Param, Body, Query, BadRequestException } from '@nestjs/common';
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

  // Архивные группы пользователя
  @Get('archived')
  getArchived(@Query('userId') userId: string) {
    const id = parseInt(userId, 10);
    if (isNaN(id)) throw new BadRequestException('userId must be a number');
    return this.groupsService.getArchivedGroupsByUser(id);
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

  // Редактировать название и/или иконку
  @Patch(':id')
  update(
    @Param('id') groupId: string,
    @Body() body: { name?: string; icon?: string; userId: number },
  ) {
    if (!body.userId) throw new BadRequestException('userId is required');
    return this.groupsService.updateGroup(groupId, body.userId, {
      name: body.name,
      icon: body.icon,
    });
  }

  // Архивировать группу
  @Patch(':id/archive')
  archive(@Param('id') groupId: string, @Body() body: { userId: number }) {
    if (!body.userId) throw new BadRequestException('userId is required');
    return this.groupsService.archiveGroup(groupId, body.userId);
  }

  // Восстановить из архива
  @Patch(':id/unarchive')
  unarchive(@Param('id') groupId: string, @Body() body: { userId: number }) {
    if (!body.userId) throw new BadRequestException('userId is required');
    return this.groupsService.unarchiveGroup(groupId, body.userId);
  }

  @Post(':id/members')
  addMember(@Param('id') groupId: string, @Body() body: { userId: number }) {
    if (!body.userId) throw new BadRequestException('userId is required');
    return this.groupsService.addMember(groupId, body.userId);
  }

  @Post(':id/join')
  joinByInvite(
    @Param('id') groupId: string,
    @Body() body: { telegramId: number | string; username?: string },
  ) {
    if (!body.telegramId) throw new BadRequestException('telegramId is required');
    return this.groupsService.addMemberByTelegramId(groupId, body.telegramId, body.username);
  }

  @Get(':id/invite-preview')
  getInvitePreview(@Param('id') id: string) {
    return this.groupsService.getGroupById(id);
  }
}