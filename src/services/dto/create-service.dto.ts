import { IsString, IsNumber, IsMongoId, IsEnum, Min, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const SERVICE_TYPES = [
  'vidange',
  'contrôle technique', 
  'réparation pneu',
  'changement pneu',
  'freinage',
  'batterie',
  'climatisation',
  'échappement',
  'révision complète',
  'diagnostic électronique',
  'carrosserie',
  'peinture',
  'pare-brise',
  'suspension',
  'embrayage',
  'transmission',
  'injection',
  'refroidissement',
  'démarrage',
  'lavage auto',
  'équilibrage roues',
  'parallélisme',
  'système électrique',
  'filtre à air',
  'filtre à huile',
  'plaquettes de frein'
] as const;

export type ServiceType = typeof SERVICE_TYPES[number];

export class CreateServiceDto {
  @ApiProperty({ 
    description: 'Type de service', 
    example: 'vidange', 
    enum: SERVICE_TYPES 
  })
  @IsEnum(SERVICE_TYPES)
  type: ServiceType;

  @ApiProperty({ description: 'Coût moyen du service', example: 60, minimum: 0 })
  @IsNumber()
  @Min(0)
  coutMoyen: number;

  @ApiProperty({ description: 'Durée estimée du service (minutes)', example: 30, minimum: 1 })
  @IsNumber()
  @Min(1)
  dureeEstimee: number;

  @ApiProperty({ description: 'ID du garage associé', example: '606cda9b1234567890123456' })
  @IsMongoId()
  garage: string;
}
