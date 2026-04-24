import { z } from 'zod'

// Order reflects UI sections requirement
export const memberFormSchema = z.object({
  // Personal Information
  role: z.string().min(1, 'Role is required'),
  team: z.string().optional(),
  arrival: z.string().optional(),
  departure: z.string().optional(),
  given_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  display_name: z.string().min(1, 'Badge name is required'),
  preferred_name: z.string().min(1, 'Official name is required'),
  gender: z.string().min(1, 'Gender is required'),
  other_gender: z.string().optional(),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  tshirt_size: z.string().min(1, 'T-shirt size is required'),

  // Contest Information
  indiv_language: z.string().optional(),

  // Accommodation
  acco_req: z.string().optional(),
  room_type: z.string().min(1, 'Please select a room type'),
  roommate_preference: z.string().optional(),

  // Travel
  document_type: z.string().min(1, 'Please select a document type'),
  passport_number: z.string().min(1, 'Document number is required'),
  issue_date: z.string().min(1, 'Issue date is required'),
  expiry_date: z.string().min(1, 'Expiry date is required'),
  issuing_country: z.string().min(1, 'Issuing country is required'),
  nationality: z.string().min(1, 'Nationality is required'),

  // Dietary Requirement
  food_req: z.string().array().optional(),
  food_allergies: z.string().array().optional(),
  other_food_allergies: z.string().optional(),

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

  // If a contestant, they should be less than 20 on the date of the individual contest
  if (val.role === 'Team Contestant' && val.indiv_language === "" || val.indiv_language === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Individual contest language is required',
      path: ['indiv_language'],
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
