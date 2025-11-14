'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useAuth } from '@/context/AuthProvider'
import { isAdmin } from '@/lib/roles'

export default function AdminHome() {
  const { claims } = useAuth()
  if (!isAdmin(claims)) return <p>Admin only.</p>
  return (
    <div className='space-y-4'>
      
      <Card><CardHeader>Admin Overview</CardHeader><CardContent>Choose a subsection from the sidebar.</CardContent></Card>
    </div>
  )
}
