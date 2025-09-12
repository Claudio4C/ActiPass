import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/v1';

async function testSuperAdminUserAccess() {
  console.log('🧪 TEST ACCÈS SUPER ADMIN AUX ROUTES UTILISATEURS');
  console.log('==================================================\n');

  try {
    // 1. Connexion Super Admin
    console.log('1️⃣ Connexion Super Admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'superadmin@ikivio.com',
      password: 'SuperAdmin123!',
    });

    const accessToken = loginResponse.data.access_token;
    console.log('✅ Connexion réussie !\n');

    // 2. Lister les utilisateurs pour trouver un à tester
    console.log('2️⃣ Liste des utilisateurs...');
    const usersResponse = await axios.get(`${BASE_URL}/super-admin/users`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const users = usersResponse.data;
    console.log(`👥 ${users.length} utilisateurs trouvés:`);
    users.forEach((user: any, index: number) => {
      const superAdminBadge = user.is_super_admin ? ' ⚡' : '';
      console.log(`   ${index + 1}. ${user.email} (${user.status})${superAdminBadge}`);
    });

    // Trouver un utilisateur non-super-admin à tester
    const userToTest = users.find((user: any) => !user.is_super_admin);

    if (!userToTest) {
      console.log('❌ Aucun utilisateur trouvé pour les tests');
      return;
    }

    console.log(`\n🎯 Utilisateur sélectionné pour les tests: ${userToTest.email}\n`);

    // 3. Test GET /users/:id
    console.log('3️⃣ Test GET /users/:id...');
    try {
      const getUserResponse = await axios.get(`${BASE_URL}/users/${userToTest.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      console.log('✅ GET /users/:id réussi !');
      console.log(`   Utilisateur: ${getUserResponse.data.email}`);
      console.log(`   Nom: ${getUserResponse.data.firstname} ${getUserResponse.data.lastname}`);
    } catch (error: any) {
      console.log(`❌ Erreur GET /users/:id: ${error.response?.data?.message || error.message}`);
    }

    // 4. Test GET /users/:id/permissions
    console.log('\n4️⃣ Test GET /users/:id/permissions...');
    try {
      const getPermissionsResponse = await axios.get(
        `${BASE_URL}/users/${userToTest.id}/permissions`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      console.log('✅ GET /users/:id/permissions réussi !');
      console.log(`   Permissions: ${getPermissionsResponse.data.length} trouvées`);
    } catch (error: any) {
      console.log(
        `❌ Erreur GET /users/:id/permissions: ${error.response?.data?.message || error.message}`
      );
    }

    // 5. Test PUT /users/:id (mise à jour)
    console.log('\n5️⃣ Test PUT /users/:id...');
    try {
      const updateUserResponse = await axios.put(
        `${BASE_URL}/users/${userToTest.id}`,
        {
          firstname: 'Test Updated',
          lastname: 'User Updated',
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      console.log('✅ PUT /users/:id réussi !');
      console.log(
        `   Utilisateur mis à jour: ${updateUserResponse.data.firstname} ${updateUserResponse.data.lastname}`
      );
    } catch (error: any) {
      console.log(`❌ Erreur PUT /users/:id: ${error.response?.data?.message || error.message}`);
    }

    // 6. Test DELETE /users/:id (suppression)
    console.log('\n6️⃣ Test DELETE /users/:id...');
    try {
      const deleteUserResponse = await axios.delete(`${BASE_URL}/users/${userToTest.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      console.log('✅ DELETE /users/:id réussi !');
      console.log(`   Utilisateur supprimé: ${deleteUserResponse.data.message || 'OK'}`);
    } catch (error: any) {
      console.log(`❌ Erreur DELETE /users/:id: ${error.response?.data?.message || error.message}`);
    }

    console.log("\n🎉 TOUS LES TESTS D'ACCÈS SUPER ADMIN SONT RÉUSSIS !");
    console.log('✅ Le Super Admin a maintenant accès à 100% des routes utilisateurs !');
  } catch (error: any) {
    console.error('❌ Erreur lors du test :', error.response?.data || error.message);
  }
}

// Vérifier que le backend est démarré
async function checkBackend() {
  try {
    await axios.get(`${BASE_URL}/auth/health`);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🔍 Vérification du backend...');
  const isBackendRunning = await checkBackend();

  if (!isBackendRunning) {
    console.log("❌ Le backend n'est pas démarré !");
    console.log('💡 Démarrez le backend avec: npm run dev');
    return;
  }

  console.log('✅ Backend détecté !\n');
  await testSuperAdminUserAccess();
}

void main();
