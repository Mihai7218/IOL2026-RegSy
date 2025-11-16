import { RegistrationDetailValues, PaymentConfirmationValues } from "@/schemas/payment"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore"

// Persist registration details for the current country user under /countries/{uid}/payment
export async function saveRegistrationDetails(
	data: RegistrationDetailValues,
	totals: { subtotal: number; processingFeeOnline: number; totalOnline: number; totalBank: number },
	step: number,
): Promise<void> {
	const user = auth.currentUser
	if (!user) {
		throw new Error("Not authenticated")
	}

	const countryRef = doc(db, "countries", user.uid)
	const prev = (await getDoc(countryRef)).data()?.payment ?? {}
	await setDoc(
		countryRef,
		{
			payment: {
				...prev,
				registration: {
					...data,
				},
				pricing: {
					subtotal: totals.subtotal,
					processingFeeOnline: totals.processingFeeOnline,
					totalOnline: totals.totalOnline,
					totalBank: totals.totalBank,
				},
				step,
				updated_at: serverTimestamp(),
			},
			updated_at: serverTimestamp(),
		},
		{ merge: true },
	)
}

// Persist payment confirmation info and step under /countries/{uid}/payment
export async function submitPaymentConfirmation(
	data: PaymentConfirmationValues,
	totals: { subtotal: number; processingFeeOnline: number; totalOnline: number; totalBank: number },
	step: number,
): Promise<void> {
	const user = auth.currentUser
	if (!user) {
		throw new Error("Not authenticated")
	}

	const countryRef = doc(db, "countries", user.uid)
	const prev = (await getDoc(countryRef)).data()?.payment ?? {}
	await setDoc(
		countryRef,
		{
			payment: {
				...prev,
				confirmation: {
					...data,
				},
				pricing: {
					subtotal: totals.subtotal,
					processingFeeOnline: totals.processingFeeOnline,
					totalOnline: totals.totalOnline,
					totalBank: totals.totalBank,
				},
				step,
				updated_at: serverTimestamp(),
			},
			updated_at: serverTimestamp(),
		},
		{ merge: true },
	)
}

// Load existing payment data (including step and totals) for current user
export async function loadPaymentState(): Promise<
	| { step?: number; registration?: any; confirmation?: any; totals?: { subtotal: number; processingFeeOnline: number; totalOnline: number; totalBank: number } }
	| null
> {
	const user = auth.currentUser
	if (!user) return null

	const countryRef = doc(db, "countries", user.uid)
	const snap = await getDoc(countryRef)
	if (!snap.exists()) return null
	const data = snap.data() as any
	const payment = data.payment as any | undefined
	if (!payment) return null

	// Prefer confirmation step if present, otherwise registration
	const step = typeof payment.step === "number"
		? payment.step
		: payment.confirmation?.step ?? payment.registration?.step
	const totals = payment.pricing ?? payment.registration?.pricing ?? payment.confirmation?.pricing

	return {
		step,
		registration: payment.registration,
		confirmation: payment.confirmation,
		totals,
	}
}
