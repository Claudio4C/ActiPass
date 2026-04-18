import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function checkSuperAdmin() {
  console.log('🔍 Vérification du Super Admin...\n');

  try {
    // Vérifier si le Super Admin existe
    const superAdmin = await prisma.user.findUnique({
      where: { email: 'superadmin@ikivio.com' },
      select: {
        id: true,
        email: true,
        is_super_admin: true,
        status: true,
        firstname: true,
        lastname: true,
      },
    });

    if (superAdmin) {
      console.log('✅ Super Admin trouvé:');
      console.log('  Email:', superAdmin.email);
      console.log('  Nom:', superAdmin.firstname, superAdmin.lastname);
      console.log('  Super Admin:', superAdmin.is_super_admin);
      console.log('  Statut:', superAdmin.status);
    } else {
      console.log('❌ Super Admin non trouvé');
      console.log('Création du Super Admin...');

      // Créer le Super Admin
      const hashedPassword = await import('bcrypt').then((bcrypt) =>
        bcrypt.hash('SuperAdmin123!', 10)
      );

      const newSuperAdmin = await prisma.user.create({
        data: {
          email: 'superadmin@ikivio.com',
          username: 'superadmin',
          firstname: 'Super',
          lastname: 'Admin',
          password: hashedPassword,
          is_email_verified: true,
          gender: 'prefer_not_to_say',
          is_super_admin: true,
          status: 'active',
        },
      });

      console.log('✅ Super Admin créé:', newSuperAdmin.email);
    }

    // Lister tous les utilisateurs avec is_super_admin = true
    const allSuperAdmins = await prisma.user.findMany({
      where: { is_super_admin: true },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        status: true,
      },
    });

    console.log('\n👑 Tous les Super Admins:');
    allSuperAdmins.forEach((admin, index) => {
      console.log(
        `  ${index + 1}. ${admin.firstname} ${admin.lastname} (${admin.email}) - ${admin.status}`
      );
    });
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSuperAdmin().catch(console.error);
