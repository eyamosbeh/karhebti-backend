import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Garage {
  @Prop({ required: true }) nom: string;
  @Prop({ required: true }) adresse: string;
  @Prop({ required: true }) telephone: string;
  @Prop({ default: 0, min: 0, max: 5 }) noteUtilisateur: number;
  @Prop({ required: true }) heureOuverture: string;
  @Prop({ required: true }) heureFermeture: string;
  
  // Nouveaux champs pour les coordonnées
  @Prop({ type: Number }) latitude?: number;
  @Prop({ type: Number }) longitude?: number;

  // ✅ NOUVEAU: Nombre de créneaux de réparation
  @Prop({ type: Number, default: 1, min: 1, max: 10 }) numberOfBays?: number;
}

export type GarageDocument = Garage & Document;
export const GarageSchema = SchemaFactory.createForClass(Garage);
