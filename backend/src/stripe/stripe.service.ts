import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Stripe = require('stripe') as typeof import('stripe');

@Injectable()
export class StripeService {
  private readonly stripe: InstanceType<typeof Stripe>;

  constructor(private readonly config: ConfigService) {
    const secretKey = config.get<string>('STRIPE_SECRET_KEY')
    if (!secretKey) {
      if (config.get<string>('NODE_ENV') === 'production') {
        throw new Error('STRIPE_SECRET_KEY est requis en production.')
      }
      // Placeholder pour permettre le démarrage local sans compte Stripe
      this.stripe = new Stripe('sk_test_dev_placeholder', {
        apiVersion: '2026-05-27.dahlia',
      })
      return
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2026-05-27.dahlia',
    })
  }

  get client(): InstanceType<typeof Stripe> {
    return this.stripe;
  }

  constructEvent(payload: Buffer, sig: string, secret?: string) {
    const webhookSecret = secret ?? this.config.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');
    return this.stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  }
}
