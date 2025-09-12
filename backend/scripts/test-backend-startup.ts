import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testBackendStartup() {
  console.log('🧪 Test de démarrage du backend...\n');

  try {
    // 1. Tester la connexion à la base de données
    console.log('📊 Test de connexion à la base de données...');
    await prisma.$connect();
    console.log('✅ Connexion à la base de données réussie');

    // 2. Vérifier que les rôles existent
    console.log('\n🎭 Vérification des rôles...');
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        level: true,
      },
    });
    console.log(`✅ ${roles.length} rôles trouvés`);

    // 3. Vérifier que les permissions existent
    console.log('\n🔐 Vérification des permissions...');
    const permissions = await prisma.permission.findMany({
      select: {
        id: true,
        slug: true,
        resource: true,
        action: true,
      },
    });
    console.log(`✅ ${permissions.length} permissions trouvées`);

    // 4. Vérifier que les utilisateurs de test existent
    console.log('\n👤 Vérification des utilisateurs de test...');
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: [
            'club.owner@test.com',
            'club.manager@test.com',
            'coach@test.com',
            'member@test.com',
            'municipal.manager@test.com',
          ],
        },
      },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        status: true,
      },
    });
    console.log(`✅ ${users.length} utilisateurs de test trouvés`);

    // 5. Vérifier que les organisations de test existent
    console.log('\n🏢 Vérification des organisations de test...');
    const organisations = await prisma.organisation.findMany({
      where: {
        slug: {
          in: ['club-judo-test', 'asso-theatre-test'],
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
      },
    });
    console.log(`✅ ${organisations.length} organisations de test trouvées`);

    console.log('\n🎉 Backend prêt pour les tests !');
    console.log('\n📋 RÉSUMÉ:');
    console.log('==========');
    console.log(`- ${roles.length} rôles configurés`);
    console.log(`- ${permissions.length} permissions configurées`);
    console.log(`- ${users.length} utilisateurs de test`);
    console.log(`- ${organisations.length} organisations de test`);

    console.log('\n🚀 Vous pouvez maintenant tester avec Postman !');
    console.log('\n🔐 COMPTES DE TEST:');
    console.log('-------------------');
    users.forEach((user) => {
      console.log(`- ${user.email} (${user.firstname} ${user.lastname}) - ${user.status}`);
    });

    console.log('\n🏢 ORGANISATIONS:');
    console.log('-----------------');
    organisations.forEach((org) => {
      console.log(`- ${org.name} (${org.type}) - ID: ${org.id}`);
    });
  } catch (error) {
    console.error('❌ Erreur lors du test de démarrage:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testBackendStartup().catch(console.error);
