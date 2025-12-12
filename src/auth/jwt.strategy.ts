import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private authService: AuthService) {
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    console.log('🔐 JwtStrategy initialized');
    console.log('📝 JWT_SECRET (first 10 chars):', secret.substring(0, 10) + '...');
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
    this.logger.log(`JWT Secret configured: ${this.getSecretKey()?.substring(0, 10)}...`);
  }

  private getSecretKey() {
    return process.env.JWT_SECRET || 'karhebti-jwt-super-secret-key-2024';
  }

  async validate(payload: any) {
    console.log('=== JWT STRATEGY VALIDATE ===');
    console.log('📦 Payload received:', JSON.stringify(payload, null, 2));
    console.log('👤 User ID (sub):', payload.sub);
    console.log('📧 Email:', payload.email);
    console.log('👔 Role:', payload.role);
    
    try {
      const user = await this.authService.validateUser(payload);
      console.log('✅ User validated:', user ? 'SUCCESS' : 'FAILED');
      
      if (!user) {
        console.error('❌ validateUser returned null/undefined');
        throw new UnauthorizedException('User validation failed');
      }
      
      console.log('👥 Validated user object:', JSON.stringify(user, null, 2));
      return user;
    } catch (error) {
      console.error('❌ Error in validate():', error.message);
      console.error('📚 Stack trace:', error.stack);
      throw error;
    }
  }
}
