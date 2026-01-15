import * as z from "zod"

const emailSchema = z
  .string()
  .trim()
  .email("Invalid email address")

export const contactSchema = z
  .object({
    primary: z.object({
      name: z.string().trim().min(1, "Name is required"),
      email: emailSchema,
      phone: z.string().optional(),
      whatsapp: z.string().optional(),
    }),
    secondary: z
      .object({
        name: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        whatsapp: z.string().optional(),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    const s = data.secondary
    if (!s) return

    const hasAny = Object.values(s).some(v => v?.trim())
    if (!hasAny) return

    if (!s.name?.trim()) {
      ctx.addIssue({
        path: ["secondary", "name"],
        message: "Name is required",
        code: z.ZodIssueCode.custom,
      })
    }

    if (!s.email?.trim()) {
      ctx.addIssue({
        path: ["secondary", "email"],
        message: "Email is required",
        code: z.ZodIssueCode.custom,
      })
    } else {
      try {
        emailSchema.parse(s.email)
      } catch {
        ctx.addIssue({
          path: ["secondary", "email"],
          message: "Invalid email address",
          code: z.ZodIssueCode.custom,
        })
      }
    }
  })

export type ContactForm = z.infer<typeof contactSchema>