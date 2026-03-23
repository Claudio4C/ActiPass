# Tests Manuels - Système de Gestion des Présences

## 📋 Résumé de ce qui a été implémenté

### Backend

- ✅ Modèle `Attendance` avec champs : `validated_at`, `correction_note`, `correction_date`, `correction_by`, `qr_code`
- ✅ Permissions `attendance:read` et `attendance:manage` pour Club Owner, Club Admin, Coach
- ✅ Service avec logique métier complète :
  - Règle des 24h pour les coaches
  - Corrections admin avec note obligatoire après 24h
  - Génération et validation de QR code
  - Statistiques complètes
  - Validation en fin de séance
- ✅ Controller avec toutes les routes API
- ✅ Audit logging pour toutes les actions

### Frontend

- ✅ Page de liste des événements avec présences (`AttendancePage`)
- ✅ Page de détail avec grille interactive (`AttendanceDetailPage`)
- ✅ Page de statistiques (`AttendanceStatsPage`)
- ✅ Routes et menu de navigation

---

## 🧪 Tests Manuels à Effectuer

### 1. Tests de Permissions

#### Test 1.1 : Accès Club Owner / Club Admin

1. Connectez-vous en tant que **Club Owner** ou **Club Admin**
2. Allez dans le menu "Présences"
3. ✅ **Résultat attendu** : Vous devez voir la liste des événements
4. Cliquez sur un événement
5. ✅ **Résultat attendu** : Vous devez voir la grille de présences avec possibilité de modifier

#### Test 1.2 : Accès Coach

1. Connectez-vous en tant que **Coach**
2. Allez dans le menu "Présences"
3. ✅ **Résultat attendu** : Vous devez voir la liste des événements
4. Cliquez sur un événement que vous avez créé
5. ✅ **Résultat attendu** : Vous devez pouvoir modifier les présences

#### Test 1.3 : Accès Membre (interdit)

1. Connectez-vous en tant que **Membre**
2. Allez dans le menu "Présences"
3. ✅ **Résultat attendu** : Le menu "Présences" ne doit pas apparaître OU vous devez recevoir une erreur 403

---

### 2. Tests de Gestion des Présences

#### Test 2.1 : Création/Mise à jour d'une présence

1. En tant que **Coach** ou **Admin**, allez sur un événement
2. Dans la grille, changez le statut d'un participant (ex: "Présent" → "En retard")
3. Ajoutez un commentaire optionnel
4. Cliquez sur "Enregistrer"
5. ✅ **Résultat attendu** :
   - Message de succès
   - La présence est enregistrée
   - Le statut est mis à jour dans la grille

#### Test 2.2 : Mise à jour en masse (Bulk Update)

1. En tant que **Coach** ou **Admin**, allez sur un événement
2. Modifiez plusieurs présences en même temps (statuts différents)
3. Cliquez sur "Enregistrer"
4. ✅ **Résultat attendu** : Toutes les présences sont mises à jour

#### Test 2.3 : Validation en fin de séance

1. En tant que **Coach** ou **Admin**, allez sur un événement
2. Modifiez quelques présences
3. Cliquez sur "Valider"
4. Confirmez la validation
5. ✅ **Résultat attendu** :
   - Message de succès
   - Toutes les présences ont `validated_at` renseigné
   - Un badge "Validé" apparaît sur l'événement dans la liste

---

### 3. Tests de la Règle des 24h

#### Test 3.1 : Modification par Coach dans les 24h

1. Créez un événement avec une date de fin **il y a moins de 24h**
2. En tant que **Coach**, allez sur cet événement
3. Modifiez une présence
4. ✅ **Résultat attendu** : La modification fonctionne sans problème

#### Test 3.2 : Modification par Coach après 24h (interdit)

1. Créez un événement avec une date de fin **il y a plus de 24h**
2. En tant que **Coach**, allez sur cet événement
3. Essayez de modifier une présence
4. ✅ **Résultat attendu** :
   - Un message d'avertissement apparaît : "Le délai de modification (24h) est dépassé"
   - Les champs sont en lecture seule
   - Vous ne pouvez pas enregistrer

#### Test 3.3 : Correction par Admin après 24h

1. Créez un événement avec une date de fin **il y a plus de 24h**
2. En tant que **Club Owner** ou **Club Admin**, allez sur cet événement
3. Modifiez une présence
4. ✅ **Résultat attendu** :
   - Vous pouvez modifier (pas de restriction pour les admins)
   - Si vous utilisez l'endpoint de correction, une note de correction est obligatoire

---

### 4. Tests de Statistiques

#### Test 4.1 : Affichage des statistiques

1. En tant que **Club Owner** ou **Club Admin**, allez dans "Présences" → "Statistiques"
2. ✅ **Résultat attendu** : Vous voyez :
   - Taux de présence global
   - Top 10 séances les plus fréquentées
   - Top 10 adhérents les plus assidus
   - Taux de no-show par mois

#### Test 4.2 : Filtres de statistiques

1. Allez dans les statistiques
2. Sélectionnez une période (date de début et fin)
3. ✅ **Résultat attendu** : Les statistiques sont filtrées selon la période
4. Testez avec un filtre par coach (si applicable)
5. ✅ **Résultat attendu** : Les statistiques sont filtrées par coach

---

### 5. Tests de QR Code

#### Test 5.1 : Génération de QR Code

1. En tant que **Coach** ou **Admin**, allez sur un événement
2. Cliquez sur "QR Code"
3. ✅ **Résultat attendu** :
   - Un QR code unique est généré
   - Un modal s'affiche avec le code
   - Le code est affiché en texte

#### Test 5.2 : Validation par QR Code (self-check-in)

1. Générez un QR code pour un événement
2. En tant que **Membre** ayant une réservation pour cet événement
3. Utilisez l'endpoint de validation QR code avec le code généré
4. ✅ **Résultat attendu** :
   - Votre présence est enregistrée automatiquement
   - Le type de présence est "self" (self-check-in)

---

### 6. Tests de Correction Admin

#### Test 6.1 : Correction avec note obligatoire

1. En tant que **Club Owner** ou **Club Admin**, allez sur un événement validé depuis plus de 24h
2. Utilisez l'endpoint de correction (`PUT /attendance/:attendanceId/correct`)
3. Modifiez le statut d'une présence
4. ✅ **Résultat attendu** :
   - Si vous fournissez une note de correction : succès
   - Si vous ne fournissez pas de note : erreur (note obligatoire)
   - La correction est tracée dans l'audit log

---

### 7. Tests de l'Interface Utilisateur

#### Test 7.1 : Liste des événements

1. Allez dans "Présences"
2. ✅ **Résultat attendu** :
   - Liste des événements publiés
   - Pour chaque événement : nombre de présents, absents, en retard
   - Badge "Validé" si l'événement est validé
   - Recherche fonctionnelle

#### Test 7.2 : Grille de présences

1. Cliquez sur un événement
2. ✅ **Résultat attendu** :
   - Tableau avec colonnes : Participant, Statut, Commentaire, Informations
   - Pour chaque participant : avatar, nom, email
   - Dropdown pour changer le statut (si modification autorisée)
   - Champ commentaire (si modification autorisée)
   - Informations sur qui a validé/corrigé

#### Test 7.3 : Indicateurs visuels

1. Vérifiez les icônes de statut :
   - ✅ Présent : icône verte
   - ⏰ En retard : icône jaune
   - ❌ Absent : icône rouge
2. ✅ **Résultat attendu** : Les icônes et couleurs correspondent aux statuts

---

### 8. Tests d'Edge Cases

#### Test 8.1 : Événement sans réservations

1. Créez un événement sans aucune réservation
2. Allez dans les présences de cet événement
3. ✅ **Résultat attendu** : Message "Aucun participant" ou liste vide

#### Test 8.2 : Participant sans présence enregistrée

1. Allez sur un événement avec des réservations
2. ✅ **Résultat attendu** : Les participants sans présence ont le statut "Présent" par défaut

#### Test 8.3 : Double enregistrement

1. Enregistrez une présence pour un utilisateur
2. Réessayez d'enregistrer la même présence
3. ✅ **Résultat attendu** : La présence est mise à jour (pas de doublon)

---

### 9. Tests d'Audit Log

#### Test 9.1 : Vérification des logs

1. Effectuez plusieurs actions (création, modification, validation, correction)
2. Vérifiez les logs d'audit (si vous avez accès)
3. ✅ **Résultat attendu** : Toutes les actions sont tracées avec :
   - Utilisateur qui a fait l'action
   - Type d'action
   - Ressource concernée
   - Timestamp

---

### 10. Tests de Performance

#### Test 10.1 : Événement avec beaucoup de participants

1. Créez un événement avec 50+ réservations
2. Allez dans les présences
3. ✅ **Résultat attendu** : La page se charge en moins de 3 secondes

#### Test 10.2 : Statistiques avec beaucoup de données

1. Avec plusieurs événements et présences en base
2. Allez dans les statistiques
3. ✅ **Résultat attendu** : Les statistiques se calculent rapidement

---

## ✅ Checklist de Validation

- [ ] Permissions : Club Owner/Admin peuvent accéder
- [ ] Permissions : Coach peut accéder
- [ ] Permissions : Membre ne peut pas accéder
- [ ] Création/Mise à jour de présence fonctionne
- [ ] Mise à jour en masse fonctionne
- [ ] Validation en fin de séance fonctionne
- [ ] Règle des 24h : Coach peut modifier dans les 24h
- [ ] Règle des 24h : Coach ne peut pas modifier après 24h
- [ ] Règle des 24h : Admin peut toujours modifier
- [ ] Correction admin avec note obligatoire fonctionne
- [ ] Statistiques s'affichent correctement
- [ ] Filtres de statistiques fonctionnent
- [ ] Génération QR code fonctionne
- [ ] Validation par QR code fonctionne
- [ ] Interface utilisateur est intuitive
- [ ] Les erreurs sont gérées proprement
- [ ] Les messages de succès/erreur s'affichent

---

## 🐛 Points à Vérifier en Cas de Problème

1. **Erreur 403 Forbidden** : Vérifiez que les permissions sont bien seedées (`npm run db:seed`)
2. **Erreur 404 Not Found** : Vérifiez que l'événement existe et appartient à l'organisation
3. **Erreur de modification après 24h** : Vérifiez que la date de fin de l'événement est correcte
4. **Statistiques vides** : Vérifiez qu'il y a des présences enregistrées
5. **QR code ne fonctionne pas** : Vérifiez que le champ `qr_code` existe dans la base de données

---

## 📝 Notes

- Les emails de notification ne sont pas encore implémentés (à faire plus tard)
- L'export CSV n'est pas encore implémenté (à faire plus tard)
- Le self-check-in avec badge n'est pas encore implémenté (à faire plus tard)
