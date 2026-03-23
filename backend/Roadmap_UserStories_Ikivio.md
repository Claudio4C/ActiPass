# ROADMAP & USER STORIES

## SaaS AssoClub / Ikivio

**Mars 2026 — Plan de livraison par phases**

---

# 🎯 Stratégie d'organisation

## Le problème actuel

Vous avez un core solide (auth, organisations, events, présences, super admin) mais beaucoup de features entamées sans être terminées : sidebar mockée, paiements sans logique, documents sans controller, portail municipal vide, routes coach non protégées. Résultat : rien n'est livrable en l'état au-delà du core.

## La règle d'or : une feature FINIE vaut mieux que cinq entamées

**Recommandation forte :** travaillez en binôme (1 front + 1 back) sur LA MÊME feature jusqu'à ce qu'elle soit livrable. Ne passez à la suivante que quand la précédente est testée et déployée. Cela vous évite le problème actuel : des bouts de code éparpillés, impossible à démontrer, difficile à débugger.

## Organisation concrète

- **Sprint de 2 semaines :** chaque sprint livre 1 à 2 épiques complètes (front + back + tests).
- **Définition de « Done » :** endpoint back fonctionnel + page front branchée sur l'API réelle (pas de mock) + tests manuels passés.
- **Review croisée :** chaque PR est reviewée par l'autre binôme. Pas de merge sans review.
- **Démo hebdo :** chaque vendredi, 15 min de démo de ce qui est fini. Si on ne peut pas démontrer, ce n'est pas fini.

---

# 🗺️ Vue d'ensemble des phases

Chaque phase est ordonnée par dépendance technique et valeur business. On ne passe à la phase suivante que quand la précédente est solide.

| Phase | Objectif | Features clés | Durée estimée |
|-------|----------|---------------|---------------|
| **Phase 0** | Stabiliser le core | Sidebar API réelle, routes protégées, cleanup mocks | 1 semaine |
| **Phase 1** | Gestion des membres 360° | Comptes parents/enfants, documents, profils complets | 3 semaines |
| **Phase 2** | Paiements & Finance | Stripe, cotisations, factures, relances | 3 semaines |
| **Phase 3** | Planning avancé & QR | QR code check-in, créneaux coach, listes d'attente | 2 semaines |
| **Phase 4** | Communication | Notifications, messagerie interne, emails auto | 2 semaines |
| **Phase 5** | Espace Coach | Dashboard coach, multi-club, profil public | 2 semaines |
| **Phase 6** | Portail Municipal | Dashboard mairie, conventions, subventions | 3 semaines |
| **Phase 7** | Nice to Have | CRM, marketplace, fidélité, pass corpo | Continu |

---

# ⚠️ Phase 0 — Stabilisation du core (1 semaine)

**Pourquoi d'abord :** Votre sidebar utilise getMockMembership, vos routes coach ne sont pas protégées, et il y a des données mockées partout. Avant d'ajouter quoi que ce soit, il faut que ce qui existe marche pour de vrai.

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P0-1 | En tant que dev, je veux que la sidebar utilise l'API réelle pour afficher le membership de l'utilisateur connecté | getMockMembership supprimé, sidebar affiche le vrai rôle et le vrai club depuis GET /api/v1/me | ✅ | ✅ |
| P0-2 | En tant que dev, je veux que toutes les routes /coach/* soient protégées par ProtectedRoute avec vérification du rôle | Un utilisateur non-coach est redirigé vers /unauthorized quand il accède à /coach/* | ✅ | — |
| P0-3 | En tant que dev, je veux supprimer toutes les données mock restantes dans le dashboard admin | Aucun fichier mock*.ts ne subsiste, toutes les pages utilisent les vrais endpoints | ✅ | — |
| P0-4 | En tant que dev, je veux un script de seed réaliste pour le dev local avec au moins 2 clubs, 5 membres, 3 events | npx prisma db seed crée des données exploitables pour tester | — | ✅ |

---

# 👪 Phase 1 — Gestion des membres 360° (3 semaines)

**Pourquoi maintenant :** C'est le coeur de votre SaaS. Un club ne peut pas fonctionner sans gestion complète des membres, surtout les comptes parents/enfants qui sont critiques pour les clubs sportifs jeunes.

## Epic 1.1 — Comptes Parents / Famille

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P1-1 | En tant que parent, je veux créer un compte famille et y rattacher mes enfants mineurs | Le parent crée un compte, puis ajoute 1 à N enfants avec nom, prénom, date de naissance. Les enfants n'ont pas de login propre. | ✅ | ✅ |
| P1-2 | En tant que parent, je veux inscrire un de mes enfants à un club et gérer son adhésion | Depuis le profil famille, le parent sélectionne un enfant et l'inscrit à un club. Le membership est créé au nom de l'enfant. | ✅ | ✅ |
| P1-3 | En tant que parent, je veux voir le planning et les réservations de tous mes enfants dans un seul dashboard | Vue consolidée avec un filtre par enfant. Les réservations de chaque enfant sont visibles. | ✅ | ✅ |
| P1-4 | En tant que parent, je veux recevoir les notifications concernant mes enfants (absences, events, paiements) | Toute notification liée à un enfant est envoyée au parent. Email ou in-app. | ✅ | ✅ |
| P1-5 | En tant qu'admin club, je veux voir le parent rattaché à un membre mineur dans la fiche membre | La fiche membre affiche le parent responsable avec ses coordonnées de contact. | ✅ | ✅ |

## Epic 1.2 — Documents & Pièces administratives

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P1-6 | En tant qu'admin club, je veux définir les documents obligatoires pour l'adhésion (certificat médical, pièce d'identité, B3...) | Page paramètres avec liste des documents requis. Chaque document a un nom, un type, et un statut obligatoire/optionnel. | ✅ | ✅ |
| P1-7 | En tant que membre (ou parent), je veux uploader mes documents administratifs depuis mon profil | Upload de fichiers (PDF, JPG, PNG) depuis la page profil. Barre de progression visible. Limite 5 Mo par fichier. | ✅ | ✅ |
| P1-8 | En tant qu'admin club, je veux valider ou refuser un document soumis par un membre | Liste des documents en attente de validation. Bouton valider/refuser avec motif de refus. | ✅ | ✅ |
| P1-9 | En tant qu'admin club, je veux voir d'un coup d'oeil quels membres ont des documents manquants ou expirés | Tableau de bord avec badge rouge sur les membres avec documents incomplets. Filtre « documents manquants ». | ✅ | ✅ |

## Epic 1.3 — Profil membre complet

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P1-10 | En tant que membre, je veux compléter mon profil avec coordonnées, contact d'urgence et infos médicales | Formulaire de profil avec sections : identité, contact, urgence, médical. Sauvegarde partielle possible. | ✅ | ✅ |
| P1-11 | En tant qu'admin club, je veux exporter la liste des membres en CSV avec toutes leurs infos | Bouton export CSV dans la page membres. Le fichier contient : nom, prénom, email, tél, rôle, statut documents, statut paiement. | ✅ | ✅ |
| P1-12 | En tant qu'admin club, je veux attribuer des tags aux membres (débutant, compétition, loisir) | Système de tags créables et assignables. Filtre par tag dans la liste des membres. | ✅ | ✅ |

---

# 💳 Phase 2 — Paiements & Finance (3 semaines)

**Pourquoi maintenant :** Le schéma DB existe déjà (payments, invoices, plans, subscriptions) mais il n'y a zéro logique. C'est la feature la plus demandée par les clubs et celle qui génère vos revenus.

## Epic 2.1 — Intégration Stripe

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P2-1 | En tant qu'admin club, je veux connecter mon compte Stripe pour recevoir les paiements | Flow Stripe Connect OAuth. Le club voit son statut de connexion Stripe dans les paramètres. | ✅ | ✅ |
| P2-2 | En tant qu'admin club, je veux créer des formules d'abonnement (mensuel, trimestriel, annuel) avec différents tarifs | CRUD des plans liés à Stripe Products/Prices. Chaque plan a un nom, un prix, une périodicité. | ✅ | ✅ |
| P2-3 | En tant que membre, je veux payer ma cotisation en ligne par carte bancaire | Checkout Stripe intégré. Après paiement, le statut membership passe à « payé ». Webhook Stripe met à jour la BDD. | ✅ | ✅ |
| P2-4 | En tant que parent, je veux payer les cotisations de mes enfants en une seule transaction | Panier multi-enfants. Le parent voit le récapitulatif avant paiement. Une facture est générée par enfant. | ✅ | ✅ |

## Epic 2.2 — Facturation & Suivi

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P2-5 | En tant qu'admin club, je veux voir un tableau de bord financier (cotisations reçues, en attente, en retard) | Dashboard avec totaux + graphique par mois. Filtres par statut de paiement. | ✅ | ✅ |
| P2-6 | En tant qu'admin club, je veux générer une facture PDF pour chaque paiement | Facture auto-générée au format PDF avec numéro séquentiel, coordonnées club/membre, détail du paiement. | ✅ | ✅ |
| P2-7 | En tant qu'admin club, je veux relancer automatiquement les membres dont la cotisation est en retard | Email de relance automatique à J+7 et J+30 après échéance. L'admin peut déclencher une relance manuelle. | ✅ | ✅ |
| P2-8 | En tant que membre, je veux consulter mon historique de paiements et télécharger mes factures | Page « Mes Paiements » avec liste des transactions et bouton de téléchargement PDF. | ✅ | ✅ |

---

# 📅 Phase 3 — Planning avancé & QR Code (2 semaines)

**Pourquoi maintenant :** Le backend QR code est déjà complet, il manque juste le frontend. Et le planning est déjà bien avancé, il faut juste compléter avec les créneaux coach et les listes d'attente.

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P3-1 | En tant que membre, je veux scanner un QR code à l'entrée pour valider ma présence | Page mobile avec scanner caméra. Le QR code appelle POST /qr-code/validate. Confirmation visuelle (vert/rouge). | ✅ | — |
| P3-2 | En tant que coach, je veux générer un QR code pour ma séance du jour | Bouton « Générer QR » sur la page de l'événement. QR affiché en grand à l'écran ou imprimable. | ✅ | — |
| P3-3 | En tant que membre, je veux m'inscrire sur une liste d'attente quand un événement est complet | Bouton « Liste d'attente » visible quand capacité atteinte. Notification automatique si une place se libère. | ✅ | ✅ |
| P3-4 | En tant que coach, je veux déclarer mes disponibilités hebdomadaires et mes indisponibilités | Calendrier interactif de disponibilités. L'admin voit les dispos quand il planifie. | ✅ | ✅ |
| P3-5 | En tant qu'admin club, je veux définir des pénalités de no-show | Page paramètres : règle de pénalité (ex: 3 no-show = suspension 1 semaine). Application automatique. | ✅ | ✅ |

---

# 🔔 Phase 4 — Communication & Notifications (2 semaines)

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P4-1 | En tant que membre, je veux recevoir un email de rappel 24h avant mon entraînement | Email automatique avec détails de la séance (lieu, heure, coach). Job CRON quotidien. | — | ✅ |
| P4-2 | En tant qu'admin club, je veux envoyer une notification à tous les membres ou un groupe filtré | Page « Communication » avec sélection des destinataires (tous, par tag, par groupe). Envoi email + notification in-app. | ✅ | ✅ |
| P4-3 | En tant que membre, je veux voir mes notifications dans l'app (cloche avec badge) | Icône cloche dans la navbar avec compteur de non-lues. Dropdown avec liste des 20 dernières notifications. | ✅ | ✅ |
| P4-4 | En tant que coach, je veux envoyer un message à toute mon équipe | Messagerie simple : le coach sélectionne un groupe/équipe et envoie un message texte visible par tous les membres. | ✅ | ✅ |
| P4-5 | En tant qu'admin club, je veux que le système envoie automatiquement des emails clés (bienvenue, paiement reçu, document validé) | Templates email configurables. Envoi auto via un service email (SendGrid/Resend). | ✅ | ✅ |

---

# 🏋️ Phase 5 — Espace Coach complet (2 semaines)

**Pourquoi maintenant :** Les routes /coach/* existent mais ne sont pas protégées et le contenu est minimal. Le coach est un utilisateur clé pour l'adoption.

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P5-1 | En tant que coach, je veux un tableau de bord avec mes prochaines séances, mes stats de présence et mes équipes | Dashboard coach avec : 3 prochaines séances, taux de présence moyen, liste de mes équipes. | ✅ | ✅ |
| P5-2 | En tant que coach multi-club, je veux voir mes créneaux de tous mes clubs dans une vue consolidée | Calendrier unifié avec code couleur par club. Filtre par club possible. | ✅ | ✅ |
| P5-3 | En tant que coach, je veux suivre la progression de mes joueurs avec des statistiques individuelles | Fiche joueur avec historique de présence, notes du coach (texte libre), évolution sur graphique. | ✅ | ✅ |
| P5-4 | En tant que coach, je veux un profil public avec mes qualifications, mes tarifs et mes disponibilités | Page publique accessible sans login. Affiche : bio, disciplines, certifications, disponibilités, avis. | ✅ | ✅ |

---

# 🏛️ Phase 6 — Portail Municipal (3 semaines)

**Pourquoi plus tard :** Le portail municipal est un différenciateur stratégique mais c'est un espace séparé qui ne bloque pas le fonctionnement des clubs. Priorité inférieure mais grosse valeur ajoutée.

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P6-1 | En tant que gestionnaire mairie, je veux voir la liste de toutes les associations de ma commune | Dashboard avec liste des clubs, nombre de membres, activités proposées, statut des conventions. | ✅ | ✅ |
| P6-2 | En tant que gestionnaire mairie, je veux gérer les infrastructures sportives (gymnases, terrains) et leurs créneaux | CRUD infrastructures avec salles, capacités, plages horaires. Attribution des créneaux aux clubs. | ✅ | ✅ |
| P6-3 | En tant que gestionnaire mairie, je veux suivre les conventions et subventions attribuées aux clubs | Tableau des conventions avec montant, date de début/fin, pièces jointes. Alertes sur les conventions arrivant à échéance. | ✅ | ✅ |
| P6-4 | En tant que gestionnaire mairie, je veux des statistiques d'utilisation des infrastructures | Graphiques de taux d'occupation par infrastructure, par jour de la semaine, par club. | ✅ | ✅ |

---

# 🚀 Phase 7 — Nice to Have (continu)

Ces features sont à planifier après les phases précédentes. Elles apportent de la valeur mais ne sont pas bloquantes pour le lancement.

| ID | User Story | Critères d'acceptation | Front | Back |
|----|-----------|------------------------|-------|------|
| P7-1 | En tant qu'admin club, je veux un CRM avec tags intelligents et campagnes automatisées | Segments auto (ex: membres inactifs depuis 30j). Campagnes email automatisées. | ✅ | ✅ |
| P7-2 | En tant que coach indépendant, je veux être référencé sur une marketplace pour trouver des élèves | Page de recherche publique avec filtres (discipline, localisation, prix). Prise de RDV en ligne. | ✅ | ✅ |
| P7-3 | En tant que membre, je veux accumuler des points de fidélité en fonction de ma participation | Système de points : 1 présence = X points. Catalogue de récompenses échangeables. | ✅ | ✅ |
| P7-4 | En tant qu'entreprise, je veux offrir un pass sport à mes salariés utilisable dans les clubs partenaires | Espace employeur, crédits mensuels, réconciliation des entrées par club. | ✅ | ✅ |
| P7-5 | En tant qu'admin club, je veux activer le 2FA pour sécuriser les comptes admin | TOTP (Google Authenticator). Les champs DB existent déjà, ajouter la logique. | ✅ | ✅ |

---

# 💾 Modèle de données — Comptes Parents

Voici le schéma Prisma suggéré pour gérer la relation parent/enfant. Il s'intègre à votre modèle User existant.

## Approche recommandée

**Relation User ↔ User :** un parent est un User avec une relation « children » vers d'autres Users. L'enfant mineur n'a pas de mot de passe (login via le parent). Quand l'enfant atteint 18 ans, on lui crée un login propre.

**Table FamilyLink :** parent_id (FK User), child_id (FK User), relationship (enum: PARENT, TUTEUR, AUTRE), is_primary_contact (boolean). Cela permet plusieurs tuteurs par enfant et un enfant avec deux parents séparés.

## Impact sur le membership

Le membership est au nom de l'enfant (child_id dans memberships). Le parent voit et gère les memberships de ses enfants via la relation FamilyLink. Les paiements sont facturés au parent (billing_user_id dans payments).

---

# ✅ Checklist avant lancement (MVP)

Ce qui doit absolument fonctionner pour une première démo / bêta avec un vrai club :

- [ ] Auth complète (inscription, login, récup mdp, vérification email)
- [ ] Création de club + invitation de membres
- [ ] Comptes parents + rattachement enfants
- [ ] Upload et validation des documents administratifs
- [ ] Création d'événements + réservation par les membres
- [ ] Paiement de cotisation en ligne (Stripe)
- [ ] Génération de facture PDF
- [ ] Tableau de bord admin avec vraies données (plus aucun mock)
- [ ] Notifications email de base (bienvenue, paiement, rappel)
- [ ] QR code check-in fonctionnel

**Estimation globale pour le MVP (Phases 0 à 3) :** ~9 semaines avec un binôme front/back dédié. Ajoutez 30% de marge pour les imprévus = ~12 semaines.
