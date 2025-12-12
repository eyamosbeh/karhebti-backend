import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type DocumentEntityDocument = DocumentEntity & Document;

@Schema({ timestamps: true })
export class DocumentEntity {
  @Prop({ required: true, enum: ['assurance', 'carte grise', 'contrôle technique', 'vignette'] })
  type: string;

  @Prop({ required: true })
  dateEmission: Date;

  @Prop({ required: true })
  dateExpiration: Date;

  @Prop({ required: true })
  fichier: string;

  @Prop()
  image?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Car', required: true })
  voiture: MongooseSchema.Types.ObjectId;

  @Prop({ default: false })
  notificationSent?: boolean;
}

export const DocumentEntitySchema = SchemaFactory.createForClass(DocumentEntity);
