import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ReplacementHistoryDocument = ReplacementHistory & Document;

@Schema({ timestamps: true })
export class ReplacementHistory {
  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  cout: number;

  @Prop({ required: true })
  fournisseur: string;

  @Prop()
  remarque: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Part', required: true })
  piece: MongooseSchema.Types.ObjectId;
}

export const ReplacementHistorySchema = SchemaFactory.createForClass(ReplacementHistory);
