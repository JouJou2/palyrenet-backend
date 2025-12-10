import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => EventsGateway))
    private eventsGateway: EventsGateway,
  ) {}

  async createNotification({
    userId,
    type,
    actorId,
    actorName,
    actorAvatar,
    targetType,
    targetId,
    title,
    message,
    link,
    metadata,
  }: {
    userId: string;
    type: NotificationType;
    actorId?: string;
    actorName?: string;
    actorAvatar?: string;
    targetType?: string;
    targetId?: string;
    title: string;
    message: string;
    link?: string;
    metadata?: any;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        actorId,
        actorName,
        actorAvatar,
        targetType,
        targetId,
        title,
        message,
        link,
        metadata,
      },
    });

    // Send real-time notification via WebSocket
    try {
      this.eventsGateway.sendNotification(userId, {
        ...notification,
        count: await this.getUnreadCount(userId),
      });
    } catch (error) {
      console.error('Failed to send real-time notification:', error);
    }

    return notification;
  }

  async getUserNotifications(userId: string, unreadOnly = false) {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    await this.prisma.notification.deleteMany({
      where: {
        userId,
        createdAt: {
          lt: oneWeekAgo,
        },
      },
    });

    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly && { isRead: false }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId, // Ensure user owns this notification
      },
      data: {
        isRead: true,
      },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }
}
