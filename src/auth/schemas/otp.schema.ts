import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OtpDocument = Otp & Document;

@Schema({ timestamps: true })
export class Otp {
  @Prop({ required: true, index: true })
  identifier: string; // email or phone

  @Prop({ required: true })
  codeHash: string; // argon2 hash of 6-digit code

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: 0 })
  attempts: number;

  @Prop({ default: false })
  consumed: boolean;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

// Index to automatically delete expired OTPs
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for efficient lookups
OtpSchema.index({ identifier: 1, consumed: 1 });
