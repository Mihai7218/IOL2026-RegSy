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

export const paymentConfirmationSchema = z.object({
  transaction_number: z.string(),
  order_number: z.string().optional(),
  need_invoice: z.boolean().optional(),
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