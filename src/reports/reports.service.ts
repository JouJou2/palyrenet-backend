import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async createReport(data: {
    reportedBy: string;
    targetType: string;
    targetId: string;
    type: string;
    reason: string;
    description?: string;
  }) {
    // Check if user already reported this content
    const existingReport = await this.prisma.report.findFirst({
      where: {
        reportedBy: data.reportedBy,
        targetType: data.targetType,
        targetId: data.targetId,
        status: { not: 'DISMISSED' },
      },
    });

    if (existingReport) {
      return {
        success: false,
        message: 'You have already reported this content',
      };
    }

    // Create new report
    const report = await this.prisma.report.create({
      data: {
        reportedBy: data.reportedBy,
        targetType: data.targetType,
        targetId: data.targetId,
        type: data.type as any,
        reason: data.reason,
        description: data.description,
      },
    });

    return {
      success: true,
      message: 'Report submitted successfully',
      report,
    };
  }
}
