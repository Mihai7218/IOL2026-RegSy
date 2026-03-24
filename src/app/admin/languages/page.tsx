'use client'

import { useEffect, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/dataTable'
import { adminListAllLanguagesDetailed, type AdminLanguageRow } from '@/services/firebaseApi'

const columns: ColumnDef<AdminLanguageRow>[] = [
  { accessorKey: 'official_name', header: 'Name' },
  { accessorKey: 'name', header: 'Name in English' },
  { accessorKey: 'code', header: 'Code' },
  { accessorKey: 'indiv_count', header: '# contestants' },
  { accessorKey: 'team_count', header: '# teams' },
]

export default function AdminLanguagesPage() {
  const [rows, setRows] = useState<AdminLanguageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await adminListAllLanguagesDetailed()
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
        <CardTitle>Languages</CardTitle>
        <p className="text-sm text-muted-foreground">
          List of languages, with the number of teams and the number of contestants using them.
        </p>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : <DataTable columns={columns} data={rows} />}
      </CardContent>
    </Card>
  )
}
