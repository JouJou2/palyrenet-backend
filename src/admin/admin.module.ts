import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminSecurityService } from './admin-security.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController],
  providers: [AdminService, AdminSecurityService],
  exports: [AdminSecurityService]
})
export class AdminModule {}
