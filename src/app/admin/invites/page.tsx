'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthProvider'
import { isAdmin } from '@/lib/roles'
import { useState } from 'react'
import { createInviteCode } from '@/services/firebaseApi'

export default function InvitesPage() {
  const { claims } = useAuth()
  if (!isAdmin(claims)) return <p>Admin only.</p>
  const [countryKey, setCountryKey] = useState('')
  const [countryName, setCountryName] = useState('')
  const [result, setResult] = useState<{code:string;expiresAt:string}|null>(null)

  const create = async () => {
    const r = await createInviteCode(countryKey, countryName)
    setResult(r)
  }

  return (
    <div className='space-y-4 px-10'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-semibold'>Create Invite</h1>
      </div>
      <Card>
        <CardContent className='space-y-3'>
          <div className='grid grid-cols-2 gap-4'>
            <div><Label>Country Key</Label><Input value={countryKey} onChange={e => setCountryKey(e.target.value)} /></div>
            <div><Label>Country Name</Label><Input value={countryName} onChange={e => setCountryName(e.target.value)} /></div>
          </div>
          <Button type='button' onClick={create}>Create</Button>
          {result && <div className='text-sm'>Code: <code>{result.code}</code> Expires: {new Date(result.expiresAt).toLocaleString()}</div>}
        </CardContent>
      </Card>
    </div>
  )
}
