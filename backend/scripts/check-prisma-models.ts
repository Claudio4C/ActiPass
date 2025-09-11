#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkModels() {
  console.log('🔍 Vérification des modèles Prisma...');

  try {
    // Test Permission
    console.log('\n📋 Test Permission:');
    const permissionCount = await prisma.permission.count();
    console.log(`✅ Permission model: ${permissionCount} permissions`);

    // Test RolePermission
    console.log('\n🔗 Test RolePermission:');
    const rolePermissionCount = await prisma.rolePermission.count();
    console.log(`✅ RolePermission model: ${rolePermissionCount} role permissions`);

    // Test Role
    console.log('\n👥 Test Role:');
    const roleCount = await prisma.role.count();
    console.log(`✅ Role model: ${roleCount} roles`);

    // Test AuditLog
    console.log('\n📝 Test AuditLog:');
    const auditLogCount = await prisma.auditLog.count();
    console.log(`✅ AuditLog model: ${auditLogCount} audit logs`);

    console.log('\n🎉 Tous les modèles sont accessibles !');
  } catch (error) {
    console.error(
      '❌ Erreur lors de la vérification:',
      error instanceof Error ? error.message : String(error)
    );
  } finally {
    await prisma.$disconnect();
  }
}

void checkModels();
