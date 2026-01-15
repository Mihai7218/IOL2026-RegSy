'use client'

import { useEffect, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/dataTable'
import { adminListAllSightseeingMembersDetailed, type AdminSightseeingRow } from '@/services/firebaseApi'

const columns: ColumnDef<AdminSightseeingRow>[] = [
  { accessorKey: 'country_name', header: 'Country' },
  {
    id: 'team_name',
    header: 'Team',
    cell: ({ row }) => row.original.team_name ?? row.original.team ?? '—',
  },
  { accessorKey: 'display_name', header: 'Display name' },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'city_tour', header: 'City Tour' },
  { accessorKey: 'excursion_route', header: 'Excursion', },
]

export default function AdminSightseeingPage() {
  const [rows, setRows] = useState<AdminSightseeingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await adminListAllSightseeingMembersDetailed()
        if (mounted) setRows(data)
      } catch (err: any) {
        if (mounted) setError(err?.message ?? 'Unable to load members')
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
        <CardTitle>Sightseeing</CardTitle>
        <p className="text-sm text-muted-foreground">
          Filterable list of every member&apos;s sightseeing option to support excursion/city tour spot checks.
        </p>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : <DataTable columns={columns} data={rows} />}
      </CardContent>
    </Card>
  )
}
