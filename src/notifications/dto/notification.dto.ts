import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
  NotificationType,
} from '../schemas/notification.schema';

export class SendNotificationDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @IsNotEmpty()
  @IsString()
  titre: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  deviceToken?: string;

  @IsOptional()
  documentId?: string;

  @IsOptional()
  maintenanceId?: string;

  @IsOptional()
  data?: Record<string, any>;
}

export class UpdateDeviceTokenDto {
  @IsNotEmpty()
  @IsString()
  deviceToken: string;
}

export class MarkAsReadDto {
  @IsNotEmpty()
  @IsString()
  notificationId: string;
}
