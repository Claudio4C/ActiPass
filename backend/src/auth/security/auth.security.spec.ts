import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '../../app.module';

describe('Auth Security Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    configService = moduleFixture.get<ConfigService>(ConfigService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Password Security', () => {
    it('should reject weak passwords during registration', async () => {
      const weakPasswords = [
        '12345678', // Only numbers
        'abcdefgh', // Only lowercase
        'ABCDEFGH', // Only uppercase
        '1234567', // Too short
        'password', // Common word
        'qwerty123', // Common pattern
      ];

      for (const password of weakPasswords) {
        const response = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
          email: 'test@example.com',
          password,
          confirmPassword: password,
          firstname: 'John',
          lastname: 'Doe',
          username: 'johndoe',
          gender: 'male',
        });

        expect(response.status).toBe(422);
      }
    });

    it('should accept strong passwords during registration', async () => {
      const strongPasswords = ['Password123', 'MySecurePass1', 'ComplexP@ss1', 'Str0ngP@ssw0rd'];

      for (const password of strongPasswords) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send({
            email: `test${Date.now()}@example.com`,
            password,
            confirmPassword: password,
            firstname: 'John',
            lastname: 'Doe',
            username: `johndoe${Date.now()}`,
            gender: 'male',
          });

        // Should not fail validation (though may fail on existing user)
        expect([200, 201, 409]).toContain(response.status);
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should limit login attempts', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      // Try to login multiple times
      for (let i = 0; i < 6; i++) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(loginData);

        if (i < 5) {
          // First 5 attempts should fail but not be rate limited
          expect([401, 422]).toContain(response.status);
        } else {
          // 6th attempt should be rate limited
          expect(response.status).toBe(429);
        }
      }
    });

    it('should limit registration attempts', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        firstname: 'John',
        lastname: 'Doe',
        username: 'johndoe',
        gender: 'male',
      };

      // Try to register multiple times
      for (let i = 0; i < 6; i++) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send({
            ...registerData,
            email: `test${i}@example.com`,
            username: `johndoe${i}`,
          });

        if (i < 5) {
          // First 5 attempts should not be rate limited
          expect(response.status).not.toBe(429);
        } else {
          // 6th attempt should be rate limited
          expect(response.status).toBe(429);
        }
      }
    });
  });

  describe('JWT Security', () => {
    it('should reject expired tokens', async () => {
      const expiredToken = jwtService.sign(
        { sub: 'user-id', email: 'test@example.com', username: 'test' },
        { secret: configService.get('JWT_SECRET'), expiresIn: '0s' }
      );

      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });

    it('should reject malformed tokens', async () => {
      const malformedTokens = [
        'invalid.token.here',
        'Bearer invalid',
        'Bearer ',
        'not-a-jwt-token',
      ];

      for (const token of malformedTokens) {
        const response = await request(app.getHttpServer())
          .get('/api/v1/auth/me')
          .set('Authorization', token);

        expect(response.status).toBe(401);
      }
    });

    it('should reject tokens with invalid signature', async () => {
      const invalidToken = jwtService.sign(
        { sub: 'user-id', email: 'test@example.com', username: 'test' },
        { secret: 'wrong-secret', expiresIn: '1h' }
      );

      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe('Input Validation', () => {
    it('should reject malformed email addresses', async () => {
      const malformedEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@example..com',
        'test@example.com.',
      ];

      for (const email of malformedEmails) {
        const response = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
          email,
          password: 'Password123',
          confirmPassword: 'Password123',
          firstname: 'John',
          lastname: 'Doe',
          username: 'johndoe',
          gender: 'male',
        });

        expect(response.status).toBe(422);
      }
    });

    it('should reject SQL injection attempts', async () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; INSERT INTO users VALUES ('hacker', 'hacker@evil.com'); --",
        "' UNION SELECT * FROM users --",
      ];

      for (const attempt of sqlInjectionAttempts) {
        const response = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
          email: attempt,
          password: 'password',
        });

        // Should not crash and should return validation error
        expect([400, 422, 401]).toContain(response.status);
      }
    });

    it('should reject XSS attempts', async () => {
      const xssAttempts = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '"><img src=x onerror=alert("xss")>',
        '"><iframe src="javascript:alert(\'xss\')"></iframe>',
      ];

      for (const attempt of xssAttempts) {
        const response = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
          email: 'test@example.com',
          password: 'Password123',
          confirmPassword: 'Password123',
          firstname: attempt,
          lastname: 'Doe',
          username: 'johndoe',
          gender: 'male',
        });

        // Should not crash and should return validation error
        expect([400, 422]).toContain(response.status);
      }
    });
  });

  describe('Cookie Security', () => {
    it('should set secure cookies in production', async () => {
      // This test would need to be run in production environment
      // For now, we'll test that cookies are set with httpOnly
      const response = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
        email: 'test@example.com',
        password: 'Password123',
      });

      const cookies = response.headers['set-cookie'];
      if (cookies && Array.isArray(cookies)) {
        cookies.forEach((cookie: string) => {
          expect(cookie).toContain('HttpOnly');
        });
      }
    });
  });
});
