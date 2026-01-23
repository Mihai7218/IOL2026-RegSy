'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthProvider'
import { isAdmin } from '@/lib/roles'
import { useState } from 'react'
import { createCountryInviteCode, createJuryMemberInviteCode } from '@/services/firebaseApi'

export default function InvitesPage() {
  const { claims } = useAuth()
  const [countryKey, setCountryKey] = useState('')
  const [countryName, setCountryName] = useState('')
  const [juryMemberCode, setJuryMemberCode] = useState('')
  const [juryMemberName, setJuryMemberName] = useState('')
  const [resultCountry, setResultCountry] = useState<{ code: string; created_at: string } | null>(null)
  const [resultJury, setResultJury] = useState<{ code: string; created_at: string } | null>(null)

  if (!isAdmin(claims)) return <p className='px-10 py-8 text-sm text-muted-foreground'>Admin only.</p>

  const createCountry = async () => {
  const r = await createCountryInviteCode(countryKey, countryName)
    setResultCountry(r)
  }
  const createJuryMember = async () => {
  const r = await createJuryMemberInviteCode(juryMemberCode, juryMemberName)
    setResultJury(r)
  }

  return (
    <div className='space-y-4 px-10'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-semibold'>Create Invite</h1>
      </div>
      <Card>
        <CardContent className='space-y-3'>
          <h1>New Country</h1>
          <div className='grid grid-cols-2 gap-4'>
            <div><Label>Country Key</Label><Input value={countryKey} onChange={e => setCountryKey(e.target.value)} /></div>
            <div><Label>Country Name</Label><Input value={countryName} onChange={e => setCountryName(e.target.value)} /></div>
          </div>
          <Button type='button' onClick={createCountry}>Create</Button>
          {resultCountry && (
            <div className='text-sm'>
              Code: <code>{resultCountry.code}</code> Created:{' '}
              {new Date(resultCountry.created_at).toLocaleString()}
            </div>
          )}
        </CardContent>
        <CardContent className='space-y-3'>
          <h1>New Jury Member</h1>
          <div className='grid grid-cols-2 gap-4'>
            <div><Label>Jury Member Code</Label><Input value={juryMemberCode} onChange={e => setJuryMemberCode(e.target.value)} /></div>
            <div><Label>Jury Member Name</Label><Input value={juryMemberName} onChange={e => setJuryMemberName(e.target.value)} /></div>
          </div>
          <Button type='button' onClick={createJuryMember}>Create</Button>
          {resultJury && (
            <div className='text-sm'>
              Code: <code>{resultJury.code}</code> Created:{' '}
              {new Date(resultJury.created_at).toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
