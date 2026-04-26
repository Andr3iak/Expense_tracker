import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { GroupsService } from './groups.service';

@Controller('groups')
export class GroupsController {
  constructor(private groupsService: GroupsService) { }

  @Get()
  getAll(@Query('userId') userId: string) {
    return this.groupsService.getGroupsByUser(parseInt(userId, 10));
  }

  @Post()
  create(@Body() body: { name: string; icon?: string; userId: number }) {
    return this.groupsService.createGroup(body.name, body.icon, body.userId);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.groupsService.getGroupById(id);
  }

  @Post(':id/members')
  addMember(@Param('id') groupId: string, @Body() body: { userId: number }) {
    return this.groupsService.addMember(groupId, body.userId);
  }

  @Delete(':id/members/:userId')
  removeMember(@Param('id') groupId: string, @Param('userId') userId: string) {
    return this.groupsService.removeMember(groupId, parseInt(userId, 10));
  }

  @Patch(':id')
  updateGroup(@Param('id') id: string, @Body() body: { name?: string; icon?: string }) {
    return this.groupsService.updateGroup(id, body);
  }
}
