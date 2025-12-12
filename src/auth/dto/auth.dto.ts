import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'user-id-here' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'CurrentPassword123!' })
  @IsString()
  @MinLength(6)
  currentPassword: string;

  @ApiProperty({ example: 'NewPassword123!' })
  @IsString()
  @MinLength(6)
  nouveauMotDePasse: string;
}

export class LoginDto {
  @ApiProperty({ example: 'jean.dupont@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(6)
  motDePasse: string;
}

export class SignupDto {
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

  @ApiProperty({ example: '0612345678' })
  @IsString()
  telephone: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'jean.dupont@example.com' })
  @IsEmail()
  email: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: 'jean.dupont@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  otp: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'jean.dupont@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  otp: string;

  @ApiProperty({ example: 'NewPassword123!' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class SendOtpDto {
  @ApiProperty({ example: 'jean.dupont@example.com', description: 'Email or phone number' })
  @IsString()
  identifier: string;
}

export class VerifyOtpLoginDto {
  @ApiProperty({ example: 'jean.dupont@example.com', description: 'Email or phone number' })
  @IsString()
  identifier: string;

  @ApiProperty({ example: '123456', description: '6-digit code' })
  @IsString()
  @MinLength(6)
  code: string;
}

export class SendEmailVerificationDto {
  @ApiProperty({ example: 'jean.dupont@example.com' })
  @IsEmail()
  email: string;
}

export class VerifyEmailDto {
  @ApiProperty({ example: 'jean.dupont@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', description: '6-digit verification code' })
  @IsString()
  @MinLength(6)
  code: string;
}

export class VerifySignupOtpDto {
  @ApiProperty({ example: 'jean.dupont@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP code' })
  @IsString()
  @MinLength(6)
  code: string;
}
