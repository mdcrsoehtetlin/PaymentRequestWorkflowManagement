import {
  Controller,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from '../shared/services/notification.service';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { JwtPayload } from '../shared/types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications(@CurrentUser() user: JwtPayload) {
    const notifications = await this.notificationService.findByUserId(user.sub);
    const unreadCount = await this.notificationService.getUnreadCount(user.sub);
    return { notifications, unreadCount };
  }

  @Patch(':id/read')
  async markAsRead(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.notificationService.markAsRead(id, user.sub);
    return { success: true };
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentUser() user: JwtPayload) {
    await this.notificationService.markAllAsRead(user.sub);
    return { success: true };
  }
}
