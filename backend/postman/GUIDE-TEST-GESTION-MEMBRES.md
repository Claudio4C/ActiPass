# 🧪 GUIDE DE TEST - GESTION DES MEMBRES

## 📋 **ROUTES DISPONIBLES**

### **1. 🔗 REJOINDRE UNE ORGANISATION**

**POST** `http://localhost:3000/api/v1/organisations/{organisationId}/join`
**Headers :** `Authorization: Bearer VOTRE_TOKEN_ICI`
**Body (JSON) :**

```json
{
  "roleType": "member"
}
```

**Exemple :**

```
POST http://localhost:3000/api/v1/organisations/4b2efb0d-5a07-4942-9f06-5e2fc3463c3e/join
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "roleType": "member"
}
```

### **2. 📋 LISTER LES MEMBRES**

**GET** `http://localhost:3000/api/v1/organisations/{organisationId}/members`
**Headers :** `Authorization: Bearer VOTRE_TOKEN_ICI`

**Exemple :**

```
GET http://localhost:3000/api/v1/organisations/4b2efb0d-5a07-4942-9f06-5e2fc3463c3e/members
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **3. 🔄 CHANGER LE RÔLE D'UN MEMBRE**

**PUT** `http://localhost:3000/api/v1/organisations/{organisationId}/members/{memberId}/role`
**Headers :** `Authorization: Bearer VOTRE_TOKEN_ICI`
**Body (JSON) :**

```json
{
  "roleType": "club_manager"
}
```

**Exemple :**

```
PUT http://localhost:3000/api/v1/organisations/4b2efb0d-5a07-4942-9f06-5e2fc3463c3e/members/123e4567-e89b-12d3-a456-426614174000/role
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "roleType": "club_manager"
}
```

### **4. 🚫 RETIRER UN MEMBRE**

**DELETE** `http://localhost:3000/api/v1/organisations/{organisationId}/members/{memberId}`
**Headers :** `Authorization: Bearer VOTRE_TOKEN_ICI`

**Exemple :**

```
DELETE http://localhost:3000/api/v1/organisations/4b2efb0d-5a07-4942-9f06-5e2fc3463c3e/members/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔐 **PERMISSIONS REQUISES**

- **Rejoindre une organisation** : Aucune (tout utilisateur connecté)
- **Lister les membres** : Aucune (membres de l'organisation)
- **Changer le rôle** : `role:assign` (seulement les propriétaires/gestionnaires)
- **Retirer un membre** : `role:assign` (seulement les propriétaires/gestionnaires)

## 🎯 **ÉTAPES DE TEST**

### **Étape 1 : Connexion**

1. Connectez-vous avec `club.owner@test.com` (propriétaire)
2. Récupérez le token JWT

### **Étape 2 : Lister les membres**

1. Testez `GET /organisations/{id}/members`
2. Vérifiez que vous voyez tous les membres

### **Étape 3 : Rejoindre l'organisation**

1. Connectez-vous avec `member.test@example.com` (nouveau membre)
2. Testez `POST /organisations/{id}/join`
3. Vérifiez que le statut est `pending`

### **Étape 4 : Gérer les membres (en tant que propriétaire)**

1. Reconnectez-vous avec `club.owner@test.com`
2. Testez `PUT /organisations/{id}/members/{memberId}/role`
3. Testez `DELETE /organisations/{id}/members/{memberId}`

## 📊 **RÉPONSES ATTENDUES**

### **Rejoindre une organisation :**

```json
{
  "message": "Demande d'adhésion envoyée avec succès",
  "membership": {
    "id": "uuid",
    "status": "pending",
    "role": {
      "name": "Test Role",
      "type": "member"
    },
    "user": {
      "email": "member.test@example.com",
      "firstname": "Marie",
      "lastname": "Martin"
    }
  }
}
```

### **Lister les membres :**

```json
[
  {
    "id": "uuid",
    "status": "active",
    "joined_at": "2024-01-01T00:00:00.000Z",
    "role": {
      "name": "Club Owner",
      "type": "club_owner"
    },
    "user": {
      "email": "club.owner@test.com",
      "firstname": "Jean",
      "lastname": "Dupont"
    }
  }
]
```

## ⚠️ **GESTION D'ERREURS**

- **401 Unauthorized** : Token manquant ou invalide
- **403 Forbidden** : Permissions insuffisantes
- **404 Not Found** : Organisation ou membre non trouvé
- **400 Bad Request** : Données invalides

## 🚀 **PRÊT POUR LE FRONTEND**

Ces routes permettent de :

- ✅ Gérer l'adhésion des membres
- ✅ Lister et filtrer les membres
- ✅ Changer les rôles et permissions
- ✅ Retirer des membres
- ✅ Gérer les statuts (pending, active, banned)

Parfait pour construire l'interface de gestion des membres dans votre SaaS !
