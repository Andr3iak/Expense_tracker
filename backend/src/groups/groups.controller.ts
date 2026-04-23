import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
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
}
