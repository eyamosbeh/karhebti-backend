import { IsString, IsMongoId, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDocumentDto {
  @ApiProperty({ enum: ['assurance', 'carte grise', 'contrôle technique', 'vignette'], example: 'assurance' })
  @IsEnum(['assurance', 'carte grise', 'contrôle technique', 'vignette'])
  type: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @IsDateString()
  dateEmission: Date;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  @IsDateString()
  dateExpiration: Date;

  @ApiProperty({ example: 'https://storage.example.com/documents/assurance.pdf' })
  @IsString()
  fichier: string;

  @ApiProperty({ example: 'https://storage.example.com/documents/photo.jpg', required: false })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  @IsMongoId()
  voiture: string;
}
