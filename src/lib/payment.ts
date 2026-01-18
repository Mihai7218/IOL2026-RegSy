import { RegistrationDetailValues } from "@/schemas/payment"
import { count } from "firebase/firestore"
import { LucideSwitchCamera } from "lucide-react"

export type PaymentMethod = "bank"

// SAMPLE pricing config (case-by-case). Replace with real values when available.
// Base price by plan for a general (non-previous-host) country.
export const BASE_FIRST_TEAM_BY_PLAN: Record<
  Plan,
  Record<RegistrationDetailValues["country_status"], number>
> = {
  "early bird": {
    "Not accredited": 18360,
    "Not a Previous Host": 9180,
    "Future Host": 9180,
    "Previous Host": 8160,
  },
  regular: {
    "Not accredited": 20400,
    "Not a Previous Host": 10200,
    "Future Host": 10200,
    "Previous Host": 9180,
  },
  // Late base is defined via a formula; this value is only used as a fallback.
  late: {
    "Not accredited": 20400,
    "Not a Previous Host": 10200,
    "Future Host": 10200,
    "Previous Host": 9180,
  },
}

// Absolute first team fee per case: plan x country_status
export const FIRST_TEAM_FEE_MATRIX: Record<
  Exclude<Plan, "late">,
  Record<RegistrationDetailValues["country_status"], number>
> = {
  "early bird": {
    "Not accredited": 18360,
    "Not a Previous Host": 9180,
    "Future Host": 9180,
    "Previous Host": 8160,
  },
  regular: {
    "Not accredited": 20400,
    "Not a Previous Host": 10200,
    "Future Host": 10200,
    "Previous Host": 9180,
  },
}

// Other per-item fees that don't vary by case
export const PRICING = {
  observerFee: 3600, // per additional observer
  singleRoomFee: 2300, // per single room request
}

export type PriceBreakdown = {
  planBaseFirstTeam: number
  firstTeamAfterAdjustments: number
  teamsCost: number
  observersCost: number
  singleRoomsCost: number
  subtotal: number
  paid_before: number
  totalBank: number
}

export function computeFirstTeamFee(detail: Pick<RegistrationDetailValues, "plan" | "country_status">) {
  if (detail.plan === "late") {
    // Late payment formula: base regular price + 1000 per team per month after deadline (rounded).
    const base = BASE_FIRST_TEAM_BY_PLAN["regular"][detail.country_status]
    const monthsLate = computeMonthsLate()
    const lateSurchargePerTeam = 1000 * monthsLate
    return [round2(base + lateSurchargePerTeam), monthsLate]
  }

  const fee = FIRST_TEAM_FEE_MATRIX[detail.plan as Exclude<Plan, "late">]?.[detail.country_status]
  const fallback = BASE_FIRST_TEAM_BY_PLAN[detail.plan][detail.country_status]
  return [round2(fee ?? fallback), 0]
}

// Compute whole months late based on current date and the regular deadline.
// 1000 is charged per team per month (rounded to nearest whole month, minimum 1 when after deadline).
function computeMonthsLate(now = new Date(), regularEndOverride?: Date): number {
  const regularEnd = regularEndOverride ?? new Date("2026-04-30T23:59:59Z")
  if (now <= regularEnd) return 0

  const msPerMonthApprox = 31 * 24 * 60 * 60 * 1000
  const diffMs = now.getTime() - regularEnd.getTime()
  const rawMonths = diffMs / msPerMonthApprox
  const rounded = Math.round(rawMonths)
  return Math.max(1, rounded)
}

function subtract1k(detail: RegistrationDetailValues, monthsLate: number): number {
  if (detail.plan !== "late" || detail.number_of_teams < 2) return 0
  return 1000 * monthsLate
}

export function calculatePricing(detail: RegistrationDetailValues): PriceBreakdown {
  const [firstTeam, monthsLate] = computeFirstTeamFee(detail)
  const teamsCost = firstTeam * (detail.number_of_teams === 2 ? 3 : 1) - subtract1k(detail, monthsLate)
  const observersCost = (detail.additional_observers - (detail.country_status === "Future Host" ? 1 : 0)) * PRICING.observerFee
  const singleRoomsCost = detail.single_room_requests * PRICING.singleRoomFee
  const subtotal = teamsCost + observersCost + singleRoomsCost
  const paid_before = detail.paid_before

  const totalBank = round2(subtotal - paid_before)

  return {
  planBaseFirstTeam: BASE_FIRST_TEAM_BY_PLAN[detail.plan][detail.country_status],
    firstTeamAfterAdjustments: round2(firstTeam),
    teamsCost: round2(teamsCost),
    observersCost: round2(observersCost),
    singleRoomsCost: round2(singleRoomsCost),
    paid_before: round2(paid_before),
    subtotal: round2(subtotal),
    totalBank,
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

// Simple helpers to decide plan by date windows
export type Plan = RegistrationDetailValues["plan"]
export function decidePlan(now = new Date(), windows?: { earlyEnd: Date; regularEnd: Date }): Plan {
  const earlyEnd = windows?.earlyEnd ?? new Date("2026-03-15T23:59:59Z")
  const regularEnd = windows?.regularEnd ?? new Date("2026-04-30T23:59:59Z")
  if (now <= earlyEnd) return "early bird"
  if (now <= regularEnd) return "regular"
  return "late"
}

export function decideCountryStatus(countryKey?: string, previousHosts?: string[]): RegistrationDetailValues["country_status"] {
  const list = previousHosts ?? DEFAULT_PREVIOUS_HOSTS
  const accredited = DEFAULT_ACCREDITED
  if (countryKey === FUTURE_HOST) return "Future Host"
  return countryKey && accredited.includes(countryKey) ? (list.includes(countryKey)
    ? "Previous Host"
    : "Not a Previous Host") 
    : "Not accredited"
}

// SAMPLE list, replace with your actual host country keys
export const DEFAULT_PREVIOUS_HOSTS = [
    "BGR",
    "NLD",
    "EST",
    "POL",
    "SWE",
    "USA",
    "SVN",
    "GBR",
    "CHN",
    "IND",
    "IRL",
    "CZE",
    "KOR",
    "LVA",
    "IMN",
    "BRA",
    "TWN",
    "TEST3",
  ]

  export const DEFAULT_ACCREDITED = [
    "AUS",
    "BRA",
    "BGR",
    "CEN",
    "CFR",
    "COL",
    "CZE",
    "EST",
    "FIN",
    "DEU",
    "GRC",
    "HKG",
    "HUN",
    "IND",
    "IDP",
    "IRN",
    "IRL",
    "IMN",
    "ISR",
    "JPN",
    "KAZ",
    "LVA",
    "MAC",
    "MYS",
    "MLT",
    "MDA",
    "NPL",
    "NLD",
    "PHL",
    "POL",
    "KOR",
    "ROU",
    "SGP",
    "SVN",
    "SWE",
    "CHE",
    "TWN",
    "THA",
    "TUR",
    "UKR",
    "GBR",
    "USA",
    "ESP",
    "CHN",
    "TEST2",
    "TEST3",
  ]

  export const FUTURE_HOST = "THA"