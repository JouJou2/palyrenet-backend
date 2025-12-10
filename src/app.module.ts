import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { EventsModule } from './events/events.module';
import { QuestionsModule } from './questions/questions.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CollaborationsModule } from './collaborations/collaborations.module';
import { MessagesModule } from './messages/messages.module';
import { LibraryModule } from './library/library.module';
import { PrepResourcesModule } from './prep-resources/prep-resources.module';
import { AdminModule } from './admin/admin.module';
import { TopicSuggestionsModule } from './topic-suggestions/topic-suggestions.module';
import { ReportsModule } from './reports/reports.module';
import { HealthModule } from './health/health.module';
import { validate } from './common/config/env.validation';
import { LoggerService } from './common/logger/logger.service';
import { SupportModule } from './support/support.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      cache: true,
    }),
    // Rate limiting: 100 requests per minute per IP
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests
    }]),
    PrismaModule,
    AuthModule,
    PostsModule,
    EventsModule,
    QuestionsModule,
    NotificationsModule,
    CollaborationsModule,
    MessagesModule,
    LibraryModule,
    PrepResourcesModule,
    AdminModule,
    TopicSuggestionsModule,
    ReportsModule,
    HealthModule,
    SupportModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    LoggerService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
