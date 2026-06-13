import { z } from 'zod';

export const CheckoutSchema = z.object({
  planId: z.string().min(1),
  organisationId: z.string().min(1),
  membershipId: z.string().optional(),
});

export type CheckoutDto = z.infer<typeof CheckoutSchema>;
