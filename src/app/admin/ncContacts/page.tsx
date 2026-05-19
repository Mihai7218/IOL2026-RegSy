'use client'

import { useEffect, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/dataTable'
import { adminListNCContactsDetailed, type AdminNCContactRow } from '@/services/firebaseApi'

const columns: ColumnDef<AdminNCContactRow>[] = [
  { accessorKey: 'jury_member_name', header: 'Account name' },
  { accessorKey: 'primary_name', header: 'Primary contact' },
  { accessorKey: 'primary_email', header: 'Primary email' },
  { accessorKey: 'primary_phone', header: 'Primary phone' },
  { accessorKey: 'primary_whatsapp', header: 'Primary WhatsApp' },
]

export default function AdminContactsPage() {
  const [rows, setRows] = useState<AdminNCContactRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await adminListNCContactsDetailed()
        if (mounted) setRows(data)
      } catch (err: any) {
        if (mounted) setError(err?.message ?? 'Unable to load contacts')
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
        <CardTitle>Contacts (Jury/LOC/Volunteers)</CardTitle>
        <p className="text-sm text-muted-foreground">
          Primary and secondary contact information for each non-country member.
        </p>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : <DataTable columns={columns} data={rows} />}
      </CardContent>
    </Card>
  )
}
