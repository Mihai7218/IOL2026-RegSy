'use client'

import { useEffect, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/dataTable'
import { AdminJuryMemberRow, adminListAllJuryMemberMembersDetailed, adminListAllMembersDetailed } from '@/services/firebaseApi'

const columns: ColumnDef<AdminJuryMemberRow>[] = [
  { accessorKey: 'display_name', header: 'Name' },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'gender', header: 'Gender' },
  { accessorKey: 'room_type', header: 'Room type' },
]

export default function AdminJuryMemberMembersPage() {
  const [rows, setRows] = useState<AdminJuryMemberRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await adminListAllJuryMemberMembersDetailed()
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
        <CardTitle>Members (Jury)</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : <DataTable columns={columns} data={rows} />}
      </CardContent>
    </Card>
  )
}
