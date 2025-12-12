import { Controller, Get, Post, Body, Param, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiCreatedResponse, ApiBadRequestResponse, ApiForbiddenResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateMessageDto } from './dto/create-message.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@ApiTags('conversations')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConversationsController {
  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all conversations for current user' })
  async getUserConversations(@Req() req) {
    return this.conversationsService.getUserConversations(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific conversation by ID' })
  async getConversation(@Param('id') id: string) {
    return this.conversationsService.getConversation(id);
  }

  @Post(':id/mark-read')
  @ApiOperation({ summary: 'Mark all messages in a conversation as read' })
  async markAsRead(@Param('id') id: string, @Req() req) {
    return this.conversationsService.markMessagesAsRead(id, req.user.userId);
  }

  @Post(':conversationId/messages')
  @ApiOperation({ summary: 'Create and send a message within a conversation' })
  @ApiCreatedResponse({ description: 'Message created and broadcasted' })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiForbiddenResponse({ description: 'User not a participant' })
  @ApiNotFoundResponse({ description: 'Conversation not found' })
  async createMessage(
    @Param('conversationId') conversationId: string,
    @Body() body: CreateMessageDto,
    @Req() req,
  ) {
    const userId = req.user.userId;
    const { conversation, message } = await this.conversationsService.addMessage(
      conversationId,
      userId,
      body.content,
    );

    const otherUserId = conversation.buyerId.toString() === userId
      ? conversation.sellerId.toString()
      : conversation.buyerId.toString();

    this.eventEmitter.emit('message.created', {
      conversationId,
      message,
      otherUserId,
    });

    return {
      _id: message._id,
      conversationId,
      senderId: message.senderId,
      content: message.content,
      isRead: message.isRead,
      createdAt: message.createdAt,
    };
  }

  @Get(':conversationId/messages')
  @ApiOperation({ summary: 'Get all messages in a conversation' })
  async getMessages(@Param('conversationId') conversationId: string, @Req() req) {
    return this.conversationsService.getMessages(conversationId, req.user.userId);
  }
}
