import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Reservation {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Garage', required: true })
  garageId: Types.ObjectId;

  @Prop({ required: true, type: Date })
  date: Date;

  @Prop({ required: true })
  heureDebut: string;

  @Prop({ required: true })
  heureFin: string;

  @Prop({ 
    type: [String], 
    enum: [
      'vidange', 'contrôle technique', 'réparation pneu', 'changement pneu', 
      'freinage', 'batterie', 'climatisation', 'échappement', 
      'révision complète', 'diagnostic électronique', 'carrosserie', 
      'peinture', 'pare-brise', 'suspension', 'embrayage', 'transmission', 
      'injection', 'refroidissement', 'démarrage', 'lavage auto', 
      'équilibrage roues', 'parallélisme', 'système électrique', 
      'filtre à air', 'filtre à huile', 'plaquettes de frein'
    ], 
    default: [] 
  })
  services: string[];

  @Prop({ enum: ['en_attente', 'confirmé', 'annulé'], default: 'en_attente' })
  status: string;

  @Prop({ type: String })
  commentaires?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;

  @Prop({ default: false })
  isPaid: boolean;

  @Prop({ default: 0 })
  totalAmount: number;

  // ✅ NOUVEAU: Référence au créneau de réparation
  @Prop({ type: Types.ObjectId, ref: 'RepairBay', required: true })
  repairBayId: Types.ObjectId;
}

export type ReservationDocument = Reservation & Document;
export const ReservationSchema = SchemaFactory.createForClass(Reservation);

// ✅ Index pour vérifier les conflits
ReservationSchema.index({ repairBayId: 1, date: 1, heureDebut: 1, heureFin: 1 });
ReservationSchema.index({ garageId: 1, date: 1 });
