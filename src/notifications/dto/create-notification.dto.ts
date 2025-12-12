import { IsString, IsObject, IsOptional, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  userId: string;

  @ApiProperty({ example: 'swipe_right' })
  @IsString()
  type: string;

  @ApiProperty({ example: 'New Interest in Your Car' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'John Doe wants to buy your Peugeot 208' })
  @IsString()
  message: string;

  @ApiProperty({ example: { carId: '507f1f77bcf86cd799439011' }, required: false })
  @IsOptional()
  @IsObject()
  data?: any;

  @ApiProperty({ example: '507f1f77bcf86cd799439011', required: false })
  @IsOptional()
  @IsMongoId()
  fromUserId?: string;
}
