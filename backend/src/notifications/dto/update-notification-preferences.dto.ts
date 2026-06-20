import { z } from 'zod';

export const UpdateNotificationPreferencesSchema = z.object({
  email_payment_received: z.boolean().optional(),
  email_document_decision: z.boolean().optional(),
  email_event_reminder: z.boolean().optional(),
  email_membership_decision: z.boolean().optional(),
  email_renewal_invitation: z.boolean().optional(),
  email_marketing: z.boolean().optional(),
  push_enabled: z.boolean().optional(),
});

export type UpdateNotificationPreferencesDto = z.infer<typeof UpdateNotificationPreferencesSchema>;
