import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCollaborationDto } from './dto/create-collaboration.dto';
import { UpdateCollaborationDto } from './dto/update-collaboration.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { MessagesService } from '../messages/messages.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CollaborationsService {
  constructor(
    private prisma: PrismaService,
    private messagesService: MessagesService,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateCollaborationDto) {
    return this.prisma.collaboration.create({
      data: {
        ...dto,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        ownerId: userId,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            university: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });
  }

  async findAll(filters?: {
    search?: string;
    disciplines?: string[];
    applicationAreas?: string[];
    isRemote?: boolean;
    status?: string;
    hasFunding?: boolean;
  }) {
    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.disciplines && filters.disciplines.length > 0) {
      where.disciplines = { hasSome: filters.disciplines };
    }

    if (filters?.applicationAreas && filters.applicationAreas.length > 0) {
      where.applicationAreas = { hasSome: filters.applicationAreas };
    }

    if (filters?.isRemote !== undefined) {
      where.isRemote = filters.isRemote;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.hasFunding !== undefined) {
      where.hasFunding = filters.hasFunding;
    }

    const collaborations = await this.prisma.collaboration.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            university: true,
          },
        },
        applications: {
          where: { status: 'ACCEPTED' },
          select: { id: true },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add acceptedCount and isFull to each collaboration
    return collaborations.map(collab => ({
      ...collab,
      acceptedCount: collab.applications.length,
      isFull: collab.maxMembers ? collab.applications.length >= collab.maxMembers : false,
      applications: undefined, // Remove the applications array from response
    }));
  }

  async findOne(id: string, userId?: string) {
    const collaboration = await this.prisma.collaboration.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            university: true,
            email: true,
          },
        },
        applications: {
          where: { status: 'ACCEPTED' },
          include: {
            applicant: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatarUrl: true,
                university: true,
              },
            },
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!collaboration) {
      throw new NotFoundException('Collaboration not found');
    }

    // Check if user has applied
    let hasApplied = false;
    let applicationStatus: string | null = null;
    if (userId) {
      const application = await this.prisma.collaborationApplication.findUnique({
        where: {
          collaborationId_applicantId: {
            collaborationId: id,
            applicantId: userId,
          },
        },
      });
      if (application) {
        hasApplied = true;
        applicationStatus = application.status;
      }
    }

    // Calculate if collaboration is full
    const acceptedCount = collaboration.applications.length;
    const isFull = collaboration.maxMembers ? acceptedCount >= collaboration.maxMembers : false;

    return {
      ...collaboration,
      hasApplied,
      applicationStatus,
      acceptedMembers: collaboration.applications,
      acceptedCount,
      isFull,
    };
  }

  async update(id: string, userId: string, dto: UpdateCollaborationDto) {
    const collaboration = await this.prisma.collaboration.findUnique({
      where: { id },
    });

    if (!collaboration) {
      throw new NotFoundException('Collaboration not found');
    }

    if (collaboration.ownerId !== userId) {
      throw new ForbiddenException('You can only update your own collaborations');
    }

    return this.prisma.collaboration.update({
      where: { id },
      data: {
        ...dto,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const collaboration = await this.prisma.collaboration.findUnique({
      where: { id },
    });

    if (!collaboration) {
      throw new NotFoundException('Collaboration not found');
    }

    if (collaboration.ownerId !== userId) {
      throw new ForbiddenException('You can only delete your own collaborations');
    }

    await this.prisma.collaboration.delete({
      where: { id },
    });

    return { message: 'Collaboration deleted successfully' };
  }

  // Application methods
  async createApplication(collaborationId: string, userId: string, dto: CreateApplicationDto) {
    // Check if collaboration exists and is open
    const collaboration = await this.prisma.collaboration.findUnique({
      where: { id: collaborationId },
      include: {
        applications: {
          where: { status: 'ACCEPTED' }
        }
      }
    });

    if (!collaboration) {
      throw new NotFoundException('Collaboration not found');
    }

    if (collaboration.status !== 'OPEN') {
      throw new ForbiddenException('This collaboration is not accepting applications');
    }

    // Check if collaboration is full
    if (collaboration.maxMembers) {
      const acceptedCount = collaboration.applications.length;
      if (acceptedCount >= collaboration.maxMembers) {
        throw new ForbiddenException('This collaboration is full and no longer accepting applications');
      }
    }

    if (collaboration.ownerId === userId) {
      throw new ForbiddenException('You cannot apply to your own collaboration');
    }

    // Check if already applied
    const existing = await this.prisma.collaborationApplication.findUnique({
      where: {
        collaborationId_applicantId: {
          collaborationId,
          applicantId: userId,
        },
      },
    });

    if (existing) {
      throw new ForbiddenException('You have already applied to this collaboration');
    }

    // Create application
    const application = await this.prisma.collaborationApplication.create({
      data: {
        ...dto,
        coverLetter: dto.coverMessage || '', // Map coverMessage to coverLetter for compatibility
        collaborationId,
        applicantId: userId,
      },
      include: {
        applicant: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            email: true,
            university: true,
          },
        },
      },
    });

    // Update applicants count
    await this.prisma.collaboration.update({
      where: { id: collaborationId },
      data: {
        applicantsCount: {
          increment: 1,
        },
      },
    });

    // Send notification to collaboration owner
    await this.notificationsService.createNotification({
      userId: collaboration.ownerId,
      type: 'COLLAB_REQUEST',
      actorId: application.applicant.id,
      actorName: application.applicant.fullName || application.applicant.username,
      actorAvatar: application.applicant.avatarUrl || undefined,
      targetType: 'collaboration',
      targetId: collaborationId,
      title: 'New Collaboration Application',
      message: `${application.applicant.fullName || application.applicant.username} has applied to your collaboration "${collaboration.title}"`,
      link: `/dashboard/messages?userId=${application.applicant.id}`,
      metadata: {
        applicationId: application.id,
        collaborationId,
        applicantId: userId,
        applicantName: application.applicant.fullName || application.applicant.username,
        conversationUserId: userId,
        contextType: 'collaboration_application',
        collaborationTitle: collaboration.title,
        status: 'pending',
      },
    });

    // Send message to collaboration owner with application details
    const messageContent = `**New Collaboration Application**\n\n` +
      `**Applicant:** ${application.applicant.fullName || application.applicant.username}\n` +
      `**Email:** ${application.applicant.email}\n` +
      `**University:** ${application.applicant.university || 'N/A'}\n\n` +
      `**Submitted Information:**\n` +
      `**Name:** ${dto.fullName}\n` +
      `**Institution:** ${dto.institution}\n` +
      `**Email:** ${dto.email}\n` +
      `**Field:** ${dto.field}\n\n` +
      `**Cover Message:**\n${dto.coverMessage}\n\n` +
      (dto.message ? `**Additional Message:**\n${dto.message}\n\n` : '') +
      (dto.motivation ? `**Motivation:**\n${dto.motivation}\n\n` : '') +
      (dto.skills ? `**Skills:**\n${dto.skills}\n\n` : '') +
      `You can review and respond to this application in your collaboration management page.`;

    await this.messagesService.sendMessage(
      userId,
      collaboration.ownerId,
      messageContent,
      'collaboration_application',
      application.id,
      {
        collaborationId,
        collaborationTitle: collaboration.title,
        applicantId: userId,
        applicantName: application.applicant.fullName || application.applicant.username,
        status: 'PENDING',
      },
    );

    return application;
  }

  async getMyApplications(userId: string) {
    return this.prisma.collaborationApplication.findMany({
      where: { applicantId: userId },
      include: {
        collaboration: {
          include: {
            owner: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                university: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyCollaborations(userId: string) {
    // Get collaborations where user is the owner
    const ownedCollaborations = await this.prisma.collaboration.findMany({
      where: { ownerId: userId },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            username: true,
            avatarUrl: true,
            university: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get collaborations where user has been accepted
    const acceptedApplications = await this.prisma.collaborationApplication.findMany({
      where: {
        applicantId: userId,
        status: 'ACCEPTED',
      },
      include: {
        collaboration: {
          include: {
            owner: {
              select: {
                id: true,
                fullName: true,
                username: true,
                avatarUrl: true,
                university: true,
              },
            },
            _count: {
              select: {
                applications: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Combine and format results
    const ownedFormatted = ownedCollaborations.map(collab => ({
      ...collab,
      isCreator: true,
      creator: collab.owner,
    }));

    const joinedFormatted = acceptedApplications.map((app: any) => ({
      ...app.collaboration,
      isCreator: false,
      creator: app.collaboration.owner,
    }));

    return [...ownedFormatted, ...joinedFormatted];
  }

  async getCollaborationApplications(collaborationId: string, userId: string) {
    // Verify ownership
    const collaboration = await this.prisma.collaboration.findUnique({
      where: { id: collaborationId },
    });

    if (!collaboration) {
      throw new NotFoundException('Collaboration not found');
    }

    if (collaboration.ownerId !== userId) {
      throw new ForbiddenException('You can only view applications for your own collaborations');
    }

    return this.prisma.collaborationApplication.findMany({
      where: { collaborationId },
      include: {
        applicant: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            email: true,
            university: true,
            bio: true,
            skills: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateApplicationStatus(
    applicationId: string,
    userId: string,
    status: 'ACCEPTED' | 'REJECTED',
  ) {
    const application = await this.prisma.collaborationApplication.findUnique({
      where: { id: applicationId },
      include: {
        collaboration: {
          select: {
            id: true,
            ownerId: true,
            status: true,
            maxMembers: true,
            applications: {
              where: { status: 'ACCEPTED' },
              select: { id: true },
            },
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.collaboration.ownerId !== userId) {
      throw new ForbiddenException('You can only update applications for your own collaborations');
    }

    // Check if accepting and if collaboration has maxMembers limit
    if (status === 'ACCEPTED' && application.collaboration.maxMembers) {
      const acceptedCount = application.collaboration.applications.length;
      
      if (acceptedCount >= application.collaboration.maxMembers) {
        throw new ForbiddenException(
          `Cannot accept more members. This collaboration is full (${application.collaboration.maxMembers} members)`
        );
      }
    }

    // Update application status
    const updatedApplication = await this.prisma.collaborationApplication.update({
      where: { id: applicationId },
      data: { status },
      include: {
        applicant: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
          },
        },
        collaboration: {
          select: {
            id: true,
            title: true,
            ownerId: true,
            owner: {
              select: {
                id: true,
                username: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (status === 'ACCEPTED') {
      await this.prisma.collaboration.update({
        where: { id: updatedApplication.collaboration.id },
        data: {
          members: {
            connect: { id: updatedApplication.applicant.id },
          },
        },
      });
    } else if (application.status === 'ACCEPTED' && status === 'REJECTED') {
      await this.prisma.collaboration.update({
        where: { id: updatedApplication.collaboration.id },
        data: {
          members: {
            disconnect: { id: updatedApplication.applicant.id },
          },
        },
      });
    }

    const updatedContextData: Prisma.JsonObject = {
      collaborationId: updatedApplication.collaboration.id,
      collaborationTitle: updatedApplication.collaboration.title,
      applicantId: updatedApplication.applicant.id,
      applicantName: updatedApplication.applicant.fullName || updatedApplication.applicant.username,
      status,
    };

    await this.prisma.message.updateMany({
      where: {
        contextType: 'collaboration_application',
        contextId: applicationId,
      },
      data: {
        contextData: updatedContextData,
      },
    });

    const relatedNotifications = await this.prisma.notification.findMany({
      where: {
        metadata: {
          path: ['applicationId'],
          equals: applicationId,
        },
      },
    });

    await Promise.all(
      relatedNotifications.map(async (notification) => {
        const metadata = (notification.metadata as Record<string, any>) || {};
        const updatedMetadata: Prisma.JsonObject = {
          ...metadata,
          status: status.toLowerCase(),
        };
        return this.prisma.notification.update({
          where: { id: notification.id },
          data: {
            metadata: updatedMetadata,
          },
        });
      })
    );

    // Send notification to applicant
    const notificationTitle = status === 'ACCEPTED' 
      ? 'Collaboration Application Accepted'
      : 'Collaboration Application Status Update';
    
    const notificationMessage = status === 'ACCEPTED'
      ? `Congratulations! Your application to "${updatedApplication.collaboration.title}" has been accepted.`
      : `Your application to "${updatedApplication.collaboration.title}" has been reviewed.`;

    await this.notificationsService.createNotification({
      userId: updatedApplication.applicant.id,
      type: 'COLLAB_UPDATE',
      actorId: updatedApplication.collaboration.ownerId,
      actorName: updatedApplication.collaboration.owner.fullName || updatedApplication.collaboration.owner.username,
      targetType: 'collaboration',
      targetId: updatedApplication.collaboration.id,
      title: notificationTitle,
      message: notificationMessage,
      link: `/dashboard/messages?userId=${updatedApplication.collaboration.ownerId}`,
      metadata: {
        applicationId,
        collaborationId: updatedApplication.collaboration.id,
        status: status.toLowerCase(),
        conversationUserId: updatedApplication.collaboration.ownerId,
        contextType: 'collaboration_application_status',
      },
    });

    // Send message to applicant
    const messageContent = status === 'ACCEPTED'
      ? `**Collaboration Application Accepted! 🎉**\n\n` +
        `Congratulations! Your application to join the collaboration **"${updatedApplication.collaboration.title}"** has been accepted by ${updatedApplication.collaboration.owner.fullName || updatedApplication.collaboration.owner.username}.\n\n` +
        `You can now start collaborating with the team. Please check the collaboration details for next steps and contact information.`
      : `**Collaboration Application Update**\n\n` +
        `Thank you for your interest in the collaboration **"${updatedApplication.collaboration.title}"**.\n\n` +
        `After careful review, we have decided not to move forward with your application at this time. We appreciate your interest and encourage you to apply to other opportunities on the platform.`;

    await this.messagesService.sendMessage(
      updatedApplication.collaboration.ownerId,
      updatedApplication.applicant.id,
      messageContent,
      'collaboration_application_status',
      applicationId,
      {
        collaborationId: updatedApplication.collaboration.id,
        collaborationTitle: updatedApplication.collaboration.title,
        status,
      },
    );

    if (application.collaboration.maxMembers) {
      const acceptedCountAfterUpdate = await this.prisma.collaborationApplication.count({
        where: {
          collaborationId: application.collaboration.id,
          status: 'ACCEPTED',
        },
      });

      if (
        status === 'ACCEPTED' &&
        acceptedCountAfterUpdate >= application.collaboration.maxMembers &&
        application.collaboration.status === 'OPEN'
      ) {
        await this.prisma.collaboration.update({
          where: { id: application.collaboration.id },
          data: { status: 'IN_PROGRESS' },
        });
      }

      if (
        status === 'REJECTED' &&
        acceptedCountAfterUpdate < application.collaboration.maxMembers &&
        application.collaboration.status === 'IN_PROGRESS'
      ) {
        await this.prisma.collaboration.update({
          where: { id: application.collaboration.id },
          data: { status: 'OPEN' },
        });
      }
    }

    const refreshedApplication = await this.prisma.collaborationApplication.findUnique({
      where: { id: applicationId },
      include: {
        applicant: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
          },
        },
        collaboration: {
          select: {
            id: true,
            title: true,
            ownerId: true,
            status: true,
            maxMembers: true,
            owner: {
              select: {
                id: true,
                username: true,
                fullName: true,
              },
            },
            members: {
              select: {
                id: true,
              },
            },
            _count: {
              select: {
                applications: true,
              },
            },
          },
        },
      },
    });

    return refreshedApplication || updatedApplication;
  }
}
