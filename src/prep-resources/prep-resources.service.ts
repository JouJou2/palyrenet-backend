import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrepResourceDto } from './dto/create-prep-resource.dto';
import { UpdatePrepResourceDto } from './dto/update-prep-resource.dto';
import { CreatePrepVideoDto } from './dto/create-prep-video.dto';
import { UpdatePrepVideoDto } from './dto/update-prep-video.dto';

@Injectable()
export class PrepResourcesService {
  constructor(private prisma: PrismaService) {}

  // PrepResource methods
  async createResource(data: CreatePrepResourceDto) {
    const createData: any = {
      title: data.title || data.titleAr || 'Untitled',
      titleAr: data.titleAr,
      type: data.type || 'Study Guide',
      typeAr: data.typeAr,
      examType: data.examType || 'gre',
      sections: data.sections || [],
      provider: data.provider,
      language: data.language || 'en',
      level: data.level || 'intermediate',
      access: data.access || [],
      fileUrl: data.fileUrl || '',
      fileType: data.fileType || 'pdf',
      fileSize: data.fileSize || 0,
      fileSizeMB: data.fileSizeMB,
      downloadUrl: data.downloadUrl || data.fileUrl || '',
      isPreviewable: data.isPreviewable ?? true,
      requiresLogin: data.requiresLogin ?? false,
    };

    return this.prisma.prepResource.create({ data: createData });
  }

  async findAllResources(filters?: {
    examType?: string;
    level?: string;
    language?: string;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.examType) {
      where.examType = filters.examType;
    }

    if (filters?.level) {
      where.level = filters.level;
    }

    if (filters?.language) {
      where.language = filters.language;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { titleAr: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.prepResource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneResource(id: string) {
    return this.prisma.prepResource.findUnique({ where: { id } });
  }

  async updateResource(id: string, data: UpdatePrepResourceDto) {
    return this.prisma.prepResource.update({ where: { id }, data: data as any });
  }

  async deleteResource(id: string) {
    return this.prisma.prepResource.delete({ where: { id } });
  }

  async incrementResourceDownloads(id: string) {
    return this.prisma.prepResource.update({
      where: { id },
      data: { downloads: { increment: 1 } },
    });
  }

  async incrementResourceViews(id: string) {
    return this.prisma.prepResource.update({
      where: { id },
      data: { views: { increment: 1 } },
    });
  }

  // PrepVideo methods
  async createVideo(data: CreatePrepVideoDto) {
    const createData: any = {
      title: data.title || data.titleAr || 'Untitled Video',
      titleAr: data.titleAr,
      instructor: data.instructor || data.instructorAr || 'Unknown',
      instructorAr: data.instructorAr,
      examType: data.examType || 'gre',
      sections: data.sections || [],
      provider: data.provider,
      language: data.language || 'en',
      level: data.level || 'intermediate',
      access: data.access || [],
      videoUrl: data.videoUrl || '',
      embedUrl: data.embedUrl,
      videoType: data.videoType || 'mp4',
      duration: data.duration || '0:00',
      durationSeconds: data.durationSeconds || 0,
      durationMin: data.durationMin || 0,
      thumbnailUrl: data.thumbnailUrl,
      captionsUrl: data.captionsUrl,
    };

    return this.prisma.prepVideo.create({ data: createData });
  }

  async findAllVideos(filters?: {
    examType?: string;
    level?: string;
    language?: string;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.examType) {
      where.examType = filters.examType;
    }

    if (filters?.level) {
      where.level = filters.level;
    }

    if (filters?.language) {
      where.language = filters.language;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { titleAr: { contains: filters.search, mode: 'insensitive' } },
        { instructor: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.prepVideo.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneVideo(id: string) {
    return this.prisma.prepVideo.findUnique({ where: { id } });
  }

  async updateVideo(id: string, data: UpdatePrepVideoDto) {
    return this.prisma.prepVideo.update({ where: { id }, data: data as any });
  }

  async deleteVideo(id: string) {
    return this.prisma.prepVideo.delete({ where: { id } });
  }

  async incrementVideoViews(id: string) {
    return this.prisma.prepVideo.update({
      where: { id },
      data: { views: { increment: 1 } },
    });
  }
}
