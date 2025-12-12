import { IsString, IsNumber, IsMongoId, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePartDto {
  @ApiProperty({ example: 'Filtre à huile' })
  @IsString()
  nom: string;

  @ApiProperty({ example: 'Filtre' })
  @IsString()
  type: string;

  @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
  @IsDateString()
  dateInstallation: Date;

  @ApiProperty({ example: 15000 })
  @IsNumber()
  kilometrageRecommande: number;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  @IsMongoId()
  voiture: string;
}
