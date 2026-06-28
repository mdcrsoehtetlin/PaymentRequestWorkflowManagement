import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { WebsocketGateway } from '../websocket.gateway';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  async create(
    userId: number,
    data: {
      paymentRequestId?: number;
      title: string;
      message: string;
      link?: string;
    },
  ): Promise<Notification> {
    const notification = this.notificationRepo.create({
      userId,
      paymentRequestId: data.paymentRequestId ?? null,
      title: data.title,
      message: data.message,
      link: data.link ?? null,
      isRead: false,
    });

    const saved = await this.notificationRepo.save(notification);

    this.websocketGateway.sendPersonalNotification(userId, 'notification', {
      notificationId: saved.id,
      paymentRequestId: saved.paymentRequestId,
      title: saved.title,
      message: saved.message,
      link: saved.link,
      timestamp: saved.createdDate.toISOString(),
    });

    this.logger.log(`Notification created for user ${userId}: ${saved.title}`);

    return saved;
  }

  async findByUserId(userId: number): Promise<Notification[]> {
    return this.notificationRepo.find({
      where: { userId },
      order: { createdDate: 'DESC' },
      take: 50,
    });
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.notificationRepo.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(id: number, userId: number): Promise<void> {
    await this.notificationRepo.update({ id, userId }, { isRead: true });
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepo.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }
}
