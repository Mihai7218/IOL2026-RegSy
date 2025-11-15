"use client"

import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { Card, CardContent } from '@/components/ui/card'
import { MemberForm, type MemberFormValues } from '@/components/memberForm'
import { upsertMember, type Member } from '@/services/firebaseApi'

export default function CreateMemberPage() {
  const router = useRouter()

  async function handleSubmit(values: MemberFormValues) {
    // Map UI values to service Member shape
    const fullName = [values.given_name, values.middle_name, values.last_name].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
    const m: Member = {
      fullName,
      teamId: values.role === 'Observer' ? '' : (values.team || ''),
      gender: values.gender === 'Other' ? (values.other_gender || 'Other') : values.gender,
      notes: `role:${values.role}`,
    }
    await upsertMember(m)
    router.push('/members' as Route)
  }

  return (
    <div className="space-y-4 px-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Create Member</h1>
      </div>
      <Card>
        <CardContent>
          <MemberForm onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  )
}
