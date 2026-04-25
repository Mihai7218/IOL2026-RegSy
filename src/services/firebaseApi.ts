/**
 * Service-layer aliases backed by Firestore.
 * Keep UI free of Firebase details.
 */

import { useAuth } from '@/context/AuthProvider'
import { getClaims } from '@/lib/claims'
import { auth, db } from '@/lib/firebase'
import { Language, languages } from '@/lib/languages'
import { getFolder, getRole } from '@/lib/utils'
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
import { number } from 'zod'

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
export const fetchContacts = async (role = 'countries'): Promise<Contact | null> => {
  const user = auth.currentUser
  if (!user) return null
  const countryRef = doc(db, role, user.uid)
  const snap = await getDoc(countryRef)
  if (!snap.exists()) return null
  const data = snap.data() as any
  if (!data.contact) return null
  return data.contact as Contact
}
export const fetchContactsJury = async (): Promise<Contact | null> => fetchContacts('juryMembers')
export const upsertContacts = async (_contacts: Contact, role = "countries"): Promise<void> => {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  const countryRef = doc(db, role, user.uid)
  await setDoc(
    countryRef,
    {
      contact: _contacts,
      updated_at: serverTimestamp(),
    },
    { merge: true },
  )
}
export const upsertContactsJury = async (_contacts: Contact): Promise<void> => upsertContacts(_contacts, 'juryMembers')

// Transportation - aligned with flightLegSchema in src/schemas/transport.ts
export type FlightLeg = {
  id?: string
  direction: 'arrival' | 'departure'
  terminal: string
  location: string
  airline: string
  flight_no: string
  datetime: string // ISO
}

export const fetchTransport = async (): Promise<FlightLeg[]> => {
  const user = auth.currentUser
  const claims = await getClaims(user)
  if (!user) return []
  const transportsCol = collection(db, getFolder(getRole(claims)), user.uid, 'transports')
  const snaps = await getDocs(transportsCol)
  return snaps.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FlightLeg, 'id'>) }))
}


export const upsertTransport = async (_leg: FlightLeg): Promise<string> => {
  const user = auth.currentUser
  const claims = await getClaims(user)
  if (!user) throw new Error('Not authenticated')
  const transportCol = collection(db, getFolder(getRole(claims)), user.uid, 'transports')
  const id = _leg.id ?? doc(transportCol).id
  const ref = doc(transportCol, id)
  console.log(id)
  const { id: _omitId, ...data } = _leg
  await setDoc(
    ref,
    {
      ...data,
      updated_at: serverTimestamp(),
    },
    { merge: true },
  )
  return id
}

export const deleteTransport = async (_transportId: string): Promise<void> => {
  const user = auth.currentUser
  const claims = await getClaims(user)
  if (!user) throw new Error('Not authenticated')
  const ref = doc(db, getFolder(getRole(claims)), user.uid, 'transports', _transportId)
  await deleteDoc(ref)
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
  arrival?: string
  departure?: string
  role: string
  given_name: string
  last_name: string
  display_name: string
  preferred_name: string
  gender: string
  other_gender?: string
  acco_req?: string
  date_of_birth: string
  tshirt_size: string
  indiv_language?: string
  room_type: string
  roommate_preference?: string
  document_type: string
  passport_number: string
  issue_date: string
  expiry_date: string
  issuing_country: string
  nationality: string
  food_req?: string[]
  food_allergies?: string[]
  other_food_allergies?: string
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
  const claims = await getClaims(user)
  if (!user) return []
  const membersCol = collection(db, getFolder(getRole(claims)), user.uid, 'members')
  const q = _teamId
    ? query(membersCol, where('team', '==', _teamId))
    : membersCol
  const snaps = await getDocs(q)
  return snaps.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Member, 'id'>) }))
}

export const upsertMember = async (_member: Member): Promise<void> => {
  const user = auth.currentUser
  const claims = await getClaims(user)
  if (!user) throw new Error('Not authenticated')
  const membersCol = collection(db, getFolder(getRole(claims)), user.uid, 'members')
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

export const upsertMemberTransport = async (_id: string, _transport: string, _direction: string): Promise<void> => {
  const user = auth.currentUser
  const claims = await getClaims(user)
  if (!user) throw new Error('Not authenticated')
  const memberDoc = doc(db, getFolder(getRole(claims)), user.uid, 'members', _id)
  const member = await getDoc(memberDoc)
  const { id: _omitId, departure: _omitDeparture, arrival: _omitArrival, ...data } = member.data()!
  const newDeparture = _direction === 'departure' ? _transport : _omitDeparture
  const newArrival = _direction === 'arrival' ? _transport : _omitArrival

  await setDoc(
    memberDoc,
    {  
      departure: newDeparture,
      arrival: newArrival,
      ...data,
      updated_at: serverTimestamp(),
    },
    { merge: true },
  )
}

export const deleteMember = async (_memberId: string): Promise<void> => {
  const user = auth.currentUser
  const claims = await getClaims(user)
  if (!user) throw new Error('Not authenticated')
  const ref = doc(db, getFolder(getRole(claims)), user.uid, 'members', _memberId)
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
    countriesSnap.docs
    .filter(adminTestFilter)
    .map(async (countryDoc) => {
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

export type AdminJurySummary = {
  id: string
  jury_member_name: string
  memberCount?: number
  observers?: number
  language_experts?: number
  single_room_reqs?: number
  subtotal?: number
  already_paid?: number
}

export const adminListJurySummaries = async (): Promise<AdminJurySummary[]> => {
  const countriesSnap = await getDocs(collection(db, 'juryMembers'))
  const rows = (await Promise.all(
    countriesSnap.docs
    .filter(adminTestFilter)
    .map(async (juryDoc) => {
      const data = juryDoc.data() as any
      const payment = data?.payment ?? {}
      const registration = payment?.registration ?? {}
      const confirmation = payment?.confirmation ?? {}
      const totals = payment?.pricing ?? {}
      const obs = parseInt(registration?.additional_observers)
      const le = parseInt(registration?.language_experts)
      const sr = parseInt(registration?.single_room_requests)

      const [membersSnap] = await Promise.all([
        getDocs(collection(db, 'juryMembers', juryDoc.id, 'members')),
      ])
      return {
        id: juryDoc.id,
        jury_member_name: data?.jury_member_name ?? juryDoc.id,
        memberCount: membersSnap.size,
        subtotal: totals?.subtotal,
        already_paid: registration?.paid_before,
        observers: Number.isNaN(obs) ? undefined : obs,
        language_experts: Number.isNaN(le) ? undefined : le,
        single_room_reqs: Number.isNaN(sr) ? undefined : sr,
      }
    }))).sort((a, b) => a.jury_member_name.localeCompare(b.jury_member_name))
    let total = {
      id: 0 as any,
      jury_member_name: "Total",
      memberCount: 0,
      subtotal: 0,
      already_paid: 0,
      observers: 0,
      language_experts: 0,
      single_room_reqs: 0,
    }
    rows.forEach ((currentValue) => {
      total.memberCount += (currentValue?.memberCount ?? 0);
      total.subtotal += (currentValue?.subtotal ?? 0);
      total.already_paid += (currentValue?.already_paid ?? 0);
      total.observers += (currentValue?.observers ?? 0);
      total.language_experts += (currentValue?.language_experts ?? 0);
      total.single_room_reqs += (currentValue?.single_room_reqs ?? 0);
    })

  rows.push(total);
  return rows;
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
    .filter(adminTestFilter)
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
  for (const countryDoc of countriesSnap.docs.filter(adminTestFilter)) {
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
  for (const countryDoc of countriesSnap.docs.filter(adminTestFilter)) {
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

export type AdminJuryMemberRow = Member & {
  jury_member_name: string
}

export const adminListAllJuryMemberMembersDetailed = async (): Promise<AdminJuryMemberRow[]> => {
  const jurySnap = await getDocs(collection(db, 'juryMembers'))
  const rows: AdminJuryMemberRow[] = []
  for (const juryDoc of jurySnap.docs.filter(adminTestFilter)) {
    const data = juryDoc.data() as any
    const membersSnap = await getDocs(collection(db, 'juryMembers', juryDoc.id, 'members'))

    membersSnap.forEach((memberDoc) => {
      const member = memberDoc.data() as Member
      rows.push({
        id: memberDoc.id,
        jury_member_name: data.jury_member_name, 
        ...member,
      })
    })

  }
  return rows.sort((a, b) => {
    const x = a.jury_member_name.localeCompare(b.jury_member_name)
    if (x == 0) {
      if (a.role == 'Jury Member') return -1
      return 1
    }
    return x
    })
}

export type AdminLanguageRow = Language & {
  indiv_count: number
  team_count: number
}

export const adminListAllLanguagesDetailed = async (): Promise<AdminLanguageRow[]> => {
  const countriesSnap = await getDocs(collection(db, 'countries'))
  const languageRows : Map<string, AdminLanguageRow> = new Map(languages.map((language) => {
      return [language.name, {
      ...language,
      indiv_count: 0,
      team_count: 0,
      }]}))
  for (const countryDoc of countriesSnap.docs.filter(adminTestFilter)) {
    const [teamsSnap, membersSnap] = await Promise.all([
      getDocs(collection(db, 'countries', countryDoc.id, 'teams')),
      getDocs(collection(db, 'countries', countryDoc.id, 'members')),
    ])
    teamsSnap.forEach((teamDoc) => {
      const teamData = teamDoc.data() as Team
      ((languageRows.get(teamData.team_language ?? "") ?? {
        name : "",
        code: "",
        official_name: "",
        indiv_count: 0,
        team_count: 0,
      }).team_count)++
    })
    membersSnap.forEach((memberDoc) => {
      const member = memberDoc.data() as Member
      ((languageRows.get(member.indiv_language ?? "") ?? {
        name : "",
        code: "",
        official_name: "",
        indiv_count: 0,
        team_count: 0,
      }).indiv_count)++
    })
  }
  return Array.from(languageRows.values());
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
  for (const countryDoc of countriesSnap.docs.filter(adminTestFilter)) {
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
  alreadyPaid?: number
  teams?: number
  observers?: number
  singleRooms?: number
}

function adminTestFilter(entry: any) : boolean {
    const x = entry.data()?.country_code ?? entry.data()?.jury_member_code ?? "" as string
    return !(x.includes("ADM") || x.includes("TEST") || x === "")
}

export const adminListPaymentsDetailed = async (): Promise<AdminPaymentRow[]> => {
  const countriesSnap = await getDocs(collection(db, 'countries'))
  let rows = countriesSnap.docs
    .filter(adminTestFilter)
    .map((countryDoc) => {
      const data = countryDoc.data() as any
      const payment = data?.payment ?? {}
      const registration = payment?.registration ?? {}
      const confirmation = payment?.confirmation ?? {}
      const totals = payment?.pricing ?? {}
      const obs = parseInt(registration?.additional_observers)
      const sr = parseInt(registration?.single_room_requests)
      return {
        id: countryDoc.id,
        country_name: data?.country_name ?? countryDoc.id,
        country_code: data?.country_code ?? '—',
        step: payment?.step,
        plan: registration?.plan,
        subtotal: totals?.subtotal,
        alreadyPaid: registration?.paid_before,
        teams: registration?.number_of_teams,
        observers: Number.isNaN(obs) ? undefined : obs,
        singleRooms: Number.isNaN(sr) ? undefined : sr,
      }
    })
    .sort((a, b) => a.country_name.localeCompare(b.country_name))
  
  let total = {
        id: 0 as any,
        country_name: "Total",
        country_code: '—',
        step: "",
        plan: "",
        subtotal: 0,
        alreadyPaid: 0,
        teams: 0,
        observers: 0,
        singleRooms: 0,
      }
  rows.forEach ((currentValue) => {
    total.subtotal += (currentValue?.subtotal ?? 0);
    total.alreadyPaid += (currentValue?.alreadyPaid ?? 0);
    total.teams += (currentValue?.teams ?? 0);
    total.observers += (currentValue?.observers ?? 0);
    total.singleRooms += (currentValue?.singleRooms ?? 0);
  }, )
  rows.push(total);
  return rows;
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

const createInviteCode = async (
  data: any,
): Promise<{ code: string; created_at: string }> => {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')

  const code = generateCode()
  const ref = doc(db, 'invitationCodes', code)
  const created_at = serverTimestamp()

  await setDoc(ref, {
    ...data,
    created_at,
    created_by: user.uid,
    used: false,
    used_by: null,
    used_at: null,
  })

  // created_at is a Firestore Timestamp in the database; here we just echo an ISO string for immediate UI use.
  return { code, created_at: new Date().toISOString() }
}

export const createCountryInviteCode = async (
  _country_name: string,
  _country_code: string,
): Promise<{ code: string; created_at: string }> => {
  return createInviteCode({
    country_code: _country_code,
    country_name: _country_name,
  })
}

export const createJuryMemberInviteCode = async (
  _jury_member_name: string,
  _jury_member_code: string,
): Promise<{ code: string; created_at: string }> => {
  return createInviteCode({
    jury_member_code: _jury_member_code,
    jury_member_name: _jury_member_name,
  })
}

export const createVolunteerInviteCode = async (
  _volunteer_name: string,
  _ignored: string,
): Promise<{ code: string; created_at: string }> => {
  return createInviteCode({
    volunteer_name: _volunteer_name,
  })
}

export const createLOCMemberInviteCode = async (
  _loc_member_name: string,
  _ignored: string,
): Promise<{ code: string; created_at: string }> => {
  return createInviteCode({
    loc_member_name: _loc_member_name,
  })
}
