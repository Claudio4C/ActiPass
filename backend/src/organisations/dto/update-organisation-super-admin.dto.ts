import { z } from 'zod';

/**
 * DTO pour la modification d'organisation par Super Admin
 * Permet de modifier plus de champs que le DTO standard
 */
export const UpdateOrganisationSuperAdminSchema = z.object({
  // Informations de base
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').optional(),
  description: z.string().optional(),
  type: z.enum(['sport', 'culture', 'loisir', 'social', 'other']).optional(),
  logo_url: z.string().url('URL invalide').optional().nullable(),

  // Contact
  email: z.string().email('Email invalide').optional().nullable(),
  phone: z.string().optional().nullable(),
  website_url: z.string().url('URL invalide').optional().nullable(),

  // Localisation
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  zip_code: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),

  // Configuration
  member_limit: z.number().int().positive('La limite doit être positive').optional().nullable(),
  is_public: z.boolean().optional(),
  status: z.enum(['active', 'suspended', 'pending_validation']).optional(),
});

export type UpdateOrganisationSuperAdminDto = z.infer<typeof UpdateOrganisationSuperAdminSchema>;
