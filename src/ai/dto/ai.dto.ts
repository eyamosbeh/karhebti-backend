import { IsNumber, IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReportRoadIssueDto {
  @ApiProperty({ example: 48.8566 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 2.3522 })
  @IsNumber()
  longitude: number;

  @ApiProperty({ example: 'nid de poule' })
  @IsString()
  typeAnomalie: string;

  @ApiPropertyOptional({ example: 'Grande zone dangereuse' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class DangerZoneQueryDto {
  @ApiPropertyOptional({ example: 48.8566 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 2.3522 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 10, description: 'Rayon en km' })
  @IsOptional()
  @IsNumber()
  rayon?: number;
}

export class MaintenanceRecommendationDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  @IsString()
  voitureId: string;
}

export class GarageRecommendationDto {
  @ApiPropertyOptional({ example: 'vidange' })
  @IsOptional()
  @IsString()
  typePanne?: string;

  @ApiPropertyOptional({ example: 48.8566 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 2.3522 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 5, description: 'Rayon en km' })
  @IsOptional()
  @IsNumber()
  rayon?: number;
}
