import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';

// Configuration globale pour les tests
export const createTestingModule = () => {
  return Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env.test',
      }),
    ],
  });
};

// Configuration des variables d'environnement de test
export const setupTestEnvironment = () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
  process.env.JWT_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  process.env.FRONTEND_URL = 'http://localhost:5173';
  process.env.THROTTLE_TTL = '60';
  process.env.THROTTLE_LIMIT = '10';
};
