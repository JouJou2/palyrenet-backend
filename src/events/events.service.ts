import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  private readonly eventSelect = {
    id: true,
    title: true,
    titleAr: true,
    description: true,
    descriptionAr: true,
    type: true,
    startDate: true,
    endDate: true,
    location: true,
    locationAr: true,
    time: true,
    imageUrl: true,
    isActive: true,
  } as const;

  async getUpcomingEvents(limit: number = 10) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = await this.prisma.event.findMany({
      where: {
        isActive: true,
        startDate: {
          gte: today,
        },
      },
      orderBy: {
        startDate: 'asc',
      },
      take: limit,
      select: this.eventSelect,
    });

    const events = upcoming.length > 0
      ? upcoming
      : await this.prisma.event.findMany({
          where: {
            isActive: true,
          },
          orderBy: {
            startDate: 'desc',
          },
          take: limit,
          select: this.eventSelect,
        });

    return events.map((event) => this.transformEvent(event, today));
  }

  private transformEvent(event: any, today: Date) {
    const startDate = event.startDate instanceof Date ? event.startDate : new Date(event.startDate);

    const formatDate = (locale: string) =>
      startDate.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

    const status = startDate.getTime() >= today.getTime() ? 'upcoming' : 'past';

    return {
      id: event.id,
      title: event.title,
      titleAr: event.titleAr,
      description: event.description,
      descriptionAr: event.descriptionAr,
      type: event.type,
      startDate: startDate.toISOString(),
      date: formatDate('en-US'),
      dateAr: formatDate('ar-SA'),
      endDate: event.endDate,
      location: event.location,
      locationAr: event.locationAr,
      time: event.time,
      imageUrl: event.imageUrl,
      status,
      isExternal: false,
    };
  }
}
