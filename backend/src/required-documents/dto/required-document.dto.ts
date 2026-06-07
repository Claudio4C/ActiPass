import { z } from 'zod'

export const DocCategorySchema = z.enum(['identity', 'medical', 'administrative', 'other'])

export const CreateRequiredDocumentSchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  description: z.string().max(500).optional(),
  required: z.boolean().optional().default(true),
  category: DocCategorySchema.optional().default('other'),
  expiresAfterMonths: z
    .number()
    .int()
    .min(1, 'La durée minimale est de 1 mois')
    .max(120, 'La durée maximale est de 120 mois (10 ans)')
    .optional(),
})

export const UpdateRequiredDocumentSchema = CreateRequiredDocumentSchema.partial()

export type DocCategory = z.infer<typeof DocCategorySchema>
export type CreateRequiredDocumentDto = z.infer<typeof CreateRequiredDocumentSchema>
export type UpdateRequiredDocumentDto = z.infer<typeof UpdateRequiredDocumentSchema>
