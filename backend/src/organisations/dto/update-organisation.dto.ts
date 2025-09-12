import { z } from 'zod';

export const UpdateOrganisationSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.email('Email invalide').optional(),
  website: z.url('URL invalide').optional(),
});

export type UpdateOrganisationDto = z.infer<typeof UpdateOrganisationSchema>;
