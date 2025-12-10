import { Controller, Post, Body, Request, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  async createReport(
    @Request() req,
    @Body('targetType') targetType: string,
    @Body('targetId') targetId: string,
    @Body('type') type: string,
    @Body('reason') reason: string,
    @Body('description') description?: string,
  ) {
    return this.reportsService.createReport({
      reportedBy: req.user.id,
      targetType,
      targetId,
      type,
      reason,
      description,
    });
  }
}
