'use client'

import { useEffect, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/dataTable'
import { adminListCountrySummaries, type AdminCountrySummary } from '@/services/firebaseApi'
import Link from 'next/link'
import type { Route } from 'next'
import { Button } from '@/components/ui/button'

const columns: ColumnDef<AdminCountrySummary>[] = [
  { accessorKey: 'country_name', header: 'Country' },
  { accessorKey: 'country_code', header: 'Code' },
  { accessorKey: 'teamCount', header: 'Teams' },
  { accessorKey: 'memberCount', header: 'Members' },
  {
    accessorKey: 'updated_at',
    header: 'Last updated',
    cell: ({ getValue }) => {
      const value = getValue<string | undefined>()
      return value ? new Date(value).toLocaleString() : '—'
    },
  },
  {
    id: 'actions',
    header: 'Details',
    enableHiding: false,
    cell: ({ row }) => (
      <Button asChild size="sm" variant="outline">
        <Link href={`/admin/countries/${row.original.id}` as Route}>Open</Link>
      </Button>
    ),
  },
]

export default function AdminCountriesPage() {
  const [rows, setRows] = useState<AdminCountrySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await adminListCountrySummaries()
        if (mounted) setRows(data)
      } catch (err: any) {
        if (mounted) setError(err?.message ?? 'Failed to load countries')
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
          <CardTitle>Countries</CardTitle>
          <p className="text-sm text-muted-foreground">
            Overview of every country document with aggregated team/member counts for quick triage.
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
