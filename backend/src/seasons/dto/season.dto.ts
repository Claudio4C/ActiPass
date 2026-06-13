import { z } from 'zod'

export const CreateSeasonSchema = z.object({
  name:      z.string().min(3, 'Le nom doit contenir au moins 3 caractères').max(50),
  starts_at: z.string().min(1, 'Date de début requise'),
  ends_at:   z.string().min(1, 'Date de fin requise'),
}).superRefine((data, ctx) => {
  const start = new Date(data.starts_at)
  const end   = new Date(data.ends_at)
  if (isNaN(start.getTime())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Date de début invalide.', path: ['starts_at'] })
    return
  }
  if (isNaN(end.getTime())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Date de fin invalide.', path: ['ends_at'] })
    return
  }
  if (end <= start) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'La date de fin doit être postérieure à la date de début.', path: ['ends_at'] })
  }
})

export const UpdateSeasonSchema = z.object({
  name:      z.string().min(3).max(50).optional(),
  starts_at: z.string().min(1).optional(),
  ends_at:   z.string().min(1).optional(),
})

export const CloseSeasonSchema = z.object({
  send_renewal_email: z.boolean().optional().default(false),
})

export type CreateSeasonDto = z.infer<typeof CreateSeasonSchema>
export type UpdateSeasonDto = z.infer<typeof UpdateSeasonSchema>
export type CloseSeasonDto  = z.infer<typeof CloseSeasonSchema>
