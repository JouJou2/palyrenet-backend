import { Controller, Get, Query } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('upcoming')
  async getUpcomingEvents(@Query('limit') limit?: string) {
    const parsedLimit = Number.parseInt(limit ?? '', 10);
    const safeLimit = Number.isNaN(parsedLimit) || parsedLimit <= 0 ? undefined : parsedLimit;
    return this.eventsService.getUpcomingEvents(safeLimit);
  }
}
