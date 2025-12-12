import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Schéma pour stocker la dernière position GPS d'un utilisateur.
 */
@Schema({ timestamps: true })
export class UserLocation extends Document {
  @Prop({ required: true, unique: true })
  userId: string;

  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;
}

export const UserLocationSchema = SchemaFactory.createForClass(UserLocation);
