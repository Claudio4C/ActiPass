import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Types pour les permissions
interface PermissionData {
  name: string;
  slug: string;
  resource: string;
  action: string;
  scope: 'own' | 'organisation' | 'global';
}

// Types pour les rôles
interface RoleData {
  name: string;
  slug: string;
  description: string;
  space: 'club_360' | 'municipality';
  type:
    | 'club_owner'
    | 'club_manager'
    | 'treasurer'
    | 'coach'
    | 'member'
    | 'municipal_admin'
    | 'municipal_manager'
    | 'municipal_viewer';
  level: number;
  is_default: boolean;
  permissions: string[];
}

async function seedRolesAndPermissions() {
  console.log('🌱 Seeding roles and permissions...');

  // 1. Créer les permissions selon les scopes du PDF (module:action)
  const permissions: PermissionData[] = [
    // 6.1 Annuaire & Profils
    {
      name: 'Lire les profils',
      slug: 'directory:read',
      resource: 'directory',
      action: 'read',
      scope: 'organisation',
    },
    {
      name: 'Modifier les profils',
      slug: 'directory:update',
      resource: 'directory',
      action: 'update',
      scope: 'organisation',
    },
    {
      name: 'Inviter des utilisateurs',
      slug: 'directory:invite',
      resource: 'directory',
      action: 'invite',
      scope: 'organisation',
    },
    {
      name: 'Fusionner des doublons',
      slug: 'directory:merge',
      resource: 'directory',
      action: 'merge',
      scope: 'organisation',
    },

    // 6.2 Activités & Catalogues
    {
      name: 'Consulter les activités',
      slug: 'activity:read',
      resource: 'activity',
      action: 'read',
      scope: 'organisation',
    },
    {
      name: 'Gérer les activités',
      slug: 'activity:manage',
      resource: 'activity',
      action: 'manage',
      scope: 'organisation',
    },
    {
      name: 'Gérer les tarifs',
      slug: 'pricing:manage',
      resource: 'pricing',
      action: 'manage',
      scope: 'organisation',
    },

    // 6.2.1 Événements (stages, tournois, compétitions, cours)
    {
      name: 'Lire les événements',
      slug: 'events:read',
      resource: 'events',
      action: 'read',
      scope: 'organisation',
    },
    {
      name: 'Créer des événements',
      slug: 'events:create',
      resource: 'events',
      action: 'create',
      scope: 'organisation',
    },
    {
      name: 'Modifier des événements',
      slug: 'events:update',
      resource: 'events',
      action: 'update',
      scope: 'organisation',
    },
    {
      name: 'Supprimer des événements',
      slug: 'events:delete',
      resource: 'events',
      action: 'delete',
      scope: 'organisation',
    },
    {
      name: 'Gérer les événements',
      slug: 'events:manage',
      resource: 'events',
      action: 'manage',
      scope: 'organisation',
    },

    // 6.3 Réservations & Planning
    {
      name: 'Consulter les créneaux',
      slug: 'booking:read',
      resource: 'booking',
      action: 'read',
      scope: 'organisation',
    },
    {
      name: 'Créer une réservation',
      slug: 'booking:create',
      resource: 'booking',
      action: 'create',
      scope: 'own',
    },
    {
      name: 'Modifier une réservation',
      slug: 'booking:update',
      resource: 'booking',
      action: 'update',
      scope: 'own',
    },
    {
      name: 'Annuler une réservation',
      slug: 'booking:cancel',
      resource: 'booking',
      action: 'cancel',
      scope: 'own',
    },
    {
      name: 'Gérer les présences',
      slug: 'attendance:manage',
      resource: 'attendance',
      action: 'manage',
      scope: 'organisation',
    },

    // 6.4 Paiements & Comptabilité
    {
      name: 'Lire les transactions',
      slug: 'finance:read',
      resource: 'finance',
      action: 'read',
      scope: 'organisation',
    },
    {
      name: 'Encaisser un paiement',
      slug: 'finance:charge',
      resource: 'finance',
      action: 'charge',
      scope: 'organisation',
    },
    {
      name: 'Effectuer un remboursement',
      slug: 'finance:refund',
      resource: 'finance',
      action: 'refund',
      scope: 'organisation',
    },
    {
      name: 'Exporter la comptabilité',
      slug: 'finance:export',
      resource: 'finance',
      action: 'export',
      scope: 'organisation',
    },

    // 6.5 Dossiers & Documents
    {
      name: 'Lire les dossiers',
      slug: 'case:read',
      resource: 'case',
      action: 'read',
      scope: 'organisation',
    },
    {
      name: 'Modifier les dossiers',
      slug: 'case:update',
      resource: 'case',
      action: 'update',
      scope: 'organisation',
    },
    {
      name: 'Déposer des documents',
      slug: 'document:upload',
      resource: 'document',
      action: 'upload',
      scope: 'own',
    },
    {
      name: 'Partager des documents',
      slug: 'document:share',
      resource: 'document',
      action: 'share',
      scope: 'organisation',
    },

    // 6.6 Subventions & Conventions
    {
      name: 'Lire les subventions',
      slug: 'subsidy:read',
      resource: 'subsidy',
      action: 'read',
      scope: 'organisation',
    },
    {
      name: 'Créer une demande',
      slug: 'subsidy:apply',
      resource: 'subsidy',
      action: 'apply',
      scope: 'organisation',
    },
    {
      name: 'Soumettre une demande',
      slug: 'subsidy:submit',
      resource: 'subsidy',
      action: 'submit',
      scope: 'organisation',
    },
    {
      name: 'Instruire un dossier',
      slug: 'subsidy:review',
      resource: 'subsidy',
      action: 'review',
      scope: 'global',
    },
    {
      name: 'Approuver une subvention',
      slug: 'subsidy:approve',
      resource: 'subsidy',
      action: 'approve',
      scope: 'global',
    },
    {
      name: 'Gérer les conventions',
      slug: 'convention:manage',
      resource: 'convention',
      action: 'manage',
      scope: 'global',
    },

    // 6.7 Équipements & Occupation
    {
      name: 'Gérer les équipements',
      slug: 'facility:manage',
      resource: 'facility',
      action: 'manage',
      scope: 'global',
    },
    {
      name: "Métriques d'occupation",
      slug: 'facility:metrics',
      resource: 'facility',
      action: 'metrics',
      scope: 'global',
    },

    // 6.7.1 Gestion des Organisations
    {
      name: 'Lire les organisations',
      slug: 'organisation:read',
      resource: 'organisation',
      action: 'read',
      scope: 'organisation',
    },
    {
      name: 'Créer des organisations',
      slug: 'organisation:create',
      resource: 'organisation',
      action: 'create',
      scope: 'global',
    },
    {
      name: 'Modifier les organisations',
      slug: 'organisation:update',
      resource: 'organisation',
      action: 'update',
      scope: 'own',
    },
    {
      name: 'Supprimer les organisations',
      slug: 'organisation:delete',
      resource: 'organisation',
      action: 'delete',
      scope: 'own',
    },
    {
      name: 'Gérer les organisations',
      slug: 'organisation:manage',
      resource: 'organisation',
      action: 'manage',
      scope: 'own',
    },

    // 6.8 Reporting & Exports
    {
      name: 'Consulter les rapports',
      slug: 'report:read',
      resource: 'report',
      action: 'read',
      scope: 'organisation',
    },
    {
      name: 'Exporter des rapports',
      slug: 'report:export',
      resource: 'report',
      action: 'export',
      scope: 'organisation',
    },

    // 6.9 Notifications & Communication
    {
      name: 'Envoyer des messages',
      slug: 'comm:message',
      resource: 'comm',
      action: 'message',
      scope: 'organisation',
    },
    {
      name: 'Publier des annonces',
      slug: 'comm:announce',
      resource: 'comm',
      action: 'announce',
      scope: 'organisation',
    },

    // 6.10 Sécurité & Paramétrage
    {
      name: "Gérer l'authentification",
      slug: 'auth:manage',
      resource: 'auth',
      action: 'manage',
      scope: 'organisation',
    },
    {
      name: 'Attribuer des rôles',
      slug: 'role:assign',
      resource: 'role',
      action: 'assign',
      scope: 'organisation',
    },
    {
      name: 'Déléguer des rôles',
      slug: 'role:delegate',
      resource: 'role',
      action: 'delegate',
      scope: 'organisation',
    },
    {
      name: "Lire l'audit",
      slug: 'audit:read',
      resource: 'audit',
      action: 'read',
      scope: 'organisation',
    },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { slug: perm.slug },
      update: perm,
      create: perm,
    });
  }

  // 2. Créer les rôles pour l'Espace 360° (selon le PDF section 5.2)
  const clubRoles: RoleData[] = [
    {
      name: 'Club Owner',
      slug: 'club-owner',
      description: 'Propriétaire du tenant club ; possède tous les droits sur les entités du club',
      space: 'club_360',
      type: 'club_owner',
      level: 100,
      is_default: false,
      permissions: [
        'directory:*',
        'activity:*',
        'events:*',
        'booking:*',
        'case:*',
        'document:*',
        'finance:*',
        'report:*',
        'comm:*',
        'role:assign',
        'auth:manage',
        'audit:read',
        'organisation:*',
      ],
    },
    {
      name: 'Club Admin',
      slug: 'club-admin',
      description: 'Gestion quotidienne des activités, plannings, adhésions, dossiers',
      space: 'club_360',
      type: 'club_manager',
      level: 90,
      is_default: false,
      permissions: [
        'directory:*',
        'activity:manage',
        'events:*',
        'booking:*',
        'case:*',
        'document:*',
        'report:*',
      ],
    },
    {
      name: 'Trésorier/Comptable',
      slug: 'treasurer',
      description: 'Gestion de la tarification, des encaissements, des remboursements',
      space: 'club_360',
      type: 'treasurer',
      level: 80,
      is_default: false,
      permissions: ['pricing:manage', 'finance:*', 'report:export'],
    },
    {
      name: 'Coach',
      slug: 'coach',
      description: 'Accès à ses créneaux, feuilles de présence, messagerie avec ses adhérents',
      space: 'club_360',
      type: 'coach',
      level: 50,
      is_default: false,
      permissions: [
        'events:read',
        'events:create',
        'events:update',
        'booking:read',
        'attendance:manage',
        'comm:message',
        'case:read',
      ],
    },
    {
      name: 'Adhérent',
      slug: 'member',
      description: 'Gestion de son profil, de ses inscriptions et paiements',
      space: 'club_360',
      type: 'member',
      level: 20,
      is_default: true,
      permissions: ['booking:create', 'booking:update', 'booking:cancel', 'document:upload'],
    },
  ];

  // 3. Créer les rôles pour le Portail Municipal (selon le PDF section 5.1)
  const municipalRoles: RoleData[] = [
    {
      name: 'Mairie Admin',
      slug: 'municipal-admin',
      description:
        'Gestion complète du portail (équipements, conventions, subventions, reporting, audit)',
      space: 'municipality',
      type: 'municipal_admin',
      level: 100,
      is_default: false,
      permissions: [
        'facility:*',
        'subsidy:*',
        'convention:manage',
        'report:*',
        'audit:read',
        'role:assign',
        'auth:manage',
      ],
    },
    {
      name: 'Mairie Gestionnaire',
      slug: 'municipal-manager',
      description: 'Gestion des équipements et subventions',
      space: 'municipality',
      type: 'municipal_manager',
      level: 80,
      is_default: false,
      permissions: [
        'facility:manage',
        'booking:read',
        'facility:metrics',
        'convention:manage',
        'subsidy:review',
        'subsidy:approve',
        'report:read',
        'report:export',
      ],
    },
    {
      name: 'Mairie Lecteur',
      slug: 'municipal-viewer',
      description: 'Accès en lecture seule aux indicateurs (occupation, subventions)',
      space: 'municipality',
      type: 'municipal_viewer',
      level: 30,
      is_default: true,
      permissions: ['booking:read', 'facility:metrics', 'subsidy:read', 'report:read'],
    },
  ];

  // Créer tous les rôles
  for (const roleData of [...clubRoles, ...municipalRoles]) {
    const { permissions: rolePermissions, ...roleInfo } = roleData;

    const role = await prisma.role.upsert({
      where: { slug: roleInfo.slug },
      update: roleInfo,
      create: roleInfo,
    });

    // Assigner les permissions au rôle
    for (const permSlug of rolePermissions) {
      // Gérer les permissions wildcard (ex: directory:*)
      if (permSlug.endsWith(':*')) {
        const resource = permSlug.replace(':*', '');
        const resourcePermissions = await prisma.permission.findMany({
          where: {
            resource: resource,
          },
        });

        for (const permission of resourcePermissions) {
          await prisma.rolePermission.upsert({
            where: {
              role_id_permission_id: {
                role_id: role.id,
                permission_id: permission.id,
              },
            },
            update: {},
            create: {
              role_id: role.id,
              permission_id: permission.id,
            },
          });
        }
      } else {
        const permission = await prisma.permission.findUnique({
          where: { slug: permSlug },
        });

        if (permission) {
          await prisma.rolePermission.upsert({
            where: {
              role_id_permission_id: {
                role_id: role.id,
                permission_id: permission.id,
              },
            },
            update: {},
            create: {
              role_id: role.id,
              permission_id: permission.id,
            },
          });
        }
      }
    }
  }

  console.log('✅ Roles and permissions seeded successfully!');
}

seedRolesAndPermissions()
  .catch((e) => {
    console.error('❌ Error seeding roles and permissions:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
