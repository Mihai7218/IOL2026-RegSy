'use client'

import { useEffect, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/dataTable'
import { adminListContactsDetailed, type AdminContactRow } from '@/services/firebaseApi'

const columns: ColumnDef<AdminContactRow>[] = [
  { accessorKey: 'country_name', header: 'Country' },
  { accessorKey: 'primary_name', header: 'Primary contact' },
  { accessorKey: 'primary_email', header: 'Primary email' },
  { accessorKey: 'primary_phone', header: 'Primary phone' },
  { accessorKey: 'secondary_name', header: 'Secondary contact' },
  { accessorKey: 'secondary_email', header: 'Secondary email' },
]

export default function AdminContactsPage() {
  const [rows, setRows] = useState<AdminContactRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await adminListContactsDetailed()
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
        <CardTitle>Contacts</CardTitle>
        <p className="text-sm text-muted-foreground">
          Primary and secondary contact information for each country.
        </p>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : <DataTable columns={columns} data={rows} />}
      </CardContent>
    </Card>
  )
}
