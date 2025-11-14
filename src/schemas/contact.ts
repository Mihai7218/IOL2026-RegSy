import { z } from 'zod'

export const contactSchema = z.object({
    name_1: z.string().min(1, "Name is required"),
    email_1: z.string().email("Invalid email address"),
    whatsapp_1: z.string().optional(),
    phone_1: z.string().optional(),
    name_2: z.string().optional(),
    email_2: z.string().optional(),
    whatsapp_2: z.string().optional(),
    phone_2: z.string().optional(),
  });
export type ContactForm = z.infer<typeof contactSchema>
