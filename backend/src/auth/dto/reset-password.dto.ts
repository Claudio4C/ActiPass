import { z } from 'zod';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{12,}$/;
const PASSWORD_ERROR_MESSAGE =
  'Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial';

export const ResetPasswordSchema = z
  .object({
    userId: z.uuid(),
    token: z.string().min(1, 'Token requis'),
    newPassword: z
      .string()
      .min(12, PASSWORD_ERROR_MESSAGE)
      .trim()
      .regex(passwordRegex, PASSWORD_ERROR_MESSAGE),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;
