import { z } from 'zod'

// Schémas du backend adaptés pour le frontend
// Basés sur backend/src/auth/dto/

// Schéma de login (identique au backend)
export const BackendLoginSchema = z.object({
  email: z.string().email('L\'adresse email n\'est pas valide'),
  password: z.string().min(1, 'Mot de passe requis').trim(),
})

// Schéma de register adapté du backend
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{12,}$/
const PASSWORD_ERROR_MESSAGE =
  'Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial'

export const BackendRegisterSchema = z
  .object({
    email: z.string().email('L\'adresse email n\'est pas valide'),
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
    // Champs spécifiques à notre application
    organizationName: z
      .string()
      .min(2, 'Le nom de l\'organisation doit contenir au moins 2 caractères')
      .trim()
      .max(100, 'Le nom de l\'organisation ne peut pas dépasser 100 caractères'),
    mode: z.enum(['club', 'municipalite']),
    acceptTerms: z
      .boolean()
      .refine((val) => val === true, {
        message: 'Vous devez accepter les conditions d\'utilisation',
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

// Types TypeScript générés
export type BackendLoginDto = z.infer<typeof BackendLoginSchema>;
export type BackendRegisterDto = z.infer<typeof BackendRegisterSchema>;

// Fonctions de validation
export const validateBackendLogin = (data: unknown) => {
  return BackendLoginSchema.safeParse(data)
}

export const validateBackendRegister = (data: unknown) => {
  return BackendRegisterSchema.safeParse(data)
}
