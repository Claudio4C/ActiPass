# Espace Coach - Documentation

## Vue d'ensemble

L'espace coach a été créé pour offrir aux coachs une interface dédiée avec des fonctionnalités spécifiques différentes de celles des membres.

## Pages créées

### 1. Dashboard Coach (`/coach/dashboard`)
- Vue consolidée des statistiques (créneaux, cours privés, revenus, notes)
- Actions rapides vers les différentes sections
- Liste des prochains créneaux avec statut (confirmé/en attente)
- Gestion des créneaux en attente de confirmation

### 2. Planning (`/coach/planning`)
- Vue calendrier et liste des créneaux
- Gestion multi-club : visualisation consolidée des créneaux dans différents clubs
- Créneaux privés : possibilité de créer des créneaux de coaching privé
  - **Option en ligne (visio)** : possibilité de créer des cours en visioconférence
  - **Option à domicile** : cours en présentiel
- Indisponibilités : déclaration d'indisponibilité (interface préparée)
- Acceptation/refus des créneaux proposés par les clubs
- **Envoi de messages aux participants** : possibilité d'envoyer un message à tous les participants d'une séance confirmée

### 3. Profil Public (`/coach/profile`)
- Présentation : description, photo, qualifications, disciplines enseignées
- Zone d'intervention et clubs où le coach enseigne
- Tarification : définition de tarifs publics (séance unique, pack 5, pack 10)
- Réductions : possibilité d'appliquer des réductions (première séance gratuite)
- Disponibilités : calendrier avec plages horaires libres pour les coachings privés
- **Publier le calendrier de disponibilités** : option pour rendre le calendrier visible par les clubs afin qu'ils puissent proposer des créneaux
- Avis et évaluations : collecte de notes et commentaires des utilisateurs
- Validation du profil : le coach ne peut pas publier son profil tant que les informations obligatoires ne sont pas renseignées

### 4. Candidatures (`/coach/applications`)
- Consultation des offres disponibles dans les clubs
- Candidature spontanée aux clubs
- Suivi des candidatures envoyées (en attente, acceptée, refusée)
- Filtres par discipline et recherche par nom/ville
- **Demandes de stages** : section dédiée pour les demandes ponctuelles d'animation de stages
  - Visualisation des demandes reçues (titre, dates, durée, rémunération)
  - **Répondre à une demande** : accepter ou décliner avec message optionnel

### 5. Rémunérations (`/coach/billing`)
- Statistiques des revenus (total, en attente, par période)
- Historique des rémunérations
- Détails par créneau (nombre de séances, participants, taux horaire)
- Statut des paiements (en attente, payé, en retard)
- Téléchargement des factures
- Information sur le système de calcul automatique des rémunérations

## Routes ajoutées

Toutes les routes sont accessibles sous le préfixe `/coach/` :
- `/coach/dashboard` - Tableau de bord
- `/coach/planning` - Planning
- `/coach/profile` - Profil public
- `/coach/applications` - Candidatures
- `/coach/billing` - Rémunérations

## Fonctionnalités implémentées

### Must Have ✅
- [x] Gestion du planning multi-club
- [x] Acceptation/refus des créneaux proposés
- [x] Création de créneaux privés (à domicile ou en ligne/visio)
- [x] Page personnelle/profil public
- [x] Présentation, qualifications, disciplines
- [x] Tarification (séance unique, packs)
- [x] Disponibilités pour cours privés
- [x] **Publier un calendrier de disponibilités accessible aux clubs**
- [x] Avis et évaluations
- [x] Candidature spontanée aux clubs
- [x] **Répondre à une demande d'un club pour animer un stage**
- [x] **Envoyer un message aux participants de sa séance**
- [x] Suivi des rémunérations
- [x] Validation du profil incomplet

### Nice to Have (À implémenter)
- [ ] Système de remplaçants automatiques pour indisponibilités
- [ ] Calcul automatique de la rémunération selon participants/forfait
- [ ] Système de paie automatique
- [ ] Pénalités pour annulation tardive de créneaux privés
- [ ] Composant calendrier complet (FullCalendar ou similaire)
- [ ] Upload de photo de profil
- [ ] Gestion complète des qualifications (ajout/suppression)
- [ ] Modification des disponibilités
- [ ] Intégration API backend

## Prochaines étapes

1. **Backend API** : Créer les endpoints pour :
   - Récupérer les créneaux du coach
   - Accepter/refuser des créneaux
   - Créer des créneaux privés
   - Gérer le profil public
   - Gérer les candidatures
   - Calculer les rémunérations

2. **Intégration** : Connecter les pages frontend aux APIs backend

3. **Fonctionnalités avancées** :
   - Système de remplaçants
   - Calcul automatique des rémunérations
   - Pénalités pour annulations tardives

4. **Améliorations UX** :
   - Composant calendrier interactif
   - Upload de fichiers (photo, diplômes)
   - Notifications en temps réel

## Notes techniques

- Toutes les pages utilisent le composant `Layout` existant
- Les données sont actuellement mockées et doivent être remplacées par des appels API
- Le système de rôles backend existe déjà (`coach` dans `RoleType`)
- Les modèles Prisma existants (`PrivateCourse`, `AvailabilitySlot`, `Listing`) peuvent être utilisés

