"use client"

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { Route } from 'next'
import { Card, CardContent } from '@/components/ui/card'
import { MemberForm, type MemberFormValues } from '@/components/memberForm'
import { fetchMembers, upsertMember, type Member } from '@/services/firebaseApi'

function splitName(full?: string) {
  const s = (full ?? '').trim()
  if (!s) return { given_name: '', middle_name: '', last_name: '', display_name: '', preferred_name: '' }
  const parts = s.split(/\s+/)
  const given_name = parts[0] ?? ''
  const last_name = parts.length > 1 ? parts[parts.length - 1] : ''
  const middle = parts.slice(1, -1)
  return {
    given_name,
    middle_name: middle.join(' '),
    last_name,
    display_name: s,
    preferred_name: given_name,
  }
}

export default function EditMemberPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [member, setMember] = useState<Member | null>(null)

  useEffect(() => {
    async function load() {
      const list = await fetchMembers()
      const m = list.find((x) => x.id === params.id) || null
      setMember(m)
      setLoading(false)
    }
    load()
  }, [params.id])

  const initialValues: Partial<MemberFormValues> | undefined = useMemo(() => {
    if (!member) return undefined
    const roleFromNotes = typeof member.notes === 'string' && member.notes.startsWith('role:') ? (member.notes.slice(5)) : 'Observer'
    const name = splitName(member.fullName)
    return {
      id: member.id,
      role: (roleFromNotes as any) ?? 'Observer',
      team: member.teamId ?? '',
      gender: member.gender ?? '',
      ...name,
    }
  }, [member])

  async function handleSubmit(values: MemberFormValues) {
    const fullName = [values.given_name, values.middle_name, values.last_name].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
    const m: Member = {
      id: member?.id,
      fullName,
      teamId: values.role === 'Observer' ? '' : (values.team || ''),
      gender: values.gender === 'Other' ? (values.other_gender || 'Other') : values.gender,
      notes: `role:${values.role}`,
    }
    await upsertMember(m)
    router.push('/members' as Route)
  }

  if (loading) {
    return (
      <div className="space-y-4 px-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Edit Member</h1>
        </div>
        <Card>
          <CardContent />
        </Card>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="space-y-4 px-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Member not found</h1>
        </div>
        <Card>
          <CardContent />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 px-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Edit Member</h1>
      </div>
      <Card>
        <CardContent>
          <MemberForm initialValues={initialValues} onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  )
}
