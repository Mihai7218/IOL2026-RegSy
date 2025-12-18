"use client"

import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { Card, CardContent } from '@/components/ui/card'
import { MemberForm, type MemberFormValues } from '@/components/memberForm'
import { upsertMember, type Member } from '@/services/firebaseApi'

export default function CreateMemberPage() {
  const router = useRouter()

  async function handleSubmit(values: MemberFormValues) {
    const m: Member = {
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
      excursion_route: values.excursion_route ?? '',
      city_tour: values.city_tour ?? '',
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
