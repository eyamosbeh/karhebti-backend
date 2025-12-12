import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RoadIssueDocument = RoadIssue & Document;

@Schema({ timestamps: true })
export class RoadIssue {
  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;

  @Prop({ required: true })
  typeAnomalie: string;

  @Prop()
  description: string;

  @Prop({ default: 1 })
  signalements: number;
}

export const RoadIssueSchema = SchemaFactory.createForClass(RoadIssue);
