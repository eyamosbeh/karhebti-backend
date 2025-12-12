import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private emailEnabled: boolean = false;

  constructor() {
    this.initializeEmailService();
  }

  private initializeEmailService() {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpUser && smtpPass && smtpUser.includes('@')) {
      try {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: false,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });
        this.emailEnabled = true;
        console.log('✓ Email service initialized successfully');
      } catch (error) {
        console.warn('⚠ Email service initialization failed:', error.message);
        this.emailEnabled = false;
      }
    } else {
      console.warn('⚠ Email service disabled - SMTP credentials not configured');
      this.emailEnabled = false;
    }
  }

  isEnabled(): boolean {
    return this.emailEnabled;
  }

  async sendVerificationCode(email: string, code: string): Promise<boolean> {
    if (!this.emailEnabled || !this.transporter) {
      console.log(`⚠ Email disabled - Verification code for ${email}: ${code}`);
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"Karhebti Support" <noreply@karhebti.com>',
        to: email,
        subject: 'Email Verification Code',
        html: this.getVerificationEmailTemplate(code),
      });
      console.log(`✓ Verification email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('✗ Email sending failed:', error.message);
      return false;
    }
  }

  async sendOTP(identifier: string, code: string): Promise<boolean> {
    if (!this.emailEnabled || !this.transporter) {
      console.log(`⚠ Email disabled - OTP for ${identifier}: ${code}`);
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"Karhebti Support" <noreply@karhebti.com>',
        to: identifier,
        subject: 'Your Login Code',
        html: this.getOTPEmailTemplate(code),
      });
      console.log(`✓ OTP email sent to ${identifier}`);
      return true;
    } catch (error) {
      console.error('✗ Email sending failed:', error.message);
      return false;
    }
  }

  async sendPasswordResetOTP(email: string, code: string): Promise<boolean> {
    if (!this.emailEnabled || !this.transporter) {
      console.log(`⚠ Email disabled - Password reset OTP for ${email}: ${code}`);
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"Karhebti Support" <noreply@karhebti.com>',
        to: email,
        subject: 'Password Reset Code',
        html: this.getPasswordResetEmailTemplate(code),
      });
      console.log(`✓ Password reset email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('✗ Email sending failed:', error.message);
      return false;
    }
  }

  private getVerificationEmailTemplate(code: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .code { font-size: 32px; font-weight: bold; color: #4CAF50; text-align: center; padding: 20px; background: white; border-radius: 5px; margin: 20px 0; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Email Verification</h1>
          </div>
          <div class="content">
            <p>Thank you for signing up with Karhebti!</p>
            <p>Your email verification code is:</p>
            <div class="code">${code}</div>
            <p>This code will expire in 24 hours.</p>
            <p>If you didn't create an account with Karhebti, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Karhebti. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getOTPEmailTemplate(code: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .code { font-size: 32px; font-weight: bold; color: #2196F3; text-align: center; padding: 20px; background: white; border-radius: 5px; margin: 20px 0; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Login Verification</h1>
          </div>
          <div class="content">
            <p>You requested a one-time password to log in to your Karhebti account.</p>
            <p>Your login code is:</p>
            <div class="code">${code}</div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Karhebti. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPasswordResetEmailTemplate(code: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FF9800; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .code { font-size: 32px; font-weight: bold; color: #FF9800; text-align: center; padding: 20px; background: white; border-radius: 5px; margin: 20px 0; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset</h1>
          </div>
          <div class="content">
            <p>You requested to reset your Karhebti account password.</p>
            <p>Your password reset code is:</p>
            <div class="code">${code}</div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Karhebti. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
