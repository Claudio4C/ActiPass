# FEATURE BRIEF — Famille · Register · Onboarding
## Projet : Actipass / Ikivio — SaaS de gestion de clubs sportifs et associations
**Date :** Mai 2026 | **Stack :** NestJS · Prisma · PostgreSQL (Neon) · React · Tailwind CSS · TypeScript

---

## 1. VUE D'ENSEMBLE DU PROJET

Ikivio est un SaaS multi-espaces :
- **Espace Famille/Membre** (`/club/*`) — mobile-first, parents et enfants
- **Espace Admin Club** (`/dashboard/:orgId/*`) — gestionnaire d'organisation
- **Portail Mairie** (`/municipalite/*`)
- **Super Admin** (`/superadmin/*`)

Chaque espace a son propre layout, header, et navigation. Le routing est basé sur l'URL (`main.tsx` détecte `/superadmin`, `/admin`, etc.).

**Design system :** Ikivio UI — CSS variables HSL (`--primary`, `--card`, `--border`, `--foreground`, etc.), `font-display` (Plus Jakarta Sans), `font-body` (Inter), Tailwind CSS, composants ikivio style (rounded-2xl, bg-card, border-border, etc.)

---

## 2. AUTHENTIFICATION

### Fichiers clés
- `backend/src/auth/auth.service.ts` — JWT 8h access + 7d refresh, bcrypt passwords
- `backend/src/auth/auth.controller.ts` — POST /auth/register, /auth/login, /auth/refresh, /auth/logout
- `frontend/src/contexts/AuthContext.tsx` — état user, login(), register(), logout()
- `frontend/src/apps/club/pages/Login.tsx` — page login ikivio style
- `frontend/src/apps/club/pages/Register.tsx` — page register multi-étapes

### Flow Register (3 étapes)

**Étape 0 — Choix du profil :**
```
3 cartes visuelles :
  - 👨‍👩‍👧‍👦 "Parent de membre" → localStorage('ikivio_onboarding_type') = 'parent'
  - 👤 "Membre"              → localStorage('ikivio_onboarding_type') = 'member'
  - 🏆 "Gérant de club"      → localStorage('ikivio_onboarding_type') = 'manager'
```

**Étape 1 — Formulaire :**
Prénom, Nom, @username, Genre (pills), Email, Téléphone (opt), Mot de passe × 2, CGU
Validation : `useFormValidation` + `registerSchema` (zod)
Soumis via `AuthContext.register()` → `POST /api/v1/auth/register`

**Étape 2 — Succès :**
Email de vérification envoyé. Affiche hint contextuel selon profil :
- Parent → "Rendez-vous dans Ma famille pour créer les profils de vos enfants"
- Manager → "Vous pourrez créer votre organisation après connexion"
- Membre → "Recherchez votre club et demandez votre adhésion"

### Flow Login
Page centrée, email + password + toggle show/hide. Validation zod.
Après login réussi, le router (`App.tsx`) appelle `postLoginTarget()` :
```typescript
const postLoginTarget = () => {
  const t = localStorage.getItem('ikivio_onboarding_type')
  return t && t !== 'member' ? '/onboarding' : '/home'
}
```
→ Redirect vers `/onboarding` (parent/manager) ou `/home` (membre/normal)

### JWT
- Access token : **8h** (config: `backend/.env` `JWT_EXPIRES_IN=8h`)
- Refresh token : **7d**
- Super admins : 24h access
- Email de vérification avec lien `FRONTEND_URL/verify-email/:userId/:token`
- Reset password avec lien `FRONTEND_URL/reset-password?token=xxx`

---

## 3. ONBOARDING POST-LOGIN

### Fichier : `frontend/src/pages/OnboardingPage.tsx`
Route : `/onboarding` — dans SimpleLayout (ProtectedRoute)

**Mécanisme de flags localStorage :**
```
Register          → ikivio_onboarding_type = 'parent'|'manager'|'member'
Login             → postLoginTarget() lit ce flag → redirect /onboarding
OnboardingPage    → au mount, transfère :
                    ikivio_welcome_pending = ikivio_onboarding_type
                    supprime ikivio_onboarding_type (évite boucle de redirect)
Onboarding done   → navigate('/home') ou '/clubs' ou '/dashboard/:id'
HomePage mount    → lit ikivio_welcome_pending → affiche WelcomeModal
WelcomeModal close → supprime ikivio_welcome_pending
                     stocke ikivio_welcome_seen = '1' (ne plus afficher)
```

### Flow Parent (`ikivio_onboarding_type = 'parent'`)
1. **Étape "count"** — Sélection visuelle du nombre d'enfants : [1] [2] [3] [4+]
2. **Étape "forms"** — N formulaires (prénom*, date de naissance, genre, nom)
   - "+ Ajouter un enfant" dynamique
   - Soumission : `Promise.all(children.map(c => POST /api/v1/family/children))`
3. **Succès** — "Profils créés !" → CTA "Trouver un club à inscrire" → `/clubs`

### Flow Manager (`ikivio_onboarding_type = 'manager'`)
1. **Form** — nom du club*, type (pills emoji), ville, description (opt)
2. **Soumission** : `POST /api/v1/organisations`
   - org créée en `status: 'pending_validation'`
   - slug unique anti-doublon : `${baseSlug}-${Date.now().toString(36)}`
3. **Succès** — écran "En attente de validation (24-48h)" → CTA "Accéder à mon espace admin"
4. **Redirect** → `/dashboard/:orgId/overview` avec bannière amber dans le layout

### WelcomeModal (1 seule fois sur /home)
Modal plein-écran backdrop-blur, header gradient primary :
```
Profil      Titre                    Cards                           CTA principal
Parent    → Bienvenue [Prénom]!    → Famille / Inscrire / Planning  → /club/famille
Manager   → Votre club est créé!  → Infos / Membres / Événements  → /home
Membre    → Bienvenue sur Actipass → Clubs / Profil / Planning     → /clubs
```

---

## 4. FEATURE FAMILLE

### Architecture base de données (Prisma)
```prisma
User {
  is_minor      Boolean @default(false)
  profile_mode  ProfileMode @default(solo)  // solo|duo|famille
  parentLinks   FamilyLink[] @relation("ParentLinks")
  childLinks    FamilyLink[] @relation("ChildLinks")
  healthInfo    ChildHealthInfo?
  childAuthorizations ChildAuthorization[]
}

FamilyLink {
  parent_id String
  child_id  String
  relationship  FamilyRelationship  // parent|tuteur|autre
  is_primary_contact Boolean
  @@unique([parent_id, child_id])
}

ChildHealthInfo {
  child_id              String @unique
  blood_type            String?
  allergies             String[]
  treatments            String[]
  medical_notes         String?
  emergency_contact_name    String?
  emergency_contact_phone   String?
  emergency_contact_relation String?
}

ChildAuthorization {
  child_id  String
  parent_id String
  type      AuthorizationType  // photo_rights|excursion|medical_waiver
  title     String
  is_signed Boolean @default(false)
  signed_at DateTime?
  @@unique([child_id, type])
}
```

### Backend API (NestJS — `/api/v1/family/*`)
Toutes les routes requièrent JWT. `assertParentOwnsChild()` vérifie l'ownership avant chaque opération.

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | /family/children | Liste les enfants du parent connecté |
| POST | /family/children | Crée un profil enfant (User is_minor=true, email interne auto) |
| PUT | /family/children/:id | Modifie les infos de l'enfant |
| DELETE | /family/children/:id | Retire le lien familial |
| POST | /family/children/:id/memberships | Inscrit l'enfant dans une organisation |
| POST | /family/children/:id/events/:eventId/register | Inscrit l'enfant à un événement |
| DELETE | /family/children/:id/events/:eventId/register | Désinscrit l'enfant |
| GET | /family/dashboard | Planning consolidé (enfants + orgs + events avec is_registered) |
| GET | /family/children/:id/health | Fiche santé de l'enfant |
| PUT | /family/children/:id/health | Upsert fiche santé |
| GET | /family/children/:id/authorizations | Les 3 autorisations avec statut |
| POST | /family/children/:id/authorizations/:type/sign | Signe une autorisation |
| DELETE | /family/children/:id/authorizations/:type/sign | Retire la signature |

**Réponse /family/dashboard :**
```typescript
{
  children: [{
    id, firstname, lastname, birthdate, relationship,
    organisations: [{ id, name }],
    events: [{
      id, title, description, start_time, end_time, location,
      registration_required, capacity,
      organisation: { id, name },
      is_registered: boolean,
      membership_id: string
    }]
  }]
}
```

### Pages Frontend Famille

**`/club/famille`** — `FamilyPage.tsx` (MemberLayout)
- Mode d'utilisation (Solo/Duo/Famille) — persisté en DB via `PUT /users/me { profile_mode }`
- Card "Vous" avec avatar coloré
- Grille des enfants : avatar, âge, clubs, actions (voir profil / modifier / supprimer)
- Modal création/édition enfant : prénom, nom, date, genre (pills), téléphone
- Breadcrumb contextuel : si `/:orgId/famille` → `← Retour au club`, sinon `← Accueil`
- Bouton "Planning" → `/club/famille/planning`

**`/club/famille/:childId`** — `ChildDetailPage.tsx` (MemberLayout)
Tabs : Profil | Santé | Autorisations | Clubs
- **Profil** : édition inline, soumit via `PUT /family/children/:id`
- **Santé** : groupe sanguin (8 boutons), tag-inputs allergies/traitements, textarea notes, contact d'urgence. Sauvegarde via `PUT /family/children/:id/health`
- **Autorisations** : 3 cartes (Droit à l'image / Sortie / Décharge médicale). Toggle avec **mise à jour optimiste** + rollback en cas d'erreur + sync sans cache. Horodatage affiché.
- **Clubs** : liste des memberships avec statut, modal inscription club
- Back button : `goBack()` → `location.state.from` (passé par FamilyPage via `state={{ from: location.pathname }}`) ou `navigate(-1)`

**`/club/famille/planning`** — `FamilyDashboardPage.tsx` (MemberLayout)
- Filtres enfants (pills colorés par enfant)
- Navigateur semaine (← →) + day picker avec dot indicator
- Events du jour sélectionné
- Bouton inscription réactif : **mise à jour optimiste** + toast de confirmation
- Events `registration_required: false` → badge "Accès libre" (pas de bouton)
- Empty state si aucun enfant → CTA `/club/famille`
- Empty state si enfants non inscrits → CTA `/clubs` + `/club/famille`

---

## 5. DISCOVERY CLUBS

### Backend
- `GET /api/v1/organisations/public?search=&type=&city=&limit=50` — liste clubs publics actifs
- `POST /api/v1/organisations/:id/join` — demande d'adhésion (membership status: 'pending')
- `POST /api/v1/family/children/:id/memberships { organisation_id }` — inscrit un enfant

### Frontend : `/clubs` — `ClubsPage.tsx` (MemberLayout)
- Barre de recherche (nom, description, ville)
- Bouton "Près de moi" → `navigator.geolocation` → ouvre Google Maps `@lat,lng,14z` dans nouvel onglet
- 5 filtres catégorie : Tout / Sport / Culture / Loisir / Social
- Cards ikivio : emoji catégorie, description, métadonnées, compteur membres
- Badge "✓ Membre" / "✓ Enfant inscrit" sur clubs déjà rejoints
- Modal inscription famille : radio (Vous + chaque enfant), état grisé si déjà inscrit
- Toast de confirmation post-inscription

---

## 6. NAVIGATION & LAYOUTS

### Hiérarchie des layouts
```
SimpleLayout      → /home, /onboarding, /discover, /accounts
  └── AppHeader   → logo + menu burger (6 liens + dark mode)

MemberLayout      → /club/members, /club/planning, /club/famille, /clubs, etc.
  └── header propre avec tabs nav + menu burger (6 liens identiques à AppHeader)

ClubLayout        → /club/:orgId/* (espace club spécifique)
  └── hero gradient + sidebar + back → /home

AdminDashboardLayout → /dashboard/:orgId/*
  └── sidebar + header + bannière amber si org pending_validation

CoachLayout, SimpleLayout... (autres espaces)
```

### Menu burger (AppHeader + MemberLayout) — liens identiques
```
Accueil          → /home
Mon activité     → /club/members
Ma famille       → /club/famille
Découvrir clubs  → /clubs
──────────────────
Mon profil       → /account/profile
Déconnexion
```

### Redirections clés
- `/club` → redirect `/club/members` (DashboardPage mocked supprimée)
- `/discover` → `DiscoverPage` (ComingSoon — à remplacer par /clubs)
- `/accounts` → `AccountSwitch` (redondant avec /home — à nettoyer)

---

## 7. DASHBOARD ADMIN CLUB (`/dashboard/:orgId/*`)

### Checklist "Premiers pas" (OverviewPage)
Affichée en haut si les 3 étapes ne sont pas complètes. Dismissable (localStorage).
1. Compléter infos du club (description + ville)
2. Créer premier événement
3. Accueillir premier membre (memberCount > 1)
Barre de progression X/3, liens directs vers chaque action.

### Bannière pending_validation (AdminDashboardLayout)
Si `org.status === 'pending_validation'` → bannière amber :
"Votre club est en cours de validation — 24-48h"
Si `org.status === 'suspended'` → bannière rouge.
Fetch silencieux `GET /organisations/:id` au mount.

### Fiche membre (MemberDetailPage)
- Tokens ikivio (bg-card, text-foreground, etc.) — plus de dark: hardcodés
- Affiche `guardians` si membre mineur (backend retourne `childLinks.map(l => l.parent)`)
- Modals : changer rôle + retirer membre
- Statuts adhésion / documents / paiement

---

## 8. PROFIL UTILISATEUR

### `/account/profile` — `ProfilePage.tsx` (MemberLayout)
- Mode d'utilisation (Solo/Duo/Famille) — modal avec 3 options, sauvegarde localStorage + `PUT /users/me { profile_mode }`
- **Barre de complétion** : `completionPct` calculé sur 5 champs (prénom/nom, téléphone, birthdate, enfants)
- Card "Vous" avec avatar coloré
- Sections : Infos personnelles, Coordonnées, Préférences communication (toggles), Contact d'urgence
- **"Autres profils"** : grille des enfants depuis `GET /family/children` → lien vers `ChildDetailPage`
- Sécurité : changement mot de passe + toggle 2FA

### `PUT /users/me` — Update profil
DTO accepte : firstname, lastname, username, phone, birthdate, avatar_url, **profile_mode**

---

## 9. ÉTAT ACTUEL — CE QUI EST FAIT / À FAIRE

### ✅ Terminé (fonctionnel)
- Auth complète (register, login, verify email, forgot/reset password, refresh JWT 8h)
- Register multi-étapes avec choix profil (Parent/Gérant/Membre)
- Onboarding post-login contextualisé par profil
- WelcomeModal premier login (gradient + cards + CTA contextuel)
- Feature Famille complète :
  - CRUD enfants, fiche santé, autorisations signées (réactif optimiste)
  - Inscription enfant dans un club, inscription aux événements
  - Planning famille semaine avec filtre par enfant et code couleur
  - Vue admin : tuteur visible dans fiche mineur
- Découverte clubs : annuaire public, filtres, modal inscription famille, Google Maps "Près de moi"
- Dashboard admin : checklist premiers pas, bannière pending_validation
- Profil : barre de complétion, mode famille, "Autres profils"
- Navigation : menus burgers complets et identiques sur tous les layouts
- Token JWT 8h, rate limiting 400 req/min, emails avec URLs correctes

### ⏳ À faire (prochaines phases)

**Epic 1.2 — Documents administratifs**
- Admin définit les types de documents requis (certificat médical, B3, etc.)
- Upload fichiers (PDF/JPG, 5Mo max) depuis profil membre
- Workflow validation admin (valider/refuser avec motif)
- Dashboard : membres avec docs manquants/expirés

**Epic 1.3 — Profil complet**
- Export CSV membres
- Tags membres (débutant/compétition/loisir) + filtres

**Phase 2 — Paiements Stripe**
- Stripe Connect pour les clubs
- Plans d'abonnement, paiement cotisation, factures PDF

**Phase 3 — QR Code & Planning avancé**
- Scanner QR pour validation présence (backend déjà fait)
- Liste d'attente événements complets

**Phase 4 — Notifications**
- Cloche in-app avec badge
- Emails automatiques (bienvenue, paiement, rappel séance)

**Onboarding étendu (prévu)**
- OB-1 : Tooltip/hints contextuels sur empty states
- OB-2 : Complétion de profil guidée (le club demande des infos spécifiques)

---

## 10. FICHIERS CLÉS — MAP

```
backend/
├── src/auth/
│   ├── auth.service.ts          JWT, register, login, refresh
│   ├── auth.controller.ts       Routes /auth/*
│   └── guards/                  JWT guard, permissions guard
├── src/family/
│   ├── family.controller.ts     Routes /family/*
│   ├── family.service.ts        Logique famille (children, health, auth, dashboard)
│   └── dto/                     CreateChildDto, UpsertChildHealthDto...
├── src/organisations/
│   ├── organisations.controller.ts  Dont: GET /public, POST /:id/join
│   └── organisations.service.ts     listPublicOrganisations, joinOrganisation...
├── src/users/
│   └── dto/update-user.dto.ts   Accepte profile_mode
└── prisma/schema.prisma         User, FamilyLink, ChildHealthInfo, ChildAuthorization...

frontend/src/
├── apps/club/pages/
│   ├── Login.tsx                Login ikivio style
│   └── Register.tsx             Register 3 étapes + profil type
├── pages/
│   ├── OnboardingPage.tsx       Onboarding Parent (enfants) + Manager (club)
│   └── HomePage.tsx             Home + WelcomeModal
├── pages/club/
│   ├── FamilyPage.tsx           /club/famille — gestion famille
│   ├── ChildDetailPage.tsx      /club/famille/:id — profil enfant (4 tabs)
│   ├── FamilyDashboardPage.tsx  /club/famille/planning — planning semaine
│   ├── ClubsPage.tsx            /clubs — annuaire clubs + enrollment modal
│   ├── MembersPage.tsx          /club/members — dashboard membre (= /club)
│   ├── PlanningPage.tsx         /club/planning — grille hebdo avec filtre famille
│   └── ProfilePage.tsx          /account/profile — profil + barre complétion
├── pages/dashboard/
│   ├── OverviewPage.tsx         Dashboard admin + checklist premiers pas
│   └── MemberDetailPage.tsx     Fiche membre (ikivio style, affiche tuteur)
├── layouts/
│   ├── AppHeader.tsx            Header SimpleLayout avec menu 6 liens
│   ├── MemberLayout.tsx         Layout membre (tabs + menu 6 liens)
│   ├── ClubLayout.tsx           Layout club spécifique (sidebar + hero)
│   └── AdminDashboardLayout.tsx Dashboard admin + bannière pending_validation
└── shared/App.tsx               Router principal + postLoginTarget() + routes
```

---

## 11. CONVENTIONS TECHNIQUES

### Gestion du cache API (`api.ts`)
```typescript
api.get(url, params, { useCache: true, cacheTTL: 30000 })  // avec cache
api.get(url, params, { useCache: false })                   // sans cache
api.clearCache('/family/children')                          // invalide le cache
```
- Après mutation (create/update/delete) → `api.clearCache(url)` puis refetch avec `useCache: false`
- Au mount des pages → cache OK pour éviter les re-fetches inutiles

### Mise à jour optimiste
Pattern utilisé dans : toggleAuthorization (ChildDetailPage), handleRegister (FamilyDashboardPage)
```typescript
// 1. Mise à jour immédiate du state
setState(optimisticState)
// 2. Appel API
await api.post(...)
// 3. Sync server
const fresh = await api.get(..., { useCache: false })
setState(fresh)
// En catch : rollback
setState(previousState)
```

### LocalStorage keys
```
ikivio_onboarding_type    → 'parent'|'manager'|'member' — post-register redirect
ikivio_welcome_pending    → copie du type — déclenche WelcomeModal
ikivio_welcome_seen       → '1' — WelcomeModal ne s'affiche plus
ikivio_profile_mode       → 'solo'|'duo'|'famille' — fallback si API indispo
selectedOrganisation      → JSON { id, name, type, role } — org active
ikivio_onboarding_type    → nettoyé dès que OnboardingPage se monte
checklist_dismissed_{id}  → '1' — checklist admin dismissée
appMode                   → 'club'|'admin'|'municipalite'
theme                     → 'dark'|'light'
```

### Couleurs avatar famille
```typescript
const MEMBER_COLORS = [
  'hsl(222,47%,20%)',  // parent (ardoise)
  'hsl(217,91%,60%)', // enfant 1 (bleu)
  'hsl(280,70%,60%)', // enfant 2 (violet)
  'hsl(25,95%,53%)',  // enfant 3 (orange)
  'hsl(160,84%,39%)', // enfant 4 (vert)
  'hsl(340,75%,55%)', // enfant 5 (rose)
]
```

---

## 12. POINTS D'ATTENTION POUR UN AGENT SENIOR

1. **Race condition redirect** : Le flag `ikivio_onboarding_type` doit être nettoyé au mount d'OnboardingPage (pas à la fin de l'onboarding), sinon chaque login redirige vers `/onboarding`.

2. **Cache stale sur 403** : Dans `MembersPage`, chaque appel org a son propre `.catch()` qui nettoie `selectedOrganisation` si 403, sans bloquer le reste du chargement.

3. **Duplicate méthodes** : La méthode `joinOrganisation` dans `organisations.service.ts` existait déjà (3 params). Ne pas en ajouter une nouvelle avec 2 params — ça crée un conflit TypeScript silencieux.

4. **profile_mode** : Le champ existe en DB (`ProfileMode` enum Prisma) et est accepté par `PUT /users/me`. Le frontend utilise localStorage comme fallback optimiste avant la réponse API.

5. **pending_validation** : Les orgs créées par onboarding sont en `pending_validation`. Le dashboard admin est accessible mais la bannière amber s'affiche. La validation se fait via le super admin (`/superadmin/organisations`).

6. **Slug anti-doublon** : Lors de `createOrganisation`, le slug est `${baseSlug}-${Date.now().toString(36)}` pour éviter les unique constraint errors sur les noms similaires.

7. **Back navigation enfant** : `ChildDetailPage` utilise `goBack()` qui lit `location.state.from` (passé par `FamilyPage` via `state={{ from: location.pathname }}`), sinon `navigate(-1)`. Ça permet de revenir sur `/club/:orgId/famille` ou `/club/famille` selon l'origine.
