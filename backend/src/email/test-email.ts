#!/usr/bin/env ts-node

/**
 * Script de test pour les emails Ikivio
 * Utilisez ce script pour tester l'envoi d'emails en mode console
 *
 * Usage: npm run test:email
 * ou: npx ts-node src/email/test-email.ts
 */

import { ConfigService } from '@nestjs/config';

import { EmailService } from './email.service';

async function testEmails() {
  console.log('🚀 Test des emails Ikivio - Mode Console\n');

  // Configuration pour les tests
  const configService = new ConfigService({
    EMAIL_FROM: 'testikivio@gmail.com',
    FRONTEND_URL: 'http://localhost:5173',
    EMAIL_PROVIDER: 'console',
    EMAIL_MAX_RETRIES: 3,
    EMAIL_RETRY_DELAY: 1000,
  });

  const emailService = new EmailService(configService);

  // Attendre que le service soit initialisé
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log('📧 Test 1: Email de vérification');
  console.log('='.repeat(50));
  const verificationResult = await emailService.sendVerificationEmail(
    'test@example.com',
    'user123',
    'verification-token-123'
  );
  console.log(`Résultat: ${verificationResult ? '✅ Succès' : '❌ Échec'}\n`);

  console.log('📧 Test 2: Email de réinitialisation de mot de passe');
  console.log('='.repeat(50));
  const resetResult = await emailService.sendPasswordResetEmail(
    'test@example.com',
    'reset-token-456'
  );
  console.log(`Résultat: ${resetResult ? '✅ Succès' : '❌ Échec'}\n`);

  console.log('📧 Test 3: Email de bienvenue');
  console.log('='.repeat(50));
  const welcomeResult = await emailService.sendWelcomeEmail('test@example.com', 'Jean Dupont');
  console.log(`Résultat: ${welcomeResult ? '✅ Succès' : '❌ Échec'}\n`);

  console.log("📧 Test 4: Test de validation d'email invalide");
  console.log('='.repeat(50));
  const invalidEmailResult = await emailService.sendVerificationEmail(
    'invalid-email',
    'user123',
    'token-123'
  );
  console.log(`Résultat: ${invalidEmailResult ? '✅ Succès' : '❌ Échec (attendu)'}\n`);

  console.log('📧 Test 5: Test avec options personnalisées');
  console.log('='.repeat(50));
  const customEmailResult = await emailService.sendEmail({
    to: 'custom@example.com',
    subject: 'Test personnalisé Ikivio',
    html: "<h1>Test personnalisé</h1><p>Ceci est un test d'email personnalisé.</p>",
    text: "Test personnalisé - Ceci est un test d'email personnalisé.",
  });
  console.log(`Résultat: ${customEmailResult ? '✅ Succès' : '❌ Échec'}\n`);

  console.log('🎉 Tests terminés !');
  console.log('\n📝 Note: En mode console, les emails sont affichés dans les logs ci-dessus.');
  console.log('   Pour envoyer de vrais emails, configurez un fournisseur email dans votre .env');
}

// Exécuter les tests
testEmails().catch(console.error);
