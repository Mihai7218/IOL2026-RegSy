"use client"

import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'

import { memberFormSchema, type MemberForm as MemberSchemaForm } from '@/schemas/member'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldGroup, FieldError } from '@/components/ui/field'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { fetchTeams, type Team } from '@/services/firebaseApi'
import { Checkbox } from '@/components/ui/checkbox'
import { languages } from '@/lib/languages'
import { cityTourOptions } from '@/lib/cityTour'
import { excursionOptions } from '@/lib/excursion'
import { isCountry, isJuryMember } from '@/lib/roles'
import { useAuth } from '@/context/AuthProvider'
import { Card, CardContent, CardContentFirst } from './ui/card'

export type MemberFormValues = MemberSchemaForm & { id?: string }

const COUNTRY_ROLES: Array<MemberSchemaForm['role']> = ['Team Leader', 'Team Contestant', 'Observer']
const JURY_ROLES: Array<MemberSchemaForm['role']> = ['Jury Member', 'Observer', 'Language Expert']
const GENDERS = ['Male', 'Female', 'Other'] as const
const DOCUMENTS = ['Passport', 'ID Card'] as const
const ROOM_TYPES = ['Single (requires supplement)', 'Shared room'] as const
const RM_PREF = ['Same role', 'Same country'] as const
const TSHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const
const FOOD_PREFERENCES = [
  'Vegetarian',
  'Vegan',
  'Halal',
  'Hindu meal (Non-Vegetarian)',
  'Kosher',
] as const
const FOOD_ALLERGIES = [
  'Cereals containing gluten - wheat, rye, barley, oats.',
  'Crustaceans, e.g., crabs, prawns, lobsters',
  'Eggs',
  'Fish',
  'Peanuts',
  'Soybeans',
  'Milk',
  'Nuts - almonds, hazelnuts, walnuts, cashews, pecan nuts, brazil nuts, pistachio nuts, macadamia/Queensland nut',
  'Celery',
  'Mustard',
  'Sesame seeds',
  'Sulphur dioxide and sulphites used as a preservative (at concentrations of more than 10 mg/kg or 10 mg/L in terms of total sulphur dioxide)',
  'Lupin',
  'Molluscs, e.g., mussels, oysters, squid, snails',
] as const

export function MemberForm({ initialValues, onSubmit }: { initialValues?: Partial<MemberFormValues>; onSubmit: (values: MemberFormValues) => Promise<void> | void }) {
  const { claims } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [hasPreferences, setHasPreferences] = useState<string>(initialValues?.food_req === undefined || initialValues?.food_req?.length === 0 ? "" : "y")
  const [hasAllergies, setHasAllergies] = useState<string>(initialValues?.other_food_allergies === undefined || initialValues.other_food_allergies === "" ? "" : "y")

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema as unknown as z.ZodType<MemberSchemaForm>),
    defaultValues: {
      id: initialValues?.id,
      role: initialValues?.role ?? '',
      team: initialValues?.team ?? '',
      given_name: initialValues?.given_name ?? '',
      last_name: initialValues?.last_name ?? '',
      display_name: initialValues?.display_name ?? '',
      preferred_name: initialValues?.preferred_name ?? '',
      gender: initialValues?.gender ?? '',
      other_gender: initialValues?.other_gender ?? '',
      acco_req: initialValues?.acco_req ?? '',
      date_of_birth: initialValues?.date_of_birth ?? '',
      tshirt_size: initialValues?.tshirt_size ?? '',
      indiv_language: initialValues?.indiv_language ?? '',
      document_type: initialValues?.document_type ?? '',
      room_type: initialValues?.room_type ?? 'Shared room',
      roommate_preference: initialValues?.roommate_preference ?? '',
      passport_number: initialValues?.passport_number ?? '',
      issue_date: initialValues?.issue_date ?? '',
      expiry_date: initialValues?.expiry_date ?? '',
      issuing_country: initialValues?.issuing_country ?? '',
      nationality: initialValues?.nationality ?? '',
      food_req: initialValues?.food_req ?? [],
      food_allergies: initialValues?.food_allergies ?? [],
      other_food_allergies: initialValues?.other_food_allergies ?? '',
      excursion_route: initialValues?.excursion_route ?? '',
      city_tour: initialValues?.city_tour ?? '',
    },
  })

  useEffect(() => {
    fetchTeams().then(setTeams)
  }, [])

  const isObserver = form.watch('role') === 'Observer'
  const isContestant = form.watch('role') === 'Team Contestant'
  const roomType = form.watch('room_type')
  const genderValue = form.watch('gender')
  const teamOptions = useMemo(() => teams.map((t) => ({ id: t.id!, name: t.team_name })), [teams])

  async function handleSubmit(values: MemberFormValues) {
    await onSubmit({ ...values, id: initialValues?.id })
  }

  const ynForm = (text : string, getter : string, setter : Dispatch<SetStateAction<string>>, fields : ("food_req" | "food_allergies" | "other_food_allergies")[], def : any[]) => {
    return <div>
      <Label>{text}</Label>
      <RadioGroup className="mt-2 gap-2" value={getter} onValueChange={(v) => {
          setter(v) 
          fields.forEach((field, i) => {
            const fieldT = field as "food_req" | "food_allergies" | "other_food_allergies"
            if (v === "") form.setValue(fieldT, def[i])
          })
      }}>
        <div key="yes" className="flex items-center gap-2">
          <RadioGroupItem id="yes" value="y" />
          <Label htmlFor="yes" className="cursor-pointer">
            Yes
          </Label>
        </div>
        <div key="no" className="flex items-center gap-2">
          <RadioGroupItem id="no" value="" />
          <Label htmlFor="no" className="cursor-pointer">
            No
          </Label>
        </div>
      </RadioGroup>
    </div>
  }
  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} id="member-form" className="space-y-8">
      {/* Personal Information */}
      <div className="space-y-3">
        <div className="text-base font-semibold" style= {{paddingTop: 15}}>Personal Information</div>
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
                    {(isJuryMember(claims) ? JURY_ROLES : COUNTRY_ROLES).map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.role && (
                  <FieldError errors={[form.formState.errors.role]} />
                )}
              </div>
            )}
          />
          {(!isJuryMember(claims) && !isObserver) && (
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
                {form.formState.errors.team && (
                  <FieldError errors={[form.formState.errors.team]} />
                )}
                </div>
              )}
            />
          )}
        </FieldGroup>

        <br />

        <FieldGroup>
          <Controller
            name="given_name"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>First name(s) (according to the travel document)</Label>
                <Input placeholder="Enter first name(s)" {...field} />
                {form.formState.errors.given_name && (
                  <FieldError errors={[form.formState.errors.given_name]} />
                )}
              </div>
            )}
          />
        </FieldGroup>
{/* 
        <FieldGroup>
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
        </FieldGroup> */}

        <FieldGroup>
          <Controller
            name="last_name"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>Last name (according to the travel document)</Label>
                <Input placeholder="Enter last name" {...field} />
                {form.formState.errors.last_name && (
                  <FieldError errors={[form.formState.errors.last_name]} />
                )}
              </div>
            )}
          />
          <Controller
            name="display_name"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>Badge name</Label>
                <Input placeholder="Enter badge name" {...field} />
                {form.formState.errors.display_name && (
                  <FieldError errors={[form.formState.errors.display_name]} />
                )}
              </div>
            )}
          />
        </FieldGroup>

        <FieldGroup>
          <Controller
            name="preferred_name"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>Name to be used in official documents (certificates, IOL website etc.)</Label>
                <Input placeholder="Enter official name" {...field} />
                {form.formState.errors.preferred_name && (
                  <FieldError errors={[form.formState.errors.preferred_name]} />
                )}
              </div>
            )}
          />
        </FieldGroup>

        <br />

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
                {form.formState.errors.gender && (
                  <FieldError errors={[form.formState.errors.gender]} />
                )}
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
                  {form.formState.errors.other_gender && (
                    <FieldError errors={[form.formState.errors.other_gender]} />
                  )}
                </div>
              )}
            />
          )}
        </FieldGroup>

        <br />

        <FieldGroup>
          <Controller
            name="date_of_birth"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>Date of birth</Label>
                <Input type="date" {...field} />
                {form.formState.errors.date_of_birth && (
                  <FieldError errors={[form.formState.errors.date_of_birth]} />
                )}
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
                {form.formState.errors.tshirt_size && (
                  <FieldError errors={[form.formState.errors.tshirt_size]} />
                )}
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
                  <Label>Individual contest language</Label>
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
                {form.formState.errors.indiv_language && (
                  <FieldError errors={[form.formState.errors.indiv_language]} />
                )}
                </div>
              )}
            />
        </FieldGroup>
      </div>)}

      {/* Accommodation */}
      <div className="space-y-3">
        <div className="text-base font-semibold">Accommodation</div>
        <div className='text-sm'>
            We are committed to ensuring that all participants, including trans and non-binary contestants, feel safe, comfortable, and welcome in their accommodation arrangements.
            Therefore, if any of the participants has specific justifiable accommodation requests or access requirements, please outline them below. This may include, but is not limited to: requests to share a room with a specific contestant from the same country/territory whom they know well, requests to avoid sharing a room with contestants from another country/territory whom they do not know, preferences regarding sharing a room with contestants of their gender assigned at birth, requests for a single room or any alternative accommodation arrangements that would support their wellbeing.
        </div>
        <FieldGroup>
          <Controller
            name="acco_req"
            control={form.control}
            render={({ field }) => (
              <div>
                <Input placeholder="Enter requirement" {...field} />
              </div>
            )}
          />
        </FieldGroup>
        <FieldGroup>
          <Controller
            name="room_type"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>Room type</Label>
                <RadioGroup className="mt-2 gap-2" value={field.value} onValueChange={field.onChange}>
                  {ROOM_TYPES.map((d) => {
                    const id = `room-${d}`
                    return (
                      <div key={id} className="flex items-center gap-2">
                        <RadioGroupItem id={id} value={d} />
                        <Label htmlFor={id} className="cursor-pointer">
                          {d}
                        </Label>
                        {form.formState.errors.room_type && (
                          <FieldError errors={[form.formState.errors.room_type]} />
                        )}
                      </div>
                    )
                  })}
                </RadioGroup>
              </div>
            )}
          />
        </FieldGroup>
        <FieldGroup>
        {!isContestant && !isJuryMember && (roomType !== "") && !(roomType === "Double (shared bed)") && (
          <Controller
            name="roommate_preference"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>Roommate preference</Label>
                <RadioGroup className="mt-2 gap-2" value={field.value} onValueChange={field.onChange}>
                  {RM_PREF.map((d) => {
                    const id = `roommate-${d}`
                    return (
                      <div key={id} className="flex items-center gap-2">
                        <RadioGroupItem id={id} value={d} />
                        <Label htmlFor={id} className="cursor-pointer">
                          {d}
                        </Label>
                      </div>
                    )
                  })}
                </RadioGroup>
              </div>
            )}
          />)}
          {/* {!isContestant && (roomType !== "") && (roomType === "Double (shared bed)") && (<Controller
            name="roommate_preference"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>Roommate name</Label>
                <Input placeholder="Enter name" {...field} />
              </div>
            )}
          />
        )} */}
        </FieldGroup>
      </div>

      {/* Travel */}
      <div className="space-y-3">
        <div className="text-base font-semibold">Travel</div>
        <div>ID Cards are only accepted for EU/EEA/Swiss citizens.</div>
        <FieldGroup>
          <Controller
            name="document_type"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>Document type</Label>
                <RadioGroup className="mt-2 gap-2" value={field.value} onValueChange={field.onChange}>
                  {DOCUMENTS.map((d) => {
                    const id = `document-${d}`
                    return (
                      <div key={id} className="flex items-center gap-2">
                        <RadioGroupItem id={id} value={d} />
                        <Label htmlFor={id} className="cursor-pointer">
                          {d}
                        </Label>
                      </div>
                    )
                  })}
                </RadioGroup>
                {form.formState.errors.document_type && (
                  <FieldError errors={[form.formState.errors.document_type]} />
                )}
              </div>
            )}
          />
          <Controller
            name="passport_number"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>Passport/ID Card number</Label>
                <Input placeholder="Enter passport/ID card number" {...field} />
                {form.formState.errors.passport_number && (
                  <FieldError errors={[form.formState.errors.passport_number]} />
                )}
              </div>
            )}
          />
          <Controller
            name="issue_date"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>Issue date</Label>
                <Input type="date" {...field} />
                {form.formState.errors.issue_date && (
                  <FieldError errors={[form.formState.errors.issue_date]} />
                )}
              </div>
            )}
          />
          <Controller
            name="expiry_date"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>Expiry date</Label>
                <Input type="date" {...field} />
                {form.formState.errors.expiry_date && (
                  <FieldError errors={[form.formState.errors.expiry_date]} />
                )}
              </div>
            )}
          />
          <Controller
            name="issuing_country"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>Issuing country</Label>
                <Input placeholder="Enter issuing country" {...field} />
                {form.formState.errors.issuing_country && (
                  <FieldError errors={[form.formState.errors.issuing_country]} />
                )}
              </div>
            )}
          />
          <Controller
            name="nationality"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>Nationality</Label>
                <Input placeholder="Enter nationality" {...field} />
                {form.formState.errors.nationality && (
                  <FieldError errors={[form.formState.errors.nationality]} />
                )}
              </div>
            )}
          />
        </FieldGroup>
      </div>

      {/* Dietary Requirement */}
      <div className="space-y-3">
        <div className="text-base font-semibold">Food preferences and allergies</div>
        <FieldGroup>
          {ynForm("Does this participant have food preferences?", hasPreferences, setHasPreferences, ["food_req"], [[]])}
          {hasPreferences && <Controller
            name="food_req"
            control={form.control}
            render={({ field }) => (
              <div className="col-span-2">
                <Label>Food preferences</Label>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {FOOD_PREFERENCES.map((opt) => {
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
          />}
          {ynForm("Does this participant have food allergies?", hasAllergies, setHasAllergies, ["food_allergies", "other_food_allergies"], [[],""])}
          {hasAllergies && <Controller
            name="food_allergies"
            control={form.control}
            render={({ field }) => (
              <div className="col-span-2">
                <Label>Food allergies</Label>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {FOOD_ALLERGIES.map((opt) => {
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
          />}
          {hasAllergies && <Controller
            name="other_food_allergies"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>Other allergies</Label>
                <Input placeholder="Enter allergies" {...field} />
              </div>
            )}
          />}
        </FieldGroup>
      </div>
      
      {/*Sightseeing Options*/}
      {/* {isObserver && (<div className="space-y-3">
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
      </div>)} */}
      
      <Button type="submit" form="member-form">
        Save
      </Button>
    </form>
  )
}
