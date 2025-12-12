import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Service {
  @Prop({ 
    required: true, 
    enum: [
      'vidange', 'contrôle technique', 'réparation pneu', 'changement pneu', 
      'freinage', 'batterie', 'climatisation', 'échappement', 
      'révision complète', 'diagnostic électronique', 'carrosserie', 
      'peinture', 'pare-brise', 'suspension', 'embrayage', 'transmission', 
      'injection', 'refroidissement', 'démarrage', 'lavage auto', 
      'équilibrage roues', 'parallélisme', 'système électrique', 
      'filtre à air', 'filtre à huile', 'plaquettes de frein'
    ]
  })
  type: string;

  @Prop({ required: true, min: 0 })
  coutMoyen: number;

  @Prop({ required: true, min: 1 })
  dureeEstimee: number;

  @Prop({ type: Types.ObjectId, ref: 'Garage', required: true })
  garage: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId; // propGarage who created this service
}

export type ServiceDocument = Service & Document;
export const ServiceSchema = SchemaFactory.createForClass(Service);
