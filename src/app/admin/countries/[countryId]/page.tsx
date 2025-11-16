'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/dataTable'
import {
  adminGetCountryProfile,
  adminListCountryMembers,
  adminListCountryTeams,
  type AdminCountryProfile,
  type AdminMemberRow,
  type AdminTeamRow,
} from '@/services/firebaseApi'

const teamColumns: ColumnDef<AdminTeamRow>[] = [
  { accessorKey: 'team_name', header: 'Team name' },
  { accessorKey: 'team_language', header: 'Language' },
  { accessorKey: 'city_tour', header: 'City tour' },
  { accessorKey: 'excursion_route', header: 'Excursion' },
]

const memberColumns: ColumnDef<AdminMemberRow>[] = [
  { accessorKey: 'display_name', header: 'Display name' },
  { accessorKey: 'team', header: 'Team' },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'food_req', header: 'Food requirements', cell: ({ getValue }) => (getValue<string[] | undefined>()?.join(', ') ?? '—') },
  { accessorKey: 'indiv_language', header: 'Language' },
]

export default function AdminCountryDetailPage() {
  const params = useParams<{ countryId: string }>()
  const countryId = params?.countryId
  const [profile, setProfile] = useState<AdminCountryProfile | null>(null)
  const [teams, setTeams] = useState<AdminTeamRow[]>([])
  const [members, setMembers] = useState<AdminMemberRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!countryId) return
    let mounted = true
    ;(async () => {
      try {
        const [profileData, teamRows, memberRows] = await Promise.all([
          adminGetCountryProfile(countryId),
          adminListCountryTeams(countryId),
          adminListCountryMembers(countryId),
        ])
        if (!mounted) return
        setProfile(profileData)
        setTeams(teamRows)
        setMembers(memberRows)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [countryId])

  if (!countryId) {
    return <p className="text-sm text-muted-foreground">No country selected.</p>
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading country data…</p>
  }

  if (!profile) {
    return <p className="text-sm text-muted-foreground">Country not found.</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Country ID: {profile.id}</p>
        <h2 className="text-2xl font-semibold">{profile.country_name ?? profile.id}</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Primary contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>Name: {profile.contact?.primary?.name ?? '—'}</p>
            <p>Email: {profile.contact?.primary?.email ?? '—'}</p>
            <p>Phone: {profile.contact?.primary?.phone ?? '—'}</p>
            <p>WhatsApp: {profile.contact?.primary?.whatsapp ?? '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payment status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>Step: {profile.payment?.step ?? 'Not started'}</p>
            <p>Plan: {profile.payment?.registration?.plan ?? '—'}</p>
            <p>Subtotal: {profile.payment?.pricing?.subtotal ?? '—'}</p>
            <p>Total (online): {profile.payment?.pricing?.totalOnline ?? '—'}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teams</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={teamColumns} data={teams} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={memberColumns} data={members} />
        </CardContent>
      </Card>
    </div>
  )
}
