import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async getConversations(userId: string) {
    // Get all unique users that have conversations with this user
    const sentMessages = await this.prisma.message.findMany({
      where: { senderId: userId },
      select: { recipientId: true },
      distinct: ['recipientId'],
    });

    const receivedMessages = await this.prisma.message.findMany({
      where: { recipientId: userId },
      select: { senderId: true },
      distinct: ['senderId'],
    });

    const userIds = [
      ...sentMessages.map(m => m.recipientId),
      ...receivedMessages.map(m => m.senderId),
    ];

    const uniqueUserIds = [...new Set(userIds)];

    // Get conversation details for each user
    const conversations = await Promise.all(
      uniqueUserIds.map(async (otherUserId) => {
        const messages = await this.prisma.message.findMany({
          where: {
            OR: [
              { senderId: userId, recipientId: otherUserId },
              { senderId: otherUserId, recipientId: userId },
            ],
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        });

        const unreadCount = await this.prisma.message.count({
          where: {
            senderId: otherUserId,
            recipientId: userId,
            isRead: false,
          },
        });

        const otherUser = await this.prisma.user.findUnique({
          where: { id: otherUserId },
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            university: true,
            academicPosition: true,
          },
        });

        return {
          userId: otherUserId,
          user: otherUser,
          lastMessage: messages[0] || null,
          unreadCount,
        };
      })
    );

    // Sort by last message time
    conversations.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || new Date(0);
      const bTime = b.lastMessage?.createdAt || new Date(0);
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    return conversations;
  }

  async getConversation(userId: string, otherUserId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, recipientId: otherUserId },
          { senderId: otherUserId, recipientId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

    return messages;
  }

  async sendMessage(
    senderId: string, 
    recipientId: string, 
    content: string,
    contextType?: string,
    contextId?: string,
    contextData?: any,
    replyToId?: string,
    attachments?: any[]
  ) {
    const message = await this.prisma.message.create({
      data: {
        senderId,
        recipientId,
        content,
        contextType,
        contextId,
        contextData,
        replyToId,
        attachments,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        recipient: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

    // Create notification for recipient
    if (message.sender) {
      await this.notificationsService.createNotification({
        userId: recipientId,
        type: NotificationType.MESSAGE,
        actorId: senderId,
        actorName: message.sender.fullName || message.sender.username,
        actorAvatar: message.sender.avatarUrl || undefined,
        targetType: 'message',
        targetId: message.id,
        title: 'New Message',
        message: `${message.sender.fullName || message.sender.username} sent you a message`,
        link: `/dashboard/messages?userId=${senderId}`,
        metadata: {
          conversationUserId: senderId,
          contextType,
          contextId,
        },
      });
    }

    return message;
  }

  async markConversationAsRead(userId: string, otherUserId: string) {
    await this.prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        recipientId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return { success: true };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.message.count({
      where: {
        recipientId: userId,
        isRead: false,
      },
    });

    return { count };
  }

  async toggleReaction(userId: string, messageId: string, emoji: string) {
    // Check if reaction already exists
    const existing = await this.prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
    });

    if (existing) {
      // Remove reaction
      await this.prisma.messageReaction.delete({
        where: { id: existing.id },
      });
      return { action: 'removed', emoji };
    } else {
      // Add reaction
      await this.prisma.messageReaction.create({
        data: {
          messageId,
          userId,
          emoji,
        },
      });
      return { action: 'added', emoji };
    }
  }

  async getMessageReactions(messageId: string) {
    const reactions = await this.prisma.messageReaction.groupBy({
      by: ['emoji'],
      where: { messageId },
      _count: { emoji: true },
    });

    return reactions.map(r => ({
      emoji: r.emoji,
      count: r._count.emoji,
    }));
  }

  async deleteConversation(userId: string, otherUserId: string) {
    // Delete all messages between these two users
    await this.prisma.message.deleteMany({
      where: {
        OR: [
          { senderId: userId, recipientId: otherUserId },
          { senderId: otherUserId, recipientId: userId },
        ],
      },
    });

    return { success: true, message: 'Conversation deleted' };
  }
}
