/**
 * Service-layer aliases backed by Firestore.
 * Keep UI free of Firebase details.
 */

import { auth, db } from '@/lib/firebase'
import { PaymentStep } from '@/schemas/payment'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'

// Contacts - aligned with contactSchema in src/schemas/contact.ts
export type Contact = {
  primary: {
    name: string
    email: string
    whatsapp?: string
    phone?: string
  }
  secondary?: {
    name?: string
    email?: string
    whatsapp?: string
    phone?: string
  }
}
export const fetchContacts = async (): Promise<Contact | null> => {
  const user = auth.currentUser
  if (!user) return null
  const countryRef = doc(db, 'countries', user.uid)
  const snap = await getDoc(countryRef)
  if (!snap.exists()) return null
  const data = snap.data() as any
  if (!data.contact) return null
  return data.contact as Contact
}
export const upsertContacts = async (_contacts: Contact): Promise<void> => {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  const countryRef = doc(db, 'countries', user.uid)
  await setDoc(
    countryRef,
    {
      contact: _contacts,
      updated_at: serverTimestamp(),
    },
    { merge: true },
  )
}

// Transportation - aligned with flightLegSchema in src/schemas/transport.ts
export type FlightLeg = {
  direction: 'arrival' | 'departure'
  terminal: string
  location: string
  airline: string
  flight_no: string
  datetime: string // ISO
}
export const fetchTransport = async (): Promise<FlightLeg[]> => {
  const user = auth.currentUser
  if (!user) return []
  const countryRef = doc(db, 'countries', user.uid)
  const snap = await getDoc(countryRef)
  if (!snap.exists()) return []
  const data = snap.data() as any
  return (data.transport?.legs as FlightLeg[] | undefined) ?? []
}
export const upsertTransport = async (_legs: FlightLeg[]): Promise<void> => {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  const countryRef = doc(db, 'countries', user.uid)
  await setDoc(
    countryRef,
    {
      transport: { legs: _legs },
      updated_at: serverTimestamp(),
    },
    { merge: true },
  )
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

// Member aligned with memberFormSchema in src/schemas/member.ts
export type Member = {
  id?: string
  team?: string
  role: string
  given_name: string
  middle_name?: string
  last_name: string
  display_name: string
  preferred_name: string
  gender: string
  other_gender?: string
  date_of_birth: string
  tshirt_size: string
  indiv_language?: string
  indiv_contest_req?: string
  passport_number?: string
  issue_date?: string
  expiry_date?: string
  food_req?: string[]
  other_food_req?: string
  excursion_route?: string
  city_tour?: string
}

export const fetchTeams = async (): Promise<Team[]> => {
  const user = auth.currentUser
  if (!user) return []
  const teamsCol = collection(db, 'countries', user.uid, 'teams')
  const snaps = await getDocs(teamsCol)
  return snaps.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Team, 'id'>) }))
}

export const upsertTeam = async (_team: Team): Promise<void> => {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  const teamsCol = collection(db, 'countries', user.uid, 'teams')
  const id = _team.id ?? doc(teamsCol).id
  const ref = doc(teamsCol, id)
  const { id: _omitId, ...data } = _team
  await setDoc(
    ref,
    {
      ...data,
      updated_at: serverTimestamp(),
    },
    { merge: true },
  )
}

export const deleteTeam = async (_teamId: string): Promise<void> => {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  const ref = doc(db, 'countries', user.uid, 'teams', _teamId)
  await deleteDoc(ref)
}

export const fetchMembers = async (_teamId?: string): Promise<Member[]> => {
  const user = auth.currentUser
  if (!user) return []
  const membersCol = collection(db, 'countries', user.uid, 'members')
  const q = _teamId
    ? query(membersCol, where('team', '==', _teamId))
    : membersCol
  const snaps = await getDocs(q)
  return snaps.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Member, 'id'>) }))
}

export const upsertMember = async (_member: Member): Promise<void> => {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  const membersCol = collection(db, 'countries', user.uid, 'members')
  const id = _member.id ?? doc(membersCol).id
  const ref = doc(membersCol, id)
  const { id: _omitId, ...data } = _member
  await setDoc(
    ref,
    {
      ...data,
      updated_at: serverTimestamp(),
    },
    { merge: true },
  )
}

export const deleteMember = async (_memberId: string): Promise<void> => {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  const ref = doc(db, 'countries', user.uid, 'members', _memberId)
  await deleteDoc(ref)
}

// Admin
const toIsoString = (value: any): string | undefined => {
  if (!value) return undefined
  try {
    return typeof value.toDate === 'function' ? value.toDate().toISOString() : undefined
  } catch {
    return undefined
  }
}

export type AdminCountrySummary = {
  id: string
  country_code: string
  country_name: string
  teamCount: number
  memberCount: number
  updated_at?: string
}

export const adminListCountrySummaries = async (): Promise<AdminCountrySummary[]> => {
  const countriesSnap = await getDocs(collection(db, 'countries'))
  const rows = await Promise.all(
    countriesSnap.docs.map(async (countryDoc) => {
      const data = countryDoc.data() as any
      const [teamsSnap, membersSnap] = await Promise.all([
        getDocs(collection(db, 'countries', countryDoc.id, 'teams')),
        getDocs(collection(db, 'countries', countryDoc.id, 'members')),
      ])
      return {
        id: countryDoc.id,
        country_code: data?.country_code ?? '—',
        country_name: data?.country_name ?? countryDoc.id,
        teamCount: teamsSnap.size,
        memberCount: membersSnap.size,
        updated_at: toIsoString(data?.updated_at),
      }
    }),
  )
  return rows.sort((a, b) => a.country_name.localeCompare(b.country_name))
}

export type AdminContactRow = {
  id: string
  country_name: string
  country_code: string
  primary_name?: string
  primary_email?: string
  primary_phone?: string
  primary_whatsapp?: string
  secondary_name?: string
  secondary_email?: string
  secondary_phone?: string
}

export const adminListContactsDetailed = async (): Promise<AdminContactRow[]> => {
  const countriesSnap = await getDocs(collection(db, 'countries'))
  return countriesSnap.docs
    .map((countryDoc) => {
      const data = countryDoc.data() as any
      const contact = (data?.contact ?? {}) as Contact | undefined
      return {
        id: countryDoc.id,
        country_name: data?.country_name ?? countryDoc.id,
        country_code: data?.country_code ?? '—',
        primary_name: contact?.primary?.name,
        primary_email: contact?.primary?.email,
        primary_phone: contact?.primary?.phone,
        primary_whatsapp: contact?.primary?.whatsapp,
        secondary_name: contact?.secondary?.name,
        secondary_email: contact?.secondary?.email,
        secondary_phone: contact?.secondary?.phone,
      }
    })
    .sort((a, b) => a.country_name.localeCompare(b.country_name))
}

export type AdminTeamRow = {
  id: string
  countryId: string
  country_name: string
  team_name: string
  team_language: string
  city_tour?: string
  excursion_route?: string
}

export const adminListAllTeamsDetailed = async (): Promise<AdminTeamRow[]> => {
  const countriesSnap = await getDocs(collection(db, 'countries'))
  const rows: AdminTeamRow[] = []
  for (const countryDoc of countriesSnap.docs) {
    const data = countryDoc.data() as any
    const teamsSnap = await getDocs(collection(db, 'countries', countryDoc.id, 'teams'))
    teamsSnap.forEach((teamDoc) => {
      const team = teamDoc.data() as Team
      rows.push({
        id: teamDoc.id,
        countryId: countryDoc.id,
        country_name: data?.country_name ?? countryDoc.id,
        team_name: team.team_name,
        team_language: team.team_language,
        city_tour: team.city_tour,
        excursion_route: team.excursion_route,
      })
    })
  }
  return rows.sort((a, b) => a.country_name.localeCompare(b.country_name))
}

export type AdminMemberRow = Member & {
  countryId: string
  country_name: string
  team_name?: string
}

export const adminListAllMembersDetailed = async (): Promise<AdminMemberRow[]> => {
  const countriesSnap = await getDocs(collection(db, 'countries'))
  const rows: AdminMemberRow[] = []
  for (const countryDoc of countriesSnap.docs) {
    const data = countryDoc.data() as any
    const [teamsSnap, membersSnap] = await Promise.all([
      getDocs(collection(db, 'countries', countryDoc.id, 'teams')),
      getDocs(collection(db, 'countries', countryDoc.id, 'members')),
    ])
    const teamMap = new Map<string, string>()
    teamsSnap.forEach((teamDoc) => {
      const teamData = teamDoc.data() as Team
      teamMap.set(teamDoc.id, teamData.team_name)
    })
    membersSnap.forEach((memberDoc) => {
      const member = memberDoc.data() as Member
      rows.push({
        countryId: countryDoc.id,
        country_name: data?.country_name ?? countryDoc.id,
        id: memberDoc.id,
        team_name: member.team ? teamMap.get(member.team) ?? member.team : undefined,
        ...member,
      })
    })
  }
  return rows.sort((a, b) => a.country_name.localeCompare(b.country_name))
}

export type AdminSightseeingRow = Member & {
  countryId: string
  country_name: string
  team_name?: string
  city_tour?: string
  excursion?: string
}

export const adminListAllSightseeingMembersDetailed = async (): Promise<AdminSightseeingRow[]> => {
  const countriesSnap = await getDocs(collection(db, 'countries'))
  const rows: AdminMemberRow[] = []
  for (const countryDoc of countriesSnap.docs) {
    const data = countryDoc.data() as any
    const [teamsSnap, membersSnap] = await Promise.all([
      getDocs(collection(db, 'countries', countryDoc.id, 'teams')),
      getDocs(collection(db, 'countries', countryDoc.id, 'members')),
    ])
    const teamMap = new Map<string, Team>()
    teamsSnap.forEach((teamDoc) => {
      const teamData = teamDoc.data() as Team
      teamMap.set(teamDoc.id, teamData)
    })
    membersSnap.forEach((memberDoc) => {
      const member = memberDoc.data() as Member
      rows.push({
        countryId: countryDoc.id,
        country_name: data?.country_name ?? countryDoc.id,
        id: memberDoc.id,
        team_name: member.team ? teamMap.get(member.team)?.team_name ?? member.team : undefined,
        city_tour: member.team ? teamMap.get(member.team)?.city_tour ?? member.city_tour : undefined,
        excursion_route: member.team ? teamMap.get(member.team)?.excursion_route ?? member.excursion_route : undefined,
        ...member,
      })
    })
  }
  return rows.sort((a, b) => a.country_name.localeCompare(b.country_name))
}

export type AdminPaymentRow = {
  id: string
  country_name: string
  country_code: string
  step?: PaymentStep
  plan?: string
  subtotal?: number
  totalOnline?: number
  totalBank?: number
  processingFeeOnline?: number
  payment_method?: string
}

export const adminListPaymentsDetailed = async (): Promise<AdminPaymentRow[]> => {
  const countriesSnap = await getDocs(collection(db, 'countries'))
  return countriesSnap.docs
    .map((countryDoc) => {
      const data = countryDoc.data() as any
      const payment = data?.payment ?? {}
      const registration = payment?.registration ?? {}
      const confirmation = payment?.confirmation ?? {}
      const totals = payment?.pricing ?? {}
      return {
        id: countryDoc.id,
        country_name: data?.country_name ?? countryDoc.id,
        country_code: data?.country_code ?? '—',
        step: payment?.step,
        plan: registration?.plan,
        subtotal: totals?.subtotal,
        totalOnline: totals?.totalOnline,
        totalBank: totals?.totalBank,
        processingFeeOnline: totals?.processingFeeOnline,
        payment_method: confirmation?.payment_method,
      }
    })
    .sort((a, b) => a.country_name.localeCompare(b.country_name))
}

export type AdminCountryProfile = {
  id: string
  country_name?: string
  country_code?: string
  contact?: Contact
  payment?: any
  transport?: any
}

export const adminGetCountryProfile = async (countryId: string): Promise<AdminCountryProfile | null> => {
  const ref = doc(db, 'countries', countryId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  const data = snap.data() as any
  return {
    id: snap.id,
    country_name: data?.country_name,
    country_code: data?.country_code,
    contact: data?.contact,
    payment: data?.payment,
    transport: data?.transport,
  }
}

export const adminListCountryTeams = async (countryId: string): Promise<AdminTeamRow[]> => {
  const country = await getDoc(doc(db, 'countries', countryId))
  if (!country.exists()) return []
  const countryData = country.data() as any
  const teamsSnap = await getDocs(collection(db, 'countries', countryId, 'teams'))
  return teamsSnap.docs.map((teamDoc) => {
    const team = teamDoc.data() as Team
    return {
      id: teamDoc.id,
      countryId,
      country_name: countryData?.country_name ?? countryId,
      team_name: team.team_name,
      team_language: team.team_language,
      city_tour: team.city_tour,
      excursion_route: team.excursion_route,
    }
  })
}

export const adminListCountryObservers = async (countryId: string): Promise<AdminSightseeingRow[]> => {
  const country = await getDoc(doc(db, 'countries', countryId))
  if (!country.exists()) return []
  const countryData = country.data() as any
  const membersSnap = await getDocs(collection(db, 'countries', countryId, 'members'))
  return membersSnap.docs.filter((memberDoc) => {
    return memberDoc.data().role === 'Observer'
  }).map((memberDoc) => {
    const member = memberDoc.data() as Member
    return {
      countryId,
      country_name: countryData?.country_name ?? countryId,
      id: memberDoc.id,
      ...member,
      city_tour: member.city_tour ?? '',
      excursion: member.excursion_route ?? '',
    }
  })
}

export const adminListCountryMembers = async (countryId: string): Promise<AdminMemberRow[]> => {
  const country = await getDoc(doc(db, 'countries', countryId))
  if (!country.exists()) return []
  const countryData = country.data() as any
  const [teamsSnap, membersSnap] = await Promise.all([
    getDocs(collection(db, 'countries', countryId, 'teams')),
    getDocs(collection(db, 'countries', countryId, 'members')),
  ])
  const teamMap = new Map<string, string>()
  teamsSnap.forEach((teamDoc) => {
    const teamData = teamDoc.data() as Team
    teamMap.set(teamDoc.id, teamData.team_name)
  })
  return membersSnap.docs.map((memberDoc) => {
    const member = memberDoc.data() as Member
    return {
      countryId,
      country_name: countryData?.country_name ?? countryId,
      id: memberDoc.id,
      team_name: member.team ? teamMap.get(member.team) ?? member.team : undefined,
      ...member,
    }
  })
}
export const adminListAdmins = async (): Promise<any[]> => {
  const snaps = await getDocs(collection(db, 'admins'))
  return snaps.docs.map((d) => ({ id: d.id, ...d.data() }))
}

function generateCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  const array = new Uint32Array(length)
  crypto.getRandomValues(array)
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length]
  }
  return result
}

export const createInviteCode = async (
  _country_code: string,
  _country_name: string,
): Promise<{ code: string; created_at: string }> => {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')

  const code = generateCode()
  const ref = doc(db, 'invitationCodes', code)
  const created_at = serverTimestamp()

  await setDoc(ref, {
    country_code: _country_code,
    country_name: _country_name,
    created_at,
    created_by: user.uid,
    used: false,
    used_by: null,
    used_at: null,
  })

  // created_at is a Firestore Timestamp in the database; here we just echo an ISO string for immediate UI use.
  return { code, created_at: new Date().toISOString() }
}
