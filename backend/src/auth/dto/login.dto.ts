import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, { error: 'Mot de passe requis' }).trim(),
});

export type LoginDto = z.infer<typeof LoginSchema>;
