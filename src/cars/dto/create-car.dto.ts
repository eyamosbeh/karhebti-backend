
import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCarDto {
  @ApiProperty({ example: 'Peugeot' })
  @IsString()
  marque: string;

  @ApiProperty({ example: '208' })
  @IsString()
  modele: string;

  @ApiProperty({ example: 2020 })
  @IsNumber()
  annee: number;

  @ApiProperty({ example: 'AB-123-CD' })
  @IsString()
  immatriculation: string;

  @ApiProperty({ example: 'Essence' })
  @IsString()
  typeCarburant: string;

  @ApiProperty({ example: 'http://example.com/image.jpg', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string; // URL or path to the uploaded car image

  // Marketplace fields
  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  forSale?: boolean;

  @ApiProperty({ example: 'available', enum: ['available', 'sold', 'not-listed'], required: false })
  @IsOptional()
  @IsEnum(['available', 'sold', 'not-listed'])
  saleStatus?: string;

  @ApiProperty({ example: 15000, required: false })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({ example: 'Well maintained car, single owner', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: ['http://example.com/1.jpg', 'http://example.com/2.jpg'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
