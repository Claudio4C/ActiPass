import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';

import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let emailService: EmailService;
  let usersService: UsersService;

  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
    password: 'hashedPassword',
    firstname: 'John',
    lastname: 'Doe',
    username: 'johndoe',
    gender: 'male' as const,
    is_email_verified: true,
    status: 'active' as const,
    phone: null,
    birthdate: null,
    avatar_url: null,
    last_login_at: null,
    refresh_token: null,
    password_reset_token: null,
    password_reset_expires: null,
    email_verification_token: null,
    email_verification_expires: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockEmailService = {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  };

  const mockUsersService = {
    sanitizeUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    emailService = module.get<EmailService>(EmailService);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should validate user with correct credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.validateUser(email, password);

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email, deleted_at: null },
      });
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.validateUser('nonexistent@example.com', 'password')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException for unverified email', async () => {
      const unverifiedUser = { ...mockUser, is_email_verified: false };
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(unverifiedUser);

      await expect(service.validateUser('test@example.com', 'password')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const inactiveUser = { ...mockUser, status: 'suspended' as const };
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(inactiveUser);

      await expect(service.validateUser('test@example.com', 'password')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.validateUser('test@example.com', 'wrongpassword')).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginDto = { email: 'test@example.com', password: 'password123' };
      const tokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };
      const sanitizedUser = { ...mockUser, password: undefined };

      jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser);
      jest.spyOn(service as any, 'generateTokens').mockResolvedValue(tokens);
      jest.spyOn(service as any, 'updateRefreshToken').mockResolvedValue(undefined);
      jest.spyOn(usersService, 'sanitizeUser').mockReturnValue(sanitizedUser);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        user: sanitizedUser,
        ...tokens,
      });
    });
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      const registerDto = {
        email: 'new@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        firstname: 'Jane',
        lastname: 'Doe',
        username: 'janedoe',
        gender: 'female' as const,
      };

      const newUser = { ...mockUser, email: 'new@example.com', username: 'janedoe' };
      const sanitizedUser = { ...newUser, password: undefined };

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);
      jest.spyOn(prismaService.user, 'create').mockResolvedValue(newUser);
      jest.spyOn(emailService, 'sendVerificationEmail').mockResolvedValue(undefined);
      jest.spyOn(usersService, 'sanitizeUser').mockReturnValue(sanitizedUser);

      const result = await service.register(registerDto);

      expect(result.message).toContain('User registered successfully');
      expect(result.user).toEqual(sanitizedUser);
    });

    it('should throw BadRequestException for existing user', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        firstname: 'John',
        lastname: 'Doe',
        username: 'johndoe',
        gender: 'male' as const,
      };

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email for existing user', async () => {
      const forgotPasswordDto = { email: 'test@example.com' };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(service as any, 'generatePasswordResetToken').mockResolvedValue('reset-token');
      jest.spyOn(emailService, 'sendPasswordResetEmail').mockResolvedValue(undefined);

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result.message).toContain('password reset link has been sent');
    });

    it('should return success message even for non-existent user (security)', async () => {
      const forgotPasswordDto = { email: 'nonexistent@example.com' };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result.message).toContain('password reset link has been sent');
    });
  });
});
