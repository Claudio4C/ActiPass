import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function testSuperAdminLogin() {
  console.log('🧪 Test de connexion Super Admin...\n');

  try {
    // Récupérer le Super Admin
    const superAdmin = await prisma.user.findUnique({
      where: { email: 'superadmin@ikivio.com' },
      select: {
        id: true,
        email: true,
        password: true,
        status: true,
        is_super_admin: true,
        firstname: true,
        lastname: true,
      },
    });

    if (!superAdmin) {
      console.log('❌ Super Admin non trouvé');
      return;
    }

    console.log('👤 Super Admin trouvé:');
    console.log('  Email:', superAdmin.email);
    console.log('  Statut:', superAdmin.status);
    console.log('  Super Admin:', superAdmin.is_super_admin);

    // Tester le mot de passe
    const password = 'SuperAdmin123!';
    const isPasswordValid = superAdmin.password
      ? await bcrypt.compare(password, superAdmin.password)
      : false;

    console.log('\n🔐 Test du mot de passe:');
    console.log('  Mot de passe fourni:', password);
    console.log('  Mot de passe valide:', isPasswordValid);

    if (isPasswordValid && superAdmin.status === 'active') {
      console.log('\n✅ Super Admin prêt pour la connexion !');
      console.log('Vous pouvez maintenant vous connecter avec:');
      console.log('Email: superadmin@ikivio.com');
      console.log('Password: SuperAdmin123!');
    } else {
      console.log('\n❌ Problème de connexion:');
      if (!isPasswordValid) console.log('  - Mot de passe incorrect');
      if (superAdmin.status !== 'active') console.log('  - Statut:', superAdmin.status);
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSuperAdminLogin().catch(console.error);
