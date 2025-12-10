import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, createPostDto: CreatePostDto) {
    const post = await this.prisma.post.create({
      data: {
        ...createPostDto,
        authorId: userId,
        tags: createPostDto.tags || [],
        imageUrls: createPostDto.imageUrls || [],
        fileUrls: createPostDto.fileUrls || [],
      },
      include: {
        author: {
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
            likes: true,
            comments: true,
          },
        },
      },
    });

    return this.formatPost(post, userId);
  }

  async findAll(userId?: string, sortBy: 'latest' | 'popular' | 'most-viewed' = 'latest', search?: string, tag?: string) {
    const where: any = {
      archived: false, // Exclude archived posts from public feed
    };

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

    let orderBy: any = { createdAt: 'desc' }; // default: latest

    if (sortBy === 'popular') {
      // Will sort by likes count in-memory after fetching
      orderBy = undefined;
    } else if (sortBy === 'most-viewed') {
      orderBy = { views: 'desc' };
    }

    const posts = await this.prisma.post.findMany({
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
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        likes: userId ? { where: { userId } } : false,
        savedBy: userId ? { where: { userId } } : false,
      },
    });

    let formattedPosts = posts.map(post => this.formatPost(post, userId));

    // Sort by likes count if popular filter
    if (sortBy === 'popular') {
      formattedPosts = formattedPosts.sort((a, b) => b.likesCount - a.likesCount);
    }

    return formattedPosts;
  }

  async findOne(id: string, userId?: string) {
    const post = await this.prisma.post.findUnique({
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
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatarUrl: true,
              },
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    username: true,
                    fullName: true,
                    avatarUrl: true,
                  },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          where: { parentId: null },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        likes: userId ? { where: { userId } } : false,
        savedBy: userId ? { where: { userId } } : false,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const currentViews = post.views ?? 0;
    let hasIncremented = false;

    // Increment views only once per authenticated user
    if (userId) {
      const existingView = await this.prisma.postView.findUnique({
        where: {
          postId_userId: {
            postId: id,
            userId: userId,
          },
        },
      });

      if (!existingView) {
        hasIncremented = true;
        // Create view record and increment count
        await Promise.all([
          this.prisma.postView.create({
            data: {
              postId: id,
              userId: userId,
            },
          }),
          this.prisma.post.update({
            where: { id },
            data: { views: { increment: 1 } },
          }),
        ]);
      }
    } else {
      hasIncremented = true;
      // For non-authenticated users, increment every time
      await this.prisma.post.update({
        where: { id },
        data: { views: { increment: 1 } },
      });
    }

    const formattedPost = this.formatPost({
      ...post,
      views: hasIncremented ? currentViews + 1 : currentViews,
    }, userId);

    return {
      ...formattedPost,
      comments: post.comments,
    };
  }

  async update(id: string, userId: string, updatePostDto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    const updated = await this.prisma.post.update({
      where: { id },
      data: updatePostDto,
      include: {
        author: {
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
            likes: true,
            comments: true,
          },
        },
      },
    });

    return this.formatPost(updated, userId);
  }

  async remove(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.post.delete({
      where: { id },
    });

    return { message: 'Post deleted successfully' };
  }

  async toggleLike(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existingLike = await this.prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingLike) {
      await this.prisma.like.delete({
        where: { id: existingLike.id },
      });
      return { 
        liked: false, 
        message: 'Like removed',
        postAuthorId: post.authorId,
      };
    } else {
      await this.prisma.like.create({
        data: {
          postId,
          userId,
        },
      });
      
      // Get liker info for notification
      const liker = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          fullName: true,
          avatarUrl: true,
        },
      });

      // Create notification for post author
      const shouldNotify = post.authorId !== userId;
      if (shouldNotify && liker) {
        await this.notificationsService.createNotification({
          userId: post.authorId,
          type: NotificationType.LIKE,
          actorId: liker.id,
          actorName: liker.fullName || undefined,
          actorAvatar: liker.avatarUrl || undefined,
          targetType: 'post',
          targetId: postId,
          title: 'New Like',
          message: `${liker.fullName || liker.username} liked your post`,
          link: `/post/${postId}`,
        });
      }
      
      return { 
        liked: true, 
        message: 'Post liked',
        postAuthorId: post.authorId,
        postTitle: post.title,
        liker: liker,
        shouldNotify,
      };
    }
  }

  async toggleSave(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existingSave = await this.prisma.savedPost.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingSave) {
      await this.prisma.savedPost.delete({
        where: { id: existingSave.id },
      });
      return { saved: false, message: 'Post unsaved' };
    } else {
      await this.prisma.savedPost.create({
        data: {
          postId,
          userId,
        },
      });
      return { saved: true, message: 'Post saved' };
    }
  }

  async incrementShares(postId: string) {
    await this.prisma.post.update({
      where: { id: postId },
      data: { shares: { increment: 1 } },
    });
    return { message: 'Share count incremented' };
  }

  async incrementViews(postId: string) {
    const post = await this.prisma.post.update({
      where: { id: postId },
      data: { views: { increment: 1 } },
    });
    return { views: post.views, message: 'View count incremented' };
  }

  async getRelated(postId: string, userId?: string, take?: number) {
    const limit = Math.min(Math.max(take ?? 6, 1), 12);

    const basePost = await this.prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        tags: true,
        category: true,
      },
    });

    if (!basePost) {
      throw new NotFoundException('Post not found');
    }

    const matchConditions: any[] = [];

    if (Array.isArray(basePost.tags) && basePost.tags.length > 0) {
      matchConditions.push({ tags: { hasSome: basePost.tags.slice(0, 5) } });
    }

    if (basePost.category) {
      matchConditions.push({ category: basePost.category });
    }

    const baseWhere: any = {
      archived: false,
      id: { not: postId },
    };

    if (matchConditions.length > 0) {
      baseWhere.OR = matchConditions;
    }

    const include = {
      author: {
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
          likes: true,
          comments: true,
        },
      },
      likes: userId ? { where: { userId } } : false,
      savedBy: userId ? { where: { userId } } : false,
    };

    let related = await this.prisma.post.findMany({
      where: baseWhere,
      orderBy: [
        { createdAt: 'desc' },
      ],
      take: limit,
      include,
    });

    if (related.length < limit) {
      const remaining = limit - related.length;
      if (remaining > 0) {
        const excludedIds = [postId, ...related.map((item) => item.id)];
        const fallback = await this.prisma.post.findMany({
          where: {
            archived: false,
            id: { notIn: excludedIds },
          },
          orderBy: { createdAt: 'desc' },
          take: remaining,
          include,
        });
        related = [...related, ...fallback];
      }
    }

    const unique = new Map<string, any>();
    related.forEach((item) => {
      if (!unique.has(item.id)) {
        unique.set(item.id, item);
      }
    });

    return Array.from(unique.values()).map((item) => this.formatPost(item, userId));
  }

  async getComments(postId: string, userId?: string) {
    const comments = await this.prisma.comment.findMany({
      where: { 
        postId,
        parentId: null, // Only get top-level comments
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
        likes: userId ? {
          where: { userId },
          select: { id: true },
        } : false,
        replies: {
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
            likes: userId ? {
              where: { userId },
              select: { id: true },
            } : false,
            _count: {
              select: {
                likes: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            replies: true,
            likes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return comments;
  }

  async createComment(postId: string, userId: string, content: string, parentId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const comment = await this.prisma.comment.create({
      data: {
        content,
        postId,
        authorId: userId,
        parentId: parentId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Create notification for post author
    const shouldNotify = post.authorId !== userId;
    if (shouldNotify) {
      await this.notificationsService.createNotification({
        userId: post.authorId,
        type: NotificationType.COMMENT,
        actorId: comment.author.id,
        actorName: comment.author.fullName || undefined,
        actorAvatar: comment.author.avatarUrl || undefined,
        targetType: 'post',
        targetId: postId,
        title: 'New Comment',
        message: `${comment.author.fullName || comment.author.username} commented on your post`,
        link: `/post/${postId}`,
      });
    }

    return {
      ...comment,
      postAuthorId: post.authorId,
      postTitle: post.title,
      shouldNotify,
    };
  }

  async toggleCommentLike(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const existingLike = await this.prisma.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId,
        },
      },
    });

    if (existingLike) {
      await this.prisma.commentLike.delete({
        where: { id: existingLike.id },
      });
      return { liked: false, message: 'Comment unliked' };
    } else {
      await this.prisma.commentLike.create({
        data: {
          commentId,
          userId,
        },
      });
      return { liked: true, message: 'Comment liked' };
    }
  }

  async getUserPosts(userId: string, includeArchived: boolean = false) {
    const where: any = {
      authorId: userId,
    };

    if (!includeArchived) {
      where.archived = false;
    }

    const posts = await this.prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
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
            likes: true,
            comments: true,
          },
        },
        likes: { where: { userId } },
        savedBy: { where: { userId } },
      },
    });

    return posts.map(post => ({
      ...this.formatPost(post, userId),
      archived: post.archived,
    }));
  }

  async getSavedPosts(userId: string) {
    const savedPosts = await this.prisma.savedPost.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            author: {
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
                likes: true,
                comments: true,
                savedBy: true,
              },
            },
            likes: { where: { userId } },
            savedBy: { where: { userId } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return savedPosts.map(saved => this.formatPost(saved.post as any, userId));
  }

  async toggleArchive(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only archive your own posts');
    }

    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: { archived: !post.archived },
    });

    return {
      archived: updated.archived,
      message: updated.archived ? 'Post archived' : 'Post unarchived',
    };
  }

  private formatPost(post: any, userId?: string) {
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      tags: post.tags,
      imageUrls: post.imageUrls,
      fileUrls: post.fileUrls,
      isAnonymous: post.isAnonymous,
      views: post.views,
      shares: post.shares,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: post.isAnonymous
        ? null
        : {
            id: post.author.id,
            username: post.author.username,
            fullName: post.author.fullName,
            avatarUrl: post.author.avatarUrl,
            university: post.author.university,
          },
      _count: {
        likes: post._count?.likes || 0,
        comments: post._count?.comments || 0,
      },
      likesCount: post._count?.likes || 0,
      commentsCount: post._count?.comments || 0,
      isLiked: userId && Array.isArray(post.likes) && post.likes.length > 0,
      isSaved: userId && Array.isArray(post.savedBy) && post.savedBy.length > 0,
    };
  }
}
