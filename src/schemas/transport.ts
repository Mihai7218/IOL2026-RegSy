import { z } from 'zod'

export type FlightLegForm = z.infer<typeof flightLegFormSchema>

// UI-friendly schema: allow choosing from common terminals or specifying Other
export const TERMINAL_OPTIONS = [
  '✈️ Henri Coandă/Otopeni Airport (OTP)',
  '✈️ Aurel Vlaicu/Băneasa Airport (BBU)',
  '🚂 Gara de Nord/București Nord/North Railway Station',
  '❓ Other',
] as const

export const terminalOptionSchema = z.enum(TERMINAL_OPTIONS)

export const flightLegFormSchema = z.object({
  direction: z.enum(['arrival', 'departure']),
  terminal_option: terminalOptionSchema,
  terminal_other: z.string().optional(),
  location: z.string().min(1),
  airline: z.string().min(1),
  flight_no: z.string().min(2),
  datetime: z.string().datetime(),
}).superRefine((val, ctx) => {
  if (val.terminal_option === '❓ Other' && !val.terminal_other?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please specify location when selecting Other',
      path: ['terminal_other'],
    })
  }
  if (val.terminal_option !== '❓ Other' && !val.flight_no?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please specify flight/train no.',
      path: ['flight_no'],
    })
  }
  if (val.terminal_option !== '❓ Other' && !val.airline?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please specify flight/train operator',
      path: ['airline'],
    })
  }
})
export type FlightLegUiForm = z.infer<typeof flightLegFormSchema>
