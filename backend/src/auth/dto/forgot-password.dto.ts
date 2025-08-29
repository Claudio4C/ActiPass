import { z } from 'zod';

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
});

export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;
