'use client'

import { useEffect, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/dataTable'
import { adminListPaymentsDetailed, type AdminPaymentRow } from '@/services/firebaseApi'

const columns: ColumnDef<AdminPaymentRow>[] = [
  { accessorKey: 'country_name', header: 'Country' },
  { accessorKey: 'plan', header: 'Plan' },
  { accessorKey: 'step', header: 'Step' },
  {
    accessorKey: 'subtotal',
    header: 'Subtotal',
    cell: ({ getValue }) => {
      const value = getValue<number | undefined>()
      return typeof value === 'number' ? `$${value.toLocaleString()}` : '—'
    },
  },
  {
    accessorKey: 'totalOnline',
    header: 'Total (online)',
    cell: ({ getValue }) => {
      const value = getValue<number | undefined>()
      return typeof value === 'number' ? `$${value.toLocaleString()}` : '—'
    },
  },
  {
    accessorKey: 'payment_method',
    header: 'Payment method',
    cell: ({ getValue }) => getValue<string | undefined>() ?? '—',
  },
]

export default function AdminPaymentsPage() {
  const [rows, setRows] = useState<AdminPaymentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await adminListPaymentsDetailed()
        if (mounted) setRows(data)
      } catch (err: any) {
        if (mounted) setError(err?.message ?? 'Unable to load payments')
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
        <CardTitle>Payments</CardTitle>
        <p className="text-sm text-muted-foreground">
          Track per-country payment progress, totals, and method selections.
        </p>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : <DataTable columns={columns} data={rows} />}
      </CardContent>
    </Card>
  )
}
