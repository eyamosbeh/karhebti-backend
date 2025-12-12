import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CarDocument = Car & Document;

@Schema({ timestamps: true })
export class Car {
  @Prop({ required: true })
  marque: string;
  //

  @Prop({ required: true })
  modele: string;

  @Prop({ required: true })
  annee: number;

  @Prop({ required: true })
  immatriculation: string;

  @Prop({ required: true })
  typeCarburant: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: MongooseSchema.Types.ObjectId;

  @Prop()
  imageUrl?: string;

  @Prop({
    type: {
      width: { type: Number },
      height: { type: Number },
      format: { type: String },
      size: { type: Number },
    },
    _id: false,
  })
  imageMeta?: {
    width: number;
    height: number;
    format: string;
    size: number;
  };

  // Marketplace fields
  @Prop({ default: false })
  forSale: boolean;

  @Prop({ enum: ['available', 'sold', 'not-listed'], default: 'not-listed' })
  saleStatus: string;

  @Prop()
  price?: number;

  @Prop()
  description?: string;

  @Prop({ type: [String], default: [] })
  images?: string[];
}

export const CarSchema = SchemaFactory.createForClass(Car);
