import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TopicSuggestionsService {
  constructor(private prisma: PrismaService) {}

  async create(topic: string, description: string | undefined, userId: string) {
    return this.prisma.topicSuggestion.create({
      data: {
        topic,
        description,
        suggestedBy: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async getMySuggestions(userId: string) {
    return this.prisma.topicSuggestion.findMany({
      where: {
        suggestedBy: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async delete(id: string, userId: string) {
    const topic = await this.prisma.topicSuggestion.findUnique({
      where: { id },
    });

    if (!topic) {
      throw new NotFoundException('Topic suggestion not found');
    }

    if (topic.suggestedBy !== userId) {
      throw new ForbiddenException('You can only delete your own suggestions');
    }

    return this.prisma.topicSuggestion.delete({
      where: { id },
    });
  }
}
