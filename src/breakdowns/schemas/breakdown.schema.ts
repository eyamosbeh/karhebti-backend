import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum BreakdownType {
  PNEU = 'PNEU',
  BATTERIE = 'BATTERIE',
  MOTEUR = 'MOTEUR',
  CARBURANT = 'CARBURANT',
  REMORQUAGE = 'REMORQUAGE',
  AUTRE = 'AUTRE',
}

export enum BreakdownStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ACCEPTED = 'ACCEPTED',
  REFUSED = 'REFUSED',
}
/**
 * Schéma Breakdown : représente une demande d'assistance panne.
 */

@Schema({ timestamps: true })
export class Breakdown extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop()
  vehicleId?: string;

  @Prop({ required: true, enum: BreakdownType })
  type: BreakdownType;

  @Prop()
  description?: string;

  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;

  @Prop({ enum: BreakdownStatus, default: BreakdownStatus.PENDING })
  status: BreakdownStatus;

  @Prop()
  assignedTo?: string;

  @Prop()
  photo?: string;
}

export const BreakdownSchema = SchemaFactory.createForClass(Breakdown);
