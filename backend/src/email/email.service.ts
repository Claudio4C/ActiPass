/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { render } from '@react-email/render';
import * as nodemailer from 'nodemailer';
import * as React from 'react';

import { EmailTemplateDataMap, EmailTemplateName, emailTemplateComponents } from './templates';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private readonly defaultFrom: string;

  constructor(private readonly configService: ConfigService) {
    this.defaultFrom = this.configService.get<string>('EMAIL_FROM', 'testikivio@gmail.com');
    // Initialize with console mode by default, will be updated when initializeTransporter is called
    this.transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
    // Initialize the real transporter asynchronously
    void this.initializeTransporter();
  }

  private async initializeTransporter(): Promise<void> {
    const emailProvider = this.configService.get<string>('EMAIL_PROVIDER', 'resend');

    try {
      switch (emailProvider) {
        case 'resend': {
          const apiKey = this.configService.get<string>('RESEND_API_KEY');
          if (!apiKey) {
            throw new Error('RESEND_API_KEY is required for Resend provider');
          }
          this.transporter = nodemailer.createTransport({
            host: 'smtp.resend.com',
            port: 587,
            secure: false,
            auth: {
              user: 'resend',
              pass: apiKey,
            },
          });
          break;
        }

        case 'sendgrid': {
          const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
          if (!apiKey) {
            throw new Error('SENDGRID_API_KEY is required for SendGrid provider');
          }
          this.transporter = nodemailer.createTransport({
            host: 'smtp.sendgrid.net',
            port: 587,
            secure: false,
            auth: {
              user: 'apikey',
              pass: apiKey,
            },
          });
          break;
        }

        case 'gmail': {
          const user = this.configService.get<string>('GMAIL_USER');
          const password = this.configService.get<string>('GMAIL_APP_PASSWORD');
          if (!user || !password) {
            throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD are required for Gmail provider');
          }
          this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user, pass: password },
          });
          break;
        }

        default:
          // Fallback to console logging for development
          this.transporter = nodemailer.createTransport({
            streamTransport: true,
            newline: 'unix',
            buffer: true,
          });
          break;
      }

      // Verify connection
      await this.transporter.verify();
      this.logger.log(`Email service initialized with ${emailProvider}`);
    } catch (error) {
      this.logger.error('Failed to initialize email service:', error);
      // Fallback to console logging
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true,
      });
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    const maxRetries = this.configService.get<number>('EMAIL_MAX_RETRIES', 3);
    const retryDelay = this.configService.get<number>('EMAIL_RETRY_DELAY', 1000);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Validation des options email
        if (!this.validateEmailOptions(options)) {
          this.logger.error('Invalid email options provided');
          return false;
        }

        const mailOptions = {
          from: options.from || this.defaultFrom,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text || this.htmlToText(options.html),
        };

        const result = await this.transporter.sendMail(mailOptions);

        if (this.configService.get<string>('EMAIL_PROVIDER') === 'console') {
          this.logger.log('📧 Email sent (console mode):', {
            to: options.to,
            subject: options.subject,
            messageId: result.messageId,
            attempt,
          });
        } else {
          this.logger.log(`📧 Email sent successfully to ${options.to}`, {
            messageId: result.messageId,
            attempt,
            provider: this.configService.get<string>('EMAIL_PROVIDER'),
          });
        }

        return true;
      } catch (error) {
        this.logger.error(
          `Failed to send email to ${options.to} (attempt ${attempt}/${maxRetries}):`,
          {
            error: error.message,
            stack: error.stack,
          }
        );

        if (attempt === maxRetries) {
          this.logger.error(`All ${maxRetries} attempts failed for email to ${options.to}`);
          return false;
        }

        // Attendre avant la prochaine tentative
        await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
      }
    }

    return false;
  }

  async sendVerificationEmail(email: string, userId: string, token: string): Promise<boolean> {
    const verificationUrl = `${this.frontendBaseUrl}/verify-email/${userId}/${token}`;

    return this.sendTemplateEmail({
      to: email,
      subject: '🔐 Vérifiez votre compte Ikivio',
      template: 'VerificationEmail',
      data: { verificationUrl },
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    const resetUrl = `${this.frontendBaseUrl}/reset-password?token=${token}`;

    return this.sendTemplateEmail({
      to: email,
      subject: '🔑 Réinitialisation de votre mot de passe Ikivio',
      template: 'PasswordResetEmail',
      data: { resetUrl },
    });
  }

  async sendTemplateEmail<T extends EmailTemplateName>(params: {
    to: string;
    subject: string;
    template: T;
    data: EmailTemplateDataMap[T];
  }): Promise<boolean> {
    const Component = emailTemplateComponents[params.template];
    const html = await render(React.createElement(Component, params.data));

    return this.sendEmail({
      to: params.to,
      subject: params.subject,
      html,
    });
  }

  async sendWelcomeEmail(email: string, firstname: string): Promise<boolean> {
    const dashboardUrl = `${this.frontendBaseUrl}/dashboard`;

    return this.sendTemplateEmail({
      to: email,
      subject: '🎉 Bienvenue sur Ikivio !',
      template: 'AccountWelcomeEmail',
      data: { firstname, dashboardUrl },
    });
  }

  private get frontendBaseUrl(): string {
    return this.configService
      .get<string>('FRONTEND_URL', 'http://localhost:5173')
      .replace(/\/$/, '');
  }

  private validateEmailOptions(options: EmailOptions): boolean {
    if (!options.to || !this.isValidEmail(options.to)) {
      this.logger.error('Invalid recipient email address:', options.to);
      return false;
    }

    if (!options.subject || options.subject.trim().length === 0) {
      this.logger.error('Email subject is required');
      return false;
    }

    if (!options.html || options.html.trim().length === 0) {
      this.logger.error('Email HTML content is required');
      return false;
    }

    if (options.from && !this.isValidEmail(options.from)) {
      this.logger.error('Invalid sender email address:', options.from);
      return false;
    }

    return true;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
