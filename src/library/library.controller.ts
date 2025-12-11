import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LibraryService } from './library.service';
import { CreateLibraryResourceDto } from './dto/create-library-resource.dto';
import { UpdateLibraryResourceDto } from './dto/update-library-resource.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { multerConfig } from '../common/multer.config';

// ✅ Custom Multer file type (same fix as auth controller)
type MulterFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename: string;
  path?: string;
  buffer?: Buffer;
};

@Controller('library')
export class LibraryController {
  constructor(private libraryService: LibraryService) {}

  @Get()
  async getAll(
    @Query('type') type?: string,
    @Query('discipline') discipline?: string,
    @Query('language') language?: string,
    @Query('search') search?: string,
  ) {
    return this.libraryService.findAll({ type, discipline, language, search });
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.libraryService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Request() req, @Body() data: CreateLibraryResourceDto) {
    const user = req.user;
    if (user.role !== 'ADMIN') {
      throw new BadRequestException('Only admins can create library resources');
    }

    if (!data.title && !data.titleAr) throw new BadRequestException('Either title or titleAr is required');
    if (!data.author && !data.authorAr) throw new BadRequestException('Either author or authorAr is required');
    if (!data.summary && !data.summaryAr) throw new BadRequestException('Either summary or summaryAr is required');

    return this.libraryService.create(data);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadFile(
    @Request() req,
    @UploadedFile() file: MulterFile,   // ✅ FIXED
    @Body() data: any,
  ) {
    const user = req.user;
    if (user.role !== 'ADMIN') {
      throw new BadRequestException('Only admins can upload library resources');
    }

    console.log('File received:', file ? file.originalname : 'NO FILE');
    console.log('Data received:', Object.keys(data));

    if (!file) throw new BadRequestException('File is required');

    if (!data.title && !data.titleAr) throw new BadRequestException('Either title or titleAr is required');
    if (!data.author && !data.authorAr) throw new BadRequestException('Either author or authorAr is required');
    if (!data.summary && !data.summaryAr) throw new BadRequestException('Either summary or summaryAr is required');

    const fileType = file.mimetype.split('/')[1] || 'unknown';
    const fileSize = file.size;
    const fileSizeDisplay = this.formatFileSize(fileSize);
    const fileUrl = `/uploads/${file.filename}`;

    const resourceData = {
      ...data,
      year: data.year ? Number(data.year) : new Date().getFullYear(),
      isPreviewable: String(data.isPreviewable) === 'true' || data.isPreviewable === true,
      requiresLogin: String(data.requiresLogin) === 'true' || data.requiresLogin === true,
      tags: Array.isArray(data.tags)
        ? data.tags
        : typeof data.tags === 'string'
          ? JSON.parse(data.tags)
          : [],
      fileUrl,
      fileType,
      fileSize,
      fileSizeDisplay,
    };

    return this.libraryService.create(resourceData as any);
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Request() req, @Param('id') id: string, @Body() data: UpdateLibraryResourceDto) {
    const user = req.user;
    if (user.role !== 'ADMIN') {
      throw new BadRequestException('Only admins can update library resources');
    }
    return this.libraryService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Request() req, @Param('id') id: string) {
    const user = req.user;
    if (user.role !== 'ADMIN') {
      throw new BadRequestException('Only admins can delete library resources');
    }
    return this.libraryService.delete(id);
  }

  @Post(':id/download')
  async incrementDownloads(@Param('id') id: string) {
    return this.libraryService.incrementDownloads(id);
  }

  @Post(':id/view')
  async incrementViews(@Param('id') id: string) {
    return this.libraryService.incrementViews(id);
  }
}
