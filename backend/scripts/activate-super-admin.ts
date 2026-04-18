import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function activateSuperAdmin() {
  console.log('🔐 Activation du Super Admin...\n');

  try {
    // Activer le Super Admin
    const superAdmin = await prisma.user.update({
      where: { email: 'superadmin@ikivio.com' },
      data: {
        status: 'active',
        is_email_verified: true,
      },
      select: {
        id: true,
        email: true,
        status: true,
        is_super_admin: true,
        firstname: true,
        lastname: true,
      },
    });

    console.log('✅ Super Admin activé:');
    console.log('  Email:', superAdmin.email);
    console.log('  Nom:', superAdmin.firstname, superAdmin.lastname);
    console.log('  Statut:', superAdmin.status);
    console.log('  Super Admin:', superAdmin.is_super_admin);

    console.log('\n🎯 Vous pouvez maintenant vous connecter avec:');
    console.log('Email: superadmin@ikivio.com');
    console.log('Password: SuperAdmin123!');
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

activateSuperAdmin().catch(console.error);
