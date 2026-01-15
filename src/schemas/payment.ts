import { z } from "zod";

export const registrationDetailSchema = z.object({
  plan: z.enum(["early bird", "regular", "late"]),
  country_status: z.enum(["Previous Host", "Not a Previous Host", "Not accredited"]),
  number_of_teams: z.number().int().min(1).max(2),
  additional_observers: z.number().int().min(0),
  single_room_requests: z.number().int().min(0),
  paid_before: z.number().min(0),
});

export type RegistrationDetailValues = z.infer<typeof registrationDetailSchema>;

export const invoiceDataSchema = z.object({
  entity_name: z.string().min(1, 'Entity name is required'),
  address: z.string().min(1, 'Address is required'),
})

export type InvoiceDataValues = z.infer<typeof invoiceDataSchema>;

export const paymentConfirmationSchema = z.object({
  transaction_number: z.string().min(1, 'Transaction number is required'),
  order_number: z.string().optional(),
  need_invoice: z.boolean().optional(),
  invoice_data: invoiceDataSchema.optional(),
  proof_of_payment_url: z.string().min(1, 'Proof of payment is required'),
}).superRefine((val, ctx) => {
  // If need_invoice is true, invoice_data must be provided with entity_name and address
  if (val.need_invoice) {
    if (!val.invoice_data?.entity_name?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Entity name is required when invoice is needed',
        path: ['invoice_data', 'entity_name'],
      })
    }
    if (!val.invoice_data?.address?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Address is required when invoice is needed',
        path: ['invoice_data', 'address'],
      })
    }
  }
});

export type PaymentConfirmationValues = z.infer<typeof paymentConfirmationSchema>;

export enum PaymentStep {
  RegistrationDetail = 0,
  PaymentConfirmation = 1,
  WaitingForVerification = 2,
  PaymentCompleted = 3,
}

// Compatibility aliases for other modules expecting these names
export type Plan = z.infer<typeof registrationDetailSchema>["plan"]
export type CountryStatus = z.infer<typeof registrationDetailSchema>["country_status"]
export type NumberOfTeams = z.infer<typeof registrationDetailSchema>["number_of_teams"]
export type PaymentDetailValues = RegistrationDetailValues