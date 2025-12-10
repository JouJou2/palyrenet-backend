import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateAnswerDto } from './dto/create-answer.dto';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async createQuestion(userId: string, createQuestionDto: CreateQuestionDto) {
    const question = await this.prisma.question.create({
      data: {
        ...createQuestionDto,
        authorId: userId,
        tags: createQuestionDto.tags || [],
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            university: true,
            role: true,
          },
        },
        _count: {
          select: {
            answers: true,
            votes: true,
          },
        },
      },
    });

    return this.formatQuestion(question, userId);
  }

  async findAll(
    userId?: string,
    sortBy: 'newest' | 'active' | 'votes' | 'views' | 'unanswered' = 'newest',
    search?: string,
    tag?: string,
    category?: string,
  ) {
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ];
    }

    if (tag) {
      where.tags = { has: tag };
    }

    if (category) {
      where.category = category;
    }

    let orderBy: any = { createdAt: 'desc' }; // default: newest

    if (sortBy === 'views') {
      orderBy = { views: 'desc' };
    } else if (sortBy === 'votes' || sortBy === 'active') {
      orderBy = undefined; // Will sort in-memory
    }

    const questions = await this.prisma.question.findMany({
      where,
      orderBy,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            university: true,
            role: true,
          },
        },
        answers: {
          select: {
            id: true,
            createdAt: true,
            isAccepted: true,
          },
        },
        votes: userId ? { where: { userId } } : false,
        _count: {
          select: {
            answers: true,
            votes: true,
          },
        },
      },
    });

    let formattedQuestions = questions.map((q) => this.formatQuestion(q, userId));

    // Filter unanswered
    if (sortBy === 'unanswered') {
      formattedQuestions = formattedQuestions.filter((q) => q.answersCount === 0);
    }

    // Sort by votes or activity
    if (sortBy === 'votes') {
      formattedQuestions = formattedQuestions.sort((a, b) => b.voteScore - a.voteScore);
    } else if (sortBy === 'active') {
      formattedQuestions = formattedQuestions.sort((a, b) => {
        const aLastActivity = a.lastActivityAt || a.createdAt;
        const bLastActivity = b.lastActivityAt || b.createdAt;
        return new Date(bLastActivity).getTime() - new Date(aLastActivity).getTime();
      });
    }

    return formattedQuestions;
  }

  async findOne(id: string, userId?: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            university: true,
            bio: true,
            role: true,
          },
        },
        answers: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatarUrl: true,
                role: true,
              },
            },
            votes: true,  // Get all votes for score calculation
            _count: {
              select: {
                votes: true,
              },
            },
          },
          orderBy: [{ isAccepted: 'desc' }, { createdAt: 'desc' }],
        },
        votes: true,  // Get all votes for score calculation
        _count: {
          select: {
            answers: true,
            votes: true,
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Increment views
    await this.prisma.question.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return {
      ...this.formatQuestion(question, userId),
      answers: question.answers.map((answer) => this.formatAnswer(answer, userId)),
    };
  }

  async createAnswer(questionId: string, userId: string, createAnswerDto: CreateAnswerDto) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const answer = await this.prisma.answer.create({
      data: {
        ...createAnswerDto,
        questionId,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            role: true,
          },
        },
        _count: {
          select: {
            votes: true,
          },
        },
      },
    });

    return this.formatAnswer(answer, userId);
  }

  async toggleQuestionVote(questionId: string, userId: string, value: 1 | -1) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const existingVote = await this.prisma.questionVote.findUnique({
      where: {
        questionId_userId: {
          questionId,
          userId,
        },
      },
    });

    if (existingVote) {
      if (existingVote.value === value) {
        // Remove vote
        await this.prisma.questionVote.delete({
          where: { id: existingVote.id },
        });
      } else {
        // Change vote
        await this.prisma.questionVote.update({
          where: { id: existingVote.id },
          data: { value },
        });
      }
    } else {
      // Create new vote
      await this.prisma.questionVote.create({
        data: {
          questionId,
          userId,
          value,
        },
      });
    }

    // Return authoritative latest score and user vote
    const votes = await this.prisma.questionVote.findMany({
      where: { questionId },
      select: { value: true, userId: true },
    });

    const voteScore = votes.reduce((sum, v) => sum + v.value, 0);
    const userVote = votes.find((v) => v.userId === userId)?.value || 0;
    const voted = userVote !== 0;

    return { voted, value: userVote as 1 | -1 | 0, voteScore, userVote };
  }

  async toggleAnswerVote(answerId: string, userId: string, value: 1 | -1) {
    const answer = await this.prisma.answer.findUnique({
      where: { id: answerId },
    });

    if (!answer) {
      throw new NotFoundException('Answer not found');
    }

    const existingVote = await this.prisma.answerVote.findUnique({
      where: {
        answerId_userId: {
          answerId,
          userId,
        },
      },
    });

    if (existingVote) {
      if (existingVote.value === value) {
        // Remove vote
        await this.prisma.answerVote.delete({
          where: { id: existingVote.id },
        });
      } else {
        // Change vote
        await this.prisma.answerVote.update({
          where: { id: existingVote.id },
          data: { value },
        });
      }
    } else {
      // Create new vote
      await this.prisma.answerVote.create({
        data: {
          answerId,
          userId,
          value,
        },
      });
    }

    // Return authoritative latest score and user vote for the answer
    const votes = await this.prisma.answerVote.findMany({
      where: { answerId },
      select: { value: true, userId: true },
    });

    const voteScore = votes.reduce((sum, v) => sum + v.value, 0);
    const userVote = votes.find((v) => v.userId === userId)?.value || 0;
    const voted = userVote !== 0;

    return { voted, value: userVote as 1 | -1 | 0, voteScore, userVote };
  }

  async acceptAnswer(answerId: string, userId: string) {
    const answer = await this.prisma.answer.findUnique({
      where: { id: answerId },
      include: {
        question: true,
      },
    });

    if (!answer) {
      throw new NotFoundException('Answer not found');
    }

    if (answer.question.authorId !== userId) {
      throw new ForbiddenException('Only the question author can accept answers');
    }

    // Unaccept all other answers for this question
    await this.prisma.answer.updateMany({
      where: {
        questionId: answer.questionId,
        id: { not: answerId },
      },
      data: { isAccepted: false },
    });

    // Accept this answer and mark question as resolved
    const [updatedAnswer] = await Promise.all([
      this.prisma.answer.update({
        where: { id: answerId },
        data: { isAccepted: true },
      }),
      this.prisma.question.update({
        where: { id: answer.questionId },
        data: { isResolved: true },
      }),
    ]);

    return { accepted: true, message: 'Answer accepted' };
  }

  private formatQuestion(question: any, userId?: string) {
    // Calculate vote score (sum of all vote values)
    const allVotes = question.votes || [];
    const voteScore = allVotes.reduce((sum: number, vote: any) => sum + vote.value, 0);
    const userVote = userId ? allVotes.find((v: any) => v.userId === userId)?.value || 0 : 0;
    
    // Debug logging
    if (userId) {
      console.log('🔍 [formatQuestion] userId:', userId);
      console.log('🔍 [formatQuestion] allVotes:', allVotes.map(v => ({ userId: v.userId, value: v.value })));
      console.log('🔍 [formatQuestion] userVote:', userVote);
    }

    // Get last activity timestamp
    const lastAnswer = question.answers?.[question.answers.length - 1];
    const lastActivityAt = lastAnswer ? lastAnswer.createdAt : question.createdAt;

    return {
      id: question.id,
      title: question.title,
      content: question.content,
      category: question.category,
      tags: question.tags,
      views: question.views,
      isResolved: question.isResolved,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
      lastActivityAt,
      author: {
        id: question.author.id,
        username: question.author.username,
        fullName: question.author.fullName,
        avatarUrl: question.author.avatarUrl,
        university: question.author.university,
        role: question.author.role,
      },
      answersCount: question._count?.answers || 0,
      voteScore,
      userVote,
      hasAcceptedAnswer: question.answers?.some((a: any) => a.isAccepted) || false,
    };
  }

  private formatAnswer(answer: any, userId?: string) {
    // Calculate vote score (sum of all vote values)
    const allVotes = answer.votes || [];
    const voteScore = allVotes.reduce((sum: number, vote: any) => sum + vote.value, 0);
    const userVote = userId ? allVotes.find((v: any) => v.userId === userId)?.value || 0 : 0;

    return {
      id: answer.id,
      content: answer.content,
      isAccepted: answer.isAccepted,
      createdAt: answer.createdAt,
      updatedAt: answer.updatedAt,
      author: {
        id: answer.author.id,
        username: answer.author.username,
        fullName: answer.author.fullName,
        avatarUrl: answer.author.avatarUrl,
        role: answer.author.role,
      },
      voteScore,
      userVote,
    };
  }

  async deleteQuestion(questionId: string, userId: string) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      select: { authorId: true },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    if (question.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own questions');
    }

    // Delete the question (cascade will delete answers, votes, etc.)
    await this.prisma.question.delete({
      where: { id: questionId },
    });

    return { success: true, message: 'Question deleted successfully' };
  }

  async deleteAnswer(answerId: string, userId: string) {
    const answer = await this.prisma.answer.findUnique({
      where: { id: answerId },
      select: { authorId: true },
    });

    if (!answer) {
      throw new NotFoundException('Answer not found');
    }

    if (answer.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own answers');
    }

    await this.prisma.answer.delete({
      where: { id: answerId },
    });

    return { success: true, message: 'Answer deleted successfully' };
  }

  async getRelatedQuestions(questionId: string) {
    // Get the question to find its tags and category
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      select: { tags: true, category: true, title: true },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Find related questions by matching tags or category
    const relatedQuestions = await this.prisma.question.findMany({
      where: {
        AND: [
          { id: { not: questionId } }, // Exclude current question
          {
            OR: [
              { tags: { hasSome: question.tags } }, // Share at least one tag
              { category: question.category }, // Same category
            ],
          },
        ],
      },
      take: 5,
      orderBy: [
        { views: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        _count: {
          select: {
            answers: true,
            votes: true,
          },
        },
      },
    });

    // Format and calculate vote scores
    return relatedQuestions.map(q => ({
      id: q.id,
      title: q.title,
      voteScore: this.calculateVoteScore(q._count?.votes || 0),
      _count: {
        answers: q._count?.answers || 0,
      },
    }));
  }

  private calculateVoteScore(votes: number): number {
    // Simple calculation - in production this would aggregate actual vote values
    return votes;
  }
}
