import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);

    // Configuration par défaut pour les tests
    mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
      const config = {
        EMAIL_FROM: 'testikivio@gmail.com',
        FRONTEND_URL: 'http://localhost:5173',
        EMAIL_PROVIDER: 'console',
        EMAIL_MAX_RETRIES: 3,
        EMAIL_RETRY_DELAY: 1000,
      };
      return config[key] || defaultValue;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email with correct template', async () => {
      const email = 'test@example.com';
      const userId = 'user123';
      const token = 'token123';

      const sendEmailSpy = jest.spyOn(service, 'sendEmail').mockResolvedValue(true);

      const result = await service.sendVerificationEmail(email, userId, token);

      expect(result).toBe(true);
      expect(sendEmailSpy).toHaveBeenCalledWith({
        to: email,
        subject: '🔐 Vérifiez votre compte Ikivio',
        html: expect.stringContaining('Ikivio'),
        text: expect.stringContaining('Ikivio'),
      });
    });

    it('should include verification URL in template', async () => {
      const email = 'test@example.com';
      const userId = 'user123';
      const token = 'token123';

      const sendEmailSpy = jest.spyOn(service, 'sendEmail').mockResolvedValue(true);

      await service.sendVerificationEmail(email, userId, token);

      const callArgs = sendEmailSpy.mock.calls[0][0];
      expect(callArgs.html).toContain(`/verify-email/${userId}/${token}`);
      expect(callArgs.text).toContain(`/verify-email/${userId}/${token}`);
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with correct template', async () => {
      const email = 'test@example.com';
      const token = 'reset-token123';

      const sendEmailSpy = jest.spyOn(service, 'sendEmail').mockResolvedValue(true);

      const result = await service.sendPasswordResetEmail(email, token);

      expect(result).toBe(true);
      expect(sendEmailSpy).toHaveBeenCalledWith({
        to: email,
        subject: '🔑 Réinitialisation de votre mot de passe Ikivio',
        html: expect.stringContaining('Ikivio'),
        text: expect.stringContaining('Ikivio'),
      });
    });

    it('should include reset URL in template', async () => {
      const email = 'test@example.com';
      const token = 'reset-token123';

      const sendEmailSpy = jest.spyOn(service, 'sendEmail').mockResolvedValue(true);

      await service.sendPasswordResetEmail(email, token);

      const callArgs = sendEmailSpy.mock.calls[0][0];
      expect(callArgs.html).toContain(`/reset-password?token=${token}`);
      expect(callArgs.text).toContain(`/reset-password?token=${token}`);
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with correct template', async () => {
      const email = 'test@example.com';
      const firstname = 'John';

      const sendEmailSpy = jest.spyOn(service, 'sendEmail').mockResolvedValue(true);

      const result = await service.sendWelcomeEmail(email, firstname);

      expect(result).toBe(true);
      expect(sendEmailSpy).toHaveBeenCalledWith({
        to: email,
        subject: '🎉 Bienvenue sur Ikivio !',
        html: expect.stringContaining('Ikivio'),
        text: expect.stringContaining('Ikivio'),
      });
    });

    it('should include firstname in template', async () => {
      const email = 'test@example.com';
      const firstname = 'John';

      const sendEmailSpy = jest.spyOn(service, 'sendEmail').mockResolvedValue(true);

      await service.sendWelcomeEmail(email, firstname);

      const callArgs = sendEmailSpy.mock.calls[0][0];
      expect(callArgs.html).toContain(firstname);
      expect(callArgs.text).toContain(firstname);
    });

    it('should include dashboard URL in template', async () => {
      const email = 'test@example.com';
      const firstname = 'John';

      const sendEmailSpy = jest.spyOn(service, 'sendEmail').mockResolvedValue(true);

      await service.sendWelcomeEmail(email, firstname);

      const callArgs = sendEmailSpy.mock.calls[0][0];
      expect(callArgs.html).toContain('/dashboard');
      expect(callArgs.text).toContain('/dashboard');
    });
  });

  describe('email validation', () => {
    it('should validate email addresses correctly', () => {
      // Test avec des emails valides
      expect(service['isValidEmail']('test@example.com')).toBe(true);
      expect(service['isValidEmail']('user.name+tag@domain.co.uk')).toBe(true);
      expect(service['isValidEmail']('test123@test-domain.org')).toBe(true);

      // Test avec des emails invalides
      expect(service['isValidEmail']('invalid-email')).toBe(false);
      expect(service['isValidEmail']('test@')).toBe(false);
      expect(service['isValidEmail']('@example.com')).toBe(false);
      expect(service['isValidEmail']('')).toBe(false);
      expect(service['isValidEmail']('test@.com')).toBe(false);
    });

    it('should validate email options correctly', () => {
      const validOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      };

      expect(service['validateEmailOptions'](validOptions)).toBe(true);

      // Test avec des options invalides
      expect(
        service['validateEmailOptions']({
          to: 'invalid-email',
          subject: 'Test Subject',
          html: '<p>Test HTML</p>',
        })
      ).toBe(false);

      expect(
        service['validateEmailOptions']({
          to: 'test@example.com',
          subject: '',
          html: '<p>Test HTML</p>',
        })
      ).toBe(false);

      expect(
        service['validateEmailOptions']({
          to: 'test@example.com',
          subject: 'Test Subject',
          html: '',
        })
      ).toBe(false);
    });
  });

  describe('htmlToText conversion', () => {
    it('should convert HTML to text correctly', () => {
      const html = '<p>Hello <strong>World</strong>!</p><br/><p>Second paragraph</p>';
      const expected = 'Hello World! Second paragraph';

      expect(service['htmlToText'](html)).toBe(expected);
    });

    it('should handle HTML entities correctly', () => {
      const html = '<p>Hello &amp; welcome &lt;test&gt;</p>';
      const expected = 'Hello & welcome <test>';

      expect(service['htmlToText'](html)).toBe(expected);
    });

    it('should handle multiple spaces correctly', () => {
      const html = '<p>Hello    world</p>';
      const expected = 'Hello world';

      expect(service['htmlToText'](html)).toBe(expected);
    });
  });

  describe('error handling', () => {
    it('should handle sendEmail failures gracefully', async () => {
      const email = 'test@example.com';
      const userId = 'user123';
      const token = 'token123';

      jest.spyOn(service, 'sendEmail').mockResolvedValue(false);

      const result = await service.sendVerificationEmail(email, userId, token);

      expect(result).toBe(false);
    });

    it('should retry on failure', async () => {
      const email = 'test@example.com';
      const userId = 'user123';
      const token = 'token123';

      // Mock transporter to throw error on first call, succeed on second
      const mockTransporter = {
        sendMail: jest
          .fn()
          .mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValueOnce({ messageId: 'test-message-id' }),
      };

      // Mock the private transporter property
      (service as any).transporter = mockTransporter;

      const result = await service.sendVerificationEmail(email, userId, token);

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2);
    });
  });
});
