import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function createSuperAdmin() {
  console.log('🔐 Création du Super Admin...\n');

  try {
    // 1. Créer l'utilisateur super admin
    const hashedPassword = await bcrypt.hash('SuperAdmin123!', 10);

    const superAdmin = await prisma.user.upsert({
      where: { email: 'superadmin@ikivio.com' },
      update: {},
      create: {
        email: 'superadmin@ikivio.com',
        username: 'superadmin',
        firstname: 'Super',
        lastname: 'Admin',
        password: hashedPassword,
        is_email_verified: true,
        gender: 'prefer_not_to_say',
        is_super_admin: true, // Champ spécial pour super admin
      },
    });

    console.log('✅ Super Admin créé:', superAdmin.email);

    // 2. Créer le rôle Super Admin
    const superAdminRole = await prisma.role.upsert({
      where: { slug: 'super-admin' },
      update: {},
      create: {
        name: 'Super Admin',
        slug: 'super-admin',
        description: 'Administrateur système avec tous les droits',
        space: 'club_360',
        type: 'club_owner',
        level: 1000, // Niveau le plus élevé
        is_default: false,
      },
    });

    console.log('✅ Rôle Super Admin créé:', superAdminRole.name);

    // 3. Créer toutes les permissions pour le super admin
    const allPermissions = await prisma.permission.findMany();

    for (const permission of allPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          role_id_permission_id: {
            role_id: superAdminRole.id,
            permission_id: permission.id,
          },
        },
        update: {},
        create: {
          role_id: superAdminRole.id,
          permission_id: permission.id,
        },
      });
    }

    console.log(`✅ ${allPermissions.length} permissions assignées au Super Admin`);

    // 4. Créer un membership global pour le super admin (optionnel)
    // Le super admin n'a pas besoin d'être dans une organisation spécifique
    console.log('✅ Super Admin configuré (pas de membership nécessaire)');

    console.log('\n🎯 Super Admin prêt !');
    console.log('Email: superadmin@ikivio.com');
    console.log('Password: SuperAdmin123!');
    console.log('Niveau: 1000 (accès total)');
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin().catch(console.error);
