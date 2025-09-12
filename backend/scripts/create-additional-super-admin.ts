import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdditionalSuperAdmin() {
  console.log("👑 Création d'un Super Admin supplémentaire...\n");

  try {
    // Données du nouveau Super Admin
    const superAdminData = {
      email: 'admin2@ikivio.com',
      username: 'admin2',
      firstname: 'Admin',
      lastname: 'Second',
      password: 'Admin2Password123!',
      gender: 'prefer_not_to_say' as const,
    };

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: superAdminData.email },
    });

    if (existingUser) {
      console.log('⚠️  Utilisateur existe déjà, mise à jour...');

      // Mettre à jour pour en faire un Super Admin
      const hashedPassword = await bcrypt.hash(superAdminData.password, 10);

      const updatedUser = await prisma.user.update({
        where: { email: superAdminData.email },
        data: {
          is_super_admin: true,
          status: 'active',
          password: hashedPassword,
        },
        select: { id: true, email: true, is_super_admin: true, status: true },
      });

      console.log('✅ Utilisateur mis à jour en Super Admin:', updatedUser.email);
    } else {
      // Créer un nouveau Super Admin
      const hashedPassword = await bcrypt.hash(superAdminData.password, 10);

      const newSuperAdmin = await prisma.user.create({
        data: {
          email: superAdminData.email,
          username: superAdminData.username,
          firstname: superAdminData.firstname,
          lastname: superAdminData.lastname,
          password: hashedPassword,
          is_email_verified: true,
          gender: superAdminData.gender,
          is_super_admin: true,
          status: 'active',
        },
        select: { id: true, email: true, is_super_admin: true, status: true },
      });

      console.log('✅ Nouveau Super Admin créé:', newSuperAdmin.email);
    }

    // Lister tous les Super Admins
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

    console.log('\n🎯 Nouveaux identifiants:');
    console.log('Email:', superAdminData.email);
    console.log('Password:', superAdminData.password);
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdditionalSuperAdmin().catch(console.error);
