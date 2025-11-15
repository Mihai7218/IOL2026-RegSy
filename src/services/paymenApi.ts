import { RegistrationDetailValues, PaymentConfirmationValues } from "@/schemas/payment"

// Placeholder upload for registration details
export async function saveRegistrationDetails(_data: RegistrationDetailValues): Promise<void> {
	// TODO: Wire to Firestore/Functions. Simulate network delay.
	await new Promise((r) => setTimeout(r, 400))
}

// Placeholder upload for payment confirmation
export async function submitPaymentConfirmation(_data: PaymentConfirmationValues): Promise<void> {
	await new Promise((r) => setTimeout(r, 400))
}
