"use client"

import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect, useMemo, useState } from 'react'

import { memberFormSchema, type MemberForm as MemberSchemaForm } from '@/schemas/member'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldGroup } from '@/components/ui/field'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { fetchTeams, type Team } from '@/services/firebaseApi'
import { Checkbox } from '@/components/ui/checkbox'
import { languages } from '@/lib/languages'
import { cityTourOptions } from '@/lib/cityTour'
import { excursionOptions } from '@/lib/excursion'

export type MemberFormValues = MemberSchemaForm & { id?: string }

const ROLES: Array<MemberSchemaForm['role']> = ['Team Leader', 'Team Contestant', 'Observer']
const GENDERS = ['Male', 'Female', 'Other'] as const
const TSHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const
const FOOD_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Halal',
  'Gluten free',
  'Nut allergy',
  'Lactose intolerant',
  'Hindu meal (Non-Vegetarian)',
  'Kosher',
] as const

export function MemberForm({ initialValues, onSubmit }: { initialValues?: Partial<MemberFormValues>; onSubmit: (values: MemberFormValues) => Promise<void> | void }) {
  const [teams, setTeams] = useState<Team[]>([])

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema as unknown as z.ZodType<MemberSchemaForm>),
    defaultValues: {
      id: initialValues?.id,
      role: initialValues?.role ?? 'Team Contestant',
      team: initialValues?.team ?? '',
      given_name: initialValues?.given_name ?? '',
      middle_name: initialValues?.middle_name ?? '',
      last_name: initialValues?.last_name ?? '',
      display_name: initialValues?.display_name ?? '',
      preferred_name: initialValues?.preferred_name ?? '',
      gender: initialValues?.gender ?? '',
      other_gender: initialValues?.other_gender ?? '',
      date_of_birth: initialValues?.date_of_birth ?? '',
      tshirt_size: initialValues?.tshirt_size ?? 'M',
      indiv_language: initialValues?.indiv_language ?? '',
      indiv_contest_req: initialValues?.indiv_contest_req ?? '',
      passport_number: initialValues?.passport_number ?? '',
      issue_date: initialValues?.issue_date ?? '',
      expiry_date: initialValues?.expiry_date ?? '',
      food_req: initialValues?.food_req ?? [],
      other_food_req: initialValues?.other_food_req ?? '',
      excursion_route: initialValues?.excursion_route ?? '',
      city_tour: initialValues?.city_tour ?? '',
    },
  })

  useEffect(() => {
    fetchTeams().then(setTeams)
  }, [])

  const isObserver = form.watch('role') === 'Observer'
  const isContestant = form.watch('role') === 'Team Contestant'
  const genderValue = form.watch('gender')
  const teamOptions = useMemo(() => teams.map((t) => ({ id: t.id!, name: t.team_name })), [teams])

  async function handleSubmit(values: MemberFormValues) {
    await onSubmit({ ...values, id: initialValues?.id })
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} id="member-form" className="space-y-8">
      {/* Personal Information */}
      <div className="space-y-3">
        <div className="text-base font-semibold">Personal Information</div>
        <FieldGroup>
          <Controller
            name="role"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>Role</Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />
          {!isObserver && (
            <Controller
              name="team"
              control={form.control}
              render={({ field }) => (
                <div>
                  <Label>Team</Label>
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamOptions.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
          )}
        </FieldGroup>

        <FieldGroup>
          <Controller
            name="given_name"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>Given name</Label>
                <Input placeholder="Enter given name" {...field} />
              </div>
            )}
          />
          <Controller
            name="middle_name"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>Middle name (optional)</Label>
                <Input placeholder="Enter middle name" {...field} />
              </div>
            )}
          />
          <Controller
            name="last_name"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>Last name</Label>
                <Input placeholder="Enter last name" {...field} />
              </div>
            )}
          />
        </FieldGroup>

        <FieldGroup>
          <Controller
            name="display_name"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>Display name</Label>
                <Input placeholder="Enter display name" {...field} />
              </div>
            )}
          />
          <Controller
            name="preferred_name"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>Preferred name</Label>
                <Input placeholder="Enter preferred name" {...field} />
              </div>
            )}
          />
        </FieldGroup>

        <FieldGroup>
          <Controller
            name="gender"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>Gender</Label>
                <RadioGroup className="mt-2 gap-2" value={field.value} onValueChange={field.onChange}>
                  {GENDERS.map((g) => {
                    const id = `gender-${g}`
                    return (
                      <div key={id} className="flex items-center gap-2">
                        <RadioGroupItem id={id} value={g} />
                        <Label htmlFor={id} className="cursor-pointer">
                          {g}
                        </Label>
                      </div>
                    )
                  })}
                </RadioGroup>
              </div>
            )}
          />
          {genderValue === 'Other' && (
            <Controller
              name="other_gender"
              control={form.control}
              render={({ field }) => (
                <div>
                  <Label>Specify gender</Label>
                  <Input placeholder="Enter gender" {...field} />
                </div>
              )}
            />
          )}
        </FieldGroup>

        <FieldGroup>
          <Controller
            name="date_of_birth"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>Date of birth</Label>
                <Input type="date" {...field} />
              </div>
            )}
          />
          <Controller
            name="tshirt_size"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>T-shirt size</Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {TSHIRT_SIZES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />
        </FieldGroup>
      </div>

      {/* Contest Information */}
      {isContestant && (<div className="space-y-3">
        <div className="text-base font-semibold">Contest Information</div>
        <FieldGroup>
           <Controller
              name="indiv_language"
              control={form.control}
              render={({ field }) => (
                <div>
                  <Label>Contest language</Label>
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((l) => (
                        <SelectItem key={l.code} value={l.name}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
          <Controller
            name="indiv_contest_req"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>Individual contest requirement (optional)</Label>
                <Input placeholder="Enter requirement" {...field} />
              </div>
            )}
          />
        </FieldGroup>
      </div>)}

      {/* Travel */}
      <div className="space-y-3">
        <div className="text-base font-semibold">Travel</div>
        <FieldGroup>
          <Controller
            name="passport_number"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>Passport number (optional)</Label>
                <Input placeholder="Enter passport number" {...field} />
              </div>
            )}
          />
          <Controller
            name="issue_date"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>Passport issue date</Label>
                <Input type="date" {...field} />
              </div>
            )}
          />
          <Controller
            name="expiry_date"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>Passport expiry date</Label>
                <Input type="date" {...field} />
              </div>
            )}
          />
        </FieldGroup>
      </div>

      {/* Dietary Requirement */}
      <div className="space-y-3">
        <div className="text-base font-semibold">Dietary Requirement</div>
        <FieldGroup>
          <Controller
            name="food_req"
            control={form.control}
            render={({ field }) => (
              <div className="col-span-2">
                <Label>Food requirements</Label>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {FOOD_OPTIONS.map((opt) => {
                    const checked = (field.value ?? []).includes(opt)
                    return (
                      <label key={opt} className="flex items-center gap-2">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => {
                            const current = new Set(field.value ?? [])
                            if (v) current.add(opt)
                            else current.delete(opt)
                            field.onChange(Array.from(current))
                          }}
                        />
                        <span>{opt}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}
          />
          <Controller
            name="other_food_req"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>Other food requirements</Label>
                <Input placeholder="Enter details" {...field} />
              </div>
            )}
          />
        </FieldGroup>
      </div>
      
      {/*Sightseeing Options*/}
      {isObserver && (<div className="space-y-3">
        <div className="text-base font-semibold">Sightseeing Options</div>
        <FieldGroup>
          <Controller
                name="city_tour"
                control={form.control}
                render={({ field }) => (
                  <div>
                    <Label>City tour route (optional)</Label>
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select route" />
                      </SelectTrigger>
                      <SelectContent>
                        {cityTourOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
              <Controller
                name="excursion_route"
                control={form.control}
                render={({ field }) => (
                  <div>
                    <Label>Excursion route (optional)</Label>
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select route" />
                      </SelectTrigger>
                      <SelectContent>
                        {excursionOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
        </FieldGroup>
      </div>)}
      
      <Button type="submit" form="member-form">
        Save
      </Button>
    </form>
  )
}
