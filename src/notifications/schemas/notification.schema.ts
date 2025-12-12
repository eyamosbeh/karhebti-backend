import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  DOCUMENT_EXPIRATION = 'document_expiration',
  MAINTENANCE_REMINDER = 'maintenance_reminder',
  SERVICE_INFO = 'service_info',
  ALERT = 'alert',
  SWIPE_RIGHT = 'swipe_right',
  SWIPE_ACCEPTED = 'swipe_accepted',
  SWIPE_DECLINED = 'swipe_declined',
  NEW_MESSAGE = 'new_message',
  CUSTOM = 'custom',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  READ = 'read',
}

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  type: string; // Can be NotificationType enum values or custom strings

  @Prop({ required: true })
  title: string;

  @Prop()
  titre?: string; // French version for compatibility

  @Prop({ required: true })
  message: string;

  @Prop({ enum: NotificationStatus, default: NotificationStatus.PENDING })
  status: NotificationStatus;

  @Prop({ default: false })
  read: boolean; // Backward compatibility

  @Prop()
  deviceToken?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  fromUserId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Document' })
  documentId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Maintenance' })
  maintenanceId?: Types.ObjectId;

  @Prop({ type: Object })
  data?: Record<string, any>;

  @Prop()
  sentAt?: Date;

  @Prop()
  readAt?: Date;

  @Prop()
  errorMessage?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
