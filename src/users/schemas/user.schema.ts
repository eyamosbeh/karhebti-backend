import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  nom: string;

  @Prop({ required: true })
  prenom: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  motDePasse: string;

  @Prop()
  telephone: string;

  @Prop({ required: true, enum: ['admin', 'utilisateur', 'propGarage'], default: 'utilisateur' })
  role: string;

  @Prop()
  propGarage: string;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop({
    type: {
      codeHash: { type: String },
      expiresAt: { type: Date },
      attempts: { type: Number, default: 0 },
    },
    _id: false,
  })
  emailVerification?: {
    codeHash: string;
    expiresAt: Date;
    attempts: number;
  };

  @Prop()
  deviceToken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
