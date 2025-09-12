import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Critical E2E Tests', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication Flow', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        firstname: 'Test',
        lastname: 'User',
        password: 'password123',
        gender: 'male',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message');
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'club.owner@test.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      accessToken = response.body.access_token;
    });

    it('should reject invalid credentials', async () => {
      const loginData = {
        email: 'club.owner@test.com',
        password: 'wrongpassword',
      };

      await request(app.getHttpServer()).post('/api/v1/auth/login').send(loginData).expect(401);
    });
  });

  describe('Organization Management', () => {
    it('should create an organization', async () => {
      const orgData = {
        name: 'Test Club',
        description: 'Test Description',
        type: 'sport',
        address: '123 Test Street',
        city: 'Test City',
        postal_code: '12345',
        country: 'France',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/organisations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(orgData)
        .expect(201);

      expect(response.body).toHaveProperty('organisation');
    });

    it('should list organizations', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/organisations')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Security', () => {
    it('should reject requests without token', async () => {
      await request(app.getHttpServer()).get('/api/v1/organisations').expect(401);
    });

    it('should reject invalid tokens', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/organisations')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
