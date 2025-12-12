import { IsString, IsEnum, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RespondSwipeDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  swipeId: string;

  @ApiProperty({ example: 'accepted', enum: ['accepted', 'declined'] })
  @IsEnum(['accepted', 'declined'])
  response: string;
}
