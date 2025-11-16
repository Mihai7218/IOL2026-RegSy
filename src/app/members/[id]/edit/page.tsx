"use client"

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { Route } from 'next'
import { Card, CardContent } from '@/components/ui/card'
import { MemberForm, type MemberFormValues } from '@/components/memberForm'
import { fetchMembers, upsertMember, type Member } from '@/services/firebaseApi'

function splitName(m: Member) {
  return {
    given_name: m.given_name ?? '',
    middle_name: m.middle_name ?? '',
    last_name: m.last_name ?? '',
    display_name: m.display_name ?? '',
    preferred_name: m.preferred_name ?? (m.given_name ?? ''),
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
    const name = splitName(member)
    return {
      id: member.id,
      role: member.role as any,
      team: member.team ?? '',
      gender: member.gender ?? '',
      ...name,
    }
  }, [member])

  async function handleSubmit(values: MemberFormValues) {
    const m: Member = {
      id: member?.id,
      role: values.role,
      team: values.role === 'Observer' ? '' : (values.team || ''),
      given_name: values.given_name,
      middle_name: values.middle_name ?? '',
      last_name: values.last_name,
      display_name: [values.given_name, values.middle_name, values.last_name].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim(),
      preferred_name: values.preferred_name,
      gender: values.gender,
      other_gender: values.other_gender ?? '',
      date_of_birth: values.date_of_birth,
      tshirt_size: values.tshirt_size,
      indiv_language: values.indiv_language ?? '',
      indiv_contest_req: values.indiv_contest_req ?? '',
      passport_number: values.passport_number ?? '',
      issue_date: values.issue_date ?? '',
      expiry_date: values.expiry_date ?? '',
      food_req: values.food_req ?? [],
      other_food_req: values.other_food_req ?? '',
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
