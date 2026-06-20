import { Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(
    @Req() req: Request,
    @Query('unread_only') unreadOnly?: string,
    @Query('limit') limit?: string
  ) {
    const userId = req.user?.['sub'] as string;
    if (!userId) throw new Error('Utilisateur non authentifié');

    return this.notificationsService.list(userId, {
      unreadOnly: unreadOnly === 'true',
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('unread-count')
  async unreadCount(@Req() req: Request) {
    const userId = req.user?.['sub'] as string;
    if (!userId) throw new Error('Utilisateur non authentifié');

    return this.notificationsService.getUnreadCount(userId);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user?.['sub'] as string;
    if (!userId) throw new Error('Utilisateur non authentifié');

    return this.notificationsService.markAsRead(id, userId);
  }

  @Post('read-all')
  async markAllAsRead(@Req() req: Request) {
    const userId = req.user?.['sub'] as string;
    if (!userId) throw new Error('Utilisateur non authentifié');

    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  async deleteOne(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user?.['sub'] as string;
    if (!userId) throw new Error('Utilisateur non authentifié');

    return this.notificationsService.deleteNotification(id, userId);
  }

  @Delete()
  async clearAll(@Req() req: Request) {
    const userId = req.user?.['sub'] as string;
    if (!userId) throw new Error('Utilisateur non authentifié');

    return this.notificationsService.clearAll(userId);
  }
}
