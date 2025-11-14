import { z } from 'zod'

export const memberSchema = z.object({
  teamId: z.string().min(1),
  fullName: z.string().min(1),
  gender: z.string().optional(),
  diet: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  passportNo: z.string().optional(),
  notes: z.string().optional()
})
export type MemberForm = z.infer<typeof memberSchema>
