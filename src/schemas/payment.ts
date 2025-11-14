import { z } from 'zod'

export const paymentSchema = z.object({
  provider: z.literal('stripe'),
  amount: z.number().nonnegative(),
  currency: z.string().length(3).transform(s => s.toUpperCase()),
  status: z.enum(['pending','succeeded','failed','refunded'])
})
export type PaymentForm = z.infer<typeof paymentSchema>
