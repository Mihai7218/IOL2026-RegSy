'use client'

import { useEffect, useMemo, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/dataTable'
import Link from 'next/link'
import type { Route } from 'next'
import { adminListCountrySummaries, type AdminCountrySummary } from '@/services/firebaseApi'

const columns: ColumnDef<AdminCountrySummary>[] = [
  {
    accessorKey: 'country_name',
    header: 'Country',
  },
  {
    accessorKey: 'country_code',
    header: 'Code',
  },
  {
    accessorKey: 'teamCount',
    header: 'Teams',
  },
  {
    accessorKey: 'memberCount',
    header: 'Members',
  },
  {
    id: 'actions',
    header: 'Drill down',
    cell: ({ row }) => (
      <Button asChild variant="outline" size="sm">
        <Link href={`/admin/countries/${row.original.id}` as Route}>View</Link>
      </Button>
    ),
    enableHiding: false,
  },
]

export default function AdminHome() {
  const [rows, setRows] = useState<AdminCountrySummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await adminListCountrySummaries()
        if (mounted) setRows(data)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const aggregates = useMemo(() => {
    const countries = rows.length
    const teamTotal = rows.reduce((acc, row) => acc + row.teamCount, 0)
    const memberTotal = rows.reduce((acc, row) => acc + row.memberCount, 0)
    return { countries, teamTotal, memberTotal }
  }, [rows])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total countries</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{aggregates.countries}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total teams</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{aggregates.teamTotal}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total members</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{aggregates.memberTotal}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Country progress</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Loading latest data…</p> : <DataTable columns={columns} data={rows} />}
        </CardContent>
      </Card>
    </div>
  )
}
