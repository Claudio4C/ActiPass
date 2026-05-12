# ROADMAP & USER STORIES

## SaaS AssoClub / Ikivio

**Mars 2026 — Plan de livraison par phases**

---

# 🎯 Stratégie d'organisation

## La règle d'or : une feature FINIE vaut mieux que cinq entamées

**Recommandation forte :** travaillez sur LA MÊME feature jusqu'à ce qu'elle soit livrable. Ne passez à la suivante que quand la précédente est testée et déployée.

- **Sprint de 2 semaines :** chaque sprint livre 1 à 2 épiques complètes (front + back + tests).
- **Définition de « Done » :** endpoint back fonctionnel + page front branchée sur l'API réelle (pas de mock) + tests manuels passés.

---

# 🗺️ Vue d'ensemble des phases

| Phase | Objectif | Features clés | Statut |
|-------|----------|---------------|--------|
| **Phase 0** | Stabiliser le core | Sidebar API réelle, routes protégées, cleanup mocks | ✅ **Terminé** |
| **Phase 1** | Gestion des membres 360° | Comptes parents/enfants, documents, profils complets | 🔄 **En cours** |
| **Phase 2** | Paiements & Finance | Stripe, cotisations, factures, relances | ⏳ À faire |
| **Phase 3** | Planning avancé & QR | QR code check-in, créneaux coach, listes d'attente | ⏳ À faire |
| **Phase 4** | Communication | Notifications, messagerie interne, emails auto | ⏳ À faire |
| **Phase 5** | Espace Coach | Dashboard coach, multi-club, profil public | ⏳ À faire |
| **Phase 6** | Portail Municipal | Dashboard mairie, conventions, subventions | ⏳ À faire |
| **Phase 7** | Nice to Have | CRM, marketplace, fidélité, pass corpo | ⏳ Continu |

---

# ⚠️ Phase 0 — Stabilisation du core ✅

| ID | User Story | Front | Back |
|----|-----------|-------|------|
| P0-1 | Sidebar utilise l'API réelle (plus de getMockMembership) | ✅ | ✅ |
| P0-2 | Routes /coach/* protégées par ProtectedRoute | ✅ | — |
| P0-3 | Suppression de toutes les données mock | ✅ | — |
| P0-4 | Script de seed réaliste (2 clubs, 5 membres, 3 events) | — | ✅ |

---

# 👪 Phase 1 — Gestion des membres 360°

## Epic 1.1 — Comptes Parents / Famille ✅

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P1-1 | En tant que parent, je veux créer un compte famille et y rattacher mes enfants mineurs | Le parent crée un compte, puis ajoute 1 à N enfants avec nom, prénom, date de naissance. Les enfants n'ont pas de login propre. | ✅ | ✅ |
| P1-2 | En tant que parent, je veux inscrire un de mes enfants à un club et gérer son adhésion | Depuis le profil famille, le parent sélectionne un enfant et l'inscrit à un club. Le membership est créé au nom de l'enfant. | ✅ | ✅ |
| P1-3 | En tant que parent, je veux voir le planning et les réservations de tous mes enfants dans un seul dashboard | Vue consolidée avec un filtre par enfant. Les réservations de chaque enfant sont visibles. | ✅ | ✅ |
| P1-4 | En tant que parent, je veux recevoir les notifications concernant mes enfants (absences, events, paiements) | Toute notification liée à un enfant est envoyée au parent. Email ou in-app. | — | — |
| P1-5 | En tant qu'admin club, je veux voir le parent rattaché à un membre mineur dans la fiche membre | La fiche membre affiche le parent responsable avec ses coordonnées de contact. | ✅ | ✅ |

## Epic 1.1b — Comptes Parents / Famille (Bonus) ✅

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P1-B1 | En tant que parent, je veux renseigner la fiche santé / urgence de chaque enfant | Formulaire dans le profil enfant avec les champs santé (allergies, traitements, groupe sanguin, contact d'urgence). | ✅ | ✅ |
| P1-B2 | En tant que parent, je veux signer des autorisations dématérialisées | Le parent signe (checkbox + horodatage). Réactif sans rechargement. Pas de fichiers — Epic 1.2. | ✅ | ✅ |
| P1-B3 | En tant que coach/animateur, je veux laisser un commentaire de suivi après chaque séance | Champ texte depuis la page de présences. Le parent voit les commentaires sur le profil enfant. | — | — |
| P1-B4 | En tant que parent multi-enfants multi-clubs, je veux une vue "semaine famille" consolidée | Calendrier hebdomadaire avec navigation semaine, code couleur par enfant. | ✅ | ✅ |

> **Note P1-B2 :** Les autorisations sont des signatures checkbox horodatées. Les vrais documents administratifs (PDF, certificats) sont traités dans l'**Epic 1.2**.

---

## Epic 1.2 — Documents & Pièces administratives

> **Note technique :** L'Epic 1.2 inclura la migration du système de fichiers (avatars + logos + documents) vers un stockage cloud externe (Cloudinary, S3, Supabase Storage ou autre — à décider selon étude). Actuellement en dev, les fichiers sont stockés localement dans `backend/uploads/` via Multer (non persistant en prod sur PaaS). La migration sera faite en une seule passe à ce moment-là.

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P1-6 | En tant qu'admin club, je veux définir les documents obligatoires pour l'adhésion (certificat médical, pièce d'identité, B3...) | Page paramètres avec liste des documents requis. Chaque document a un nom, un type, et un statut obligatoire/optionnel. | — | — |
| P1-7 | En tant que membre (ou parent), je veux uploader mes documents administratifs depuis mon profil | Upload de fichiers (PDF, JPG, PNG) depuis la page profil. Barre de progression visible. Limite 5 Mo par fichier. | — | — |
| P1-8 | En tant qu'admin club, je veux valider ou refuser un document soumis par un membre | Liste des documents en attente de validation. Bouton valider/refuser avec motif de refus. | — | — |
| P1-9 | En tant qu'admin club, je veux voir d'un coup d'oeil quels membres ont des documents manquants ou expirés | Tableau de bord avec badge rouge sur les membres avec documents incomplets. Filtre « documents manquants ». | — | — |

---

## Epic 1.3 — Profil membre complet

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P1-10 | En tant que membre, je veux compléter mon profil avec coordonnées, contact d'urgence et infos médicales | Formulaire de profil avec sections. profile_mode persisté en DB via PUT /users/me. | ✅ | ✅ |
| P1-11 | En tant qu'admin club, je veux exporter la liste des membres en CSV avec toutes leurs infos | Bouton export CSV dans la page membres. | — | — |
| P1-12 | En tant qu'admin club, je veux attribuer des tags aux membres (débutant, compétition, loisir) | Système de tags créables et assignables. Filtre par tag dans la liste des membres. | — | — |

---

# 💳 Phase 2 — Paiements & Finance

## Epic 2.1 — Intégration Stripe

| ID | User Story | Front | Back |
|----|-----------|-------|------|
| P2-1 | Admin connecte son compte Stripe | — | — |
| P2-2 | Admin crée des formules d'abonnement | — | — |
| P2-3 | Membre paie sa cotisation en ligne | — | — |
| P2-4 | Parent paie les cotisations de ses enfants en une transaction | — | — |

## Epic 2.2 — Facturation & Suivi

| ID | User Story | Front | Back |
|----|-----------|-------|------|
| P2-5 | Dashboard financier admin | — | — |
| P2-6 | Génération facture PDF | — | — |
| P2-7 | Relances automatiques cotisations en retard | — | — |
| P2-8 | Historique paiements + téléchargement factures (membre) | — | — |

---

# 📅 Phase 3 — Planning avancé & QR Code

| ID | User Story | Front | Back |
|----|-----------|-------|------|
| P3-1 | Membre scanne un QR code pour valider sa présence | — | ✅ |
| P3-2 | Coach génère un QR code pour sa séance | — | ✅ |
| P3-3 | Liste d'attente quand événement complet | — | — |
| P3-4 | Coach déclare ses disponibilités | — | — |
| P3-5 | Admin définit des pénalités de no-show | — | — |

---

# 🔔 Phase 4 — Communication & Notifications

| ID | User Story | Front | Back |
|----|-----------|-------|------|
| P4-1 | Email de rappel 24h avant un entraînement | — | — |
| P4-2 | Admin envoie une notification à un groupe filtré | — | — |
| P4-3 | Cloche de notifications avec badge dans la navbar | — | — |
| P4-4 | Coach envoie un message à son équipe | — | — |
| P4-5 | Emails automatiques (bienvenue, paiement reçu, document validé) | — | — |

---

# 🏋️ Phase 5 — Espace Coach complet

| ID | User Story | Front | Back |
|----|-----------|-------|------|
| P5-1 | Dashboard coach (séances, stats, équipes) | — | — |
| P5-2 | Vue consolidée multi-clubs | — | — |
| P5-3 | Suivi progression joueurs | — | — |
| P5-4 | Profil public coach | — | — |

---

# 🏛️ Phase 6 — Portail Municipal

| ID | User Story | Front | Back |
|----|-----------|-------|------|
| P6-1 | Liste des associations de la commune | — | — |
| P6-2 | Gestion des infrastructures sportives | — | — |
| P6-3 | Conventions et subventions | — | — |
| P6-4 | Statistiques d'utilisation des infrastructures | — | — |

---

# 🚀 Phase 7 — Nice to Have (continu)

| ID | User Story | Front | Back |
|----|-----------|-------|------|
| P7-1 | CRM avec tags intelligents | — | — |
| P7-2 | Marketplace coachs indépendants | — | — |
| P7-3 | Points de fidélité | — | — |
| P7-4 | Pass sport entreprise | — | — |
| P7-5 | 2FA pour comptes admin | — | — |

---

# ✅ Checklist avant lancement (MVP — Phases 0 à 3)

- [x] Auth complète (inscription, login, récup mdp, vérification email)
- [x] Register multi-étapes avec choix de profil (Membre / Parent / Gérant)
- [x] Comptes parents + rattachement enfants + fiche santé + autorisations
- [x] Planning famille consolidé (vue semaine, filtre par enfant, code couleur)
- [x] Dashboard admin : membres, événements, présences — vraies données
- [x] Fiche membre detail avec tuteur pour les mineurs
- [ ] Upload et validation des documents administratifs (**Epic 1.2**)
- [x] Export CSV membres + tags membres (**Epic 1.3**)
- [ ] Création d'événements + réservation par les membres (paiements)
- [ ] Paiement de cotisation en ligne (Stripe)
- [ ] Génération de facture PDF
- [ ] Notifications email de base (bienvenue, rappel)
- [ ] QR code check-in fonctionnel (frontend — backend ✅)

**Priorité suivante : Epic 1.2 (Documents) → Epic 1.3 (Export/Tags) → Phase 2 (Stripe)**
