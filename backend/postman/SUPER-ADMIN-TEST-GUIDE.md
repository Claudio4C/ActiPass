# 🧪 GUIDE DE TEST COMPLET - SUPER ADMIN

## 📋 **PRÉREQUIS**

1. **Backend démarré** : `npm run dev`
2. **Super Admin créé** et activé
3. **Postman** ou **Thunder Client** installé

---

## 🔐 **ÉTAPE 1 : CONNEXION SUPER ADMIN**

### **POST** `/api/v1/auth/login`

```json
{
  "email": "superadmin@ikivio.com",
  "password": "SuperAdmin123!"
}
```

**✅ Réponse attendue :**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "superadmin@ikivio.com",
    "username": "superadmin",
    "firstname": "Super",
    "lastname": "Admin",
    "is_super_admin": true,
    "status": "active"
  }
}
```

**💾 Sauvegardez le `access_token` pour les requêtes suivantes !**

---

## 📊 **ÉTAPE 2 : TABLEAU DE BORD**

### **GET** `/api/v1/super-admin/dashboard`

**Headers :** `Authorization: Bearer VOTRE_TOKEN`

**✅ Réponse attendue :**

```json
{
  "message": "Tableau de bord Super Admin",
  "stats": {
    "users": {
      "total": 5,
      "active": 4,
      "suspended": 1
    },
    "organisations": {
      "total": 3,
      "active": 2,
      "deleted": 1
    },
    "memberships": {
      "total": 8
    }
  }
}
```

---

## 👥 **ÉTAPE 3 : GESTION DES UTILISATEURS**

### **3.1 - Lister tous les utilisateurs**

**GET** `/api/v1/super-admin/users`

**✅ Réponse attendue :**

```json
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "username": "user1",
    "firstname": "John",
    "lastname": "Doe",
    "is_email_verified": true,
    "status": "active",
    "is_super_admin": false,
    "created_at": "2024-01-01T00:00:00.000Z",
    "last_login_at": "2024-01-01T12:00:00.000Z"
  }
]
```

### **3.2 - Suspendre un utilisateur**

**POST** `/api/v1/super-admin/users/{userId}/suspend`

```json
{
  "reason": "Violation des conditions d'utilisation"
}
```

### **3.3 - Réactiver un utilisateur**

**POST** `/api/v1/super-admin/users/{userId}/activate`

---

## 🏢 **ÉTAPE 4 : GESTION DES ORGANISATIONS**

### **4.1 - Lister toutes les organisations**

**GET** `/api/v1/super-admin/organisations`

**✅ Réponse attendue :**

```json
[
  {
    "id": "uuid",
    "name": "Club de Football",
    "type": "sport",
    "status": "active",
    "created_at": "2024-01-01T00:00:00.000Z",
    "memberships": [
      {
        "user": {
          "id": "uuid",
          "email": "owner@club.com",
          "firstname": "Jean",
          "lastname": "Dupont"
        },
        "role": {
          "name": "club_owner",
          "level": 1000
        }
      }
    ]
  }
]
```

### **4.2 - Supprimer définitivement une organisation**

**DELETE** `/api/v1/super-admin/organisations/{orgId}/permanent`

### **4.3 - Restaurer une organisation supprimée**

**POST** `/api/v1/super-admin/organisations/{orgId}/restore`

---

## ⚡ **ÉTAPE 5 : CRÉER UN AUTRE SUPER ADMIN**

### **POST** `/api/v1/super-admin/create-super-admin`

```json
{
  "email": "admin2@ikivio.com",
  "username": "admin2",
  "firstname": "Admin",
  "lastname": "Second",
  "password": "Admin2Password123!"
}
```

**✅ Réponse attendue :**

```json
{
  "message": "Super Admin créé avec succès",
  "superAdmin": {
    "id": "uuid",
    "email": "admin2@ikivio.com",
    "username": "admin2",
    "firstname": "Admin",
    "lastname": "Second",
    "is_super_admin": true,
    "status": "active"
  }
}
```

---

## 🧪 **TESTS DE SÉCURITÉ**

### **Test 1 : Accès sans token**

**GET** `/api/v1/super-admin/dashboard`
**❌ Réponse attendue :** `401 Unauthorized`

### **Test 2 : Accès avec token utilisateur normal**

**GET** `/api/v1/super-admin/dashboard`
**Headers :** `Authorization: Bearer TOKEN_UTILISATEUR_NORMAL`
**❌ Réponse attendue :** `403 Forbidden`

### **Test 3 : Création Super Admin par utilisateur normal**

**POST** `/api/v1/super-admin/create-super-admin`
**Headers :** `Authorization: Bearer TOKEN_UTILISATEUR_NORMAL`
**❌ Réponse attendue :** `403 Forbidden`

---

## 📝 **CHECKLIST DE VALIDATION**

- [ ] ✅ Connexion Super Admin réussie
- [ ] ✅ Accès au tableau de bord
- [ ] ✅ Liste des utilisateurs accessible
- [ ] ✅ Liste des organisations accessible
- [ ] ✅ Suspension d'utilisateur fonctionnelle
- [ ] ✅ Réactivation d'utilisateur fonctionnelle
- [ ] ✅ Suppression d'organisation fonctionnelle
- [ ] ✅ Restauration d'organisation fonctionnelle
- [ ] ✅ Création d'un autre Super Admin
- [ ] ✅ Sécurité : accès refusé sans token
- [ ] ✅ Sécurité : accès refusé avec token normal

---

## 🚨 **EN CAS DE PROBLÈME**

### **Erreur 401 - Unauthorized**

- Vérifiez que le token est correct
- Vérifiez que le Super Admin est actif

### **Erreur 403 - Forbidden**

- Vérifiez que l'utilisateur est bien Super Admin
- Vérifiez que le token est valide

### **Erreur 500 - Internal Server Error**

- Vérifiez les logs du backend
- Vérifiez la connexion à la base de données

---

## 🎯 **RÉSULTAT ATTENDU**

Après tous ces tests, vous devriez avoir :

- ✅ Un Super Admin fonctionnel
- ✅ Accès total à toutes les données
- ✅ Capacité de gérer utilisateurs et organisations
- ✅ Sécurité appropriée
- ✅ Possibilité de créer d'autres Super Admins

**🎉 Votre système Super Admin est prêt pour la production !**
