import { Body, Controller, Get, Post, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { MessagesService } from '../messages/messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { AdminSecurityService } from '../admin/admin-security.service';

interface ContactDto {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

@Controller('support')
export class SupportController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly prisma: PrismaService,
    private readonly adminSecurityService: AdminSecurityService,
  ) {}

  private async getSupportTeamIds(): Promise<string[]> {
    const filePath = path.resolve(process.cwd(), 'uploads', 'support-team.json');
    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.userIds)) {
        return parsed.userIds.filter((x: any) => typeof x === 'string');
      }
    } catch {}
    const envIds = (process.env.SUPPORT_TEAM_USER_IDS || '')
      .split(',')
      .map(id => id.trim())
      .filter(Boolean);
    return envIds;
  }

  private async saveSupportTeamIds(userIds: string[]): Promise<void> {
    const fileDir = path.resolve(process.cwd(), 'uploads');
    const filePath = path.resolve(fileDir, 'support-team.json');
    await fs.mkdir(fileDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify({ userIds }, null, 2), 'utf-8');
  }

  @Get('team')
  async getTeam() {
    const userIds = await this.getSupportTeamIds();
    return { userIds };
  }

  @Post('team')
  @UseGuards(JwtAuthGuard)
  async setTeam(@Request() req, @Body() body: { userIds: string[]; operationsPassword: string }) {
    // Verify admin role
    const currentUser = await this.prisma.user.findUnique({ where: { id: req.user.id } });
    if (!currentUser || currentUser.role !== 'ADMIN') {
      throw new UnauthorizedException('Only admins can manage support team');
    }
    
    // Verify operations password
    if (!body.operationsPassword) {
      throw new UnauthorizedException('Operations password is required');
    }

    const passwordValid = await this.adminSecurityService.validateOperationsPassword(body.operationsPassword);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid operations password');
    }
    
    const safeIds = (body.userIds || []).filter(id => typeof id === 'string' && id.trim().length > 0);
    await this.saveSupportTeamIds(safeIds);
    return { ok: true, userIds: safeIds };
  }

  @Post('contact')
  async contactSupport(@Body() body: ContactDto) {
    const { name, email, subject, message } = body;
    const supportUserIds = await this.getSupportTeamIds();

    if (supportUserIds.length === 0) {
      // If no support IDs configured, just return an acknowledgement
      return { ok: true, delivered: 0, note: 'No support team configured' };
    }

    const content = `Support Contact\nFrom: ${name} <${email}>\nSubject: ${subject || '(no subject)'}\n\n${message}`;

    const deliveries = [] as any[];
    for (const supportId of supportUserIds) {
      // Use a system sender id like 'system-support' if available; otherwise echo as anonymous
      const senderId = 'system-support';
      const delivered = await this.messagesService.sendMessage(
        senderId,
        supportId,
        content,
        'support-contact',
        undefined,
        { name, email, subject },
      );
      deliveries.push({ supportId, messageId: delivered.id });
    }

    return { ok: true, delivered: deliveries.length, deliveries };
  }
}
