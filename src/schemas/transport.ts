import { z } from 'zod'

export const flightLegSchema = z.object({
  direction: z.enum(['arrival', 'departure']),
  terminal: z.string().min(1),
  location: z.string().min(1),
  airline: z.string().min(1),
  flight_no: z.string().min(2),
  datetime: z.string().datetime()
})
export type FlightLegForm = z.infer<typeof flightLegSchema>

// UI-friendly schema: allow choosing from common terminals or specifying Other
export const TERMINAL_OPTIONS = [
  'Terminal 1',
  'Terminal 2',
  'Terminal 3',
  'Other',
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
  if (val.terminal_option === 'Other' && !val.terminal_other?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please specify terminal when selecting Other',
      path: ['terminal_other'],
    })
  }
})
export type FlightLegUiForm = z.infer<typeof flightLegFormSchema>
