import { z } from 'zod'

export const teamSchema = z.object({
    team_name: z.string().min(1, "Team name is required"),
    team_language: z.string().min(1, "Team language is required"),
    excursion_route: z.string().optional(),
    city_tour: z.string().optional(),
  });
export type TeamForm = z.infer<typeof teamSchema>
