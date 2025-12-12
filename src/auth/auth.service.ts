import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import * as admin from 'firebase-admin';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Otp, OtpDocument } from './schemas/otp.schema';
import { PendingSignup, PendingSignupDocument } from './schemas/pending-signup.schema';
import { EmailService } from '../common/services/email.service';
import { 
  LoginDto, 
  SignupDto, 
  ForgotPasswordDto, 
  VerifyOtpDto, 
  ResetPasswordDto, 
  ChangePasswordDto,
  SendOtpDto,
  VerifyOtpLoginDto,
  SendEmailVerificationDto,
  VerifyEmailDto,
  VerifySignupOtpDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Otp.name) private otpModel: Model<OtpDocument>,
    @InjectModel(PendingSignup.name) private pendingSignupModel: Model<PendingSignupDocument>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async changePassword(changePasswordDto: ChangePasswordDto) {
    // changePasswordDto: { userId, currentPassword, nouveauMotDePasse }
    const { userId, currentPassword, nouveauMotDePasse } = changePasswordDto;
    if (!nouveauMotDePasse || nouveauMotDePasse.length < 6) {
      return { message: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' };
    }
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }
    const isCurrentValid = await bcrypt.compare(currentPassword, user.motDePasse);
    if (!isCurrentValid) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }
    user.motDePasse = await bcrypt.hash(nouveauMotDePasse, 10);
    await user.save();
    return { message: 'Mot de passe changé avec succès' };
  }

  async signup(signupDto: SignupDto) {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email: signupDto.email });
    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(signupDto.motDePasse, 10);
    
    // Generate 6-digit OTP code
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpHash = await argon2.hash(otpCode);
    
    // Set expiry time (10 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Delete any existing pending signup for this email
    await this.pendingSignupModel.deleteMany({ email: signupDto.email });

    // Store pending signup data
    await this.pendingSignupModel.create({
      nom: signupDto.nom,
      prenom: signupDto.prenom,
      email: signupDto.email,
      motDePasseHash: hashedPassword,
      telephone: signupDto.telephone,
      otpHash,
      expiresAt,
      attempts: 0,
    });

    // Send OTP email
    const sent = await this.emailService.sendVerificationCode(signupDto.email, otpCode);
    
    return {
      message: sent 
        ? 'OTP code sent to your email. Please verify to complete signup.' 
        : 'OTP code generated. Please verify to complete signup.',
      email: signupDto.email,
      // Return code in response when email is not configured or in development
      ...(!sent && { otpCode }),
      ...(process.env.NODE_ENV === 'development' && sent && { otpCode }),
    };
  }

  async verifySignupOtp(verifySignupOtpDto: VerifySignupOtpDto) {
    const { email, code } = verifySignupOtpDto;

    // Find pending signup
    const pendingSignup = await this.pendingSignupModel.findOne({ email });
    if (!pendingSignup) {
      throw new NotFoundException('No pending signup found for this email. Please sign up first.');
    }

    // Check if OTP has expired
    if (new Date() > pendingSignup.expiresAt) {
      await this.pendingSignupModel.deleteOne({ email });
      throw new UnauthorizedException('OTP has expired. Please sign up again.');
    }

    // Check attempts limit
    if (pendingSignup.attempts >= 5) {
      await this.pendingSignupModel.deleteOne({ email });
      throw new UnauthorizedException('Too many failed attempts. Please sign up again.');
    }

    // Verify OTP using constant-time comparison
    const isValid = await argon2.verify(pendingSignup.otpHash, code);
    
    if (!isValid) {
      pendingSignup.attempts += 1;
      await pendingSignup.save();
      throw new UnauthorizedException(`Invalid OTP code. ${5 - pendingSignup.attempts} attempts remaining.`);
    }

    // OTP is valid - create the user account
    const user = new this.userModel({
      nom: pendingSignup.nom,
      prenom: pendingSignup.prenom,
      email: pendingSignup.email,
      motDePasse: pendingSignup.motDePasseHash,
      telephone: pendingSignup.telephone,
      role: 'utilisateur',
      emailVerified: true, // Email is verified via OTP
    });

    await user.save();

    // Delete pending signup
    await this.pendingSignupModel.deleteOne({ email });

    // Generate JWT token
    const payload = { 
      email: user.email, 
      sub: user._id, 
      role: user.role,
      emailVerified: true,
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        emailVerified: true,
      },
      message: 'Account created successfully!',
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userModel.findOne({ email: loginDto.email });
    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.motDePasse, user.motDePasse);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const payload = { email: user.email, sub: user._id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
      },
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    
    // Find user by email
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('Email not found');
    }

    // Generate random 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Hash OTP with argon2
    const codeHash = await argon2.hash(otp);

    // Set expiry time (10 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Delete any existing OTPs for this identifier
    await this.otpModel.deleteMany({ identifier: email });

    // Store hashed OTP in database
    await this.otpModel.create({
      identifier: email,
      codeHash,
      expiresAt,
      attempts: 0,
      consumed: false,
    });

    // Send OTP via email
    const sent = await this.emailService.sendPasswordResetOTP(email, otp);

    return { 
      message: sent 
        ? 'OTP code has been sent to your email' 
        : 'OTP code generated (email not configured - check response)',
      // Return OTP in response when email is not configured or in development
      ...(!sent && { otp }),
      ...(process.env.NODE_ENV === 'development' && sent && { otp }),
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { email, otp } = verifyOtpDto;

    if (!otp) {
      throw new BadRequestException('OTP required');
    }

    // Find user by email
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('Email not found');
    }

    // Find OTP record for identifier
    const otpRecord = await this.otpModel.findOne({ 
      identifier: email,
      consumed: false,
    });
    if (!otpRecord) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Check if OTP has expired
    if (new Date() > otpRecord.expiresAt) {
      await this.otpModel.deleteOne({ _id: otpRecord._id });
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Verify OTP matches hash using constant-time comparison
    const isOtpValid = await argon2.verify(otpRecord.codeHash, otp);
    if (!isOtpValid) {
      // Increment attempts
      otpRecord.attempts += 1;
      if (otpRecord.attempts >= 5) {
        await this.otpModel.deleteOne({ _id: otpRecord._id });
        throw new UnauthorizedException('Too many failed attempts. Please request a new OTP.');
      }
      await otpRecord.save();
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    return { 
      message: 'OTP verified successfully',
      verified: true,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, otp, newPassword } = resetPasswordDto;

    if (!otp) {
      throw new BadRequestException('OTP required');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters');
    }

    // Find user by email
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('Email not found');
    }

    // Find OTP record
    const otpRecord = await this.otpModel.findOne({ 
      identifier: email,
      consumed: false,
    });
    if (!otpRecord) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Check if OTP has expired
    if (new Date() > otpRecord.expiresAt) {
      await this.otpModel.deleteOne({ _id: otpRecord._id });
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Verify OTP matches hash using constant-time comparison
    const isOtpValid = await argon2.verify(otpRecord.codeHash, otp);
    if (!isOtpValid) {
      otpRecord.attempts += 1;
      if (otpRecord.attempts >= 5) {
        await this.otpModel.deleteOne({ _id: otpRecord._id });
        throw new UnauthorizedException('Too many failed attempts. Please request a new OTP.');
      }
      await otpRecord.save();
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    user.motDePasse = hashedPassword;
    await user.save();

    // Mark OTP as consumed
    otpRecord.consumed = true;
    await otpRecord.save();

    return { 
      message: 'Password reset successfully',
    };
  }

  async validateUser(payload: any): Promise<any> {
    console.log('=== AUTH SERVICE VALIDATE USER ===');
    console.log('🔍 Looking up user with ID:', payload.sub);
    
    try {
      const user = await this.userModel.findById(payload.sub);
      
      if (!user) {
        console.error('❌ User not found in database');
        console.error('🔍 Searched for ID:', payload.sub);
        return null;
      }
      
      console.log('✅ User found in database');
      console.log('📧 User email:', user.email);
      console.log('👔 User role:', user.role);
      
      const validatedUser = {
        userId: (user._id as any).toString(),
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified || false,
      };
      
      console.log('✅ Returning validated user:', JSON.stringify(validatedUser, null, 2));
      return validatedUser;
    } catch (error) {
      console.error('❌ Error in validateUser():', error.message);
      console.error('📚 Stack trace:', error.stack);
      throw error;
    }
  }

  // OTP Login - Send 6-digit code
  async sendOtpLogin(sendOtpDto: SendOtpDto) {
    const { identifier } = sendOtpDto;
    
    // Check if user exists
    const user = await this.userModel.findOne({ email: identifier });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();
    const codeHash = await argon2.hash(code);

    // Set expiry time (10 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Delete any existing OTPs for this identifier
    await this.otpModel.deleteMany({ identifier });

    // Store hashed OTP
    await this.otpModel.create({
      identifier,
      codeHash,
      expiresAt,
      attempts: 0,
      consumed: false,
    });

    // Send OTP via email
    const sent = await this.emailService.sendOTP(identifier, code);

    return {
      ok: true,
      message: sent ? 'OTP sent successfully' : 'OTP generated',
      ...(!sent && { code }),
      ...(process.env.NODE_ENV === 'development' && sent && { code }),
    };
  }

  // OTP Login - Verify code and issue JWT
  async verifyOtpLogin(verifyOtpDto: VerifyOtpLoginDto) {
    const { identifier, code } = verifyOtpDto;

    // Find OTP record
    const otpRecord = await this.otpModel.findOne({ 
      identifier,
      consumed: false,
    });
    
    if (!otpRecord) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Check if expired
    if (new Date() > otpRecord.expiresAt) {
      await this.otpModel.deleteOne({ _id: otpRecord._id });
      throw new UnauthorizedException('OTP has expired');
    }

    // Check attempts limit
    if (otpRecord.attempts >= 5) {
      await this.otpModel.deleteOne({ _id: otpRecord._id });
      throw new UnauthorizedException('Too many failed attempts');
    }

    // Verify code using constant-time comparison
    const isValid = await argon2.verify(otpRecord.codeHash, code);
    
    if (!isValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      throw new UnauthorizedException('Invalid OTP code');
    }

    // Mark as consumed
    otpRecord.consumed = true;
    await otpRecord.save();

    // Find user and issue JWT
    const user = await this.userModel.findOne({ email: identifier });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload = { 
      email: user.email, 
      sub: user._id, 
      role: user.role,
      emailVerified: user.emailVerified || false,
    };
    
    return {
      token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        emailVerified: user.emailVerified || false,
      },
    };
  }

  // Email Verification - Send code
  async sendEmailVerification(dto: SendEmailVerificationDto) {
    const { email } = dto;

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Generate 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();
    const codeHash = await argon2.hash(code);

    // Set expiry time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Update user with new verification code
    user.emailVerification = {
      codeHash,
      expiresAt,
      attempts: 0,
    };
    await user.save();

    // Send verification email
    const sent = await this.emailService.sendVerificationCode(email, code);

    return {
      ok: true,
      message: sent ? 'Verification code sent' : 'Verification code generated',
      ...(!sent && { code }),
      ...(process.env.NODE_ENV === 'development' && sent && { code }),
    };
  }

  // Email Verification - Verify code
  async verifyEmail(dto: VerifyEmailDto) {
    const { email, code } = dto;

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    if (!user.emailVerification || !user.emailVerification.codeHash) {
      throw new BadRequestException('No verification code found. Please request a new one.');
    }

    // Check if expired
    if (new Date() > user.emailVerification.expiresAt) {
      user.emailVerification = undefined;
      await user.save();
      throw new UnauthorizedException('Verification code has expired');
    }

    // Check attempts limit
    if (user.emailVerification.attempts >= 10) {
      user.emailVerification = undefined;
      await user.save();
      throw new UnauthorizedException('Too many failed attempts. Please request a new code.');
    }

    // Verify code using constant-time comparison
    const isValid = await argon2.verify(user.emailVerification.codeHash, code);
    
    if (!isValid) {
      user.emailVerification.attempts += 1;
      await user.save();
      throw new UnauthorizedException('Invalid verification code');
    }

    // Mark email as verified and clear verification data
    user.emailVerified = true;
    user.emailVerification = undefined;
    await user.save();

    return {
      ok: true,
      message: 'Email verified successfully',
    };
  }
}
