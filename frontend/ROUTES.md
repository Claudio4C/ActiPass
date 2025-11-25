# 📍 Routes Frontend - IKIVIO

Documentation complète de toutes les routes disponibles dans l'application frontend.

---

## 🏟️ **ESPACE CLUB** (Mode: `club`)

### 🔐 Authentification

- `GET /login` - Page de connexion
- `GET /register` - Page d'inscription
- `GET /verify-email/:userId/:token` - Vérification d'email
- `GET /forgot-password` - Mot de passe oublié
- `GET /reset-password` - Réinitialisation du mot de passe
- `GET /resend-verification` - Renvoyer l'email de vérification

### 📊 Dashboard Principal

- `GET /club` - Dashboard principal (redirige vers `/club`)

### 👥 Espace Membres

- `GET /club/members` - Liste des membres
- `GET /club/loyalty` - Programme de fidélité
- `GET /club/notifications` - Notifications
- `GET /club/professeurs` - Liste des professeurs
- `GET /club/disciplines` - Disciplines
- `GET /club/cours-video` - Cours vidéo
- `GET /club/galerie` - Galerie photos
- `GET /club/planning` - Planning

### 🎯 Dashboard Organisation (avec `organisationId`)

- `GET /dashboard/:organisationId/overview` - Vue d'ensemble du dashboard
  - ✅ **Implémenté** - Dashboard différencié par rôle (Owner/Admin/Treasurer)
  - 🔒 **Protégé** - Nécessite authentification + rôle approprié

#### Routes Dashboard à implémenter :

- `GET /dashboard/:organisationId/members` - Gestion membres
  - `GET /dashboard/:organisationId/members/list` - Liste + CRUD
  - `GET /dashboard/:organisationId/members/:memberId` - Détail membre
  - `GET /dashboard/:organisationId/members/import-export` - Import/Export CSV

- `GET /dashboard/:organisationId/events` - Gestion événements
  - `GET /dashboard/:organisationId/events/calendar` - Vue calendrier
  - `GET /dashboard/:organisationId/events/list` - Vue liste
  - `GET /dashboard/:organisationId/events/create` - Création événement
  - `GET /dashboard/:organisationId/events/:eventId/edit` - Modification

- `GET /dashboard/:organisationId/attendance` - Gestion présences
  - `GET /dashboard/:organisationId/attendance/sessions` - Liste séances
  - `GET /dashboard/:organisationId/attendance/:sessionId/check-in` - Pointage

- `GET /dashboard/:organisationId/payments` - Finances
  - `GET /dashboard/:organisationId/payments/overview` - Vue d'ensemble
  - `GET /dashboard/:organisationId/payments/invoices` - Factures
  - `GET /dashboard/:organisationId/payments/transactions` - Transactions
  - `GET /dashboard/:organisationId/payments/reports` - Rapports

- `GET /dashboard/:organisationId/documents` - Documents
  - `GET /dashboard/:organisationId/documents/pending` - En attente validation
  - `GET /dashboard/:organisationId/documents/validated` - Validés

- `GET /dashboard/:organisationId/settings` - Paramètres
  - `GET /dashboard/:organisationId/settings/general` - Infos club
  - `GET /dashboard/:organisationId/settings/policies` - Politiques annulation
  - `GET /dashboard/:organisationId/settings/team` - Gestion équipe
  - `GET /dashboard/:organisationId/settings/permissions` - Gestion des droits

- `GET /dashboard/:organisationId/communication` - Communication
- `GET /dashboard/:organisationId/my-schedule` - Planning personnel (Coach uniquement)

### 👤 Compte Utilisateur

- `GET /accounts` - Sélection/Changement d'organisation
- `GET /account/profile` - Profil utilisateur
- `GET /account/subscriptions` - Abonnements & paiements

---

## 🏛️ **ESPACE ADMIN** (Mode: `club`)

### 🔐 Authentification

- `GET /admin/login` - Page de connexion admin
- `GET /admin/register` - Page d'inscription admin
- `GET /admin/verify-email/:userId/:token` - Vérification d'email
- `GET /admin/forgot-password` - Mot de passe oublié
- `GET /admin/reset-password` - Réinitialisation du mot de passe
- `GET /admin/resend-verification` - Renvoyer l'email de vérification

### 📊 Dashboard Admin

- `GET /admin` - Dashboard admin principal
- `GET /admin/associations` - Gestion des associations
- `GET /admin/members` - Gestion des membres
- `GET /admin/municipalities` - Gestion des municipalités
- `GET /admin/settings` - Paramètres admin

---

## 👑 **ESPACE SUPER ADMIN**

### 🔐 Authentification

- `GET /superadmin/login` - Page de connexion super admin
  - 🔒 **Protégé** - Vérifie `is_super_admin === true`

### 📊 Dashboard Super Admin

- `GET /superadmin` - Dashboard super admin principal
- `GET /superadmin/users` - Liste des utilisateurs
- `GET /superadmin/users/:id` - Détail d'un utilisateur
- `GET /superadmin/create-super-admin` - Créer un super admin
- `GET /superadmin/organisations` - Liste des organisations
- `GET /superadmin/organisations/:id` - Détail d'une organisation
- `GET /superadmin/memberships` - Gestion des adhésions

---

## 🏛️ **ESPACE MUNICIPALITÉ** (Mode: `municipalite`)

### 🔐 Authentification

- `GET /municipalite/login` - Page de connexion municipalité
- `GET /municipalite/register` - Page d'inscription municipalité
- `GET /municipalite/verify-email/:userId/:token` - Vérification d'email
- `GET /municipalite/forgot-password` - Mot de passe oublié
- `GET /municipalite/reset-password` - Réinitialisation du mot de passe
- `GET /municipalite/resend-verification` - Renvoyer l'email de vérification

### 📊 Dashboard Municipalité

- `GET /municipalite` - Dashboard municipalité principal

---

## 🔄 **Routes Globales**

### Redirections

- `GET /` - Redirige vers `/login` (selon le mode)
- `GET /*` - Route de fallback, redirige vers `/login`

---

## 🔒 **Protection des Routes**

### Niveaux de Protection

1. **Public** - Accessible sans authentification
   - Routes `/login`, `/register`, `/forgot-password`, etc.

2. **Authentifié** - Nécessite un utilisateur connecté
   - Routes `/club/*`, `/admin/*`, `/municipalite/*`
   - Vérifie `user !== null`

3. **Mode Spécifique** - Nécessite le bon mode (`club` ou `municipalite`)
   - Routes protégées par `ProtectedRoute` avec `requiredMode`

4. **Rôle Spécifique** - Nécessite un rôle particulier
   - Routes `/dashboard/:organisationId/*` protégées par `RoleBasedRoute`
   - Rôles supportés : `club_owner`, `club_manager`, `treasurer`, `coach`, `member`

5. **Super Admin** - Nécessite `is_super_admin === true`
   - Routes `/superadmin/*`

---

## 📝 **Notes Importantes**

### Routes Dashboard avec `organisationId`

Toutes les routes `/dashboard/:organisationId/*` nécessitent :

- ✅ Authentification
- ✅ Mode `club`
- ✅ Membership valide pour l'organisation
- ✅ Rôle approprié selon la route

### Rôles et Permissions

- **Club Owner** : Accès complet à toutes les routes dashboard
- **Club Manager** : Accès complet sauf suppression définitive
- **Treasurer** : Accès uniquement aux routes finances (`/payments/*`)
- **Coach** : Accès limité (présences, planning personnel)
- **Member** : Accès lecture seule

### TODO - Routes à Implémenter

Les routes suivantes sont documentées mais pas encore implémentées :

- `/dashboard/:organisationId/members/*`
- `/dashboard/:organisationId/events/*`
- `/dashboard/:organisationId/attendance/*`
- `/dashboard/:organisationId/payments/*` (sauf overview)
- `/dashboard/:organisationId/documents/*`
- `/dashboard/:organisationId/settings/*`
- `/dashboard/:organisationId/communication`
- `/dashboard/:organisationId/my-schedule`

---

## 🗂️ **Structure des Fichiers de Routage**

```
frontend/src/
├── shared/
│   └── App.tsx                    # Routes communes (club/municipalite)
├── apps/
│   ├── club/
│   │   └── App.tsx                # Point d'entrée mode club
│   ├── admin/
│   │   └── App.tsx                # Routes admin
│   ├── superadmin/
│   │   └── App.tsx                # Routes super admin
│   └── municipalite/
│       └── App.tsx                # Point d'entrée mode municipalite
```

---

**Dernière mise à jour** : Après implémentation du système de dashboard avec rôles
