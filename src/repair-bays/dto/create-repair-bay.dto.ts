import { IsString, IsNumber, IsBoolean, IsOptional, Matches, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRepairBayDto {
  @ApiProperty({ description: 'ID du garage', example: '507f1f77bcf86cd799439011' })
  @IsString()
  garageId: string;

  @ApiProperty({ description: 'Numéro du créneau', example: 1, minimum: 1 })
  @IsNumber()
  @Min(1)
  bayNumber: number;

  @ApiProperty({ description: 'Nom du créneau', example: 'Créneau 1' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Heure d\'ouverture (HH:mm)', example: '08:00' })
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Format horaire invalide (HH:MM)',
  })
  heureOuverture: string;

  @ApiProperty({ description: 'Heure de fermeture (HH:mm)', example: '18:00' })
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Format horaire invalide (HH:MM)',
  })
  heureFermeture: string;

  @ApiProperty({ description: 'État actif/inactif', example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
