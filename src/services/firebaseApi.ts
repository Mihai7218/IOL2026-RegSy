/**
 * Service-layer aliases. Wire these to Firestore/Functions later.
 * Keep UI free of Firebase details.
 */

// Contacts
export type Contact = {
  name: string
  email: string
  phone: string
  whatsapp?: string
  isPrimary?: boolean
}
export const fetchContacts = async (): Promise<Contact[]> => {
  return [] // TODO
}
export const upsertContacts = async (_contacts: Contact[]): Promise<void> => {
  // TODO
}

// Transportation
export type FlightLeg = {
  direction: 'arrival' | 'departure'
  terminal: string
  location: string
  airline: string
  flight_no: string
  datetime: string // ISO
}
export const fetchTransport = async (): Promise<FlightLeg[]> => {
  return [] // TODO
}
export const upsertTransport = async (_legs: FlightLeg[]): Promise<void> => {
  // TODO
}

// Payments
export type Payment = {
  provider: 'stripe'
  amount: number
  currency: string
  status: 'pending'|'succeeded'|'failed'|'refunded'
}
export const fetchPayments = async (): Promise<Payment[]> => { return [] }
export const createPaymentIntent = async (_amount: number, _currency: string) => { /* TODO */ }

// Teams and Members
// Align Team shape with UI schema in src/schemas/team.ts
export type Team = {
  id?: string
  team_name: string
  team_language: string
  city_tour?: string
  excursion_route?: string
}
export type Member = { id?: string; teamId: string; fullName: string; gender?: string; diet?: string; email?: string; phone?: string; passportNo?: string; notes?: string }

export const fetchTeams = async (): Promise<Team[]> => { return [] }
export const upsertTeam = async (_team: Team): Promise<void> => { /* TODO */ }
export const deleteTeam = async (_teamId: string): Promise<void> => { /* TODO */ }

export const fetchMembers = async (_teamId?: string): Promise<Member[]> => { return [] }
export const upsertMember = async (_member: Member): Promise<void> => { /* TODO */ }
export const deleteMember = async (_memberId: string): Promise<void> => { /* TODO */ }

// Admin
export const adminListCountries = async (): Promise<Array<{ id: string; name: string }>> => { return [] }
export const adminListContacts = async (): Promise<any[]> => { return [] }
export const adminListPayments = async (): Promise<any[]> => { return [] }
export const adminListTeams = async (): Promise<any[]> => { return [] }
export const adminListMembers = async (): Promise<any[]> => { return [] }
export const adminListAdmins = async (): Promise<any[]> => { return [] }
export const createInviteCode = async (_countryKey: string, _countryName: string): Promise<{code: string; expiresAt: string}> => {
  return { code: 'PLACEHOLDER', expiresAt: new Date().toISOString() }
}
