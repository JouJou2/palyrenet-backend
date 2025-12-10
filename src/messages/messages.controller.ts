import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, Delete } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Get('conversations')
  async getConversations(@Request() req) {
    return this.messagesService.getConversations(req.user.id);
  }

  @Get('conversation/:userId')
  async getConversation(@Request() req, @Param('userId') otherUserId: string) {
    return this.messagesService.getConversation(req.user.id, otherUserId);
  }

  @Post('send')
  async sendMessage(
    @Request() req,
    @Body() body: { 
      recipientId: string; 
      content: string;
      contextType?: string;
      contextId?: string;
      contextData?: any;
      replyToId?: string;
      attachments?: any[];
    }
  ) {
    return this.messagesService.sendMessage(
      req.user.id, 
      body.recipientId, 
      body.content,
      body.contextType,
      body.contextId,
      body.contextData,
      body.replyToId,
      body.attachments
    );
  }

  @Post('mark-read/:userId')
  async markAsRead(@Request() req, @Param('userId') otherUserId: string) {
    return this.messagesService.markConversationAsRead(req.user.id, otherUserId);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    return this.messagesService.getUnreadCount(req.user.id);
  }

  @Post(':messageId/react')
  async reactToMessage(
    @Request() req,
    @Param('messageId') messageId: string,
    @Body() body: { emoji: string }
  ) {
    return this.messagesService.toggleReaction(req.user.id, messageId, body.emoji);
  }

  @Get(':messageId/reactions')
  async getMessageReactions(@Param('messageId') messageId: string) {
    return this.messagesService.getMessageReactions(messageId);
  }

  @Delete('conversation/:userId')
  async deleteConversation(@Request() req, @Param('userId') otherUserId: string) {
    return this.messagesService.deleteConversation(req.user.id, otherUserId);
  }
}
