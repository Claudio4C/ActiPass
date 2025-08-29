<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

# Backend SaaS Associations - API d'Authentification

## 🚀 Vue d'ensemble

Ce backend robuste et sécurisé implémente un système d'authentification complet avec toutes les fonctionnalités de sécurité modernes.

## ✨ Fonctionnalités

### 🔐 Authentification

- **Inscription** avec validation des données
- **Connexion** sécurisée
- **Déconnexion** avec invalidation des tokens
- **Refresh tokens** automatique
- **Vérification d'email** obligatoire

### 🔒 Sécurité

- **Hashage des mots de passe** avec bcrypt (12 rounds)
- **JWT tokens** avec expiration courte (15min) et refresh (7 jours)
- **Cookies HttpOnly** (pas de localStorage)
- **Rate limiting** configurable
- **Headers de sécurité** avec Helmet
- **Validation Zod** stricte
- **CORS** configuré
- **Protection CSRF** via cookies sécurisés

### 📧 Services Email

- Vérification d'email
- Réinitialisation de mot de passe
- Emails de bienvenue
- Support pour SendGrid, AWS SES (configurable)

### 🧪 Tests

- **Tests unitaires** avec Jest
- **Tests de sécurité** complets
- **Tests fonctionnels** d'intégration
- **Tests de pénétration** automatisés

## 🛠️ Installation

### Prérequis

- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Configuration

1. **Cloner le projet**

```bash
git clone <repository-url>
cd backend
```

2. **Installer les dépendances**

```bash
npm install
```

3. **Configuration de l'environnement**

```bash
cp env.example .env
```

4. **Variables d'environnement requises**

```env
# Base de données
DATABASE_URL="postgresql://username:password@localhost:5432/saas_assos?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here-make-it-long-and-random"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-super-secret-jwt-refresh-key-here-make-it-long-and-random"
JWT_REFRESH_EXPIRES_IN="7d"

# Application
PORT=3000
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=10
```

5. **Base de données**

```bash
# Générer le client Prisma
npx prisma generate

# Exécuter les migrations
npx prisma migrate dev

# (Optionnel) Seed de données
npx prisma db seed
```

6. **Lancer l'application**

```bash
# Développement
npm run start:dev

# Production
npm run build
npm run start:prod
```

## 📚 API Endpoints

### 🔐 Authentification

#### POST `/api/v1/auth/register`

Inscription d'un nouvel utilisateur.

**Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123",
  "firstname": "John",
  "lastname": "Doe",
  "username": "johndoe",
  "gender": "male",
  "phone": "+33123456789",
  "birthdate": "1990-01-01T00:00:00.000Z"
}
```

**Validation:**

- Email unique et valide
- Mot de passe : min 8 caractères, majuscule, minuscule, chiffre
- Username : 3-30 caractères, alphanumérique + tirets/underscores
- Confirmation de mot de passe

#### POST `/api/v1/auth/login`

Connexion utilisateur.

**Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Réponse:**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "firstname": "John",
    "lastname": "Doe",
    "is_email_verified": true,
    "status": "active"
  },
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token"
}
```

**Cookies:**

- `access_token` : HttpOnly, 15min
- `refresh_token` : HttpOnly, 7 jours

#### POST `/api/v1/auth/refresh`

Rafraîchir le token d'accès.

**Body:**

```json
{
  "refreshToken": "refresh-token"
}
```

#### POST `/api/v1/auth/logout`

Déconnexion et invalidation des tokens.

**Headers:**

```
Authorization: Bearer <access-token>
```

#### POST `/api/v1/auth/forgot-password`

Demande de réinitialisation de mot de passe.

**Body:**

```json
{
  "email": "user@example.com"
}
```

#### POST `/api/v1/auth/reset-password`

Réinitialisation du mot de passe.

**Body:**

```json
{
  "userId": "uuid",
  "token": "reset-token",
  "newPassword": "NewSecurePass123",
  "confirmPassword": "NewSecurePass123"
}
```

#### GET `/api/v1/auth/verify-email/:userId/:token`

Vérification de l'email.

#### POST `/api/v1/auth/resend-verification`

Renvoyer l'email de vérification.

**Query:**

```
?email=user@example.com
```

#### GET `/api/v1/auth/me`

Récupérer le profil utilisateur connecté.

**Headers:**

```
Authorization: Bearer <access-token>
```

## 🔒 Sécurité

### Rate Limiting

- **Global** : 10 requêtes par minute
- **Authentification** : 5 tentatives par minute

### Validation des Mots de Passe

- Minimum 8 caractères
- Au moins une majuscule
- Au moins une minuscule
- Au moins un chiffre
- Pas de mots communs

### JWT Security

- **Access Token** : 15 minutes
- **Refresh Token** : 7 jours
- **Rotation automatique** des refresh tokens
- **Invalidation** lors de la déconnexion

### Cookies Sécurisés

- **HttpOnly** : Protection XSS
- **Secure** : HTTPS uniquement en production
- **SameSite** : Protection CSRF
- **Expiration** automatique

## 🧪 Tests

### Tests Unitaires

```bash
npm run test
```

### Tests avec Coverage

```bash
npm run test:cov
```

### Tests E2E

```bash
npm run test:e2e
```

### Tests de Sécurité

```bash
npm run test:security
```

## 🚀 Déploiement

### Production

```bash
# Build
npm run build

# Variables d'environnement
NODE_ENV=production
JWT_SECRET=<secret-très-long-et-aléatoire>
JWT_REFRESH_SECRET=<secret-très-long-et-aléatoire>

# Lancer
npm run start:prod
```

### Docker

```bash
docker build -t saas-assos-backend .
docker run -p 3000:3000 saas-assos-backend
```

## 📊 Monitoring

### Logs

- Winston pour la journalisation
- Rotation automatique des logs
- Niveaux : error, warn, info, debug

### Métriques

- Temps de réponse des endpoints
- Taux d'erreur
- Utilisation des ressources

## 🔧 Configuration Avancée

### Email Service

```typescript
// SendGrid
SENDGRID_API_KEY = "your-api-key";

// AWS SES
AWS_SES_ACCESS_KEY = "your-access-key";
AWS_SES_SECRET_KEY = "your-secret-key";
AWS_SES_REGION = "eu-west-1";
```

### Base de Données

```typescript
// Pool de connexions
DATABASE_POOL_MIN = 2;
DATABASE_POOL_MAX = 10;
DATABASE_POOL_IDLE_TIMEOUT = 30000;
```

## 🐛 Dépannage

### Erreurs Communes

1. **JWT_SECRET manquant**
   - Vérifier le fichier .env
   - Générer une clé sécurisée

2. **Connexion base de données**
   - Vérifier DATABASE_URL
   - Tester la connexion PostgreSQL

3. **Rate limiting trop strict**
   - Ajuster THROTTLE_TTL et THROTTLE_LIMIT
   - Vérifier la configuration

### Logs de Debug

```bash
NODE_ENV=development
DEBUG=* npm run start:dev
```

## 📝 Contribution

1. Fork le projet
2. Créer une branche feature
3. Commit les changements
4. Push vers la branche
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

## 🤝 Support

Pour toute question ou problème :

- Ouvrir une issue sur GitHub
- Contacter l'équipe de développement
- Consulter la documentation technique
