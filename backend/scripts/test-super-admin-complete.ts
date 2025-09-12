import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function testSuperAdminComplete() {
  console.log('🧪 TEST COMPLET DU SUPER ADMIN');
  console.log('================================\n');

  try {
    // 1. Vérifier l'existence du Super Admin
    console.log('1️⃣ Vérification du Super Admin...');
    const superAdmin = await prisma.user.findFirst({
      where: { is_super_admin: true },
      select: {
        id: true,
        email: true,
        username: true,
        firstname: true,
        lastname: true,
        status: true,
        is_super_admin: true,
        created_at: true,
        password: true,
      },
    });

    if (!superAdmin) {
      console.log('❌ Aucun Super Admin trouvé !');
      return;
    }

    console.log('✅ Super Admin trouvé :');
    console.log(`   📧 Email: ${superAdmin.email}`);
    console.log(`   👤 Nom: ${superAdmin.firstname} ${superAdmin.lastname}`);
    console.log(`   🔑 Username: ${superAdmin.username}`);
    console.log(`   📊 Status: ${superAdmin.status}`);
    console.log(`   ⚡ Super Admin: ${superAdmin.is_super_admin}`);
    console.log(`   📅 Créé le: ${superAdmin.created_at}\n`);

    // 2. Tester la connexion
    console.log('2️⃣ Test de connexion...');
    const testPassword = 'SuperAdmin123!';
    const passwordMatch = await bcrypt.compare(testPassword, superAdmin.password || '');

    if (passwordMatch) {
      console.log('✅ Mot de passe correct !');
    } else {
      console.log('❌ Mot de passe incorrect !');
    }

    // 3. Vérifier les organisations
    console.log('\n3️⃣ Vérification des organisations...');
    const organisations = await prisma.organisation.findMany({
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstname: true,
                lastname: true,
              },
            },
            role: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    console.log(`📊 Nombre d'organisations: ${organisations.length}`);
    organisations.forEach((org, index) => {
      console.log(`   ${index + 1}. ${org.name} (${org.type}) - ${org.memberships.length} membres`);
    });

    // 4. Vérifier les utilisateurs
    console.log('\n4️⃣ Vérification des utilisateurs...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        firstname: true,
        lastname: true,
        status: true,
        is_super_admin: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    console.log(`👥 Nombre d'utilisateurs: ${users.length}`);
    users.forEach((user, index) => {
      const superAdminBadge = user.is_super_admin ? ' ⚡' : '';
      console.log(`   ${index + 1}. ${user.email} (${user.status})${superAdminBadge}`);
    });

    // 5. Statistiques globales
    console.log('\n5️⃣ Statistiques globales...');
    const [totalUsers, activeUsers, totalOrganisations, activeOrganisations, totalMemberships] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: 'active' } }),
        prisma.organisation.count(),
        prisma.organisation.count({ where: { deleted_at: null } }),
        prisma.membership.count({ where: { left_at: null } }),
      ]);

    console.log('📈 Statistiques :');
    console.log(`   👥 Utilisateurs: ${totalUsers} (${activeUsers} actifs)`);
    console.log(`   🏢 Organisations: ${totalOrganisations} (${activeOrganisations} actives)`);
    console.log(`   🔗 Membres: ${totalMemberships}`);

    // 6. Test des permissions
    console.log('\n6️⃣ Test des permissions Super Admin...');
    const superAdminPermissions = await prisma.role.findFirst({
      where: { name: 'club_owner' },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (superAdminPermissions) {
      console.log('🔐 Permissions du Super Admin :');
      superAdminPermissions.permissions.forEach((rolePermission, index) => {
        console.log(
          `   ${index + 1}. ${rolePermission.permission.resource}:${rolePermission.permission.action}`
        );
      });
    }

    console.log('\n✅ TEST COMPLET TERMINÉ !');
    console.log('🎯 Le Super Admin est prêt à être utilisé !');
  } catch (error) {
    console.error('❌ Erreur lors du test :', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSuperAdminComplete();
