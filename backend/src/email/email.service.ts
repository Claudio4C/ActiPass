/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
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
    const template = this.getVerificationEmailTemplate(userId, token);

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    const template = this.getPasswordResetEmailTemplate(token);

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendWelcomeEmail(email: string, firstname: string): Promise<boolean> {
    const template = this.getWelcomeEmailTemplate(firstname);

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  private getVerificationEmailTemplate(userId: string, token: string): EmailTemplate {
    const verificationUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173')}/verify-email/${userId}/${token}`;

    return {
      subject: '🔐 Vérifiez votre compte Ikivio',
      html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Vérification de votre compte Ikivio</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
            .header p { font-size: 16px; opacity: 0.9; }
            .content { padding: 40px 30px; }
            .content h2 { font-size: 24px; font-weight: 600; margin-bottom: 16px; color: #1f2937; }
            .content p { font-size: 16px; margin-bottom: 20px; color: #4b5563; }
            .button { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0; transition: transform 0.2s; }
            .button:hover { transform: translateY(-2px); }
            .link-container { background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1; }
            .link-container p { word-break: break-all; font-family: monospace; font-size: 14px; color: #374151; margin: 0; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 20px 0; }
            .warning strong { color: #92400e; }
            .footer { background: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
            .logo { font-size: 32px; font-weight: 800; margin-bottom: 8px; }
            @media (max-width: 600px) {
              .container { margin: 10px; border-radius: 8px; }
              .header, .content { padding: 30px 20px; }
              .header h1 { font-size: 24px; }
              .content h2 { font-size: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Ikivio</div>
              <h1>🎉 Bienvenue !</h1>
              <p>Vérifiez votre compte pour commencer votre aventure</p>
            </div>
            <div class="content">
              <h2>Bonjour !</h2>
              <p>Merci de vous être inscrit sur <strong>Ikivio</strong>. Pour activer votre compte et accéder à toutes nos fonctionnalités, veuillez cliquer sur le bouton ci-dessous :</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">✅ Vérifier mon compte</a>
              </div>
              
              <p>Ou copiez et collez ce lien dans votre navigateur :</p>
              <div class="link-container">
                <p>${verificationUrl}</p>
              </div>
              
              <div class="warning">
                <strong>⏰ Important :</strong> Ce lien expire dans 24 heures pour des raisons de sécurité.
              </div>
              
              <p>Si vous n'avez pas créé de compte sur Ikivio, vous pouvez ignorer cet email en toute sécurité.</p>
            </div>
            <div class="footer">
              <p>© 2025 Ikivio. Tous droits réservés.</p>
              <p>Votre plateforme de gestion d'associations nouvelle génération</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Bienvenue sur Ikivio !\n\nVérifiez votre compte en cliquant sur ce lien : ${verificationUrl}\n\nCe lien expire dans 24 heures.\n\nSi vous n'avez pas créé de compte, ignorez cet email.\n\n© 2025 Ikivio - Votre plateforme de gestion d'associations nouvelle génération`,
    };
  }

  private getPasswordResetEmailTemplate(token: string): EmailTemplate {
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173')}/reset-password?token=${token}`;

    return {
      subject: '🔑 Réinitialisation de votre mot de passe Ikivio',
      html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Réinitialisation de mot de passe Ikivio</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
            .header p { font-size: 16px; opacity: 0.9; }
            .content { padding: 40px 30px; }
            .content h2 { font-size: 24px; font-weight: 600; margin-bottom: 16px; color: #1f2937; }
            .content p { font-size: 16px; margin-bottom: 20px; color: #4b5563; }
            .button { display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0; transition: transform 0.2s; }
            .button:hover { transform: translateY(-2px); }
            .link-container { background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
            .link-container p { word-break: break-all; font-family: monospace; font-size: 14px; color: #374151; margin: 0; }
            .warning { background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .warning strong { color: #dc2626; }
            .warning ul { margin: 10px 0 0 20px; }
            .warning li { margin-bottom: 8px; color: #7f1d1d; }
            .footer { background: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
            .logo { font-size: 32px; font-weight: 800; margin-bottom: 8px; }
            .security-note { background: #f0f9ff; border: 1px solid #0ea5e9; padding: 16px; border-radius: 8px; margin: 20px 0; }
            .security-note strong { color: #0369a1; }
            @media (max-width: 600px) {
              .container { margin: 10px; border-radius: 8px; }
              .header, .content { padding: 30px 20px; }
              .header h1 { font-size: 24px; }
              .content h2 { font-size: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Ikivio</div>
              <h1>🔑 Réinitialisation de mot de passe</h1>
              <p>Demande de réinitialisation reçue</p>
            </div>
            <div class="content">
              <h2>Bonjour !</h2>
              <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte <strong>Ikivio</strong>.</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">🔄 Réinitialiser mon mot de passe</a>
              </div>
              
              <p>Ou copiez et collez ce lien dans votre navigateur :</p>
              <div class="link-container">
                <p>${resetUrl}</p>
              </div>
              
              <div class="warning">
                <strong>⚠️ Informations importantes :</strong>
                <ul>
                  <li>Ce lien expire dans 24 heures pour des raisons de sécurité</li>
                  <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                  <li>Votre mot de passe actuel reste inchangé jusqu'à la réinitialisation</li>
                </ul>
              </div>
              
              <div class="security-note">
                <strong>🔒 Sécurité :</strong> Ce lien ne peut être utilisé qu'une seule fois. Après utilisation, il sera automatiquement désactivé.
              </div>
            </div>
            <div class="footer">
              <p>© 2025 Ikivio. Tous droits réservés.</p>
              <p>Votre plateforme de gestion d'associations nouvelle génération</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Réinitialisation de mot de passe Ikivio\n\nCliquez sur ce lien pour réinitialiser votre mot de passe : ${resetUrl}\n\nCe lien expire dans 24 heures.\n\nSi vous n'avez pas demandé cette réinitialisation, ignorez cet email.\n\n© 2025 Ikivio - Votre plateforme de gestion d'associations nouvelle génération`,
    };
  }

  private getWelcomeEmailTemplate(firstname: string): EmailTemplate {
    const dashboardUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173')}/dashboard`;

    return {
      subject: '🎉 Bienvenue sur Ikivio !',
      html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bienvenue sur Ikivio</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
            .header p { font-size: 16px; opacity: 0.9; }
            .content { padding: 40px 30px; }
            .content h2 { font-size: 24px; font-weight: 600; margin-bottom: 16px; color: #1f2937; }
            .content p { font-size: 16px; margin-bottom: 20px; color: #4b5563; }
            .button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0; transition: transform 0.2s; }
            .button:hover { transform: translateY(-2px); }
            .feature { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 24px; margin: 20px 0; border-radius: 12px; border-left: 4px solid #10b981; }
            .feature h3 { color: #065f46; font-size: 18px; font-weight: 600; margin-bottom: 12px; }
            .feature ul { margin: 12px 0 0 20px; }
            .feature li { margin-bottom: 8px; color: #047857; }
            .help-section { background: #eff6ff; border: 1px solid #bfdbfe; padding: 24px; margin: 20px 0; border-radius: 12px; border-left: 4px solid #3b82f6; }
            .help-section h3 { color: #1e40af; font-size: 18px; font-weight: 600; margin-bottom: 12px; }
            .help-section p { color: #1e3a8a; }
            .footer { background: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
            .logo { font-size: 32px; font-weight: 800; margin-bottom: 8px; }
            .success-badge { background: #dcfce7; color: #166534; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; display: inline-block; margin-bottom: 20px; }
            @media (max-width: 600px) {
              .container { margin: 10px; border-radius: 8px; }
              .header, .content { padding: 30px 20px; }
              .header h1 { font-size: 24px; }
              .content h2 { font-size: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Ikivio</div>
              <h1>🎉 Bienvenue ${firstname} !</h1>
              <p>Votre compte est maintenant actif et prêt à l'emploi</p>
            </div>
            <div class="content">
              <div class="success-badge">✅ Compte vérifié avec succès</div>
              
              <h2>Félicitations !</h2>
              <p>Votre compte <strong>Ikivio</strong> a été vérifié avec succès. Vous pouvez maintenant profiter de toutes nos fonctionnalités avancées pour gérer votre association.</p>
              
              <div style="text-align: center;">
                <a href="${dashboardUrl}" class="button">🚀 Accéder à mon tableau de bord</a>
              </div>
              
              <div class="feature">
                <h3>🚀 Découvrez vos nouvelles fonctionnalités</h3>
                <p>Ikivio vous offre une suite complète d'outils pour gérer votre association :</p>
                <ul>
                  <li><strong>Gestion des membres</strong> - Suivez vos adhérents et leurs informations</li>
                  <li><strong>Événements et réservations</strong> - Organisez et gérez vos événements</li>
                  <li><strong>Paiements et facturation</strong> - Gérez les cotisations et les paiements</li>
                  <li><strong>Communication</strong> - Restez en contact avec vos membres</li>
                  <li><strong>Rapports et analytics</strong> - Suivez les performances de votre association</li>
                </ul>
              </div>
              
              <div class="help-section">
                <h3>💡 Besoin d'aide pour commencer ?</h3>
                <p>Notre équipe d'experts est là pour vous accompagner dans votre prise en main d'Ikivio. N'hésitez pas à nous contacter si vous avez des questions ou besoin d'assistance.</p>
              </div>
              
              <p style="text-align: center; margin-top: 30px;">
                <strong>Bonne découverte et bienvenue dans la communauté Ikivio !</strong>
              </p>
              <p style="text-align: center; color: #6b7280;">
                L'équipe Ikivio
              </p>
            </div>
            <div class="footer">
              <p>© 2025 Ikivio. Tous droits réservés.</p>
              <p>Votre plateforme de gestion d'associations nouvelle génération</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Bienvenue ${firstname} sur Ikivio !\n\nVotre compte est maintenant actif et vérifié. Connectez-vous pour commencer à utiliser toutes nos fonctionnalités :\n\n• Gestion des membres et adhérents\n• Organisation d'événements et réservations\n• Paiements et facturation\n• Communication avec vos membres\n• Rapports et analytics\n\nAccédez à votre tableau de bord : ${dashboardUrl}\n\nBonne découverte !\n\nL'équipe Ikivio\n\n© 2025 Ikivio - Votre plateforme de gestion d'associations nouvelle génération`,
    };
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
