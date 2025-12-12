import { 
    IsString, 
    IsISO8601, 
    IsNotEmpty, 
    IsOptional, 
    IsEmail, 
    IsIn, 
    IsMongoId, 
    Matches, 
    IsArray, 
    ArrayMinSize, 
    ArrayMaxSize 
  } from 'class-validator';
  import { ApiProperty } from '@nestjs/swagger';
  
  export const SERVICE_TYPES = [
    'vidange', 'contrôle technique', 'réparation pneu', 'changement pneu', 
    'freinage', 'batterie', 'climatisation', 'échappement', 
    'révision complète', 'diagnostic électronique', 'carrosserie', 
    'peinture', 'pare-brise', 'suspension', 'embrayage', 'transmission', 
    'injection', 'refroidissement', 'démarrage', 'lavage auto', 
    'équilibrage roues', 'parallélisme', 'système électrique', 
    'filtre à air', 'filtre à huile', 'plaquettes de frein'
  ];
  
  export class CreateReservationDto {
    @ApiProperty({ 
      description: 'User ID (ObjectId)', 
      required: false, 
      example: '606cda9b1234567890123456' 
    })
    @IsOptional()
    @IsMongoId()
    userId?: string;
  
    @ApiProperty({ 
      description: 'User email', 
      required: false, 
      example: 'user@example.com' 
    })
    @IsOptional()
    @IsEmail()
    email?: string;
  
    @ApiProperty({ 
      description: 'Garage ID', 
      example: '606cda9b1234567890123457' 
    })
    @IsMongoId()
    @IsNotEmpty()
    garageId: string;
  
    @ApiProperty({ 
      description: 'Date de réservation (ISO 8601)', 
      example: '2025-11-25' 
    })
    @IsISO8601()
    @IsNotEmpty()
    date: string;
  
    @ApiProperty({ description: 'Heure de début (HH:mm)', example: '09:00' })
    @IsString()
    @IsNotEmpty()
    @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)
    heureDebut: string;
  
    @ApiProperty({ description: 'Heure de fin (HH:mm)', example: '10:30' })
    @IsString()
    @IsNotEmpty()
    @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)
    heureFin: string;
  
    @ApiProperty({ 
      description: 'Services (optionnel)', 
      example: ['vidange'], 
      required: false 
    })
    @IsOptional()
    @IsArray()
    @ArrayMinSize(0)
    @ArrayMaxSize(5)
    @IsString({ each: true })
    @IsIn(SERVICE_TYPES, { each: true })
    services?: string[];
  
    @ApiProperty({ 
      description: 'Statut', 
      enum: ['en_attente', 'confirmé', 'annulé'], 
      required: false 
    })
    @IsOptional()
    @IsIn(['en_attente', 'confirmé', 'annulé'])
    status?: string;
  
    @ApiProperty({ 
      description: 'Commentaires', 
      required: false, 
      example: 'Vidange urgente' 
    })
    @IsOptional()
    @IsString()
    commentaires?: string;
  }
  