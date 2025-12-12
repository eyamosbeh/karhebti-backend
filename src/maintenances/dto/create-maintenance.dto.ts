import { IsString, IsNumber, IsMongoId, IsEnum, IsDateString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMaintenanceDto {
  @ApiProperty({ example: 'Vidange moteur' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Changer huile et filtre' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: ['maintenance', 'urgent'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ enum: ['planned', 'done'], example: 'planned' })
  @IsOptional()
  @IsEnum(['planned', 'done'])
  status?: string;

  @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
  @IsDateString()
  dueAt: Date;

  @ApiPropertyOptional({ example: 45000 })
  @IsOptional()
  @IsNumber()
  mileage?: number;

  @ApiProperty({ enum: ['vidange', 'révision', 'réparation'], example: 'vidange' })
  @IsEnum(['vidange', 'révision', 'réparation'])
  type: string;

  @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
  @IsDateString()
  date: Date;

  @ApiProperty({ example: 150.50 })
  @IsNumber()
  cout: number;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  garage: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  @IsMongoId()
  voiture: string;
}
