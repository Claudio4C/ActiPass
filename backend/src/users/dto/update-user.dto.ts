import { z } from 'zod';

export const UpdateUserSchema = z.object({
  firstname: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères').optional(),
  lastname: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').optional(),
  username: z
    .string()
    .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères")
    .optional(),
  phone: z.string().optional(),
  birthdate: z.string().optional(),
  avatar_url: z.url("URL d'avatar invalide").optional(),
});

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
