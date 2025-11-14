import { z } from 'zod'

export const teamSchema = z.object({
  name: z.string().min(1),
  languages: z.array(z.string()).default([])
})
export type TeamForm = z.infer<typeof teamSchema>
