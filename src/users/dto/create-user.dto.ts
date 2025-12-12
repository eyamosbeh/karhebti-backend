import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'Dupont' })
  @IsString()
  nom: string;

  @ApiProperty({ example: 'Jean' })
  @IsString()
  prenom: string;

  @ApiProperty({ example: 'jean.dupont@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!', minLength: 6 })
  @IsString()
  @MinLength(6)
  motDePasse: string;

  @ApiPropertyOptional({ example: '0612345678' })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiPropertyOptional({ enum: ['admin', 'utilisateur'], example: 'utilisateur' })
  @IsOptional()
  @IsEnum(['admin', 'utilisateur'])
  role?: string;
}
