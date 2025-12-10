import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() createPostDto: CreatePostDto) {
    return this.postsService.create(req.user.id, createPostDto);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(
    @Request() req,
    @Query('sortBy') sortBy?: 'latest' | 'popular' | 'most-viewed',
    @Query('search') search?: string,
    @Query('tag') tag?: string,
  ) {
    const userId = req.user?.id;
    return this.postsService.findAll(userId, sortBy, search, tag);
  }

  @Get('user/my-posts')
  @UseGuards(JwtAuthGuard)
  getMyPosts(@Request() req, @Query('includeArchived') includeArchived?: string) {
    return this.postsService.getUserPosts(req.user.id, includeArchived === 'true');
  }

  @Get('user/saved')
  @UseGuards(JwtAuthGuard)
  getSavedPosts(@Request() req) {
    return this.postsService.getSavedPosts(req.user.id);
  }

  @Get(':id/related')
  @UseGuards(OptionalJwtAuthGuard)
  getRelated(
    @Param('id') id: string,
    @Request() req,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user?.id;
    const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined;
    const normalizedLimit = parsedLimit !== undefined && !Number.isNaN(parsedLimit)
      ? parsedLimit
      : undefined;
    return this.postsService.getRelated(id, userId, normalizedLimit);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id') id: string, @Request() req) {
    const userId = req.user?.id;
    return this.postsService.findOne(id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.update(id, req.user.id, updatePostDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req) {
    return this.postsService.remove(id, req.user.id);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  toggleLike(@Param('id') id: string, @Request() req) {
    return this.postsService.toggleLike(id, req.user.id);
  }

  @Post(':id/save')
  @UseGuards(JwtAuthGuard)
  toggleSave(@Param('id') id: string, @Request() req) {
    return this.postsService.toggleSave(id, req.user.id);
  }

  @Post(':id/share')
  incrementShares(@Param('id') id: string) {
    return this.postsService.incrementShares(id);
  }

  @Post(':id/archive')
  @UseGuards(JwtAuthGuard)
  toggleArchive(@Param('id') id: string, @Request() req) {
    return this.postsService.toggleArchive(id, req.user.id);
  }

  @Post(':id/view')
  incrementViews(@Param('id') id: string) {
    return this.postsService.incrementViews(id);
  }

  @Get(':id/comments')
  getComments(@Param('id') id: string, @Request() req) {
    const userId = req.user?.id; // Optional: will be undefined if not logged in
    return this.postsService.getComments(id, userId);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  createComment(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { content: string; parentId?: string },
  ) {
    return this.postsService.createComment(
      id,
      req.user.id,
      body.content,
      body.parentId,
    );
  }

  @Post('comments/:commentId/like')
  @UseGuards(JwtAuthGuard)
  toggleCommentLike(
    @Param('commentId') commentId: string,
    @Request() req,
  ) {
    return this.postsService.toggleCommentLike(commentId, req.user.id);
  }
}
