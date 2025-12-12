import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
  ) {}

  async createConversation(data: {
    buyerId: string;
    sellerId: string;
    carId: string;
  }) {
    const conversation = await this.conversationModel.create({
      ...data,
      status: 'active',
      messages: [],
    });
    return conversation;
  }

  async findOrCreateConversation(data: {
    buyerId: string;
    sellerId: string;
    carId: string;
  }) {
    // Try to find existing conversation
    let conversation = await this.conversationModel.findOne({
      buyerId: data.buyerId,
      sellerId: data.sellerId,
      carId: data.carId,
    });

    if (!conversation) {
      try {
        conversation = await this.createConversation(data);
      } catch (error) {
        // Handle race condition - another request may have created it
        if (error.code === 11000) {
          conversation = await this.conversationModel.findOne({
            buyerId: data.buyerId,
            sellerId: data.sellerId,
            carId: data.carId,
          });
        } else {
          throw error;
        }
      }
    }

    return conversation;
  }

  async getConversation(conversationId: string) {
    return this.conversationModel
      .findById(conversationId)
      .populate('buyerId', 'nom prenom email')
      .populate('sellerId', 'nom prenom email')
      .populate('carId');
  }

  async getUserConversations(userId: string) {
    return this.conversationModel
      .find({
        $or: [{ buyerId: userId }, { sellerId: userId }],
        status: 'active',
      })
      .populate('buyerId', 'nom prenom email')
      .populate('sellerId', 'nom prenom email')
      .populate('carId')
      .sort({ updatedAt: -1 });
  }

  async addMessage(conversationId: string, senderId: string, content: string) {
    if (typeof content !== 'string' || !content.trim()) {
      throw new BadRequestException('Content must be a non-empty string');
    }

    const conversation = await this.conversationModel.findById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isBuyer = conversation.buyerId.toString() === senderId;
    const isSeller = conversation.sellerId.toString() === senderId;
    if (!isBuyer && !isSeller) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    const messageId = new Types.ObjectId();
    const createdAt = new Date();
    const message = {
      _id: messageId,
      senderId: new Types.ObjectId(senderId) as any,
      content: content.trim(),
      timestamp: createdAt,
      read: false,
    } as any;

    conversation.messages.push(message);

    conversation.lastMessage = message.content;
    conversation.lastMessageAt = createdAt;
    if (isBuyer) {
      conversation.unreadCountSeller = (conversation.unreadCountSeller || 0) + 1;
    } else if (isSeller) {
      conversation.unreadCountBuyer = (conversation.unreadCountBuyer || 0) + 1;
    }

    await conversation.save();

    return {
      conversation,
      message: {
        _id: messageId.toString(),
        conversationId: conversationId,
        senderId,
        content: message.content,
        isRead: false,
        createdAt,
      },
    };
  }

  async markMessagesAsRead(conversationId: string, userId: string) {
    const conversation = await this.conversationModel.findById(conversationId);
    
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isBuyer = conversation.buyerId.toString() === userId;
    const isSeller = conversation.sellerId.toString() === userId;
    if (!isBuyer && !isSeller) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    conversation.messages.forEach((message) => {
      if (message.senderId.toString() !== userId && !message.read) {
        message.read = true;
      }
    });

    // Reset unread count for current user
    if (isBuyer) {
      conversation.unreadCountBuyer = 0;
    } else if (isSeller) {
      conversation.unreadCountSeller = 0;
    }

    await conversation.save();
    return conversation;
  }

  async getMessages(conversationId: string, userId: string) {
    const conversation = await this.conversationModel.findById(conversationId);
    
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isBuyer = conversation.buyerId.toString() === userId;
    const isSeller = conversation.sellerId.toString() === userId;
    if (!isBuyer && !isSeller) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    return conversation.messages.map((msg: any) => ({
      _id: msg._id?.toString() || new Types.ObjectId().toString(),
      conversationId,
      senderId: msg.senderId.toString(),
      content: msg.content,
      isRead: msg.read,
      createdAt: msg.timestamp,
    }));
  }
}
