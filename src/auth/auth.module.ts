import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Otp, OtpSchema } from './schemas/otp.schema';
import { PendingSignup, PendingSignupSchema } from './schemas/pending-signup.schema';
import { EmailService } from '../common/services/email.service';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Otp.name, schema: OtpSchema },
      { name: PendingSignup.name, schema: PendingSignupSchema },
    ]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'karhebti-jwt-super-secret-key-2024',
      signOptions: { expiresIn: '24h' },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 3600000, // 1 hour in milliseconds
        limit: 5, // 5 requests per hour for OTP/email
      },
    ]),
    FirebaseModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, EmailService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
