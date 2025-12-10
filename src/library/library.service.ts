import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLibraryResourceDto } from './dto/create-library-resource.dto';
import { UpdateLibraryResourceDto } from './dto/update-library-resource.dto';

@Injectable()
export class LibraryService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateLibraryResourceDto) {
    // Prepare the data, ensuring required fields have defaults
    const createData: any = {
      title: data.title || data.titleAr || 'Untitled',
      titleAr: data.titleAr,
      author: data.author || data.authorAr || 'Unknown',
      authorAr: data.authorAr,
      institution: data.institution,
      institutionAr: data.institutionAr,
      summary: data.summary || data.summaryAr || 'No summary provided',
      summaryAr: data.summaryAr,
      type: data.type || 'book',
      discipline: data.discipline || 'general',
      disciplineAr: data.disciplineAr,
      language: data.language || 'en',
      fileUrl: data.fileUrl || '',
      fileType: data.fileType || 'pdf',
      fileSize: data.fileSize || 0,
      fileSizeDisplay: data.fileSizeDisplay || '0 B',
      tags: data.tags || [],
      year: data.year || new Date().getFullYear(),
      isPreviewable: data.isPreviewable ?? true,
      requiresLogin: data.requiresLogin ?? false,
      previewUrl: data.previewUrl || data.fileUrl,
      videoUrl: data.videoUrl,
      thumbnailUrl: data.thumbnailUrl,
      duration: data.duration,
      durationSeconds: data.durationSeconds,
    };

    return this.prisma.libraryResource.create({
      data: createData,
    });
  }

  async findAll(filters?: {
    type?: string;
    discipline?: string;
    language?: string;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.discipline) {
      where.discipline = filters.discipline;
    }

    if (filters?.language) {
      where.language = filters.language;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { titleAr: { contains: filters.search, mode: 'insensitive' } },
        { author: { contains: filters.search, mode: 'insensitive' } },
        { summary: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.libraryResource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.libraryResource.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: UpdateLibraryResourceDto) {
    return this.prisma.libraryResource.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.libraryResource.delete({
      where: { id },
    });
  }

  async incrementDownloads(id: string) {
    return this.prisma.libraryResource.update({
      where: { id },
      data: {
        downloads: { increment: 1 },
      },
    });
  }

  async incrementViews(id: string) {
    return this.prisma.libraryResource.update({
      where: { id },
      data: {
        views: { increment: 1 },
      },
    });
  }
}
