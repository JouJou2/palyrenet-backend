import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EventsController],
  providers: [EventsGateway, EventsService],
  exports: [EventsGateway, EventsService],
})
export class EventsModule {}
