import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export class Message {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  senderId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ default: Date.now })
  timestamp: Date;

  @Prop({ default: false })
  read: boolean;
}

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  buyerId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  sellerId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Car', required: true })
  carId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, enum: ['pending', 'active', 'closed'], default: 'pending' })
  status: string;

  @Prop({ type: [{ type: Object }], default: [] })
  messages: Message[];

  @Prop({ required: false })
  lastMessage?: string;

  @Prop({ required: false })
  lastMessageAt?: Date;

  @Prop({ type: Number, default: 0 })
  unreadCountBuyer?: number;

  @Prop({ type: Number, default: 0 })
  unreadCountSeller?: number;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// Create compound index to prevent duplicate conversations for same buyer-seller-car
ConversationSchema.index({ buyerId: 1, sellerId: 1, carId: 1 }, { unique: true });
