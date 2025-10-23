/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '../types/user.types';
import { UsersService } from '../users/users.service';

import { LoginDto, RegisterDto, ForgotPasswordDto } from './dto';
import { JwtPayload, JwtRefreshPayload } from './interfaces';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly usersService: UsersService
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.is_email_verified) {
      throw new UnauthorizedException('Email not verified');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.usersService.sanitizeUser(user),
      ...tokens,
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: registerDto.email }, { username: registerDto.username }],
      },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);
    const verificationToken = this.generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        firstname: registerDto.firstname,
        lastname: registerDto.lastname,
        username: registerDto.username,
        gender: registerDto.gender,
        phone: registerDto.phone || null,
        birthdate: registerDto.birthdate
          ? new Date(registerDto.birthdate.toString() + 'T00:00:00.000Z')
          : null,
        email_verification_token: verificationToken,
        email_verification_expires: expiresAt,
      },
    });

    // Send verification email
    await this.emailService.sendVerificationEmail(user.email, user.id, verificationToken);

    return {
      message: 'User registered successfully. Please check your email to verify your account.',
      user: this.usersService.sanitizeUser(user),
    };
  }

  async refreshToken(refreshTokenDto: { refreshToken: string }) {
    try {
      const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub, refresh_token_hash: refreshTokenDto.refreshToken },
      });

      if (!user) {
        throw new ForbiddenException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user);
      await this.updateRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch {
      throw new ForbiddenException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    await this.updateRefreshToken(userId, null);
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: forgotPasswordDto.email },
    });

    if (user) {
      const resetToken = this.generatePasswordResetToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          password_reset_token: resetToken,
          password_reset_expires: expiresAt,
        },
      });

      await this.emailService.sendPasswordResetEmail(user.email, resetToken);
    }

    // Always return success to prevent email enumeration
    return {
      message:
        'Si un compte existe avec cette adresse email, un lien de réinitialisation de mot de passe a été envoyé.',
    };
  }

  async resetPassword(resetPasswordDto: { token: string; newPassword: string }) {
    const user = await this.prisma.user.findUnique({
      where: {
        password_reset_token: resetPasswordDto.token,
        password_reset_expires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        password_reset_token: null,
        password_reset_expires: null,
      },
    });

    return { message: 'Mot de passe réinitialisé avec succès' };
  }

  async verifyEmail(userId: string, token: string) {
    // Vérifier d'abord si l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    // Si l'email est déjà vérifié, retourner un message de succès
    if (user.is_email_verified) {
      return { message: "L'email à bien été vérifié avec succès" };
    }

    // Vérifier si le token correspond et n'est pas expiré
    if (
      !user.email_verification_token ||
      user.email_verification_token !== token ||
      !user.email_verification_expires ||
      user.email_verification_expires <= new Date()
    ) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        is_email_verified: true,
        status: 'active',
        email_verification_token: null,
        email_verification_expires: null,
      },
    });

    // Envoyer l'email de bienvenue après vérification
    await this.emailService.sendWelcomeEmail(user.email, user.firstname);

    return { message: 'Email vérifié avec succès' };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Pour des raisons de sécurité, on ne révèle pas si l'email existe
      return {
        message:
          "Si un compte existe avec cette adresse email et n'est pas encore vérifié, un email de vérification a été envoyé.",
      };
    }

    if (user.is_email_verified) {
      // Le compte est déjà vérifié
      return {
        message: 'Ce compte est déjà vérifié. Vous pouvez vous connecter directement.',
        alreadyVerified: true,
      };
    }

    // Le compte existe mais n'est pas vérifié
    const verificationToken = this.generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        email_verification_token: verificationToken,
        email_verification_expires: expiresAt,
      },
    });

    await this.emailService.sendVerificationEmail(user.email, user.id, verificationToken);

    return {
      message:
        'Un nouvel email de vérification a été envoyé. Vérifiez votre boîte de réception et vos spams.',
      emailSent: true,
    };
  }

  private async generateTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    const refreshPayload: JwtRefreshPayload = {
      sub: user.id,
      email: user.email,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private generatePasswordResetToken(): string {
    const token =
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    return token;
  }

  private generateVerificationToken(): string {
    const token =
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    return token;
  }

  private async updateRefreshToken(userId: string, refreshToken: string | null) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refresh_token_hash: refreshToken },
    });
  }
}
