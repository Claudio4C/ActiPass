import { z } from 'zod';

export const UpdateOrganisationSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zip_code: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email invalide').optional(),
  website: z.string().url('URL invalide').optional(),
  logo_url: z.string().optional(),
  is_public: z.boolean().optional(),
});

export type UpdateOrganisationDto = z.infer<typeof UpdateOrganisationSchema>;
