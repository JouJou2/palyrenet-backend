import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { TopicSuggestionsService } from './topic-suggestions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('topic-suggestions')
@UseGuards(JwtAuthGuard)
export class TopicSuggestionsController {
  constructor(private readonly topicSuggestionsService: TopicSuggestionsService) {}

  @Post()
  async create(@Request() req, @Body() body: { topic: string; description?: string }) {
    return this.topicSuggestionsService.create(body.topic, body.description, req.user.id);
  }

  @Get('my-suggestions')
  async getMySuggestions(@Request() req) {
    return this.topicSuggestionsService.getMySuggestions(req.user.id);
  }

  @Delete(':id')
  async delete(@Request() req, @Param('id') id: string) {
    return this.topicSuggestionsService.delete(id, req.user.id);
  }
}
