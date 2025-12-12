import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
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

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @Throttle({ default: { ttl: 3600000, limit: 5 } }) // 5 requests per hour
  @ApiOperation({ 
    summary: 'Step 1: Request signup - sends OTP to email',
    description: 'Initiates signup process by sending a 6-digit OTP code to the provided email. The account is NOT created yet. You must verify the OTP using /auth/signup/verify to complete registration.'
  })
  @ApiResponse({ status: 201, description: 'OTP sent to email successfully' })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  @ApiResponse({ status: 429, description: 'Too many requests - Rate limit: 5 per hour' })
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('signup/verify')
  @ApiOperation({ 
    summary: 'Step 2: Verify OTP and complete signup',
    description: 'Verifies the OTP code sent to email and creates the user account. Returns JWT token for immediate login.'
  })
  @ApiResponse({ status: 201, description: 'Account created successfully, user logged in' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  @ApiResponse({ status: 404, description: 'No pending signup found' })
  async verifySignupOtp(@Body() verifySignupOtpDto: VerifySignupOtpDto) {
    return this.authService.verifySignupOtp(verifySignupOtpDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Connexion d\'un utilisateur' })
  @ApiResponse({ status: 200, description: 'Connexion réussie' })
  @ApiResponse({ status: 401, description: 'Identifiants invalides' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset - sends OTP code to email' })
  @ApiResponse({ status: 200, description: 'OTP code sent to email' })
  @ApiResponse({ status: 404, description: 'Email not found' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP code' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  @ApiResponse({ status: 404, description: 'Email not found' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with OTP code' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  @ApiResponse({ status: 404, description: 'Email not found' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

    @Post('change-password')
    @ApiOperation({ summary: 'Changement du mot de passe (utilisateur authentifié)' })
    @ApiResponse({ status: 200, description: 'Mot de passe changé avec succès' })
    @ApiResponse({ status: 400, description: 'Mot de passe actuel incorrect ou nouveau mot de passe trop court' })
    async changePassword(@Body() changePasswordDto: ChangePasswordDto) {
      return this.authService.changePassword(changePasswordDto);
    }

  // OTP Login Endpoints
  @Post('otp/send')
  @Throttle({ default: { ttl: 3600000, limit: 5 } }) // 5 requests per hour
  @ApiOperation({ summary: 'Send OTP code for login' })
  @ApiResponse({ status: 200, description: 'OTP code sent successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async sendOtpLogin(@Body() sendOtpDto: SendOtpDto) {
    return this.authService.sendOtpLogin(sendOtpDto);
  }

  @Post('otp/verify')
  @ApiOperation({ summary: 'Verify OTP code and login' })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT token and user data' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  async verifyOtpLogin(@Body() verifyOtpDto: VerifyOtpLoginDto) {
    return this.authService.verifyOtpLogin(verifyOtpDto);
  }

  // Email Verification Endpoints
  @Post('email/send')
  @Throttle({ default: { ttl: 3600000, limit: 5 } }) // 5 requests per hour
  @ApiOperation({ summary: 'Send or resend email verification code' })
  @ApiResponse({ status: 200, description: 'Verification code sent successfully' })
  @ApiResponse({ status: 400, description: 'Email already verified' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async sendEmailVerification(@Body() dto: SendEmailVerificationDto) {
    return this.authService.sendEmailVerification(dto);
  }

  @Post('email/verify')
  @ApiOperation({ summary: 'Verify email with 6-digit code' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired verification code' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }
}
