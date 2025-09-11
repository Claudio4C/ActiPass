import { PrismaClient, RoleType } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateExistingRoles() {
  console.log('🔄 Migrating existing roles to new structure...');

  try {
    // 1. Mettre à jour les rôles existants avec les nouveaux champs
    const existingRoles = await prisma.role.findMany();

    for (const role of existingRoles) {
      // Déterminer l'espace et le type basé sur le nom du rôle
      let space: 'club_360' | 'municipality' = 'club_360';
      let type: string = 'member';

      if (role.name.toLowerCase().includes('admin') || role.name.toLowerCase().includes('owner')) {
        type = 'club_owner';
      } else if (
        role.name.toLowerCase().includes('manager') ||
        role.name.toLowerCase().includes('gestionnaire')
      ) {
        type = 'club_manager';
      } else if (
        role.name.toLowerCase().includes('coach') ||
        role.name.toLowerCase().includes('animateur')
      ) {
        type = 'coach';
      } else if (
        role.name.toLowerCase().includes('municipal') ||
        role.name.toLowerCase().includes('mairie')
      ) {
        space = 'municipality';
        type = 'municipal_viewer';
      }

      await prisma.role.update({
        where: { id: role.id },
        data: {
          space: space,
          type: type as RoleType,
        },
      });

      console.log(`✅ Updated role: ${role.name} -> ${space}/${type}`);
    }

    // 2. Créer les permissions de base si elles n'existent pas
    const basicPermissions = [
      {
        name: 'Créer des événements',
        slug: 'events.create',
        resource: 'events',
        action: 'create',
        scope: 'organisation',
      },
      {
        name: 'Lire les événements',
        slug: 'events.read',
        resource: 'events',
        action: 'read',
        scope: 'organisation',
      },
      {
        name: 'Modifier les événements',
        slug: 'events.update',
        resource: 'events',
        action: 'update',
        scope: 'organisation',
      },
      {
        name: 'Supprimer les événements',
        slug: 'events.delete',
        resource: 'events',
        action: 'delete',
        scope: 'organisation',
      },
      {
        name: 'Gérer les événements',
        slug: 'events.manage',
        resource: 'events',
        action: 'manage',
        scope: 'organisation',
      },
      {
        name: 'Créer des membres',
        slug: 'members.create',
        resource: 'members',
        action: 'create',
        scope: 'organisation',
      },
      {
        name: 'Lire les membres',
        slug: 'members.read',
        resource: 'members',
        action: 'read',
        scope: 'organisation',
      },
      {
        name: 'Modifier les membres',
        slug: 'members.update',
        resource: 'members',
        action: 'update',
        scope: 'organisation',
      },
      {
        name: 'Supprimer les membres',
        slug: 'members.delete',
        resource: 'members',
        action: 'delete',
        scope: 'organisation',
      },
      {
        name: 'Gérer les membres',
        slug: 'members.manage',
        resource: 'members',
        action: 'manage',
        scope: 'organisation',
      },
      {
        name: "Gérer l'organisation",
        slug: 'organisation.manage',
        resource: 'organisation',
        action: 'manage',
        scope: 'organisation',
      },
      {
        name: "Lire l'organisation",
        slug: 'organisation.read',
        resource: 'organisation',
        action: 'read',
        scope: 'organisation',
      },
    ];

    for (const perm of basicPermissions) {
      await prisma.permission.upsert({
        where: { slug: perm.slug },
        update: perm,
        create: perm,
      });
    }

    // 3. Assigner des permissions de base aux rôles existants
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    for (const role of roles) {
      // Si le rôle n'a pas de permissions, lui en assigner selon son type
      if (role.permissions.length === 0) {
        let permissionsToAssign: string[] = [];

        switch (role.type) {
          case 'club_owner':
            permissionsToAssign = ['events.manage', 'members.manage', 'organisation.manage'];
            break;
          case 'club_manager':
            permissionsToAssign = [
              'events.create',
              'events.read',
              'events.update',
              'members.read',
              'members.update',
              'organisation.read',
            ];
            break;
          case 'coach':
            permissionsToAssign = ['events.read', 'events.update', 'members.read'];
            break;
          case 'member':
            permissionsToAssign = ['events.read', 'organisation.read'];
            break;
          case 'municipal_admin':
            permissionsToAssign = ['organisation.read'];
            break;
          case 'municipal_viewer':
            permissionsToAssign = ['organisation.read'];
            break;
        }

        // Assigner les permissions
        for (const permSlug of permissionsToAssign) {
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

        console.log(`✅ Assigned permissions to role: ${role.name}`);
      }
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
}

migrateExistingRoles()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
