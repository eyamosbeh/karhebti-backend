import { IsString, IsEnum, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSwipeDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  carId: string;

  @ApiProperty({ example: 'right', enum: ['left', 'right'] })
  @IsEnum(['left', 'right'])
  direction: string;
}
