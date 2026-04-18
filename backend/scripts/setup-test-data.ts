import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function setupTestData() {
  console.log('🧪 Configuration des données de test pour Postman...\n');

  try {
    // 1. Créer des utilisateurs de test
    console.log('👤 Création des utilisateurs de test...');

    const testUsers = await Promise.all([
      // Club Owner
      prisma.user.upsert({
        where: { email: 'club.owner@test.com' },
        update: {},
        create: {
          email: 'club.owner@test.com',
          password: '$2b$10$rQZ8K9vL8mN7pQ6rS5tT.uVwXyZ1aB2cD3eF4gH5iJ6kL7mN8oP9qR', // password: test123
          firstname: 'Jean',
          lastname: 'Dupont',
          username: 'jean.dupont',
          gender: 'male',
          status: 'active',
          is_email_verified: true,
        },
      }),
      // Club Manager
      prisma.user.upsert({
        where: { email: 'club.manager@test.com' },
        update: {},
        create: {
          email: 'club.manager@test.com',
          password: '$2b$10$rQZ8K9vL8mN7pQ6rS5tT.uVwXyZ1aB2cD3eF4gH5iJ6kL7mN8oP9qR', // password: test123
          firstname: 'Marie',
          lastname: 'Martin',
          username: 'marie.martin',
          gender: 'female',
          status: 'active',
          is_email_verified: true,
        },
      }),
      // Coach
      prisma.user.upsert({
        where: { email: 'coach@test.com' },
        update: {},
        create: {
          email: 'coach@test.com',
          password: '$2b$10$rQZ8K9vL8mN7pQ6rS5tT.uVwXyZ1aB2cD3eF4gH5iJ6kL7mN8oP9qR', // password: test123
          firstname: 'Pierre',
          lastname: 'Durand',
          username: 'pierre.durand',
          gender: 'male',
          status: 'active',
          is_email_verified: true,
        },
      }),
      // Member
      prisma.user.upsert({
        where: { email: 'member@test.com' },
        update: {},
        create: {
          email: 'member@test.com',
          password: '$2b$10$rQZ8K9vL8mN7pQ6rS5tT.uVwXyZ1aB2cD3eF4gH5iJ6kL7mN8oP9qR', // password: test123
          firstname: 'Sophie',
          lastname: 'Bernard',
          username: 'sophie.bernard',
          gender: 'female',
          status: 'active',
          is_email_verified: true,
        },
      }),
      // Municipal Manager
      prisma.user.upsert({
        where: { email: 'municipal.manager@test.com' },
        update: {},
        create: {
          email: 'municipal.manager@test.com',
          password: '$2b$10$rQZ8K9vL8mN7pQ6rS5tT.uVwXyZ1aB2cD3eF4gH5iJ6kL7mN8oP9qR', // password: test123
          firstname: 'Alain',
          lastname: 'Moreau',
          username: 'alain.moreau',
          gender: 'male',
          status: 'active',
          is_email_verified: true,
        },
      }),
    ]);

    console.log(`✅ ${testUsers.length} utilisateurs créés`);

    // 2. Créer des organisations de test
    console.log('\n🏢 Création des organisations de test...');

    const club = await prisma.organisation.upsert({
      where: { slug: 'club-judo-test' },
      update: {},
      create: {
        name: 'Club de Judo Test',
        slug: 'club-judo-test',
        type: 'sport',
        description: 'Club de judo pour les tests',
        address: '123 Rue du Sport, 75001 Paris',
        phone: '01 23 45 67 89',
        email: 'contact@club-judo-test.com',
        website_url: 'https://club-judo-test.com',
        created_by_id: testUsers[0].id, // Club Owner
      },
    });

    const association = await prisma.organisation.upsert({
      where: { slug: 'asso-theatre-test' },
      update: {},
      create: {
        name: 'Association Théâtre Test',
        slug: 'asso-theatre-test',
        type: 'culture',
        description: 'Association de théâtre pour les tests',
        address: '456 Avenue de la Culture, 75002 Paris',
        phone: '01 98 76 54 32',
        email: 'contact@asso-theatre-test.com',
        website_url: 'https://asso-theatre-test.com',
        created_by_id: testUsers[1].id, // Club Manager
      },
    });

    console.log(`✅ ${2} organisations créées`);

    // 3. Créer des membreships
    console.log('\n👥 Création des adhésions...');

    // Récupérer les rôles
    const clubOwnerRole = await prisma.role.findFirst({ where: { type: 'club_owner' } });
    const clubManagerRole = await prisma.role.findFirst({ where: { type: 'club_manager' } });
    const coachRole = await prisma.role.findFirst({ where: { type: 'coach' } });
    const memberRole = await prisma.role.findFirst({ where: { type: 'member' } });
    const municipalManagerRole = await prisma.role.findFirst({
      where: { type: 'municipal_manager' },
    });

    if (!clubOwnerRole || !clubManagerRole || !coachRole || !memberRole || !municipalManagerRole) {
      throw new Error('Rôles manquants dans la base de données');
    }

    const memberships = await Promise.all([
      // Club Owner dans le club de judo
      prisma.membership.upsert({
        where: {
          id: `${testUsers[0].id}-${club.id}`,
        },
        update: {},
        create: {
          user_id: testUsers[0].id,
          organisation_id: club.id,
          role_id: clubOwnerRole.id,
          is_main_membership: true,
          validated: true,
          status: 'active',
        },
      }),
      // Club Manager dans l'association théâtre
      prisma.membership.upsert({
        where: {
          id: `${testUsers[1].id}-${association.id}`,
        },
        update: {},
        create: {
          user_id: testUsers[1].id,
          organisation_id: association.id,
          role_id: clubManagerRole.id,
          is_main_membership: true,
          validated: true,
          status: 'active',
        },
      }),
      // Coach dans le club de judo
      prisma.membership.upsert({
        where: {
          id: `${testUsers[2].id}-${club.id}`,
        },
        update: {},
        create: {
          user_id: testUsers[2].id,
          organisation_id: club.id,
          role_id: coachRole.id,
          is_main_membership: true,
          validated: true,
          status: 'active',
        },
      }),
      // Member dans le club de judo
      prisma.membership.upsert({
        where: {
          id: `${testUsers[3].id}-${club.id}`,
        },
        update: {},
        create: {
          user_id: testUsers[3].id,
          organisation_id: club.id,
          role_id: memberRole.id,
          is_main_membership: true,
          validated: true,
          status: 'active',
        },
      }),
    ]);

    console.log(`✅ ${memberships.length} adhésions créées`);

    // 4. Afficher les informations de test
    console.log('\n📋 INFORMATIONS POUR POSTMAN:');
    console.log('=====================================');
    console.log('\n🔐 COMPTES DE TEST:');
    console.log('-------------------');
    console.log('Club Owner:');
    console.log('  Email: club.owner@test.com');
    console.log('  Password: test123');
    console.log('  Organisation: Club de Judo Test');
    console.log('  Rôle: Club Owner');

    console.log('\nClub Manager:');
    console.log('  Email: club.manager@test.com');
    console.log('  Password: test123');
    console.log('  Organisation: Association Théâtre Test');
    console.log('  Rôle: Club Manager');

    console.log('\nCoach:');
    console.log('  Email: coach@test.com');
    console.log('  Password: test123');
    console.log('  Organisation: Club de Judo Test');
    console.log('  Rôle: Coach');

    console.log('\nMember:');
    console.log('  Email: member@test.com');
    console.log('  Password: test123');
    console.log('  Organisation: Club de Judo Test');
    console.log('  Rôle: Member');

    console.log('\nMunicipal Manager:');
    console.log('  Email: municipal.manager@test.com');
    console.log('  Password: test123');
    console.log('  Rôle: Municipal Manager');

    console.log('\n🏢 ORGANISATIONS DE TEST:');
    console.log('-------------------------');
    console.log(`Club de Judo: ${club.id}`);
    console.log(`Association Théâtre: ${association.id}`);

    console.log('\n✅ Données de test configurées avec succès !');
    console.log('\n🚀 Vous pouvez maintenant utiliser ces comptes dans Postman');
  } catch (error) {
    console.error('❌ Erreur lors de la configuration des données de test:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupTestData().catch(console.error);
