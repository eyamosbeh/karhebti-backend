import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SwipeDocument = Swipe & Document;

@Schema({ timestamps: true })
export class Swipe {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Car', required: true })
  carId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, enum: ['left', 'right'] })
  direction: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  sellerId: MongooseSchema.Types.ObjectId;

  @Prop({ default: 'pending', enum: ['pending', 'accepted', 'declined'] })
  status: string;
}

export const SwipeSchema = SchemaFactory.createForClass(Swipe);

// Create compound index to prevent duplicate swipes
SwipeSchema.index({ userId: 1, carId: 1 }, { unique: true });
