import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Delete,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() createQuestionDto: CreateQuestionDto) {
    return this.questionsService.createQuestion(req.user.id, createQuestionDto);
  }

  @Get()
  findAll(
    @Request() req,
    @Query('sortBy') sortBy?: 'newest' | 'active' | 'votes' | 'views' | 'unanswered',
    @Query('search') search?: string,
    @Query('tag') tag?: string,
    @Query('category') category?: string,
  ) {
    const userId = req.user?.id;
    return this.questionsService.findAll(userId, sortBy, search, tag, category);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    const userId = req.user?.id;
    return this.questionsService.findOne(id, userId);
  }

  @Post(':id/answers')
  @UseGuards(JwtAuthGuard)
  createAnswer(
    @Param('id') id: string,
    @Request() req,
    @Body() createAnswerDto: CreateAnswerDto,
  ) {
    return this.questionsService.createAnswer(id, req.user.id, createAnswerDto);
  }

  @Post(':id/vote')
  @UseGuards(JwtAuthGuard)
  voteQuestion(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { value: 1 | -1 },
  ) {
    return this.questionsService.toggleQuestionVote(id, req.user.id, body.value);
  }

  @Post('answers/:answerId/vote')
  @UseGuards(JwtAuthGuard)
  voteAnswer(
    @Param('answerId') answerId: string,
    @Request() req,
    @Body() body: { value: 1 | -1 },
  ) {
    return this.questionsService.toggleAnswerVote(answerId, req.user.id, body.value);
  }

  @Post('answers/:answerId/accept')
  @UseGuards(JwtAuthGuard)
  acceptAnswer(@Param('answerId') answerId: string, @Request() req) {
    return this.questionsService.acceptAnswer(answerId, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteQuestion(@Param('id') id: string, @Request() req) {
    return this.questionsService.deleteQuestion(id, req.user.id);
  }

  @Delete('answers/:answerId')
  @UseGuards(JwtAuthGuard)
  deleteAnswer(@Param('answerId') answerId: string, @Request() req) {
    return this.questionsService.deleteAnswer(answerId, req.user.id);
  }

  @Get(':id/related')
  getRelated(@Param('id') id: string) {
    return this.questionsService.getRelatedQuestions(id);
  }
}
