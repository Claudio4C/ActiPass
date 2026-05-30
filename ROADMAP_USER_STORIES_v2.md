# ROADMAP & USER STORIES

## SaaS Actipass / Ikivio

**Mai 2026 — Plan de livraison par phases**

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
| **Phase 1** | Gestion des membres 360° | Comptes parents/enfants, adhésion, documents, profils, licences | 🔄 **En cours** |
| **Phase 2** | Paiements & Finance | Stripe, cotisations, multi-tarifs, avoirs, renouvellement | ⏳ À faire |
| **Phase 3** | Planning avancé | Récurrence, réservation, liste d'attente, QR code, présences | ⏳ À faire |
| **Phase 4** | Communication | Notifications ciblées, messagerie, emails auto | ⏳ À faire |
| **Phase 5** | Espace Coach | Dashboard coach, multi-club, profil public | ⏳ À faire |
| **Phase 6** | Portail Municipal | Dashboard mairie, conventions, subventions, statistiques | ⏳ À faire |
| **Phase 7** | Nice to Have | CRM, marketplace, fidélité, pass corpo, PWA, QR adhérent | ⏳ Continu |

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
| P1-4 | En tant que parent, je veux recevoir les notifications concernant mes enfants | Toute notification liée à un enfant est envoyée au parent. Email ou in-app. | — | — |
| P1-5 | En tant qu'admin club, je veux voir le parent rattaché à un membre mineur dans la fiche membre | La fiche membre affiche le parent responsable avec ses coordonnées de contact. | ✅ | ✅ |

## Epic 1.1b — Comptes Parents / Famille (Bonus) ✅

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P1-B1 | En tant que parent, je veux renseigner la fiche santé / urgence de chaque enfant | Formulaire avec allergies, traitements, groupe sanguin, contact d'urgence. | ✅ | ✅ |
| P1-B2 | En tant que parent, je veux signer des autorisations dématérialisées | Checkbox + horodatage. Les vrais documents PDF sont dans Epic 1.3. | ✅ | ✅ |
| P1-B3 | En tant que coach, je veux laisser un commentaire de suivi après chaque séance | Champ texte depuis la page de présences. Le parent voit les commentaires sur le profil enfant. | — | — |
| P1-B4 | En tant que parent multi-enfants multi-clubs, je veux une vue "semaine famille" consolidée | Calendrier hebdomadaire, navigation semaine, code couleur par enfant. | ✅ | ✅ |

---

## Epic 1.2 — Flux d'adhésion 🔄 En cours

> **Note :** Frontend `MemberPickerSheet`, `AdminRequests` et KPIs dashboard déjà construits. Backend membership existant. Il reste à brancher le front sur l'API réelle et à ajouter les statuts manquants.

### Enum MembershipStatus (Prisma)
```prisma
enum MembershipStatus {
  PENDING      // demande en attente de validation admin
  ACTIVE       // membre actif validé
  REJECTED     // demande refusée
  SUSPENDED    // suspendu par l'admin
  EXPIRED      // fin de saison / non-renouvellement
  RESIGNED     // membre parti de lui-même
}
```

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P1-6 | En tant que membre/parent, je veux envoyer une demande d'adhésion | MemberPickerSheet → POST /organisations/:orgId/memberships → status PENDING. Badge "En attente" sur la card club. | ✅ | ✅ |
| P1-7 | En tant qu'admin, je veux gérer les demandes en attente | AdminRequests branché API réelle. Accepter → ACTIVE. Refuser → REJECTED + motif. Tout accepter en masse. | ✅ | — |
| P1-8 | En tant que membre, je veux suivre le statut de ma demande | Badge statut sur card club : PENDING amber, ACTIVE emerald, REJECTED rouge + motif. | ✅ | ✅ |
| P1-9 | En tant qu'admin, je veux suspendre ou archiver un membre actif | Bouton Suspendre → SUSPENDED + motif. Bouton Archiver → EXPIRED. | ✅ | ✅ |
| P1-10 | En tant que membre, je veux quitter un club | Bouton "Quitter ce club" → confirmation → RESIGNED. Notification à l'admin. | ✅ | — |

---

## Epic 1.3 — Documents & Pièces administratives ⏳

> **Note technique :** Inclut la migration du stockage vers OVH Object Storage (S3-compatible via `@aws-sdk/client-s3`). Actuellement fichiers en local `backend/uploads/`. Frontends admin (`AdminDocuments` avec 3 onglets) déjà construits. Hooks `useRequiredDocuments`, `useMemberDocuments`, `useClubCompliance` existent, APIs backend manquantes.

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P1-11 | En tant qu'admin, je veux définir les documents obligatoires pour l'adhésion | Onglet "Paramètres" AdminDocuments. CRUD RequiredDocument. Présets standards (certificat médical, pièce d'identité, photo, B3, attestation assurance). | ✅ | — |
| P1-12 | En tant que membre/parent, je veux uploader mes documents depuis mon profil | Upload PDF/JPG/PNG (5 Mo max). Barre de progression XHR. Statut par type. Si refusé : motif + renvoyer. | — | — |
| P1-13 | En tant qu'admin, je veux valider ou refuser un document soumis | Onglet "À valider". Bouton "Voir" → URL signée 15 min. Valider / Refuser avec motif. | ✅ | — |
| P1-14 | En tant qu'admin, je veux voir les membres avec documents manquants ou expirés | Onglet "Conformité". Accordéon par membre, pills manquant/expiré/en attente/refusé. | ✅ | — |

---

## Epic 1.4 — Licences fédérales ⏳

> Clubs affiliés FFF, FFG, FFJ, FFN, etc. Le numéro de licence est obligatoire pour la compétition et les assurances fédérales.

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P1-15 | En tant qu'admin, je veux configurer la fédération de mon club | Champ "Fédération affiliée" dans les paramètres du club (liste : FFF, FFG, FFJ, FFN, FFTT, non affilié, autre). | — | — |
| P1-16 | En tant que membre, je veux renseigner mon numéro de licence fédérale | Champ numéro de licence dans le profil membre, optionnel si club non affilié, obligatoire sinon. Date de validité. | — | — |
| P1-17 | En tant qu'admin, je veux voir quels membres n'ont pas de licence valide | Badge dans la liste membres. Filtre "Sans licence valide". Export CSV avec colonne licence. | — | — |

---

## Epic 1.5 — Profil membre complet ⏳

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P1-18 | En tant que membre, je veux compléter mon profil complet | Coordonnées, contact d'urgence, infos médicales. profile_mode persisté en DB via PUT /users/me. | ✅ | ✅ |
| P1-19 | En tant qu'admin, je veux exporter la liste des membres en CSV | Bouton export CSV dans la page membres. Inclut licence, statut documents, statut membership. | ✅ | ✅ |
| P1-20 | En tant qu'admin, je veux attribuer des tags aux membres | Tags créables et assignables (débutant, compétition, loisir, bénévole…). Filtre par tag. | ✅ | ✅ |

---

# 💳 Phase 2 — Paiements & Finance

## Epic 2.1 — Gestion des saisons ⏳

> **Prérequis de toute la Phase 2.** Les memberships, paiements et renouvellements sont rattachés à une saison.

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P2-1 | En tant qu'admin, je veux créer et gérer les saisons de mon club | Une saison a un nom (2024-2025), une date de début et de fin. Une seule saison active à la fois. | — | — |
| P2-2 | En tant qu'admin, je veux clôturer une saison et en ouvrir une nouvelle | Clôture : tous les memberships ACTIVE passent en EXPIRED. Ouverture : workflow de renouvellement déclenché. | — | — |
| P2-3 | En tant que membre, je veux voir ma saison en cours et mon historique d'adhésions | Vue timeline des saisons passées avec statut et paiement associé. | — | — |

## Epic 2.2 — Intégration Stripe & Cotisations ⏳

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P2-4 | En tant qu'admin, je veux connecter mon compte Stripe | Stripe Connect (compte séparé par club). Tableau de bord paiements dans Actipass. | — | — |
| P2-5 | En tant qu'admin, je veux créer des formules de cotisation | Nom, montant, description, saison associée. Ex : "Adulte 2024-2025 — 120€". | — | — |
| P2-6 | En tant qu'admin, je veux gérer les multi-tarifs | Tarif enfant/adulte/famille, tarif réduit (RSA, étudiant, chômage), early bird (-10% avant le 31/08). Conditions configurables. | — | — |
| P2-7 | En tant que membre, je veux payer ma cotisation en ligne | Stripe Checkout depuis le profil ou la page du club. Paiement en 1x ou en plusieurs fois (2x, 3x). | — | — |
| P2-8 | En tant que parent, je veux payer les cotisations de mes enfants en une transaction | Panier multi-membres, une seule transaction Stripe. | — | — |

## Epic 2.3 — Renouvellement & Suivi financier ⏳

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P2-9 | En tant qu'admin, je veux déclencher le renouvellement annuel | En fin de saison, email automatique à tous les membres ACTIVE avec lien de ré-adhésion et paiement. | — | — |
| P2-10 | En tant qu'admin, je veux suivre les cotisations impayées et relancer | Liste des membres sans paiement validé. Relance email manuelle ou automatique (J+7, J+14, J+30). | — | — |
| P2-11 | En tant qu'admin, je veux générer et envoyer des factures | Facture PDF générée automatiquement après paiement. Téléchargeable par l'admin et le membre. | — | — |
| P2-12 | En tant qu'admin, je veux émettre des avoirs et remboursements | Avoir total ou partiel (blessure, déménagement). Remboursement via Stripe ou avoir crédit utilisable sur prochaine saison. | — | — |
| P2-13 | En tant qu'admin, je veux voir le tableau de bord financier de la saison | CA total, cotisations encaissées/en attente/en retard, graphique par mois. Export comptable CSV. | — | — |

---

# 📅 Phase 3 — Planning avancé

## Epic 3.1 — Événements récurrents & Réservation ⏳

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P3-1 | En tant qu'admin/coach, je veux créer un événement récurrent | Récurrence : quotidienne, hebdomadaire (jours choisis), mensuelle. Date de fin ou nombre d'occurrences. Modifier une occurrence ou toute la série. | — | — |
| P3-2 | En tant que membre, je veux réserver ma place à un événement | Bouton "Réserver" sur un créneau. Confirmation par email. Annulation possible jusqu'à X heures avant. | — | — |
| P3-3 | En tant qu'admin, je veux définir la capacité maximale d'un événement | Nombre de places max configurable par événement. Compteur de places restantes visible. | — | — |

## Epic 3.2 — Liste d'attente ⏳

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P3-4 | En tant que membre, je veux rejoindre la liste d'attente d'un événement complet | Bouton "Liste d'attente" quand event complet. Position visible. Notification automatique si une place se libère. | — | — |
| P3-5 | En tant qu'admin, je veux gérer la liste d'attente | Vue liste d'attente par événement. Promotion manuelle ou automatique. | — | — |

## Epic 3.3 — Présences & QR Code ⏳

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P3-6 | En tant que coach, je veux pointer les présences manuellement | Liste des inscrits avec case à cocher. Sauvegarde en temps réel. Absent/présent/retard. | — | — |
| P3-7 | En tant que coach, je veux générer un QR code pour ma séance | QR code unique par événement, valable pendant la durée du cours. Affiché sur l'écran du coach. | — | ✅ |
| P3-8 | En tant que membre, je veux scanner le QR code pour valider ma présence | Page scan depuis l'app. Confirmation visuelle immédiate. | — | ✅ |
| P3-9 | En tant qu'admin, je veux voir les statistiques de présence | Taux de présence par membre, par cours, par période. Export CSV. | — | — |

---

# 🔔 Phase 4 — Communication & Notifications

## Epic 4.1 — Notifications & Emails ⏳

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P4-1 | En tant qu'admin, je veux envoyer une notification ciblée | Destinataires : tous les membres, une section, les membres sans document, les impayés. Canal : email et/ou in-app. | — | — |
| P4-2 | En tant qu'admin, je veux planifier des emails automatiques | Rappel 24h avant entraînement, relance cotisation J+7/14/30, document expiré, renouvellement saison. | — | — |
| P4-3 | En tant que membre, je veux voir mes notifications in-app | Cloche dans la navbar avec badge. Centre de notifications. Marquer comme lu. | — | — |
| P4-4 | En tant que coach, je veux envoyer un message à mon équipe | Message groupé à tous les inscrits d'un cours. Reçu in-app et par email. | — | — |
| P4-5 | Emails transactionnels automatiques | Bienvenue à l'inscription, paiement reçu, document validé/refusé, place disponible en liste d'attente, invitation renouvellement. | — | — |

---

# 🏋️ Phase 5 — Espace Coach complet

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P5-1 | Dashboard coach (séances, stats, équipes) | Vue semaine, liste des inscrits, taux de présence, commentaires de suivi. | — | — |
| P5-2 | Vue consolidée multi-clubs pour les coachs indépendants | Un coach peut gérer plusieurs clubs depuis un seul dashboard. | — | — |
| P5-3 | Suivi de progression par membre | Champs personnalisables par sport (ceintures judo, niveaux natation, chronos...). | — | — |
| P5-4 | Profil public coach | Page publique avec bio, spécialités, clubs associés. Visible dans l'annuaire. | — | — |
| P5-5 | Commentaires de suivi post-séance (P1-B3) | Champ texte après chaque séance. Visible par le membre/parent dans son profil. | — | — |

---

# 🏛️ Phase 6 — Portail Municipal

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P6-1 | Dashboard mairie — liste des associations de la commune | Vue de toutes les associations enregistrées, statuts, nombre de membres, activités. | — | — |
| P6-2 | Gestion des infrastructures sportives | Gymnases, terrains, salles : capacité, disponibilité, réservation par les clubs. | — | — |
| P6-3 | Conventions et subventions | Suivi des conventions annuelles, montants des subventions, documents associés. | — | — |
| P6-4 | Statistiques d'utilisation pour la mairie | Nombre de licenciés par sport, taux d'occupation des équipements, évolution annuelle. Export PDF pour rapport municipal. | — | — |

---

# 🚀 Phase 7 — Nice to Have (continu)

| ID | User Story | Front | Back |
|----|-----------|-------|------|
| P7-1 | CRM avec tags intelligents et segmentation avancée | — | — |
| P7-2 | Marketplace coachs indépendants | — | — |
| P7-3 | Points de fidélité (présences = points = réductions) | — | — |
| P7-4 | Pass sport entreprise (CSE) | — | — |
| P7-5 | 2FA pour comptes admin et mairie | — | — |
| P7-6 | QR code carte adhérent digitale | — | — |
| P7-7 | PWA mobile (installation sur écran d'accueil) | — | — |
| P7-8 | API publique pour intégrations tierces (fédérations, logiciels compta) | — | — |

---

# ✅ Checklist avant lancement MVP (Phases 0 à 3)

- [x] Auth complète (inscription, login, récup mdp, vérification email)
- [x] Register multi-étapes avec choix de profil (Membre / Parent / Gérant)
- [x] Onboarding 3 variantes (parent, membre, gérant) avec GettingStartedCard
- [x] Comptes parents + rattachement enfants + fiche santé + autorisations
- [x] Planning famille consolidé (vue semaine, filtre par enfant, code couleur)
- [x] Dashboard admin : membres, événements, présences — vraies données
- [x] Fiche membre detail avec tuteur pour les mineurs
- [x] Export CSV membres + tags membres
- [ ] **Flux d'adhésion — brancher front sur API réelle (Epic 1.2)** ← en cours
- [ ] **Documents administratifs + OVH Storage (Epic 1.3)** ← suivant
- [ ] Licences fédérales (Epic 1.4)
- [ ] Gestion des saisons (Epic 2.1)
- [ ] Paiement cotisation en ligne Stripe (Epic 2.2)
- [ ] Renouvellement annuel + relances (Epic 2.3)
- [ ] Événements récurrents (Epic 3.1)
- [ ] Liste d'attente (Epic 3.2)
- [ ] Présences manuelles + QR code front (Epic 3.3)
- [ ] Notifications email de base (Epic 4.1)

**Ordre de priorité : 1.2 → 1.3 → 1.4 → 2.1 → 2.2 → 2.3 → 3.1 → 3.2 → 3.3 → 4.1**
