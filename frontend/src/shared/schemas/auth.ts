import { z } from 'zod'

// Schémas du backend pour la cohérence
// Utilise les mêmes règles de validation que le backend

// Schéma de login (du backend)
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'adresse email est requise')
    .email('L\'adresse email n\'est pas valide'),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis'),
  rememberMe: z.boolean().optional().default(false),
})

// Schéma de register (du backend)
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{12,}$/
const PASSWORD_ERROR_MESSAGE =
  'Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial'

export const registerSchema = z
  .object({
    // Champs obligatoires alignés avec le backend
    email: z
      .string()
      .min(1, 'L\'adresse email est requise')
      .email('L\'adresse email n\'est pas valide'),

    password: z
      .string()
      .min(12, PASSWORD_ERROR_MESSAGE)
      .regex(passwordRegex, PASSWORD_ERROR_MESSAGE),

    confirmPassword: z
      .string()
      .min(1, 'La confirmation du mot de passe est requise'),

    firstname: z
      .string()
      .min(2, 'Le prénom doit contenir au moins 2 caractères')
      .max(50, 'Le prénom ne peut pas dépasser 50 caractères'),

    lastname: z
      .string()
      .min(2, 'Le nom doit contenir au moins 2 caractères')
      .max(50, 'Le nom ne peut pas dépasser 50 caractères'),

    username: z
      .string()
      .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères")
      .max(30, "Le nom d'utilisateur ne peut pas dépasser 30 caractères"),

    // Champs spécifiques à notre application
    organizationName: z
      .string()
      .min(2, 'Le nom de l\'organisation doit contenir au moins 2 caractères')
      .max(100, 'Le nom de l\'organisation ne peut pas dépasser 100 caractères'),

    phone: z
      .string()
      .optional()
      .refine((val) => !val || /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/.test(val), {
        message: 'Le numéro de téléphone français n\'est pas valide',
      }),

    mode: z.enum(['club', 'municipalite']),

    acceptTerms: z
      .boolean()
      .refine((val) => val === true, {
        message: 'Vous devez accepter les conditions d\'utilisation',
      }),

    // Champs optionnels du backend
    gender: z.enum(['male', 'female', 'prefer_not_to_say']).optional(),
    birthdate: z.string().optional(), // Date en string pour le frontend
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
    bio: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

// Types TypeScript générés automatiquement
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

// Fonctions utilitaires pour la validation
export const validateLogin = (data: unknown) => {
  return loginSchema.safeParse(data)
}

export const validateRegister = (data: unknown) => {
  return registerSchema.safeParse(data)
}

// Messages d'erreur personnalisés
export const getFieldError = (errors: z.ZodError, field: string): string => {
  const fieldError = errors.issues.find(err => err.path.includes(field))
  return fieldError?.message || ''
}
