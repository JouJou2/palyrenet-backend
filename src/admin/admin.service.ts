import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  private readonly validEventTypes: Set<EventType> = new Set(Object.values(EventType));

  constructor(private prisma: PrismaService) {}

  // Overview statistics
  async getOverviewStats() {
    const [totalUsers, totalPosts, totalQuestions, totalCollaborations, pendingReports] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.post.count(),
      this.prisma.question.count(),
      this.prisma.collaboration.count(),
      this.prisma.report.count({ where: { status: 'PENDING' } }),
    ]);

    // Get new users this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newUsersThisWeek = await this.prisma.user.count({
      where: { createdAt: { gte: oneWeekAgo } },
    });

    // Get active users (users who posted or commented in last 7 days)
    const activeUsers = await this.prisma.user.count({
      where: {
        OR: [
          { posts: { some: { createdAt: { gte: oneWeekAgo } } } },
          { comments: { some: { createdAt: { gte: oneWeekAgo } } } },
        ],
      },
    });

    // Get new reports today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newReportsToday = await this.prisma.report.count({
      where: { 
        status: 'PENDING',
        createdAt: { gte: today },
      },
    });

    return {
      totalUsers,
      totalPosts,
      totalQuestions,
      totalCollaborations,
      activeUsers,
      newUsersThisWeek,
      pendingReports,
      newReportsToday,
    };
  }

  // User management
  async getUsers(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;
    
    const where = search
      ? {
          OR: [
            { username: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { fullName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          role: true,
          isVerified: true,
          createdAt: true,
          _count: {
            select: {
              posts: true,
              comments: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async verifyUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });
  }

  async suspendUser(userId: string, reason: string, duration?: number) {
    const suspendedUntil = duration
      ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
      : null;

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isSuspended: true,
        suspendedUntil,
        suspensionReason: reason,
      },
    });
  }

  async unsuspendUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isSuspended: false,
        suspendedUntil: null,
        suspensionReason: null,
      },
    });
  }

  async banUser(userId: string, reason: string, duration?: number) {
    const bannedUntil = duration
      ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
      : null;

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
        bannedUntil,
        banReason: reason,
      },
    });
  }

  async unbanUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: false,
        bannedUntil: null,
        banReason: null,
      },
    });
  }

  async deleteUser(userId: string) {
    return this.prisma.user.delete({
      where: { id: userId },
    });
  }

  async getUserDetails(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            posts: true,
            comments: true,
            questions: true,
            answers: true,
            collaborations: true,
          },
        },
      },
    });
  }

  async updateUserRole(userId: string, role: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
    });
  }

  async promoteUserToAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'ADMIN') {
      throw new BadRequestException('User is already an admin');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: 'ADMIN' },
    });
  }

  async demoteAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'ADMIN') {
      throw new BadRequestException('User is not an admin');
    }

    const adminCount = await this.prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount <= 1) {
      throw new BadRequestException('At least one admin is required');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: 'STUDENT' },
    });
  }

  async flagUser(userId: string, reason: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isFlagged: true,
        flagReason: reason,
      },
    });
  }

  async unflagUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isFlagged: false,
        flagReason: null,
      },
    });
  }

  // Content moderation
  async getContent(page: number = 1, limit: number = 10, status?: string, search?: string) {
    const skip = (page - 1) * limit;

    // Build filter based on status
    const where: any = {};
    if (status && status !== 'all') {
      if (status === 'flagged') {
        // Flagged content means posts from flagged users
        where.author = { isFlagged: true };
      } else {
        // pending, approved, rejected
        where.moderationStatus = status.toUpperCase();
      }
    }

    // Add search functionality
    if (search) {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { author: { username: { contains: search, mode: 'insensitive' } } },
        { author: { fullName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          // Flagged users' posts first
          { author: { isFlagged: 'desc' } },
          { createdAt: 'desc' },
        ],
        include: {
          author: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true,
              isFlagged: true,
              flagReason: true,
            },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async approveContent(postId: string, reviewerId: string) {
    return this.prisma.post.update({
      where: { id: postId },
      data: {
        moderationStatus: 'APPROVED',
        approvedAt: new Date(),
        reviewedBy: reviewerId,
        rejectionReason: null,
      },
    });
  }

  async rejectContent(postId: string, reviewerId: string, reason: string) {
    return this.prisma.post.update({
      where: { id: postId },
      data: {
        moderationStatus: 'REJECTED',
        rejectedAt: new Date(),
        reviewedBy: reviewerId,
        rejectionReason: reason,
      },
    });
  }

  async deleteContent(postId: string) {
    return this.prisma.post.delete({
      where: { id: postId },
    });
  }

  // Reports Management
  async getReports(page: number = 1, limit: number = 10, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    // Group reports by target and exclude resolved targets
    const allReports = await this.prisma.report.findMany({
      where: {
        ...where,
        isResolved: false,
      },
      orderBy: [{ createdAt: 'desc' }],
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Group by target
    const groupedMap = new Map();
    for (const report of allReports) {
      const key = `${report.targetType}:${report.targetId}`;
      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          targetType: report.targetType,
          targetId: report.targetId,
          reports: [],
          reportCount: 0,
          firstReportedAt: report.createdAt,
          latestReportedAt: report.createdAt,
        });
      }
      const group = groupedMap.get(key);
      group.reports.push(report);
      group.reportCount++;
      if (report.createdAt > group.latestReportedAt) {
        group.latestReportedAt = report.createdAt;
      }
    }

    // Convert to array and paginate
    const groupedArray = Array.from(groupedMap.values());
    const paginatedGroups = groupedArray.slice(skip, skip + limit);

    // Fetch target content details
    const result: any[] = [];
    for (const group of paginatedGroups) {
      let targetContent: any = null;

      try {
        switch (group.targetType) {
          case 'post':
            targetContent = await this.prisma.post.findUnique({
              where: { id: group.targetId },
              include: {
                author: {
                  select: { id: true, username: true, fullName: true, avatarUrl: true },
                },
                _count: { select: { comments: true, likes: true } },
              },
            });
            break;
          case 'comment':
            targetContent = await this.prisma.comment.findUnique({
              where: { id: group.targetId },
              include: {
                author: {
                  select: { id: true, username: true, fullName: true, avatarUrl: true },
                },
                post: { select: { id: true } },
              },
            });
            break;
          case 'question':
            targetContent = await this.prisma.question.findUnique({
              where: { id: group.targetId },
              include: {
                author: {
                  select: { id: true, username: true, fullName: true, avatarUrl: true },
                },
              },
            });
            break;
          case 'collaboration':
            targetContent = await this.prisma.collaboration.findUnique({
              where: { id: group.targetId },
              include: {
                owner: {
                  select: { id: true, username: true, fullName: true, avatarUrl: true },
                },
              },
            });
            break;
        }
      } catch (error) {
        console.error(`Failed to fetch ${group.targetType} ${group.targetId}:`, error);
      }

      if (targetContent) {
        result.push({
          ...group,
          targetContent,
        });
      }
    }

    return {
      reports: result,
      total: groupedArray.length,
      page,
      limit,
      totalPages: Math.ceil(groupedArray.length / limit),
    };
  }

  async resolveReport(targetType: string, targetId: string, adminId: string) {
    // Mark all reports for this target as resolved
    await this.prisma.report.updateMany({
      where: {
        targetType,
        targetId,
        status: { not: 'DISMISSED' },
      },
      data: {
        status: 'RESOLVED',
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy: adminId,
      },
    });

    return { success: true, message: 'All reports for this content have been resolved' };
  }

  async dismissReport(reportId: string) {
    // Dismiss a single report
    return this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'DISMISSED',
        resolvedAt: new Date(),
      },
    });
  }

  // Analytics
  async getGrowthData(period: string = '7days') {
    const days = period === '30days' ? 30 : 7;
    const data: Array<{ date: string; users: number; posts: number }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [users, posts] = await Promise.all([
        this.prisma.user.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate,
            },
          },
        }),
        this.prisma.post.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate,
            },
          },
        }),
      ]);

      data.push({
        date: date.toISOString().split('T')[0],
        users,
        posts,
      });
    }

    return data;
  }

  async getTopContributors(limit: number = 10) {
    const users = await this.prisma.user.findMany({
      take: limit,
      orderBy: {
        posts: {
          _count: 'desc',
        },
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        avatarUrl: true,
        _count: {
          select: {
            posts: true,
            comments: true,
          },
        },
      },
    });

    return users.map(user => ({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      postsCount: user._count.posts,
      commentsCount: user._count.comments,
      totalContributions: user._count.posts + user._count.comments,
    }));
  }

  async getActivityData(period: string = '7days') {
    const days = period === '30days' ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [posts, comments, questions] = await Promise.all([
      this.prisma.post.count({
        where: { createdAt: { gte: startDate } },
      }),
      this.prisma.comment.count({
        where: { createdAt: { gte: startDate } },
      }),
      this.prisma.question.count({
        where: { createdAt: { gte: startDate } },
      }),
    ]);

    return { posts, comments, questions };
  }

  async getEngagementData() {
    const totalPosts = await this.prisma.post.count();
    const totalLikes = await this.prisma.like.count();
    const totalComments = await this.prisma.comment.count();
    const totalShares = await this.prisma.post.aggregate({
      _sum: { shares: true },
    });

    return {
      totalPosts,
      totalLikes,
      totalComments,
      totalShares: totalShares._sum.shares || 0,
      avgLikesPerPost: totalPosts > 0 ? (totalLikes / totalPosts).toFixed(2) : 0,
      avgCommentsPerPost: totalPosts > 0 ? (totalComments / totalPosts).toFixed(2) : 0,
    };
  }

  // Settings
  async getSettings() {
    return {
      siteName: 'Palyrenet',
      maintenanceMode: false,
      allowRegistration: true,
      requireEmailVerification: false,
    };
  }

  async updateSettings(settings: any) {
    return settings;
  }

  // Topic Suggestions Management
  async getTopicSuggestions(status?: string) {
    const where = status ? { status: status as any } : {};

    return this.prisma.topicSuggestion.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateTopicStatus(topicId: string, status: string) {
    return this.prisma.topicSuggestion.update({
      where: { id: topicId },
      data: { status: status as any },
    });
  }

  async deleteTopic(topicId: string) {
    return this.prisma.topicSuggestion.delete({
      where: { id: topicId },
    });
  }

  // Events Management
  private resolveEventType(type: any, fallback: EventType = EventType.OTHER): EventType {
    if (typeof type === 'string') {
      const normalized = type.toUpperCase();
      if (this.validEventTypes.has(normalized as EventType)) {
        return normalized as EventType;
      }
    }
    return fallback;
  }

  async getEvents() {
    const events = await this.prisma.event.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    // Transform startDate to date for frontend compatibility
    return events.map(event => ({
      ...event,
      date: event.startDate.toISOString(),
    }));
  }

  async createEvent(data: any, userId: string) {
    const { type, date, ...rest } = data ?? {};
    const eventType = this.resolveEventType(type);

    // Transform date string to DateTime for startDate
    const startDate = date ? new Date(date) : new Date();

    return this.prisma.event.create({
      data: {
        ...rest,
        type: eventType,
        startDate,
        createdBy: userId,
      },
    });
  }

  async updateEvent(eventId: string, data: any) {
    const { type, date, ...rest } = data ?? {};
    const updateData: Record<string, any> = { ...rest };

    if (type !== undefined && type !== null) {
      updateData.type = this.resolveEventType(type);
    }

    // Transform date string to DateTime for startDate if provided
    if (date !== undefined && date !== null) {
      updateData.startDate = new Date(date);
    }

    return this.prisma.event.update({
      where: { id: eventId },
      data: updateData,
    });
  }

  async deleteEvent(eventId: string) {
    return this.prisma.event.delete({
      where: { id: eventId },
    });
  }

  async toggleEventStatus(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.prisma.event.update({
      where: { id: eventId },
      data: { isActive: !event.isActive },
    });
  }
}
