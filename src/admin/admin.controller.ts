import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminSecurityService } from './admin-security.service';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly adminSecurityService: AdminSecurityService,
  ) {}

  private checkAdminRole(req: any) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can access this resource');
    }
  }

  @Get('overview')
  async getOverview(@Request() req) {
    this.checkAdminRole(req);
    return this.adminService.getOverviewStats();
  }

  @Get('users')
  async getUsers(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    this.checkAdminRole(req);
    return this.adminService.getUsers(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      search,
    );
  }

  @Get('users/:id')
  async getUserDetails(@Request() req, @Param('id') id: string) {
    this.checkAdminRole(req);
    return this.adminService.getUserDetails(id);
  }

  @Patch('users/:id/verify')
  async verifyUser(@Request() req, @Param('id') id: string) {
    this.checkAdminRole(req);
    return this.adminService.verifyUser(id);
  }

  @Patch('users/:id/suspend')
  async suspendUser(
    @Request() req,
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Body('duration') duration?: number,
  ) {
    this.checkAdminRole(req);
    return this.adminService.suspendUser(id, reason, duration);
  }

  @Patch('users/:id/unsuspend')
  async unsuspendUser(@Request() req, @Param('id') id: string) {
    this.checkAdminRole(req);
    return this.adminService.unsuspendUser(id);
  }

  @Patch('users/:id/ban')
  async banUser(
    @Request() req,
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Body('duration') duration?: number,
  ) {
    this.checkAdminRole(req);
    return this.adminService.banUser(id, reason, duration);
  }

  @Patch('users/:id/unban')
  async unbanUser(@Request() req, @Param('id') id: string) {
    this.checkAdminRole(req);
    return this.adminService.unbanUser(id);
  }

  @Delete('users/:id')
  async deleteUser(@Request() req, @Param('id') id: string) {
    this.checkAdminRole(req);
    return this.adminService.deleteUser(id);
  }

  @Patch('users/:id/role')
  async updateUserRole(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { role: string },
  ) {
    this.checkAdminRole(req);
    return this.adminService.updateUserRole(id, body.role);
  }

  @Patch('users/:id/flag')
  async flagUser(
    @Request() req,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    this.checkAdminRole(req);
    return this.adminService.flagUser(id, reason);
  }

  @Patch('users/:id/unflag')
  async unflagUser(@Request() req, @Param('id') id: string) {
    this.checkAdminRole(req);
    return this.adminService.unflagUser(id);
  }

  @Post('users/:id/promote')
  async promoteUser(
    @Request() req,
    @Param('id') id: string,
    @Body('operationsPassword') operationsPassword: string,
  ) {
    this.checkAdminRole(req);

    if (!operationsPassword) {
      throw new BadRequestException('Operations password is required');
    }

    const isValid = await this.adminSecurityService.validateOperationsPassword(operationsPassword);
    if (!isValid) {
      throw new UnauthorizedException('Invalid operations password');
    }

    return this.adminService.promoteUserToAdmin(id);
  }

  @Post('users/:id/demote')
  async demoteUser(
    @Request() req,
    @Param('id') id: string,
    @Body('operationsPassword') operationsPassword: string,
  ) {
    this.checkAdminRole(req);

    if (!operationsPassword) {
      throw new BadRequestException('Operations password is required');
    }

    const isValid = await this.adminSecurityService.validateOperationsPassword(operationsPassword);
    if (!isValid) {
      throw new UnauthorizedException('Invalid operations password');
    }

    return this.adminService.demoteAdmin(id);
  }

  @Get('content')
  async getContent(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    this.checkAdminRole(req);
    return this.adminService.getContent(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      status,
      search,
    );
  }

  @Patch('content/:id/approve')
  async approveContent(@Request() req, @Param('id') id: string) {
    this.checkAdminRole(req);
    return this.adminService.approveContent(id, req.user.id);
  }

  @Patch('content/:id/reject')
  async rejectContent(
    @Request() req,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    this.checkAdminRole(req);
    return this.adminService.rejectContent(id, req.user.id, reason);
  }

  @Delete('content/:id')
  async deleteContent(
    @Request() req,
    @Param('id') id: string,
  ) {
    this.checkAdminRole(req);
    return this.adminService.deleteContent(id);
  }

  // Reports endpoints
  @Get('reports')
  async getReports(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    this.checkAdminRole(req);
    return this.adminService.getReports(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      status,
    );
  }

  @Patch('reports/resolve')
  async resolveReport(
    @Request() req,
    @Body('targetType') targetType: string,
    @Body('targetId') targetId: string,
  ) {
    this.checkAdminRole(req);
    return this.adminService.resolveReport(targetType, targetId, req.user.id);
  }

  @Patch('reports/:id/dismiss')
  async dismissReport(
    @Request() req,
    @Param('id') id: string,
  ) {
    this.checkAdminRole(req);
    return this.adminService.dismissReport(id);
  }

  @Get('analytics/growth')
  async getGrowthData(@Request() req, @Query('period') period?: string) {
    this.checkAdminRole(req);
    return this.adminService.getGrowthData(period);
  }

  @Get('analytics/contributors')
  async getTopContributors(@Request() req, @Query('limit') limit?: string) {
    this.checkAdminRole(req);
    return this.adminService.getTopContributors(limit ? parseInt(limit) : 10);
  }

  @Get('analytics/activity')
  async getActivityData(@Request() req, @Query('period') period?: string) {
    this.checkAdminRole(req);
    return this.adminService.getActivityData(period);
  }

  @Get('analytics/engagement')
  async getEngagementData(@Request() req) {
    this.checkAdminRole(req);
    return this.adminService.getEngagementData();
  }

  @Get('settings')
  async getSettings(@Request() req) {
    this.checkAdminRole(req);
    return this.adminService.getSettings();
  }

  @Patch('settings')
  async updateSettings(@Request() req, @Body() body: any) {
    this.checkAdminRole(req);
    return this.adminService.updateSettings(body);
  }

  @Patch('security/password')
  async updateOperationsPassword(
    @Request() req,
    @Body() body: { currentPassword: string; newPassword: string; confirmPassword: string },
  ) {
    this.checkAdminRole(req);

    if (!body?.newPassword || body.newPassword !== body.confirmPassword) {
      throw new BadRequestException('New password and confirmation must match');
    }

    await this.adminSecurityService.updateOperationsPassword(body.currentPassword, body.newPassword);
    return { success: true };
  }

  // Topic Suggestions
  @Get('topics')
  async getTopicSuggestions(@Request() req, @Query('status') status?: string) {
    this.checkAdminRole(req);
    return this.adminService.getTopicSuggestions(status);
  }

  @Patch('topics/:id/status')
  async updateTopicStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    this.checkAdminRole(req);
    return this.adminService.updateTopicStatus(id, body.status);
  }

  @Delete('topics/:id')
  async deleteTopic(@Request() req, @Param('id') id: string) {
    this.checkAdminRole(req);
    return this.adminService.deleteTopic(id);
  }

  // Events
  @Get('events')
  async getEvents(@Request() req) {
    this.checkAdminRole(req);
    return this.adminService.getEvents();
  }

  @Post('events')
  async createEvent(@Request() req, @Body() body: any) {
    this.checkAdminRole(req);
    return this.adminService.createEvent(body, req.user.id);
  }

  @Patch('events/:id')
  async updateEvent(
    @Request() req,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    this.checkAdminRole(req);
    return this.adminService.updateEvent(id, body);
  }

  @Delete('events/:id')
  async deleteEvent(@Request() req, @Param('id') id: string) {
    this.checkAdminRole(req);
    return this.adminService.deleteEvent(id);
  }

  @Patch('events/:id/toggle')
  async toggleEventStatus(@Request() req, @Param('id') id: string) {
    this.checkAdminRole(req);
    return this.adminService.toggleEventStatus(id);
  }
}
