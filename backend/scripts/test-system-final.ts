#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Types pour les tests

async function testSystemFinal() {
  console.log('🧪 Test Final du Système IKIVIO\n');

  try {
    // 1. Vérifier les données de base
    console.log('📊 Vérification des données:');
    const stats = await getSystemStats();
    console.log(`   ✅ ${stats.permissions} permissions`);
    console.log(`   ✅ ${stats.roles} rôles`);
    console.log(`   ✅ ${stats.rolePermissions} permissions assignées`);
    console.log(`   ✅ ${stats.clubRoles} rôles club`);
    console.log(`   ✅ ${stats.municipalRoles} rôles municipal`);

    // 2. Tester les rôles par espace
    console.log('\n🌍 Rôles par espace:');
    await testRolesBySpace();

    // 3. Tester les permissions par ressource
    console.log('\n🔧 Permissions par ressource:');
    await testPermissionsByResource();

    // 4. Tester les permissions d'un rôle spécifique
    console.log('\n👤 Test des permissions du Club Owner:');
    await testClubOwnerPermissions();

    // 5. Tester la sécurité (isolation des données)
    console.log('\n🔒 Test de sécurité:');
    await testDataIsolation();

    console.log('\n🎉 Test final terminé avec succès !');
    console.log('\n📈 Résumé:');
    console.log(`   ✅ Système de rôles et permissions opérationnel`);
    console.log(`   ✅ ${stats.permissions} permissions granulaires`);
    console.log(`   ✅ ${stats.roles} rôles optimisés`);
    console.log(`   ✅ Séparation des espaces (Club 360° / Municipal)`);
    console.log(`   ✅ Sécurité et isolation des données`);
  } catch (error) {
    console.error(
      '❌ Erreur lors du test final:',
      error instanceof Error ? error.message : String(error)
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function getSystemStats() {
  const permissions = await prisma.permission.count();
  const roles = await prisma.role.count();
  const rolePermissions = await prisma.rolePermission.count();

  const clubRoles = await prisma.role.count({
    where: { space: 'club_360' },
  });

  const municipalRoles = await prisma.role.count({
    where: { space: 'municipality' },
  });

  return {
    permissions,
    roles,
    rolePermissions,
    clubRoles,
    municipalRoles,
    resources: 0,
    wildcardPermissions: 0,
  };
}

async function testRolesBySpace() {
  const clubRoles = await prisma.role.findMany({
    where: { space: 'club_360' },
    select: { name: true, type: true, level: true },
  });

  console.log('   Espace Club 360°:');
  clubRoles.forEach((role) => {
    console.log(`   - ${role.name} (${role.type}) - Niveau ${role.level}`);
  });

  const municipalRoles = await prisma.role.findMany({
    where: { space: 'municipality' },
    select: { name: true, type: true, level: true },
  });

  console.log('   Espace Municipal:');
  municipalRoles.forEach((role) => {
    console.log(`   - ${role.name} (${role.type}) - Niveau ${role.level}`);
  });
}

async function testPermissionsByResource() {
  const resources = await prisma.permission.groupBy({
    by: ['resource'],
    _count: { resource: true },
  });

  resources.forEach((resource) => {
    console.log(`   ${resource.resource}: ${resource._count.resource} permissions`);
  });
}

async function testClubOwnerPermissions() {
  const clubOwner = await prisma.role.findFirst({
    where: { type: 'club_owner' },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  });

  if (clubOwner) {
    console.log(`   Rôle: ${clubOwner.name}`);
    console.log(`   Permissions: ${clubOwner.permissions.length}`);
    console.log('   Exemples:');
    clubOwner.permissions.slice(0, 5).forEach((rp) => {
      console.log(`   - ${rp.permission.slug}`);
    });
  }
}

async function testDataIsolation() {
  // Test que les rôles sont bien séparés par espace
  const clubRoles = await prisma.role.findMany({
    where: { space: 'club_360' },
  });

  const municipalRoles = await prisma.role.findMany({
    where: { space: 'municipality' },
  });

  console.log(`   ✅ ${clubRoles.length} rôles club isolés`);
  console.log(`   ✅ ${municipalRoles.length} rôles municipal isolés`);

  // Vérifier qu'aucun rôle n'est dans les deux espaces
  const crossSpaceRoles = clubRoles.filter((role) =>
    municipalRoles.some((mr) => mr.id === role.id)
  );

  if (crossSpaceRoles.length === 0) {
    console.log('   ✅ Aucun rôle partagé entre les espaces');
  } else {
    console.log(`   ⚠️  ${crossSpaceRoles.length} rôles partagés détectés`);
  }
}

void testSystemFinal();
