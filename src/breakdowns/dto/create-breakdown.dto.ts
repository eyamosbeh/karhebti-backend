
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BreakdownType } from '../schemas/breakdown.schema';

export class CreateBreakdownDto {
  @ApiProperty({ description: "ID de l'utilisateur (ObjectId MongoDB)", example: '507f1f77bcf86cd799439011' })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiPropertyOptional({ description: "ID du véhicule (ObjectId MongoDB)", example: '507f1f77bcf86cd799439012' })
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @ApiProperty({ enum: BreakdownType, description: 'Type de panne', example: BreakdownType.PNEU })
  @IsNotEmpty()
  @IsEnum(BreakdownType)
  type: BreakdownType;

  @ApiPropertyOptional({ description: 'Description détaillée', example: "Pneu crevé sur l'autoroute A1" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Latitude GPS', example: 36.8065 })
  @IsNotEmpty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ description: 'Longitude GPS', example: 10.1815 })
  @IsNotEmpty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({ description: 'Photo (URL ou base64)', example: 'https://storage.example.com/photos/123.jpg' })
  @IsOptional()
  @IsString()
  photo?: string;
}
