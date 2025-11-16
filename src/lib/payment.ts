import { RegistrationDetailValues } from "@/schemas/payment"

export type PaymentMethod = "online" | "bank"

// SAMPLE pricing config (case-by-case). Replace with real values when available.
// Base price by plan for a general (non-previous-host) country.
export const BASE_FIRST_TEAM_BY_PLAN: Record<Plan, number> = {
  "early bird": 83500,
  regular: 95500,
  // Late base is defined via a formula; this value is only used as a fallback.
  late: 95500,
}

// Absolute first team fee per case: plan x country_status
export const FIRST_TEAM_FEE_MATRIX: Record<
  Exclude<Plan, "late">,
  Record<RegistrationDetailValues["country_status"], number>
> = {
  "early bird": {
    "Not a Previous Host": 83500,
    "Previous Host": 75500,
  },
  regular: {
    "Not a Previous Host": 95500,
    "Previous Host": 91500,
  },
}

// Online processing fee per case (pure value, not rate): plan x country_status
export const PROCESSING_FEE_VALUE_MATRIX: Record<
  Plan,
  Record<RegistrationDetailValues["country_status"], number>
> = {
  "early bird": {
    "Not a Previous Host": 3000,
    "Previous Host": 2700,
  },
  regular: {
    "Not a Previous Host": 3500,
    "Previous Host": 3400,
  },
  late: {
    "Not a Previous Host": 3500,
    "Previous Host": 3400,
  },
}

const observerProcessingFee = 900
const singleRoomProcessingFee = 600

// Other per-item fees that don't vary by case
export const PRICING = {
  observerFee: 24000, // per additional observer
  singleRoomFee: 16000, // per single room request
}

export type PriceBreakdown = {
  planBaseFirstTeam: number
  firstTeamAfterAdjustments: number
  teamsCost: number
  observersCost: number
  singleRoomsCost: number
  subtotal: number
  processingFeeOnline: number
  totalOnline: number
  totalBank: number
}

export function computeFirstTeamFee(detail: Pick<RegistrationDetailValues, "plan" | "country_status">) {
  if (detail.plan === "late") {
    // Late payment formula: base regular price + 5000 per team per month after deadline (rounded).
    const base = BASE_FIRST_TEAM_BY_PLAN["regular"]
    const monthsLate = computeMonthsLate()
    const lateSurchargePerTeam = 5000 * monthsLate
    return round2(base + lateSurchargePerTeam)
  }

  const fee = FIRST_TEAM_FEE_MATRIX[detail.plan as Exclude<Plan, "late">]?.[detail.country_status]
  const fallback = BASE_FIRST_TEAM_BY_PLAN[detail.plan]
  return round2(fee ?? fallback)
}

// Compute whole months late based on current date and the regular deadline.
// 5000 is charged per team per month (rounded to nearest whole month, minimum 1 when after deadline).
function computeMonthsLate(now = new Date(), regularEndOverride?: Date): number {
  const regularEnd = regularEndOverride ?? new Date("2026-04-30T23:59:59Z")
  if (now <= regularEnd) return 0

  const msPerMonthApprox = 30 * 24 * 60 * 60 * 1000
  const diffMs = now.getTime() - regularEnd.getTime()
  const rawMonths = diffMs / msPerMonthApprox
  const rounded = Math.round(rawMonths)
  return Math.max(1, rounded)
}

export function calculatePricing(detail: RegistrationDetailValues): PriceBreakdown {
  const firstTeam = computeFirstTeamFee(detail)
  const teamsCost = firstTeam * (detail.number_of_teams === 2 ? 3 : 1)
  const observersCost = detail.additional_observers * PRICING.observerFee
  const singleRoomsCost = detail.single_room_requests * PRICING.singleRoomFee
  const subtotal = teamsCost + observersCost + singleRoomsCost

  const processingFeeOnline = round2(
    PROCESSING_FEE_VALUE_MATRIX[detail.plan]?.[detail.country_status] ?? 0
  ) + detail.additional_observers * observerProcessingFee
    + detail.single_room_requests * singleRoomProcessingFee
  const totalOnline = round2(subtotal + processingFeeOnline)
  const totalBank = round2(subtotal)

  return {
  planBaseFirstTeam: BASE_FIRST_TEAM_BY_PLAN[detail.plan],
    firstTeamAfterAdjustments: round2(firstTeam),
    teamsCost: round2(teamsCost),
    observersCost: round2(observersCost),
    singleRoomsCost: round2(singleRoomsCost),
    subtotal: round2(subtotal),
    processingFeeOnline,
    totalOnline,
    totalBank,
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

// Simple helpers to decide plan by date windows
export type Plan = RegistrationDetailValues["plan"]
export function decidePlan(now = new Date(), windows?: { earlyEnd: Date; regularEnd: Date }): Plan {
  const earlyEnd = windows?.earlyEnd ?? new Date("2026-03-31T23:59:59Z")
  const regularEnd = windows?.regularEnd ?? new Date("2026-04-30T23:59:59Z")
  if (now <= earlyEnd) return "early bird"
  if (now <= regularEnd) return "regular"
  return "late"
}

export function decideCountryStatus(countryKey?: string, previousHosts?: string[]): RegistrationDetailValues["country_status"] {
  const list = previousHosts ?? DEFAULT_PREVIOUS_HOSTS
  return countryKey && list.includes(countryKey)
    ? "Previous Host"
    : "Not a Previous Host"
}

// SAMPLE list, replace with your actual host country keys
export const DEFAULT_PREVIOUS_HOSTS = [
  "usa",
  "china",
  "japan",
  "uk",
  "Admin1",
]
