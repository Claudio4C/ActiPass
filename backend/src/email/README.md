# 📧 Service Email Ikivio

Ce module gère l'envoi d'emails pour l'application Ikivio, incluant la vérification d'emails, la réinitialisation de mots de passe, et les emails de bienvenue.

## 🚀 Fonctionnalités

### Types d'emails supportés

1. **Email de vérification** - Envoyé lors de l'inscription
2. **Email de réinitialisation de mot de passe** - Envoyé lors de la demande de reset
3. **Email de bienvenue** - Envoyé après vérification du compte

### Fournisseurs d'emails supportés

- **Resend** (Recommandé pour la production)
- **SendGrid**
- **Gmail** (avec mot de passe d'application)
- **Console** (Mode développement - affiche les emails dans les logs)

## ⚙️ Configuration

### 1. Variables d'environnement

Copiez le fichier `email.config.example` vers `.env` et configurez :

```bash
# Configuration générale
FRONTEND_URL=http://localhost:5173
EMAIL_FROM=testikivio@gmail.com
EMAIL_PROVIDER=console

# Pour Resend (recommandé)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Pour SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Pour Gmail
GMAIL_USER=votre-email@gmail.com
GMAIL_APP_PASSWORD=votre-mot-de-passe-application
```

### 2. Configuration avancée

```bash
# Délai d'expiration des tokens (en heures)
EMAIL_TOKEN_EXPIRY=24

# Nombre maximum de tentatives d'envoi
EMAIL_MAX_RETRIES=3

# Délai entre les tentatives (en millisecondes)
EMAIL_RETRY_DELAY=1000
```

## 🧪 Tests

### Test en mode console

```bash
npm run test:email
```

Ce script teste tous les types d'emails en mode console (les emails s'affichent dans les logs).

### Tests unitaires

```bash
npm test -- --testPathPattern=email
```

## 📝 Utilisation

### Dans votre service

```typescript
import { EmailService } from "./email/email.service";

@Injectable()
export class AuthService {
  constructor(private readonly emailService: EmailService) {}

  async sendVerificationEmail(email: string, userId: string, token: string) {
    return this.emailService.sendVerificationEmail(email, userId, token);
  }

  async sendPasswordResetEmail(email: string, token: string) {
    return this.emailService.sendPasswordResetEmail(email, token);
  }

  async sendWelcomeEmail(email: string, firstname: string) {
    return this.emailService.sendWelcomeEmail(email, firstname);
  }
}
```

### Email personnalisé

```typescript
await this.emailService.sendEmail({
  to: "user@example.com",
  subject: "Mon sujet",
  html: "<h1>Mon contenu HTML</h1>",
  text: "Mon contenu texte",
});
```

## 🎨 Templates

Les templates d'emails sont optimisés pour :

- ✅ **Design responsive** - S'adapte aux mobiles et desktop
- ✅ **Accessibilité** - Compatible avec les lecteurs d'écran
- ✅ **Compatibilité** - Fonctionne sur tous les clients email
- ✅ **Branding Ikivio** - Couleurs et logo cohérents
- ✅ **Sécurité** - Liens sécurisés et expiration des tokens

### Personnalisation des templates

Les templates sont définis dans les méthodes privées :

- `getVerificationEmailTemplate()`
- `getPasswordResetEmailTemplate()`
- `getWelcomeEmailTemplate()`

## 🔒 Sécurité

- **Validation des emails** - Vérification du format des adresses
- **Retry automatique** - Gestion des échecs temporaires
- **Logs détaillés** - Traçabilité des envois
- **Tokens sécurisés** - Expiration automatique des liens

## 🚀 Déploiement en production

### 1. Configuration du domaine

Assurez-vous de configurer :

- **SPF** - `v=spf1 include:_spf.resend.com ~all`
- **DKIM** - Configuré automatiquement avec Resend
- **DMARC** - `v=DMARC1; p=quarantine; rua=mailto:dmarc@ikivio.com`

### 2. Vérification de l'adresse FROM

L'adresse `EMAIL_FROM` doit être vérifiée avec votre fournisseur d'emails.

### 3. Tests avant déploiement

```bash
# Test en mode console
npm run test:email

# Tests unitaires
npm test -- --testPathPattern=email

# Test avec un vrai fournisseur (optionnel)
EMAIL_PROVIDER=resend npm run test:email
```

## 📊 Monitoring

Le service enregistre automatiquement :

- ✅ Succès d'envoi avec messageId
- ❌ Échecs avec détails d'erreur
- 🔄 Tentatives de retry
- 📈 Métriques de performance

## 🛠️ Dépannage

### Problèmes courants

1. **Email non reçu**
   - Vérifiez les spams
   - Vérifiez la configuration SPF/DKIM
   - Testez avec un autre fournisseur

2. **Erreur d'authentification**
   - Vérifiez vos clés API
   - Vérifiez les permissions du compte

3. **Emails bloqués**
   - Vérifiez la réputation de votre domaine
   - Configurez correctement DMARC

### Logs utiles

```bash
# Activer les logs détaillés
LOG_LEVEL=debug npm run start:dev
```

## 📞 Support

Pour toute question ou problème :

- 📧 Email : support@ikivio.com
- 📚 Documentation : [docs.ikivio.com](https://docs.ikivio.com)
- 🐛 Issues : [GitHub Issues](https://github.com/ikivio/issues)
