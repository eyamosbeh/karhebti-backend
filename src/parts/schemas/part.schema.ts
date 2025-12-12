import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PartDocument = Part & Document;

@Schema({ timestamps: true })
export class Part {
  @Prop({ required: true })
  nom: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  dateInstallation: Date;

  @Prop({ required: true })
  kilometrageRecommande: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Car', required: true })
  voiture: MongooseSchema.Types.ObjectId;
}

export const PartSchema = SchemaFactory.createForClass(Part);
