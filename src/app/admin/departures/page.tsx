'use client'

import { useEffect, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/dataTable'
import { adminListAllArrivalsDetailed, adminListAllDeparturesDetailed, AdminTransportRow, type AdminTeamRow } from '@/services/firebaseApi'

const columns: ColumnDef<AdminTransportRow>[] = [
  { accessorKey: 'datetime', header: 'Date/Time'},
  { accessorKey: 'location_BUH', header: 'Location'},
  { accessorKey: 'location_OTH', header: 'Destination'},
  { accessorKey: 'airline', header: 'Transport Company'},
  { accessorKey: 'flight_no', header: 'Transport Number'},
  { accessorKey: 'name', header: 'Account' },
  { accessorKey: 'member', header: 'Name' },
]

export default function AdminDeparturesPage() {
  const [rows, setRows] = useState<AdminTransportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await adminListAllDeparturesDetailed()
        if (mounted) setRows(data)
      } catch (err: any) {
        if (mounted) setError(err?.message ?? 'Unable to load departures')
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
        <CardTitle>Arrivals</CardTitle>
        <p className="text-sm text-muted-foreground">
          See all departures.
        </p>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : <DataTable columns={columns} data={rows} />}
      </CardContent>
    </Card>
  )
}
