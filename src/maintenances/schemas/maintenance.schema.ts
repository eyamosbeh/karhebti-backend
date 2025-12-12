import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type MaintenanceDocument = Maintenance & Document;

@Schema({ timestamps: true })
export class Maintenance {
  @Prop({ required: true })
  title: string;

  @Prop()
  notes?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ required: true, enum: ['planned', 'done'], default: 'planned' })
  status: string;

  @Prop({ required: true })
  dueAt: Date;

  @Prop()
  mileage?: number;

  @Prop({ required: true, enum: ['vidange', 'révision', 'réparation'] })
  type: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  cout: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Garage', required: true })
  garage: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Car', required: true })
  voiture: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  ownerId: MongooseSchema.Types.ObjectId;
}

export const MaintenanceSchema = SchemaFactory.createForClass(Maintenance);

// Text index for search functionality
MaintenanceSchema.index({ title: 'text', notes: 'text', tags: 'text' });

// Compound index for efficient filtering
MaintenanceSchema.index({ ownerId: 1, dueAt: 1 });
MaintenanceSchema.index({ ownerId: 1, status: 1 });
