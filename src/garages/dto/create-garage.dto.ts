import { IsString, IsNumber, Min, Max, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGarageDto {
  @ApiProperty({ description: 'Nom du garage', example: 'Garage Central' })
  @IsString()
  nom: string;

  @ApiProperty({ description: 'Adresse du garage', example: '123 rue de Paris' })
  @IsString()
  adresse: string;

  @ApiProperty({ description: 'Téléphone du garage', example: '0145678901' })
  @IsString()
  telephone: string;

  @ApiProperty({ description: 'Note utilisateur (0 à 5)', example: 4.5, minimum: 0, maximum: 5 })
  @IsNumber()
  @Min(0)
  @Max(5)
  noteUtilisateur: number;

  @ApiProperty({ description: 'Heure d\'ouverture (HH:mm)', example: '08:00' })
  @IsString()
  @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)
  heureOuverture: string;

  @ApiProperty({ description: 'Heure de fermeture (HH:mm)', example: '18:00' })
  @IsString()
  @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)
  heureFermeture: string;

  @ApiProperty({ description: 'Latitude', example: 48.8566, required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ description: 'Longitude', example: 2.3522, required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;

    // ✅ NOUVEAU: Nombre de créneaux
    @IsOptional()
    @IsNumber()
    @Min(1)
    numberOfBays?: number;
}