import {
  IsString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsMongoId,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReclamationDto {
  @ApiProperty({
    description: 'Type of reclamation',
    enum: ['service', 'garage'],
    example: 'service',
  })
  @IsEnum(['service', 'garage'])
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description: 'Title of the reclamation',
    example: 'Delayed service',
  })
  @IsString()
  @IsNotEmpty()
  titre: string;

  @ApiProperty({
    description: 'Detailed message of the problem or complaint',
    example: 'The service took too long to complete.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description: 'ID of the garage concerned (MongoDB ObjectId)',
    example: '673e13b9588fb8d58d9b0f17',
  })
  @IsMongoId()
  @IsOptional()
  garage?: string;

  @ApiPropertyOptional({
    description: 'ID of the service concerned (MongoDB ObjectId)',
    example: '673e1405588fb8d58d9b0f19',
  })
  @IsMongoId()
  @IsOptional()
  service?: string;
}
