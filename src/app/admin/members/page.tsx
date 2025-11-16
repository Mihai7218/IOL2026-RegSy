'use client'

import { useEffect, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/dataTable'
import { adminListAllMembersDetailed, type AdminMemberRow } from '@/services/firebaseApi'

const columns: ColumnDef<AdminMemberRow>[] = [
  { accessorKey: 'country_name', header: 'Country' },
  {
    id: 'team_name',
    header: 'Team',
    cell: ({ row }) => row.original.team_name ?? row.original.team ?? '—',
  },
  { accessorKey: 'display_name', header: 'Display name' },
  { accessorKey: 'role', header: 'Role' },
  {
    accessorKey: 'food_req',
    header: 'Diet',
    cell: ({ getValue }) => getValue<string[] | undefined>()?.join(', ') ?? '—',
  },
  { accessorKey: 'indiv_language', header: 'Language' },
]

export default function AdminMembersPage() {
  const [rows, setRows] = useState<AdminMemberRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await adminListAllMembersDetailed()
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
        <CardTitle>Members</CardTitle>
        <p className="text-sm text-muted-foreground">
          Filterable list of every member to support diet/language spot checks.
        </p>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : <DataTable columns={columns} data={rows} />}
      </CardContent>
    </Card>
  )
}
