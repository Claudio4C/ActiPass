/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
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
    this.defaultFrom = this.configService.get<string>('EMAIL_FROM', 'noreply@saasassos.com');
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
    try {
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
        });
      } else {
        this.logger.log(`📧 Email sent successfully to ${options.to}`, result.messageId);
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
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
      subject: '🔐 Vérifiez votre compte SaaS Assos',
      html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Vérification de votre compte</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Bienvenue sur SaaS Assos !</h1>
              <p>Vérifiez votre compte pour commencer</p>
            </div>
            <div class="content">
              <h2>Bonjour !</h2>
              <p>Merci de vous être inscrit sur SaaS Assos. Pour activer votre compte, veuillez cliquer sur le bouton ci-dessous :</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">✅ Vérifier mon compte</a>
              </div>
              
              <p>Ou copiez ce lien dans votre navigateur :</p>
              <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${verificationUrl}</p>
              
              <p><strong>Ce lien expire dans 24 heures.</strong></p>
              
              <p>Si vous n'avez pas créé de compte, ignorez cet email.</p>
            </div>
            <div class="footer">
              <p>© 2025 SaaS Assos. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Bienvenue sur SaaS Assos !\n\nVérifiez votre compte en cliquant sur ce lien : ${verificationUrl}\n\nCe lien expire dans 24 heures.\n\nSi vous n'avez pas créé de compte, ignorez cet email.`,
    };
  }

  private getPasswordResetEmailTemplate(token: string): EmailTemplate {
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173')}/reset-password?token=${token}`;

    return {
      subject: '🔑 Réinitialisation de votre mot de passe',
      html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Réinitialisation de mot de passe</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔑 Réinitialisation de mot de passe</h1>
              <p>Vous avez demandé à réinitialiser votre mot de passe</p>
            </div>
            <div class="content">
              <h2>Bonjour !</h2>
              <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte SaaS Assos.</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">🔄 Réinitialiser mon mot de passe</a>
              </div>
              
              <p>Ou copiez ce lien dans votre navigateur :</p>
              <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${resetUrl}</p>
              
              <div class="warning">
                <strong>⚠️ Important :</strong>
                <ul>
                  <li>Ce lien expire dans 24 heures</li>
                  <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                  <li>Votre mot de passe actuel reste inchangé</li>
                </ul>
              </div>
              
              <p>Pour des raisons de sécurité, ce lien ne peut être utilisé qu'une seule fois.</p>
            </div>
            <div class="footer">
              <p>© 2025 SaaS Assos. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Réinitialisation de mot de passe SaaS Assos\n\nCliquez sur ce lien pour réinitialiser votre mot de passe : ${resetUrl}\n\nCe lien expire dans 24 heures.\n\nSi vous n'avez pas demandé cette réinitialisation, ignorez cet email.`,
    };
  }

  private getWelcomeEmailTemplate(firstname: string): EmailTemplate {
    return {
      subject: '🎉 Bienvenue sur SaaS Assos !',
      html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bienvenue sur SaaS Assos</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .feature { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #4facfe; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Bienvenue ${firstname} !</h1>
              <p>Votre compte est maintenant actif sur SaaS Assos</p>
            </div>
            <div class="content">
              <h2>Félicitations !</h2>
              <p>Votre compte a été vérifié avec succès. Vous pouvez maintenant profiter de toutes les fonctionnalités de SaaS Assos.</p>
              
              <div class="feature">
                <h3>🚀 Commencez dès maintenant</h3>
                <p>Connectez-vous à votre compte et explorez nos fonctionnalités :</p>
                <ul>
                  <li>Gestion des associations et clubs</li>
                  <li>Organisation d'événements</li>
                  <li>Gestion des adhésions</li>
                  <li>Et bien plus encore !</li>
                </ul>
              </div>
              
              <div class="feature">
                <h3>💡 Besoin d'aide ?</h3>
                <p>Notre équipe est là pour vous accompagner. N'hésitez pas à nous contacter si vous avez des questions.</p>
              </div>
              
              <p>Bonne découverte !</p>
              <p><strong>L'équipe SaaS Assos</strong></p>
            </div>
            <div class="footer">
              <p>© 2025 SaaS Assos. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Bienvenue ${firstname} sur SaaS Assos !\n\nVotre compte est maintenant actif. Connectez-vous pour commencer à utiliser toutes nos fonctionnalités.\n\nBonne découverte !\n\nL'équipe SaaS Assos`,
    };
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
