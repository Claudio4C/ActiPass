import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Stripe = require('stripe') as typeof import('stripe');

@Injectable()
export class StripeService {
  private readonly stripe: InstanceType<typeof Stripe>;

  constructor(private readonly config: ConfigService) {
    this.stripe = new Stripe(this.config.getOrThrow<string>('STRIPE_SECRET_KEY'), {
      apiVersion: '2026-05-27.dahlia',
    });
  }

  get client(): InstanceType<typeof Stripe> {
    return this.stripe;
  }

  constructEvent(payload: Buffer, sig: string, secret?: string) {
    const webhookSecret = secret ?? this.config.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');
    return this.stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  }
}
