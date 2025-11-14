import { z } from 'zod'

export const flightLegSchema = z.object({
  direction: z.enum(['arrival', 'departure']),
  terminal: z.string().min(1),
  location: z.string().min(1),
  airline: z.string().min(1),
  flightNo: z.string().min(2),
  datetime: z.string().datetime()
})
export type FlightLegForm = z.infer<typeof flightLegSchema>
