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
import { PrepResourcesService } from './prep-resources.service';
import { CreatePrepResourceDto } from './dto/create-prep-resource.dto';
import { UpdatePrepResourceDto } from './dto/update-prep-resource.dto';
import { CreatePrepVideoDto } from './dto/create-prep-video.dto';
import { UpdatePrepVideoDto } from './dto/update-prep-video.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { multerConfig, videoMulterConfig } from '../common/multer.config';

// ✅ Custom Multer File type (same as other controllers)
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

@Controller('prep-resources')
export class PrepResourcesController {
  constructor(private prepResourcesService: PrepResourcesService) {}

  // Resource endpoints
  @Get('resources')
  async getAllResources(
    @Query('examType') examType?: string,
    @Query('level') level?: string,
    @Query('language') language?: string,
    @Query('search') search?: string,
  ) {
    return this.prepResourcesService.findAllResources({
      examType,
      level,
      language,
      search,
    });
  }

  @Get('resources/:id')
  async getOneResource(@Param('id') id: string) {
    return this.prepResourcesService.findOneResource(id);
  }

  @Post('resources')
  @UseGuards(JwtAuthGuard)
  async createResource(@Request() req, @Body() data: CreatePrepResourceDto) {
    if (req.user.role !== 'ADMIN') {
      throw new BadRequestException('Only admins can create prep resources');
    }
    if (!data.title && !data.titleAr) {
      throw new BadRequestException('Either title or titleAr is required');
    }
    return this.prepResourcesService.createResource(data);
  }

  @Post('resources/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadResource(
    @Request() req,
    @UploadedFile() file: MulterFile,   // ✅ FIXED
    @Body() data: any,
  ) {
    if (req.user.role !== 'ADMIN') {
      throw new BadRequestException('Only admins can upload prep resources');
    }
    if (!file) {
      throw new BadRequestException('File is required');
    }
    if (!data.title && !data.titleAr) {
      throw new BadRequestException('Either title or titleAr is required');
    }

    const fileType = file.mimetype.split('/')[1] || 'unknown';
    const fileSize = file.size;
    const fileSizeMB = (fileSize / 1048576).toFixed(1) + ' MB';
    const fileUrl = `/uploads/${file.filename}`;

    const resourceData = {
      ...data,
      sections: Array.isArray(data.sections)
        ? data.sections
        : typeof data.sections === 'string'
        ? JSON.parse(data.sections)
        : [],
      access: Array.isArray(data.access)
        ? data.access
        : typeof data.access === 'string'
        ? JSON.parse(data.access)
        : [],
      isPreviewable: String(data.isPreviewable) === 'true' || data.isPreviewable === true,
      requiresLogin: String(data.requiresLogin) === 'true' || data.requiresLogin === true,
      fileUrl,
      downloadUrl: fileUrl,
      fileType,
      fileSize,
      fileSizeMB,
    };

    return this.prepResourcesService.createResource(resourceData as any);
  }

  @Patch('resources/:id')
  @UseGuards(JwtAuthGuard)
  async updateResource(
    @Request() req,
    @Param('id') id: string,
    @Body() data: UpdatePrepResourceDto,
  ) {
    if (req.user.role !== 'ADMIN') {
      throw new BadRequestException('Only admins can update prep resources');
    }
    return this.prepResourcesService.updateResource(id, data);
  }

  @Delete('resources/:id')
  @UseGuards(JwtAuthGuard)
  async deleteResource(@Request() req, @Param('id') id: string) {
    if (req.user.role !== 'ADMIN') {
      throw new BadRequestException('Only admins can delete prep resources');
    }
    return this.prepResourcesService.deleteResource(id);
  }

  @Post('resources/:id/download')
  async incrementResourceDownloads(@Param('id') id: string) {
    return this.prepResourcesService.incrementResourceDownloads(id);
  }

  @Post('resources/:id/view')
  async incrementResourceViews(@Param('id') id: string) {
    return this.prepResourcesService.incrementResourceViews(id);
  }

  // Video endpoints
  @Get('videos')
  async getAllVideos(
    @Query('examType') examType?: string,
    @Query('level') level?: string,
    @Query('language') language?: string,
    @Query('search') search?: string,
  ) {
    return this.prepResourcesService.findAllVideos({
      examType,
      level,
      language,
      search,
    });
  }

  @Get('videos/:id')
  async getOneVideo(@Param('id') id: string) {
    return this.prepResourcesService.findOneVideo(id);
  }

  @Post('videos')
  @UseGuards(JwtAuthGuard)
  async createVideo(@Request() req, @Body() data: CreatePrepVideoDto) {
    if (req.user.role !== 'ADMIN') {
      throw new BadRequestException('Only admins can create prep videos');
    }
    if (!data.title && !data.titleAr) {
      throw new BadRequestException('Either title or titleAr is required');
    }
    if (!data.instructor && !data.instructorAr) {
      throw new BadRequestException('Either instructor or instructorAr is required');
    }
    return this.prepResourcesService.createVideo(data);
  }

  @Post('videos/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', videoMulterConfig))
  async uploadVideo(
    @Request() req,
    @UploadedFile() file: MulterFile,   // ✅ FIXED
    @Body() data: any,
  ) {
    if (req.user.role !== 'ADMIN') {
      throw new BadRequestException('Only admins can upload prep videos');
    }
    if (!file) {
      throw new BadRequestException('Video file is required');
    }
    if (!data.title && !data.titleAr) {
      throw new BadRequestException('Either title or titleAr is required');
    }
    if (!data.instructor && !data.instructorAr) {
      throw new BadRequestException('Either instructor or instructorAr is required');
    }

    const videoType = file.mimetype.split('/')[1] || 'mp4';
    const videoUrl = `/uploads/videos/${file.filename}`;

    const videoData = {
      ...data,
      sections: Array.isArray(data.sections)
        ? data.sections
        : typeof data.sections === 'string'
        ? JSON.parse(data.sections)
        : [],
      access: Array.isArray(data.access)
        ? data.access
        : typeof data.access === 'string'
        ? JSON.parse(data.access)
        : [],
      videoUrl,
      embedUrl: videoUrl,
      videoType,
    };

    return this.prepResourcesService.createVideo(videoData as any);
  }

  @Patch('videos/:id')
  @UseGuards(JwtAuthGuard)
  async updateVideo(
    @Request() req,
    @Param('id') id: string,
    @Body() data: UpdatePrepVideoDto,
  ) {
    if (req.user.role !== 'ADMIN') {
      throw new BadRequestException('Only admins can update prep videos');
    }
    return this.prepResourcesService.updateVideo(id, data);
  }

  @Delete('videos/:id')
  @UseGuards(JwtAuthGuard)
  async deleteVideo(@Request() req, @Param('id') id: string) {
    if (req.user.role !== 'ADMIN') {
      throw new BadRequestException('Only admins can delete prep videos');
    }
    return this.prepResourcesService.deleteVideo(id);
  }

  @Post('videos/:id/view')
  async incrementVideoViews(@Param('id') id: string) {
    return this.prepResourcesService.incrementVideoViews(id);
  }
}
