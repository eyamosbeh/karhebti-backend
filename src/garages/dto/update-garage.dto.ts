import { IsString, IsNumber, Min, Max, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateGarageDto {
  @ApiProperty({ description: 'Nom du garage', required: false })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiProperty({ description: 'Adresse du garage', required: false })
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiProperty({ description: 'Téléphone du garage', required: false })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiProperty({ description: 'Note utilisateur (0 à 5)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  noteUtilisateur?: number;

  @ApiProperty({ description: 'Heure d\'ouverture (HH:mm)', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)
  heureOuverture?: string;

  @ApiProperty({ description: 'Heure de fermeture (HH:mm)', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)
  heureFermeture?: string;

  @ApiProperty({ description: 'Latitude', required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ description: 'Longitude', required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  // ✅ NOUVEAU
  @ApiProperty({ description: 'Nombre de créneaux de réparation', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  numberOfBays?: number;
}
