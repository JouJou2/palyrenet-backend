import { Module } from '@nestjs/common';
import { CollaborationsService } from './collaborations.service';
import { CollaborationsController } from './collaborations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MessagesModule } from '../messages/messages.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, MessagesModule, NotificationsModule],
  controllers: [CollaborationsController],
  providers: [CollaborationsService],
  exports: [CollaborationsService],
})
export class CollaborationsModule {}
