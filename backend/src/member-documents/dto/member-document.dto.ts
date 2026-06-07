import { z } from 'zod'

export const ReviewDocumentSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().min(5, 'Le motif doit contenir au moins 5 caractères').optional(),
}).refine(
  (d) => d.action !== 'reject' || (d.rejectionReason !== undefined && d.rejectionReason.length >= 5),
  { message: 'Le motif de refus est obligatoire', path: ['rejectionReason'] },
)

export type ReviewDocumentDto = z.infer<typeof ReviewDocumentSchema>
