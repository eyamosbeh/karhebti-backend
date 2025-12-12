import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PendingSignupDocument = PendingSignup & Document;

@Schema({ timestamps: true })
export class PendingSignup {
  @Prop({ required: true })
  nom: string;

  @Prop({ required: true })
  prenom: string;

  @Prop({ required: true, index: true })
  email: string;

  @Prop({ required: true })
  motDePasseHash: string;

  @Prop({ required: true })
  telephone: string;

  @Prop({ required: true })
  otpHash: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: 0 })
  attempts: number;
}

export const PendingSignupSchema = SchemaFactory.createForClass(PendingSignup);

// TTL index to auto-delete expired pending signups
PendingSignupSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
