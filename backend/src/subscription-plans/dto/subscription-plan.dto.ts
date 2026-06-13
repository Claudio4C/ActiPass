import { z } from 'zod';

const AUDIENCE_VALUES = ['enfant', 'adulte', 'famille', 'etudiant', 'senior'] as const;

export const CreatePlanSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  amount: z.number().positive(), // in euros — converted to cents in service
  seasonId: z.string().optional(),
  max_installments: z.number().int().min(1).max(12).default(1),
  target_audience: z.enum(AUDIENCE_VALUES).optional().nullable(),
});

export const UpdatePlanSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  is_active: z.boolean().optional(),
  max_installments: z.number().int().min(1).max(12).optional(),
  target_audience: z.enum(AUDIENCE_VALUES).optional().nullable(),
});

export type CreatePlanDto = z.infer<typeof CreatePlanSchema>;
export type UpdatePlanDto = z.infer<typeof UpdatePlanSchema>;
