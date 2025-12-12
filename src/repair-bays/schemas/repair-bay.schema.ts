import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class RepairBay {
  @Prop({ type: Types.ObjectId, ref: 'Garage', required: true })
  garageId: Types.ObjectId;

  @Prop({ required: true })
  bayNumber: number; // Numéro du créneau (1, 2, 3, etc.)

  @Prop({ required: true })
  name: string; // Ex: "Créneau 1", "Bay A"

  @Prop({ required: true })
  heureOuverture: string; // Héritées du garage

  @Prop({ required: true })
  heureFermeture: string; // Héritées du garage

  @Prop({ default: true })
  isActive: boolean; // Pour désactiver un créneau temporairement
}

export type RepairBayDocument = RepairBay & Document;
export const RepairBaySchema = SchemaFactory.createForClass(RepairBay);

// Index pour éviter les doublons
RepairBaySchema.index({ garageId: 1, bayNumber: 1 }, { unique: true });
