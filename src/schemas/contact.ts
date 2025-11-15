import { z } from 'zod'

// Allow empty string for optional email to avoid validation error when the field is left blank
const optionalEmail = z.union([z.string().email('Invalid email address'), z.literal('')]).optional()

export const contactPersonRequired = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  whatsapp: z.string().optional(),
  phone: z.string().optional(),
})

export const contactPersonOptional = z.object({
  name: z.string().optional(),
  email: optionalEmail,
  whatsapp: z.string().optional(),
  phone: z.string().optional(),
})

export const contactSchema = z.object({
  primary: contactPersonRequired,
  secondary: contactPersonOptional.optional(),
})

export type ContactForm = z.infer<typeof contactSchema>
