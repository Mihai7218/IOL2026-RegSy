'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthProvider'
import { isAdmin } from '@/lib/roles'
import { useState } from 'react'
import { createCountryInviteCode, createJuryMemberInviteCode, createLOCMemberInviteCode, createVolunteerInviteCode } from '@/services/firebaseApi'

export default function InvitesPage() {
  const { claims } = useAuth()
  const [userType, setUserType] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [result, setResult] = useState<{ code: string; created_at: string } | null>(null)

  if (!isAdmin(claims)) return <p className='px-10 py-8 text-sm text-muted-foreground'>Admin only.</p>

  function create(role: string) { return async () => {
      let createFun = (x : string, y : string) : Promise <{code: string, created_at: string}> => {return Promise.resolve({code: "failed", created_at: "never"})}
      switch (role) {
        case "Country":
          createFun = createCountryInviteCode
          break
        case "Jury":
          createFun = createJuryMemberInviteCode
          break
        case "Volunteer":
          setCode("")
          createFun = createVolunteerInviteCode
          break
        case "LOC":
          setCode("")
          createFun = createLOCMemberInviteCode
          break
      }
      const r = await createFun(name, code)
      setResult(r)
    }
  }
  // const createVolunteer = async () => {
  // const r = await createVolunteerInviteCode(juryMemberCode, juryMemberName)
  //   setResult(r)
  // }

  function getField1(userType : string) : string {
    switch (userType) {
      case "Country":
          return "Country Name"
      case "Jury":
          return "Jury Member Name"
      case "Volunteer":
          return "Volunteer Name"
      case "LOC":
          return "LOC Member Name"
      default:
        return "N/A"
    }
  }

  function getField2(userType : string) : string {
    switch (userType) {
      case "Country":
          return "Country Code"
      case "Jury":
          return "Jury Member Code"
      default:
        return "N/A"
    }
  }

  return (
    <div className='space-y-4 px-10'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-semibold'>Create Invite</h1>
      </div>
      <Card>
        <CardContent className='space-y-3'>
          <Label>Type of user</Label>
          <Select value={userType} onValueChange={(v) => setUserType(v)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Country">Country</SelectItem>
              <SelectItem value="Jury">Jury Member</SelectItem>
              <SelectItem value="Volunteer">Volunteer</SelectItem>
              <SelectItem value="LOC">LOC Member</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
        {userType && <CardContent className='space-y-3'>
          <div className='grid grid-cols-2 gap-4'>
            <div><Label>{getField1(userType)}</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            {(userType === "Country" || userType === "Jury") && <div><Label>{getField2(userType)}</Label><Input value={code} onChange={e => setCode(e.target.value)} /></div>}
          </div>
          <Button type='button' onClick={create(userType)}>Create</Button>
          {result && (
            <div className='text-sm'>
              Code: <code>{result.code}</code> Created:{' '}
              {new Date(result.created_at).toLocaleString()}
            </div>
          )}
        </CardContent>}
      </Card>
    </div>
  )
}
