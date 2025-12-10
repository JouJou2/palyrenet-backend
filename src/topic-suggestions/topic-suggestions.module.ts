import { Module } from '@nestjs/common';
import { TopicSuggestionsController } from './topic-suggestions.controller';
import { TopicSuggestionsService } from './topic-suggestions.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TopicSuggestionsController],
  providers: [TopicSuggestionsService]
})
export class TopicSuggestionsModule {}
