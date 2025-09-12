# 🧪 Guide de Test Postman - SaaS IKIVIO

## 📋 Prérequis

1. **Backend démarré** : `npm run dev` dans le dossier `backend/`
2. **Postman installé** : [Télécharger Postman](https://www.postman.com/downloads/)
3. **Données de test** : Exécuter `npx ts-node scripts/setup-test-data.ts`

## 🚀 Installation de la Collection

1. **Importer la collection** :
   - Ouvrir Postman
   - Cliquer sur "Import"
   - Sélectionner le fichier `IKIVIO-SaaS-Collection.json`
   - Cliquer sur "Import"

2. **Configurer l'environnement** :
   - Les variables sont déjà configurées dans la collection
   - `baseUrl` : `http://localhost:3000/api/v1`
   - `clubId` et `associationId` : IDs des organisations de test

## 🔐 Comptes de Test Disponibles

| Rôle                  | Email                        | Password  | Organisation             | Permissions                    |
| --------------------- | ---------------------------- | --------- | ------------------------ | ------------------------------ |
| **Club Owner**        | `club.owner@test.com`        | `test123` | Club de Judo Test        | Toutes les permissions du club |
| **Club Manager**      | `club.manager@test.com`      | `test123` | Association Théâtre Test | Gestion quotidienne            |
| **Coach**             | `coach@test.com`             | `test123` | Club de Judo Test        | Gestion des créneaux           |
| **Member**            | `member@test.com`            | `test123` | Club de Judo Test        | Permissions de base            |
| **Municipal Manager** | `municipal.manager@test.com` | `test123` | -                        | Gestion municipale             |

## 📝 Ordre de Test Recommandé

### 1. **🔐 Authentification**

```
1. Login - Club Owner
2. Get Profile (Me)
3. Refresh Token
4. Logout
```

### 2. **🏢 Organisations**

```
1. Login - Club Owner
2. Create Organisation - Club Sport
3. Get My Organisations
4. Get Organisation Details
5. Update Organisation
6. Delete Organisation
```

### 3. **👥 Gestion des Membres**

```
1. Login - Club Owner
2. Get Organisation Members
3. Update Member Role - Promote to Coach
4. Update Member Role - Promote to Manager
5. Remove Member
```

### 4. **👤 Utilisateurs**

```
1. Login - Club Owner
2. Get My Profile
3. Update My Profile
4. Get My Organisations
5. Get My Permissions
6. Get User by ID (Admin)
7. Update User by ID (Admin)
8. Get User Permissions by ID (Admin)
9. Delete User by ID (Admin)
```

### 5. **🔒 Tests de Sécurité**

```
1. Test - Accès sans token
2. Test - Token invalide
3. Test - Accès organisation d'un autre club
```

## 🎯 Scénarios de Test Spécifiques

### **Scénario 1 : Création d'un Club**

1. **Login** avec `club.owner@test.com`
2. **Create Organisation** - Club Sport
3. **Get My Organisations** - Vérifier la création
4. **Get Organisation Details** - Vérifier les détails

### **Scénario 2 : Gestion des Membres**

1. **Login** avec `club.owner@test.com`
2. **Get Organisation Members** - Voir les membres
3. **Update Member Role** - Promouvoir un membre
4. **Remove Member** - Retirer un membre

### **Scénario 3 : Test des Permissions**

1. **Login** avec `member@test.com`
2. **Get My Permissions** - Voir les permissions limitées
3. **Try to Update Organisation** - Doit échouer (403)
4. **Login** avec `club.owner@test.com`
5. **Update Organisation** - Doit réussir

### **Scénario 4 : Test de Sécurité**

1. **Test sans token** - Doit échouer (401)
2. **Test avec token invalide** - Doit échouer (401)
3. **Test accès cross-organisation** - Doit échouer (403)

## 🔧 Variables de Collection

| Variable        | Description                                  | Valeur                                 |
| --------------- | -------------------------------------------- | -------------------------------------- |
| `baseUrl`       | URL de base de l'API                         | `http://localhost:3000/api/v1`         |
| `accessToken`   | Token d'accès JWT                            | Automatiquement rempli                 |
| `refreshToken`  | Token de rafraîchissement                    | Automatiquement rempli                 |
| `clubId`        | ID du club de test                           | `be742ff4-6b1c-40e7-9622-5c49d391a671` |
| `associationId` | ID de l'association de test                  | `de144891-195f-4266-a88a-9df80a900a80` |
| `memberId`      | ID d'un membre (à remplir manuellement)      | -                                      |
| `userId`        | ID d'un utilisateur (à remplir manuellement) | -                                      |

## 📊 Codes de Réponse Attendus

| Code    | Description          | Exemples                              |
| ------- | -------------------- | ------------------------------------- |
| **200** | Succès               | Login, Get Profile, Get Organisations |
| **201** | Créé                 | Register, Create Organisation         |
| **400** | Requête invalide     | Données manquantes, format incorrect  |
| **401** | Non authentifié      | Token manquant ou invalide            |
| **403** | Non autorisé         | Permissions insuffisantes             |
| **404** | Non trouvé           | Organisation inexistante              |
| **422** | Erreur de validation | Données invalides (Zod)               |

## 🚨 Erreurs Courantes

### **401 Unauthorized**

- **Cause** : Token manquant ou expiré
- **Solution** : Relancer un login pour obtenir un nouveau token

### **403 Forbidden**

- **Cause** : Permissions insuffisantes
- **Solution** : Utiliser un compte avec les bonnes permissions

### **404 Not Found**

- **Cause** : Ressource inexistante
- **Solution** : Vérifier l'ID de la ressource

### **422 Unprocessable Entity**

- **Cause** : Données invalides
- **Solution** : Vérifier le format des données envoyées

## 🎉 Tests de Validation

### **✅ Tests à Réussir**

- [ ] Login avec tous les comptes
- [ ] Création d'organisations
- [ ] Gestion des membres
- [ ] Mise à jour des profils
- [ ] Gestion des permissions

### **❌ Tests d'Échec Attendus**

- [ ] Accès sans token (401)
- [ ] Accès avec token invalide (401)
- [ ] Accès cross-organisation (403)
- [ ] Actions non autorisées (403)

## 🔄 Réinitialisation des Données

Pour réinitialiser les données de test :

```bash
cd backend
npx ts-node scripts/setup-test-data.ts
```

## 📈 Monitoring des Tests

1. **Console Postman** : Voir les logs des tests
2. **Backend Logs** : Surveiller les logs du serveur
3. **Base de données** : Vérifier les données avec Prisma Studio

## 🚀 Prochaines Étapes

Une fois les tests validés, vous pouvez :

1. **Développer le frontend** avec confiance
2. **Ajouter de nouvelles routes** (activités, planning, paiements)
3. **Implémenter les tests automatisés**
4. **Déployer en production**

---

**🎯 Objectif** : Valider que toutes les routes fonctionnent correctement et que le système de rôles/permissions est opérationnel pour le développement frontend.
