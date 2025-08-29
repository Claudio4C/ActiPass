import { z } from 'zod';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{12,}$/;
const PASSWORD_ERROR_MESSAGE =
  'Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial';

export const RegisterSchema = z
  .object({
    email: z.email(),
    password: z
      .string()
      .min(12, PASSWORD_ERROR_MESSAGE)
      .trim()
      .regex(passwordRegex, PASSWORD_ERROR_MESSAGE),
    confirmPassword: z.string(),
    firstname: z
      .string()
      .min(2, 'Le prénom doit contenir au moins 2 caractères')
      .trim()
      .max(50, 'Le prénom ne peut pas dépasser 50 caractères'),
    lastname: z
      .string()
      .min(2, 'Le nom doit contenir au moins 2 caractères')
      .trim()
      .max(50, 'Le nom ne peut pas dépasser 50 caractères'),
    username: z
      .string()
      .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères")
      .trim()
      .max(30, "Le nom d'utilisateur ne peut pas dépasser 30 caractères"),
    gender: z.enum(['male', 'female', 'prefer_not_to_say']),
    phone: z.string().optional(),
    birthdate: z.date().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
    avatar: z.string().optional(),
    bio: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export type RegisterDto = z.infer<typeof RegisterSchema>;
