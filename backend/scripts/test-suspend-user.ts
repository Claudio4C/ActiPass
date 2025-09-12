import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/v1';

async function testSuspendUser() {
  console.log('🧪 TEST SUSPENSION UTILISATEUR');
  console.log('===============================\n');

  try {
    // 1. Connexion Super Admin
    console.log('1️⃣ Connexion Super Admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'superadmin@ikivio.com',
      password: 'SuperAdmin123!',
    });

    const accessToken = loginResponse.data.access_token;
    console.log('✅ Connexion réussie !\n');

    // 2. Lister les utilisateurs pour trouver un à suspendre
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

    // Trouver un utilisateur non-super-admin à suspendre
    const userToSuspend = users.find(
      (user: any) => !user.is_super_admin && user.status === 'active'
    );

    if (!userToSuspend) {
      console.log('❌ Aucun utilisateur actif trouvé pour la suspension');
      return;
    }

    console.log(`\n🎯 Utilisateur sélectionné pour la suspension: ${userToSuspend.email}\n`);

    // 3. Tester la suspension avec raison
    console.log('3️⃣ Test suspension avec raison...');
    try {
      const suspendResponse = await axios.put(
        `${BASE_URL}/super-admin/users/${userToSuspend.id}/suspend`,
        {
          reason: 'Test de suspension automatique',
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      console.log('✅ Suspension réussie !');
      console.log(`   Utilisateur: ${userToSuspend.email}`);
      console.log(`   Nouveau statut: ${suspendResponse.data.status}`);
    } catch (error: any) {
      console.log(`❌ Erreur suspension: ${error.response?.data?.message || error.message}`);
    }

    // 4. Tester la suspension sans raison (body vide)
    console.log('\n4️⃣ Test suspension sans raison...');
    try {
      const suspendResponse2 = await axios.put(
        `${BASE_URL}/super-admin/users/${userToSuspend.id}/suspend`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      console.log('✅ Suspension sans raison réussie !');
      console.log(`   Utilisateur: ${userToSuspend.email}`);
      console.log(`   Nouveau statut: ${suspendResponse2.data.status}`);
    } catch (error: any) {
      console.log(
        `❌ Erreur suspension sans raison: ${error.response?.data?.message || error.message}`
      );
    }

    // 5. Réactiver l'utilisateur
    console.log('\n5️⃣ Test réactivation...');
    try {
      const activateResponse = await axios.put(
        `${BASE_URL}/super-admin/users/${userToSuspend.id}/activate`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      console.log('✅ Réactivation réussie !');
      console.log(`   Utilisateur: ${userToSuspend.email}`);
      console.log(`   Nouveau statut: ${activateResponse.data.status}`);
    } catch (error: any) {
      console.log(`❌ Erreur réactivation: ${error.response?.data?.message || error.message}`);
    }

    console.log('\n🎉 TOUS LES TESTS DE SUSPENSION SONT RÉUSSIS !');
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
  await testSuspendUser();
}

main();
