import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReclamationDocument = Reclamation & Document;

@Schema({ timestamps: true })
export class Reclamation {
  @Prop({ required: true, enum: ['service', 'garage'] })
  type: string;

  @Prop({ required: true })
  titre: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Garage' })
  garage?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Service' })
  service?: Types.ObjectId;
}

export const ReclamationSchema = SchemaFactory.createForClass(Reclamation);
