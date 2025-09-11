# Système de Rôles et Permissions - IKIVIO

## Vue d'ensemble

Ce système de permissions granulaire permet de gérer l'accès aux fonctionnalités selon deux espaces principaux :

- **Espace 360°** : Gestion des clubs et associations (privé/associatif)
- **Portail Propriétaire** : Interface municipale pour la gestion des équipements et subventions

## Architecture

### 1. Modèles de données

#### Role

- `space` : Définit l'espace d'utilisation (`club_360` ou `municipality`)
- `type` : Type de rôle spécifique à l'espace
- `level` : Niveau hiérarchique (0-100)

#### Permission

- `resource` : Ressource concernée (`events`, `members`, `payments`, etc.)
- `action` : Action autorisée (`create`, `read`, `update`, `delete`, `manage`)
- `scope` : Portée de la permission (`own`, `organisation`, `global`)

#### RolePermission

- Table de liaison entre les rôles et les permissions

### 2. Rôles par espace

#### Espace 360° (Club/Association)

| Rôle                     | Niveau | Description            | Permissions principales          |
| ------------------------ | ------ | ---------------------- | -------------------------------- |
| **Propriétaire de Club** | 100    | Administrateur complet | Toutes les permissions           |
| **Gestionnaire de Club** | 80     | Gestion opérationnelle | Événements, membres, paiements   |
| **Coach**                | 60     | Animateur/Coach        | Ses cours, lecture membres       |
| **Membre**               | 20     | Adhérent               | Réservations, lecture événements |

#### Portail Propriétaire (Municipal)

| Rôle                           | Niveau | Description                 | Permissions principales        |
| ------------------------------ | ------ | --------------------------- | ------------------------------ |
| **Administrateur Municipal**   | 100    | Vue d'ensemble complète     | Toutes les données municipales |
| **Gestionnaire d'Équipements** | 80     | Gestion des équipements     | Équipements, occupation        |
| **Responsable Subventions**    | 70     | Instruction des subventions | Subventions, conventions       |
| **Observateur Municipal**      | 30     | Lecture seule               | Données agrégées               |

## Utilisation

### 1. Décorateurs de permissions

```typescript
import {
  RequireEventRead,
  RequireMemberManage,
} from "./decorators/permissions.decorator";

@Controller("events")
@UseGuards(PermissionsGuard)
export class EventsController {
  @Get()
  @RequireEventRead("organisation")
  async getEvents() {
    // Accessible aux membres et plus
  }

  @Post()
  @RequireMemberManage("organisation")
  async createMember() {
    // Accessible aux gestionnaires et propriétaires
  }
}
```

### 2. Service de permissions

```typescript
import { PermissionsService } from "./permissions.service";

@Injectable()
export class MyService {
  constructor(private permissionsService: PermissionsService) {}

  async checkUserPermission(userId: string, resource: string, action: string) {
    return this.permissionsService.hasPermission(userId, {
      resource,
      action,
      scope: "organisation",
    });
  }
}
```

### 3. Vérification manuelle

```typescript
// Vérifier une permission spécifique
const canCreateEvents = await permissionsService.hasPermission(
  userId,
  { resource: "events", action: "create", scope: "organisation" },
  organisationId
);

// Vérifier dans un espace spécifique
const canManageEquipment = await permissionsService.hasPermissionInSpace(
  userId,
  { resource: "equipment", action: "manage", scope: "global" },
  "municipality"
);
```

## Migration

### 1. Appliquer les migrations Prisma

```bash
npx prisma migrate dev --name add-permissions-system
```

### 2. Initialiser les rôles et permissions

```bash
npx ts-node prisma/seed-roles-permissions.ts
```

### 3. Migrer les données existantes

```bash
npx ts-node prisma/migrate-roles.ts
```

## Sécurité

### 1. Principes

- **Principe du moindre privilège** : Chaque rôle a uniquement les permissions nécessaires
- **Séparation des espaces** : Les utilisateurs municipaux ne peuvent pas accéder aux données des clubs
- **Vérification systématique** : Tous les endpoints sensibles sont protégés

### 2. Bonnes pratiques

- Utiliser les décorateurs pour définir les permissions requises
- Vérifier les permissions côté serveur, jamais côté client
- Implémenter des logs d'audit pour les actions sensibles
- Réviser régulièrement les permissions accordées

## Exemples d'utilisation

### Contrôleur d'événements

```typescript
@Controller("events")
@UseGuards(PermissionsGuard)
export class EventsController {
  // Lecture - accessible aux membres
  @Get()
  @RequireEventRead("organisation")
  async getEvents() {}

  // Création - accessible aux gestionnaires
  @Post()
  @RequireEventWrite("organisation")
  async createEvent() {}

  // Gestion complète - accessible aux propriétaires
  @Put(":id")
  @RequireEventManage("organisation")
  async updateEvent() {}
}
```

### Contrôleur municipal

```typescript
@Controller("municipal")
@UseGuards(PermissionsGuard)
export class MunicipalController {
  // Accès aux données agrégées
  @Get("organisations")
  @RequireMunicipalAccess()
  async getOrganisations() {}

  // Gestion des équipements
  @Get("equipment")
  @RequireEquipmentManage()
  async getEquipment() {}
}
```

## Maintenance

### Ajouter une nouvelle permission

1. Ajouter la permission dans `seed-roles-permissions.ts`
2. Créer un décorateur dans `permissions.decorator.ts`
3. Mettre à jour les rôles concernés
4. Tester la nouvelle permission

### Ajouter un nouveau rôle

1. Ajouter le type dans l'enum `RoleType`
2. Définir les permissions dans `seed-roles-permissions.ts`
3. Mettre à jour la logique de migration si nécessaire
4. Documenter le nouveau rôle

## Monitoring

- Surveiller les tentatives d'accès non autorisées
- Logger les changements de permissions
- Analyser l'utilisation des rôles
- Réviser régulièrement les permissions accordées
