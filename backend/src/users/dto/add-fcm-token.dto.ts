import { z } from 'zod';

export const AddFcmTokenSchema = z.object({
  token: z.string().min(1, 'Le token FCM est requis'),
});

export type AddFcmTokenDto = z.infer<typeof AddFcmTokenSchema>;
