import { IsString, IsNumber, IsMongoId, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReplacementHistoryDto {
  @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
  @IsDateString()
  date: Date;

  @ApiProperty({ example: 45.99 })
  @IsNumber()
  cout: number;

  @ApiProperty({ example: 'AutoParts Inc.' })
  @IsString()
  fournisseur: string;

  @ApiPropertyOptional({ example: 'Pièce de qualité supérieure' })
  @IsOptional()
  @IsString()
  remarque?: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439013' })
  @IsMongoId()
  piece: string;
}
