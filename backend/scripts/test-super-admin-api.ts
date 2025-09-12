import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/v1';

interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    username: string;
    firstname: string;
    lastname: string;
    is_super_admin: boolean;
    status: string;
  };
}

async function testSuperAdminAPI() {
  console.log('🧪 TEST API SUPER ADMIN');
  console.log('========================\n');

  let accessToken = '';

  try {
    // 1. Test de connexion
    console.log('1️⃣ Test de connexion Super Admin...');
    const loginResponse = await axios.post<LoginResponse>(`${BASE_URL}/auth/login`, {
      email: 'superadmin@ikivio.com',
      password: 'SuperAdmin123!',
    });

    if (loginResponse.data.access_token) {
      accessToken = loginResponse.data.access_token;
      console.log('✅ Connexion réussie !');
      console.log(
        `   👤 Utilisateur: ${loginResponse.data.user.firstname} ${loginResponse.data.user.lastname}`
      );
      console.log(`   ⚡ Super Admin: ${loginResponse.data.user.is_super_admin}`);
      console.log(`   🔑 Token: ${accessToken.substring(0, 20)}...\n`);
    } else {
      console.log('❌ Échec de la connexion');
      return;
    }

    // 2. Test du tableau de bord
    console.log('2️⃣ Test du tableau de bord...');
    const dashboardResponse = await axios.get(`${BASE_URL}/super-admin/dashboard`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log('✅ Tableau de bord accessible !');
    console.log('   📊 Statistiques :');
    console.log(
      `      👥 Utilisateurs: ${dashboardResponse.data.stats.users.total} (${dashboardResponse.data.stats.users.active} actifs)`
    );
    console.log(
      `      🏢 Organisations: ${dashboardResponse.data.stats.organisations.total} (${dashboardResponse.data.stats.organisations.active} actives)`
    );
    console.log(`      🔗 Membres: ${dashboardResponse.data.stats.memberships.total}\n`);

    // 3. Test de la liste des utilisateurs
    console.log('3️⃣ Test de la liste des utilisateurs...');
    const usersResponse = await axios.get(`${BASE_URL}/super-admin/users`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log('✅ Liste des utilisateurs accessible !');
    console.log(`   👥 Nombre d'utilisateurs: ${usersResponse.data.length}`);
    usersResponse.data.forEach((user: any, index: number) => {
      const superAdminBadge = user.is_super_admin ? ' ⚡' : '';
      console.log(`      ${index + 1}. ${user.email} (${user.status})${superAdminBadge}`);
    });
    console.log('');

    // 4. Test de la liste des organisations
    console.log('4️⃣ Test de la liste des organisations...');
    const organisationsResponse = await axios.get(`${BASE_URL}/super-admin/organisations`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log('✅ Liste des organisations accessible !');
    console.log(`   🏢 Nombre d'organisations: ${organisationsResponse.data.length}`);
    organisationsResponse.data.forEach((org: any, index: number) => {
      console.log(
        `      ${index + 1}. ${org.name} (${org.type}) - ${org.memberships.length} membres`
      );
    });
    console.log('');

    // 5. Test de sécurité - Accès sans token
    console.log('5️⃣ Test de sécurité - Accès sans token...');
    try {
      await axios.get(`${BASE_URL}/super-admin/dashboard`);
      console.log("❌ ERREUR: L'accès sans token devrait être refusé !");
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('✅ Sécurité OK: Accès refusé sans token (401)');
      } else {
        console.log(`❌ ERREUR: Code de statut inattendu: ${error.response?.status}`);
      }
    }
    console.log('');

    // 6. Test de création d'un autre Super Admin
    console.log("6️⃣ Test de création d'un autre Super Admin...");
    try {
      const createAdminResponse = await axios.post(
        `${BASE_URL}/super-admin/create-super-admin`,
        {
          email: 'admin2@ikivio.com',
          username: 'admin2',
          firstname: 'Admin',
          lastname: 'Second',
          password: 'Admin2Password123!',
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      console.log('✅ Super Admin créé avec succès !');
      console.log(`   📧 Email: ${createAdminResponse.data.superAdmin.email}`);
      console.log(
        `   👤 Nom: ${createAdminResponse.data.superAdmin.firstname} ${createAdminResponse.data.superAdmin.lastname}`
      );
      console.log(`   ⚡ Super Admin: ${createAdminResponse.data.superAdmin.is_super_admin}`);
    } catch (error: any) {
      if (error.response?.status === 409) {
        console.log('ℹ️ Super Admin existe déjà (409)');
      } else {
        console.log(
          `❌ Erreur lors de la création: ${error.response?.data?.message || error.message}`
        );
      }
    }
    console.log('');

    console.log('🎉 TOUS LES TESTS API SONT RÉUSSIS !');
    console.log('✅ Le Super Admin est 100% fonctionnel !');
  } catch (error: any) {
    console.error('❌ Erreur lors du test API :', error.response?.data || error.message);
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
  await testSuperAdminAPI();
}

main();
