// Configuration globale pour les tests de sécurité
import { config } from 'dotenv';

// Charger les variables d'environnement de test
config({ path: '.env.test' });

// Configuration des timeouts pour les tests de sécurité
jest.setTimeout(30000);

// Mock des services externes pour les tests de sécurité
jest.mock('../email/email.service', () => ({
  EmailService: jest.fn().mockImplementation(() => ({
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Configuration des variables d'environnement de test
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-security-tests';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-for-security-tests';
process.env.JWT_EXPIRES_IN = '1s';
process.env.JWT_REFRESH_EXPIRES_IN = '1s';
process.env.FRONTEND_URL = 'http://localhost:5173';

// Supprimer les logs pendant les tests de sécurité
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Configuration des tests de sécurité
export const securityTestConfig = {
  maxLoginAttempts: 5,
  maxRegistrationAttempts: 5,
  weakPasswords: ['12345678', 'abcdefgh', 'ABCDEFGH', '1234567', 'password', 'qwerty123'],
  strongPasswords: ['Password123', 'MySecurePass1', 'ComplexP@ss1', 'Str0ngP@ssw0rd'],
  malformedEmails: [
    'invalid-email',
    '@example.com',
    'test@',
    'test..test@example.com',
    'test@example..com',
    'test@example.com.',
  ],
  sqlInjectionAttempts: [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "'; INSERT INTO users VALUES ('hacker', 'hacker@evil.com'); --",
    "' UNION SELECT * FROM users --",
  ],
  xssAttempts: [
    '<script>alert("xss")</script>',
    'javascript:alert("xss")',
    '"><img src=x onerror=alert("xss")>',
    '"><iframe src="javascript:alert(\'xss\')"></iframe>',
  ],
};
