import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { CollaborationsService } from './collaborations.service';
import { CreateCollaborationDto } from './dto/create-collaboration.dto';
import { UpdateCollaborationDto } from './dto/update-collaboration.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@Controller('collaborations')
@UseGuards(JwtAuthGuard)
export class CollaborationsController {
  constructor(private readonly collaborationsService: CollaborationsService) {}

  @Post()
  create(@Request() req, @Body() createCollaborationDto: CreateCollaborationDto) {
    return this.collaborationsService.create(req.user.id, createCollaborationDto);
  }

  @Public()
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('disciplines') disciplines?: string,
    @Query('applicationAreas') applicationAreas?: string,
    @Query('isRemote') isRemote?: string,
    @Query('status') status?: string,
    @Query('hasFunding') hasFunding?: string,
  ) {
    const filters: any = {};
    if (search) filters.search = search;
    if (disciplines) filters.disciplines = disciplines.split(',');
    if (applicationAreas) filters.applicationAreas = applicationAreas.split(',');
    if (isRemote) filters.isRemote = isRemote === 'true';
    if (status) filters.status = status;
    if (hasFunding) filters.hasFunding = hasFunding === 'true';

    return this.collaborationsService.findAll(filters);
  }

  @Get('my-applications')
  getMyApplications(@Request() req) {
    return this.collaborationsService.getMyApplications(req.user.id);
  }

  @Get('my-collaborations')
  getMyCollaborations(@Request() req) {
    return this.collaborationsService.getMyCollaborations(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.collaborationsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateCollaborationDto: UpdateCollaborationDto,
  ) {
    return this.collaborationsService.update(id, req.user.id, updateCollaborationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.collaborationsService.remove(id, req.user.id);
  }

  // Applications
  @Post(':id/apply')
  applyToCollaboration(
    @Param('id') collaborationId: string,
    @Request() req,
    @Body() createApplicationDto: CreateApplicationDto,
  ) {
    return this.collaborationsService.createApplication(
      collaborationId,
      req.user.id,
      createApplicationDto,
    );
  }

  @Get(':id/applications')
  getCollaborationApplications(@Param('id') collaborationId: string, @Request() req) {
    return this.collaborationsService.getCollaborationApplications(collaborationId, req.user.id);
  }

  @Patch('applications/:id/status')
  updateApplicationStatus(
    @Param('id') applicationId: string,
    @Request() req,
    @Body('status') status: 'ACCEPTED' | 'REJECTED',
  ) {
    return this.collaborationsService.updateApplicationStatus(applicationId, req.user.id, status);
  }
}
