import { z } from 'zod';

export const CreateOrganisationSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  type: z.enum(['sport', 'culture', 'loisir', 'social', 'other']),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.email('Email invalide').optional(),
  website: z.url('URL invalide').optional(),
});

export type CreateOrganisationDto = z.infer<typeof CreateOrganisationSchema>;
