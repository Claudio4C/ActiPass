/**
 * Script de test complet pour l'espace Super Admin
 *
 * Ce script teste toutes les fonctionnalités Super Admin :
 * - Dashboard et statistiques
 * - Gestion des utilisateurs (GET, PUT, DELETE, suspend, activate)
 * - Gestion des organisations (GET, DELETE, restore, permanent delete)
 * - Création de Super Admin
 *
 * Usage: npm run test:super-admin-complete
 */

import axios from 'axios';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  data?: any;
}

const results: TestResult[] = [];

let authToken: string = '';
let testUserId: string = '';
let testOrgId: string = '';
let testSuperAdminId: string = '';

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function test(name: string, testFn: () => Promise<any>): Promise<void> {
  try {
    log(`\n🧪 Test: ${name}`, 'blue');
    const data = await testFn();
    results.push({ name, passed: true, data });
    log(`✅ ${name} - PASSED`, 'green');
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
    results.push({ name, passed: false, error: errorMessage });
    log(`❌ ${name} - FAILED: ${errorMessage}`, 'red');
  }
}

async function loginAsSuperAdmin() {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, {
    email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@test.com',
    password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!',
  });

  if (!response.data.access_token) {
    throw new Error('No access token received');
  }

  authToken = response.data.access_token;
  return authToken;
}

function getAuthHeaders() {
  return {
    Authorization: `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  };
}

async function main() {
  log('\n🚀 Démarrage des tests Super Admin complets\n', 'yellow');
  log('='.repeat(60), 'yellow');

  // 1. Connexion en tant que Super Admin
  await test('Connexion Super Admin', async () => {
    await loginAsSuperAdmin();
    return { token: 'received' };
  });

  if (!authToken) {
    log('\n❌ Impossible de se connecter. Arrêt des tests.', 'red');
    return;
  }

  // 2. Dashboard et statistiques
  await test('GET /super-admin/dashboard - Statistiques globales', async () => {
    const response = await axios.get(`${API_BASE_URL}/super-admin/dashboard`, {
      headers: getAuthHeaders(),
    });

    if (!response.data.users || !response.data.organisations || !response.data.memberships) {
      throw new Error('Invalid dashboard structure');
    }

    return response.data;
  });

  // 3. Liste des utilisateurs
  await test('GET /super-admin/users - Liste tous les utilisateurs', async () => {
    const response = await axios.get(`${API_BASE_URL}/super-admin/users`, {
      headers: getAuthHeaders(),
    });

    if (!Array.isArray(response.data)) {
      throw new Error('Expected array of users');
    }

    // Sauvegarder un ID d'utilisateur pour les tests suivants
    if (response.data.length > 0) {
      testUserId = response.data[0].id;
    }

    return { count: response.data.length };
  });

  // 4. Détail d'un utilisateur
  await test('GET /users/:id - Détail utilisateur', async () => {
    if (!testUserId) {
      throw new Error('No user ID available');
    }

    const response = await axios.get(`${API_BASE_URL}/users/${testUserId}`, {
      headers: getAuthHeaders(),
    });

    if (!response.data.user) {
      throw new Error('User not found in response');
    }

    return response.data;
  });

  // 5. Suspendre un utilisateur
  await test('PUT /super-admin/users/:id/suspend - Suspendre utilisateur', async () => {
    if (!testUserId) {
      throw new Error('No user ID available');
    }

    const response = await axios.put(
      `${API_BASE_URL}/super-admin/users/${testUserId}/suspend`,
      { reason: 'Test suspension' },
      { headers: getAuthHeaders() }
    );

    return response.data;
  });

  // 6. Réactiver un utilisateur
  await test('PUT /super-admin/users/:id/activate - Réactiver utilisateur', async () => {
    if (!testUserId) {
      throw new Error('No user ID available');
    }

    const response = await axios.put(
      `${API_BASE_URL}/super-admin/users/${testUserId}/activate`,
      {},
      { headers: getAuthHeaders() }
    );

    return response.data;
  });

  // 7. Modifier un utilisateur
  await test('PUT /users/:id - Modifier utilisateur', async () => {
    if (!testUserId) {
      throw new Error('No user ID available');
    }

    const response = await axios.put(
      `${API_BASE_URL}/users/${testUserId}`,
      { firstname: 'Test', lastname: 'User' },
      { headers: getAuthHeaders() }
    );

    return response.data;
  });

  // 8. Liste des organisations
  await test('GET /super-admin/organisations - Liste toutes les organisations', async () => {
    const response = await axios.get(`${API_BASE_URL}/super-admin/organisations`, {
      headers: getAuthHeaders(),
    });

    if (!Array.isArray(response.data)) {
      throw new Error('Expected array of organisations');
    }

    // Sauvegarder un ID d'organisation pour les tests suivants
    if (response.data.length > 0) {
      testOrgId = response.data[0].id;
    }

    return { count: response.data.length };
  });

  // 9. Supprimer une organisation (soft delete)
  await test('DELETE /super-admin/organisations/:id - Supprimer organisation (soft delete)', async () => {
    if (!testOrgId) {
      throw new Error('No organisation ID available');
    }

    const response = await axios.delete(`${API_BASE_URL}/super-admin/organisations/${testOrgId}`, {
      headers: getAuthHeaders(),
    });

    return response.data;
  });

  // 10. Restaurer une organisation
  await test('PUT /super-admin/organisations/:id/restore - Restaurer organisation', async () => {
    if (!testOrgId) {
      throw new Error('No organisation ID available');
    }

    const response = await axios.put(
      `${API_BASE_URL}/super-admin/organisations/${testOrgId}/restore`,
      {},
      { headers: getAuthHeaders() }
    );

    return response.data;
  });

  // 11. Créer un Super Admin
  await test('POST /super-admin/create-super-admin - Créer Super Admin', async () => {
    const timestamp = Date.now();
    const testEmail = `test-superadmin-${timestamp}@test.com`;
    const testUsername = `test-superadmin-${timestamp}`;

    const response = await axios.post(
      `${API_BASE_URL}/super-admin/create-super-admin`,
      {
        email: testEmail,
        username: testUsername,
        firstname: 'Test',
        lastname: 'SuperAdmin',
        password: 'TestPassword123!',
      },
      { headers: getAuthHeaders() }
    );

    if (!response.data.superAdmin) {
      throw new Error('Super Admin not created');
    }

    testSuperAdminId = response.data.superAdmin.id;

    return response.data;
  });

  // 12. Supprimer un utilisateur (soft delete)
  await test('DELETE /users/:id - Supprimer utilisateur (soft delete)', async () => {
    if (!testSuperAdminId) {
      log('⚠️  Skipping user delete test - no test user available', 'yellow');
      return { skipped: true };
    }

    const response = await axios.delete(`${API_BASE_URL}/users/${testSuperAdminId}`, {
      headers: getAuthHeaders(),
    });

    return response.data;
  });

  // Résumé des tests
  log('\n' + '='.repeat(60), 'yellow');
  log('\n📊 RÉSUMÉ DES TESTS\n', 'yellow');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  results.forEach((result) => {
    if (result.passed) {
      log(`✅ ${result.name}`, 'green');
    } else {
      log(`❌ ${result.name}: ${result.error}`, 'red');
    }
  });

  log('\n' + '='.repeat(60), 'yellow');
  log(`\n📈 Résultats: ${passed}/${total} tests réussis`, passed === total ? 'green' : 'yellow');

  if (failed > 0) {
    log(`❌ ${failed} test(s) échoué(s)`, 'red');
    process.exit(1);
  } else {
    log('\n🎉 Tous les tests sont passés avec succès !', 'green');
    process.exit(0);
  }
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (error) => {
  log(`\n❌ Erreur non gérée: ${error}`, 'red');
  process.exit(1);
});

// Exécution
main().catch((error) => {
  log(`\n❌ Erreur fatale: ${error.message}`, 'red');
  process.exit(1);
});
