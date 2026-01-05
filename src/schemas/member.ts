import { z } from 'zod'

// Order reflects UI sections requirement
export const memberFormSchema = z.object({
  // Personal Information
  role: z.string().min(1, 'Role is required'),
  team: z.string().optional(),
  given_name: z.string().min(1, 'Given name is required'),
  middle_name: z.string().optional(),
  last_name: z.string().min(1, 'Last name is required'),
  display_name: z.string().min(1, 'Display name is required'),
  preferred_name: z.string().min(1, 'Preferred name is required'),
  gender: z.string().min(1, 'Gender is required'),
  other_gender: z.string().optional(),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  tshirt_size: z.string().min(1, 'T-shirt size is required'),

  // Contest Information
  indiv_language: z.string().optional(),
  indiv_contest_req: z.string().optional(),

  // Travel
  passport_number: z.string().optional(),
  issue_date: z.string().optional(),
  expiry_date: z.string().optional(),

  // Dietary Requirement
  food_req: z.string().array().optional(),
  other_food_req: z.string().optional(),

  // Observer Sightseeing
  excursion_route: z.string().optional(),
  city_tour: z.string().optional(),
}).superRefine((val, ctx) => {

  // If a contestant, they should be less than 20 on the date of the individual contest
  if (val.role === 'Team Contestant' && new Date(val.date_of_birth) < new Date("2006-07-28")) {
    ctx.addIssue({
      code: z.ZodIssueCode.invalid_date,
      message: 'Contestants should be less than 20 on the first day of the competition (born on or after July 28th, 2006).',
      path: ['date_of_birth'],
    })
  }

  // If gender is 'Other', require other_gender (similar to terminal-other pattern)
  if (val.gender === 'Other' && !val.other_gender?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please specify gender when selecting Other',
      path: ['other_gender'],
    })
  }
})

export type MemberForm = z.infer<typeof memberFormSchema>
