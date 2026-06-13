# Stripe — Guide développement

## Stripe webhooks en local

Les paiements sont créés sur les comptes connectés (Stripe Connect Express).
Stripe envoie les events `checkout.session.completed` en tant que **Connect events**
(émis depuis le compte Express, pas depuis la plateforme).

La Stripe CLI doit être lancée avec `--forward-connect-to` pour les recevoir :

```bash
stripe listen \
  --forward-to localhost:3000/api/v1/webhooks/stripe \
  --forward-connect-to localhost:3000/api/v1/webhooks/stripe
```

> **Sans `--forward-connect-to`**, les paiements resteront en status `pending` en base
> même après un paiement réussi côté Stripe.

## Variables d'environnement requises

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # généré par `stripe listen`
FRONTEND_URL=http://localhost:5173
```

## Architecture Connect

- Chaque club possède son propre compte Stripe Express (`stripe_account_id` sur `Organisation`)
- Les sessions Checkout sont créées **sur le compte connecté** (`stripeAccount` header)
- Actipass prélève **2%** via `application_fee_amount` sur chaque transaction
- Les virements vont directement sur le compte bancaire du club

## Webhooks gérés

| Event | Action |
|---|---|
| `account.updated` | Met à jour `stripe_charges_enabled`, `stripe_payouts_enabled`, `stripe_onboarding_done` sur l'org |
| `checkout.session.completed` | Passe le Payment en `paid` + met à jour `membership.payment_status` |
| `payment_intent.payment_failed` | Passe le Payment en `failed` |

## Production — Stripe Dashboard

Dans **Developers → Webhooks → ton endpoint** :
- Sous "Listen to", activer **"Events on Connected accounts"** en plus de "Events on your account"
- Sans ça, `checkout.session.completed` ne sera jamais reçu en production
