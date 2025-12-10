import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { MessagesModule } from '../messages/messages.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [MessagesModule, NotificationsModule, PrismaModule, AdminModule],
  controllers: [SupportController],
})
export class SupportModule {}
