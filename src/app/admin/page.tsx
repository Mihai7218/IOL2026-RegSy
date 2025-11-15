'use client'

import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/context/AuthProvider'
import { isAdmin } from '@/lib/roles'

export default function AdminHome() {
  const { claims } = useAuth()
  if (!isAdmin(claims)) return <p>Admin only.</p>
  return (
    <div className='space-y-4 px-10'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-semibold'>Admin Overview</h1>
      </div>
      <Card>
        <CardContent>Choose a subsection from the sidebar.</CardContent>
      </Card>
    </div>
  )
}
