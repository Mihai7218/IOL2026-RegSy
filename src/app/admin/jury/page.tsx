'use client'

import { useEffect, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/dataTable'
import { type AdminJurySummary, adminListCountrySummaries, adminListJurySummaries } from '@/services/firebaseApi'

const columns: ColumnDef<AdminJurySummary>[] = [
  { accessorKey: 'jury_member_name', header: 'Name' },
  { accessorKey: 'memberCount', header: 'Registered people' },
  {
    accessorKey: 'updated_at',
    header: 'Last updated',
    cell: ({ getValue }) => {
      const value = getValue<string | undefined>()
      return value ? new Date(value).toLocaleString() : '—'
    },
  },
]

export default function AdminJuryPage() {
  const [rows, setRows] = useState<AdminJurySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await adminListJurySummaries()
        if (mounted) setRows(data)
      } catch (err: any) {
        if (mounted) setError(err?.message ?? 'Failed to load jury members')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Jury Members</CardTitle>
          <p className="text-sm text-muted-foreground">
            Overview of every jury member registered.
          </p>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : <DataTable columns={columns} data={rows} />}
        </CardContent>
      </Card>
    </div>
  )
}
