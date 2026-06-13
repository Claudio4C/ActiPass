# ROADMAP & USER STORIES

## SaaS Actipass / Ikivio

**Juin 2026 — Plan de livraison par phases**

---

# 🎯 Stratégie d'organisation

## La règle d'or : une feature FINIE vaut mieux que cinq entamées

- **Sprint de 2 semaines :** chaque sprint livre 1 à 2 épiques complètes (front + back + tests).
- **Définition de « Done » :** endpoint back fonctionnel + page front branchée sur l'API réelle + tests manuels passés.

---

# 🗺️ Vue d'ensemble des phases

| Phase | Objectif | Features clés | Statut |
|-------|----------|---------------|--------|
| **Phase 0** | Stabiliser le core | Sidebar API réelle, routes protégées, cleanup mocks | ✅ **Terminé** |
| **Phase 1** | Gestion des membres 360° | Comptes parents/enfants, adhésion, documents, profils | ✅ **Terminé** |
| **Phase 2** | Paiements & Finance | Stripe Connect, cotisations, saisons, renouvellement | ✅ **Terminé** |
| **Phase 3** | Planning avancé | Récurrence, réservation, liste d'attente, QR code, présences | ⏳ À faire |
| **Phase 4** | Communication | Notifications ciblées, messagerie, emails auto | ⏳ À faire |
| **Phase 5** | Espace Coach | Dashboard coach, multi-club, profil public | ⏳ À faire |
| **Phase 6** | Portail Municipal | Dashboard mairie, conventions, subventions, statistiques | ⏳ À faire |
| **Phase 7** | Nice to Have | CRM, marketplace, fidélité, pass corpo, PWA, QR adhérent | ⏳ Continu |

---

# ⚠️ Phase 0 — Stabilisation du core ✅

| ID | User Story | Front | Back |
|----|-----------|-------|------|
| P0-1 | Sidebar utilise l'API réelle | ✅ | ✅ |
| P0-2 | Routes protégées par ProtectedRoute | ✅ | ✅ |
| P0-3 | Suppression de toutes les données mock | ✅ | ✅ |
| P0-4 | Script de seed réaliste | ✅ | ✅ |

---

# 👪 Phase 1 — Gestion des membres 360° ✅

## Epic 1.1 — Comptes Parents / Famille ✅

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P1-1 | Créer un compte famille et rattacher des enfants mineurs | Compte parent + 1 à N enfants (nom, prénom, date de naissance). Enfants sans login propre. | ✅ | ✅ |
| P1-2 | Inscrire un enfant à un club | Sélection enfant → membership créé au nom de l'enfant. | ✅ | ✅ |
| P1-3 | Vue planning consolidée multi-enfants | Filtre par enfant, réservations visibles. | ✅ | ✅ |
| P1-4 | Notifications enfants → parent | Email ou in-app. | — | — |
| P1-5 | Voir le parent d'un mineur (admin) | Fiche membre affiche le parent responsable + coordonnées. | ✅ | ✅ |

## Epic 1.1b — Comptes Parents / Famille (Bonus) ✅

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P1-B1 | Fiche santé / urgence de chaque enfant | Allergies, traitements, groupe sanguin, contact d'urgence. | ✅ | ✅ |
| P1-B2 | Autorisations dématérialisées | Checkbox + horodatage. Documents PDF dans Epic 1.3. | ✅ | ✅ |
| P1-B3 | Commentaire de suivi coach post-séance | Champ texte depuis présences. Visible par le parent. | — | — |
| P1-B4 | Vue semaine famille consolidée | Calendrier hebdomadaire, code couleur par enfant. | ✅ | ✅ |

---

## Epic 1.2 — Flux d'adhésion ✅

> Frontend `MemberPickerSheet`, `AdminRequests`, KPIs dashboard et backend complets et branchés sur l'API réelle.

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P1-6 | Envoyer une demande d'adhésion | MemberPickerSheet → POST memberships → PENDING. Badge sur card club. | ✅ | ✅ |
| P1-7 | Gérer les demandes en attente (admin) | AdminRequests branché API. Accepter → ACTIVE. Refuser → REJECTED + motif. Tout accepter en masse. | ✅ | ✅ |
| P1-8 | Suivre le statut de sa demande | Badge PENDING amber / ACTIVE emerald / REJECTED rouge + motif. | ✅ | ✅ |
| P1-9 | Suspendre ou archiver un membre (admin) | Suspendre → SUSPENDED + motif. Archiver → EXPIRED. | ✅ | ✅ |
| P1-10 | Quitter un club | Bouton "Quitter" → confirmation → RESIGNED. | ✅ | ✅ |

---

## Epic 1.3 — Documents & Pièces administratives ✅

> Stockage Backblaze B2 (S3-compatible). Backend complet : CRUD RequiredDocuments, upload/review/signed-URL/compliance, endpoints famille pour documents enfants.

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P1-11 | Définir les documents obligatoires (admin) | Onglet Paramètres, CRUD, présets standards, seed-defaults. | ✅ | ✅ |
| P1-12 | Uploader ses documents (membre/parent) | Upload PDF/JPG/PNG (5 Mo max), progression, états, re-upload, documents enfants. | ✅ | ✅ |
| P1-13 | Valider ou refuser un document (admin) | Onglet À valider, URL signée 15 min, valider/refuser avec motif. | ✅ | ✅ |
| P1-14 | Vue conformité membres (admin) | Onglet Conformité, accordéon, pills, rôles admin exclus. | ✅ | ✅ |

---

## Epic 1.4 — Licences fédérales ✅

> Intégrées via le système de documents (RequiredDocument "Licence fédérale"). Pas d'Epic séparé nécessaire.

---

## Epic 1.5 — Profil membre complet ✅

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P1-18 | Compléter son profil | Coordonnées, contact d'urgence, infos médicales. PUT /users/me. | ✅ | ✅ |
| P1-19 | Export CSV membres (admin) | Export avec statuts documents et membership. | ✅ | ✅ |
| P1-20 | Tags membres (admin) | Tags créables, assignables, filtrables. | ✅ | ✅ |

---

# 💳 Phase 2 — Paiements & Finance 🔄

## Epic 2.1 — Gestion des saisons ✅

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P2-1 | Créer et gérer les saisons | Nom, dates début/fin, une seule active à la fois. | ✅ | ✅ |
| P2-2 | Clôturer une saison | Membres ACTIVE → EXPIRED. Admins non expirés. | ✅ | ✅ |
| P2-3 | Historique d'adhésions (membre) | Timeline saisons passées avec statut. | ✅ | ✅ |

## Epic 2.2 — Intégration Stripe & Cotisations 🔄

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P2-4 | Connecter son compte Stripe (admin) | Stripe Connect Express, onboarding intégré, 3 états UI. | ✅ | ✅ |
| P2-5 | Créer des formules de cotisation | Nom, montant, saison, Stripe Price créé automatiquement. | ✅ | ✅ |
| P2-6 | Multi-tarifs | Tarif enfant/adulte/famille, réduit, early bird. | ✅ | — |
| P2-7 | Payer sa cotisation en ligne | Stripe Checkout sur compte connecté, commission 2% Actipass, anti-double-paiement. | ✅ | ✅ |
| P2-8 | Panier multi-membres (parent) | Une transaction pour plusieurs enfants. | — | — |

## Epic 2.3 — Dashboard financier & Suivi ✅

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P2-9 | Dashboard financier admin | KPI cards CA/mois/attente/échoués, tableau filtrable, export CSV. | ✅ | ✅ |
| P2-10 | Renouvellement annuel | Bouton envoi invitations fin de saison, RenewalLog, compteur membres expirés. Email réel → Phase 4. | ✅ | ✅ |
| P2-11 | Relances impayés | Onglet Impayés, liste membres sans paiement, relancer individuel/tous. Relances J+7/14/30 automatiques → Phase 4. | ✅ | ✅ |
| P2-12 | Reçus Stripe | Lien reçu Stripe après paiement, accessible admin et membre. PDF custom → Phase 7. | ✅ | ✅ |
| P2-13 | Remboursements | Remboursement Stripe total via admin, webhook sync. Remboursement partiel + avoir crédit → Phase 7. | ✅ | ✅ |

---

# 📅 Phase 3 — Planning avancé ⏳

## Epic 3.1 — Événements récurrents & Réservation

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P3-1 | Créer un événement récurrent | Récurrence : quotidienne, hebdomadaire, mensuelle. Modifier une occurrence ou la série. | — | — |
| P3-2 | Réserver sa place à un événement | Bouton "Réserver", confirmation email, annulation jusqu'à X heures avant. | — | — |
| P3-3 | Capacité maximale d'un événement | Places max configurables, compteur visible. | — | — |
| P3-4b | Événements payants | Prix d'entrée sur un event, Stripe Checkout, club encaisse (ex-P2-15). | — | — |

## Epic 3.2 — Liste d'attente

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P3-4 | Rejoindre la liste d'attente | Bouton si event complet, position visible, notification si place libre. | — | — |
| P3-5 | Gérer la liste d'attente (admin) | Vue par événement, promotion manuelle ou automatique. | — | — |

## Epic 3.3 — Présences & QR Code

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P3-6 | Pointer les présences manuellement (coach) | Liste inscrits + case à cocher, absent/présent/retard, temps réel. | — | — |
| P3-7 | Générer un QR code de séance (coach) | QR unique par event, valable pendant la durée. | — | ✅ |
| P3-8 | Scanner le QR code (membre) | Page scan, confirmation visuelle immédiate. | — | ✅ |
| P3-9 | Statistiques de présence (admin) | Taux par membre/cours/période, export CSV. | — | — |

---

# 🔔 Phase 4 — Communication & Notifications ⏳

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P4-1 | Notification ciblée (admin) | Tous membres / section / sans document / impayés. Email + in-app. | — | — |
| P4-2 | Emails automatiques planifiés | Rappel 24h avant entraînement, relance cotisation, renouvellement saison. | — | — |
| P4-3 | Centre de notifications in-app | Cloche + badge navbar, marquer comme lu. | — | — |
| P4-4 | Message équipe (coach) | Message groupé aux inscrits d'un cours. In-app + email. | — | — |
| P4-5 | Emails transactionnels | Bienvenue, paiement reçu, document validé/refusé, place disponible. | — | — |

---

# 🏋️ Phase 5 — Espace Coach complet ⏳

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P5-1 | Dashboard coach | Vue semaine, liste inscrits, taux présence, commentaires. | — | — |
| P5-2 | Vue multi-clubs coach indépendant | Gérer plusieurs clubs depuis un dashboard. | — | — |
| P5-3 | Suivi progression membres | Champs personnalisables par sport (ceintures, niveaux, chronos). | — | — |
| P5-4 | Profil public coach | Bio, spécialités, clubs. Visible dans l'annuaire. | — | — |
| P5-5 | Commentaires suivi post-séance | Champ texte après séance, visible parent/membre. | — | — |

---

# 🏛️ Phase 6 — Portail Municipal ⏳

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P6-1 | Liste des associations de la commune | Vue toutes associations, statuts, membres, activités. | — | — |
| P6-2 | Gestion des infrastructures sportives | Gymnases, terrains : capacité, dispo, réservation par clubs. | — | — |
| P6-3 | Conventions et subventions | Suivi conventions, montants, documents associés. | — | — |
| P6-4 | Statistiques d'utilisation | Licenciés par sport, occupation équipements, export PDF rapport municipal. | — | — |

---

# 🚀 Phase 7 — Nice to Have ⏳

| ID | User Story | Front | Back |
|----|-----------|-------|------|
| P7-1 | CRM tags intelligents et segmentation | — | — |
| P7-2 | Marketplace coachs indépendants | — | — |
| P7-3 | Points de fidélité (présences = réductions) | — | — |
| P7-4 | Pass sport entreprise (CSE) | — | — |
| P7-5 | 2FA comptes admin et mairie | — | — |
| P7-6 | QR code carte adhérent digitale | — | — |
| P7-7 | PWA mobile (installation écran d'accueil) | — | — |
| P7-8 | API publique (fédérations, logiciels compta) | — | — |
| P7-9 | Portail client Stripe (CB, reçus) | — | — |
| P7-10 | Codes promo / réductions (early bird, parrainage) | — | — |
| P7-11 | Export comptable FEC / intégration Pennylane | — | — |
| P7-12 | Paiement en plusieurs fois (2x/3x Stripe) | max_installments déjà en base (ex-P2-14). | — | — |
| P7-13 | Factures PDF custom | Générée après paiement, téléchargeable (ex-P2-12 partiel). | — | — |
| P7-14 | Remboursement partiel + avoir crédit saison suivante | Extension de P2-13. | — | — |

---

# ✅ Checklist avant lancement MVP

- [x] Auth complète (inscription, login, récup mdp, vérification email)
- [x] Register multi-étapes avec choix de profil (Membre / Parent / Gérant)
- [x] Onboarding 3 variantes avec GettingStartedCard
- [x] Comptes parents + enfants + fiche santé + autorisations
- [x] Planning famille consolidé (vue semaine, filtre, code couleur)
- [x] Dashboard admin : membres, événements, présences — données réelles
- [x] Fiche membre avec tuteur pour les mineurs
- [x] Export CSV membres + tags
- [x] Flux d'adhésion complet (Epic 1.2)
- [x] Documents administratifs + Backblaze B2 (Epic 1.3)
- [x] Gestion des saisons (Epic 2.1)
- [x] Stripe Connect + cotisations + dashboard financier (Epic 2.2/2.3)
- [x] Renouvellement annuel + relances impayés + reçus Stripe + remboursements (Epic 2.3)
- [ ] Événements récurrents + réservation (Epic 3.1) ← suivant
- [ ] Liste d'attente (Epic 3.2)
- [ ] Présences manuelles + QR code front (Epic 3.3)
- [ ] Notifications email de base (Epic 4.1)

**Ordre de priorité : 3.1 → 3.2 → 3.3 → 4.1**
