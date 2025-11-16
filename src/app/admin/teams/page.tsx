'use client'

import { useEffect, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/dataTable'
import { adminListAllTeamsDetailed, type AdminTeamRow } from '@/services/firebaseApi'

const columns: ColumnDef<AdminTeamRow>[] = [
  { accessorKey: 'country_name', header: 'Country' },
  { accessorKey: 'team_name', header: 'Team name' },
  { accessorKey: 'team_language', header: 'Language' },
  { accessorKey: 'city_tour', header: 'City tour' },
  { accessorKey: 'excursion_route', header: 'Excursion' },
]

export default function AdminTeamsPage() {
  const [rows, setRows] = useState<AdminTeamRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await adminListAllTeamsDetailed()
        if (mounted) setRows(data)
      } catch (err: any) {
        if (mounted) setError(err?.message ?? 'Unable to load teams')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teams by country</CardTitle>
        <p className="text-sm text-muted-foreground">
          Drill into each country’s teams without leaving the dashboard.
        </p>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : <DataTable columns={columns} data={rows} />}
      </CardContent>
    </Card>
  )
}
