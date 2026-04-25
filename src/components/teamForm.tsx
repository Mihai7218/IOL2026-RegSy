"use client"

import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { teamSchema, type TeamForm as TeamSchemaForm } from "@/schemas/team"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FieldError, FieldGroup } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { languages } from "@/lib/languages"
import { cityTourOptions } from "@/lib/cityTour"
import { excursionOptions } from "@/lib/excursion"
import { Checkbox } from "@/components/ui/checkbox"
import { setEquality } from "@/lib/utils"
import { fetchMembers, Member } from "@/services/firebaseApi"
import { useEffect, useMemo, useState } from "react"
import { RadioGroup, RadioGroupItem } from "./ui/radio-group"

export type TeamFormValues = TeamSchemaForm & { id?: string, tl: string, participants: string[] }

export function TeamForm({
  initialValues,
  onSubmit,
}: {
  initialValues?: Partial<TeamFormValues>
  onSubmit: (values: TeamFormValues) => Promise<void> | void
}) {
  const [tls, setTLs] = useState<Member[]>([])
  const [participants, setParticipants] = useState<Member[]>([])
  

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema as unknown as z.ZodType<TeamSchemaForm>),
    defaultValues: {
      team_name: initialValues?.team_name ?? "",
      team_language: initialValues?.team_language ?? "",
      city_tour: initialValues?.city_tour ?? "",
      excursion_route: initialValues?.excursion_route ?? "",
      id: initialValues?.id,
      tl: initialValues?.tl ?? "",
      participants: initialValues?.participants ?? [],
    },
  })

  const tlWatch = form.watch("tl")
  const participantWatch = form.watch("participants")

  useEffect(() => {
    fetchMembers().then((xs) => {
      setParticipants(xs.filter((x) => x.role === "Team Contestant"))
      setTLs(xs.filter((x) => x.role === "Team Leader"))
    })
  }, [])

  async function handleSubmit(values: TeamFormValues) {
    // Preserve id even though it's not part of the zod schema (zod strips unknown by default)
    await onSubmit({ ...values, id: initialValues?.id, tl: tlWatch, participants: participantWatch })
  }

  const participantOptions = useMemo(() => participants.map((m) => ({ id: m.id!, name: m.display_name })), [participants])
  const tlOptions = useMemo(() => tls.map((m) => ({ id: m.id!, name: m.display_name })), [tls])
  

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} id="team-form" className="space-y-4">
      <FieldGroup>
        <Controller
          name="team_name"
          control={form.control}
          render={({ field }) => (
            <div>
              <Label>Team name</Label>
              <Input placeholder="Enter team name" {...field} />
            </div>
          )}
        />
        <Controller
          name="team_language"
          control={form.control}
          render={({ field }) => (
            <div>
              <Label>Team contest language</Label>
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
          name="tl"
          control={form.control}
          render={({ field }) => (
            <div>
              <Label>Team Leader</Label>
              <RadioGroup className="mt-2 gap-2" value={field.value} onValueChange={field.onChange}>
                {tlOptions.map((d) => {
                  const id = `document-${d}`
                  return (
                    <div key={d.id} className="flex items-center gap-2">
                      <RadioGroupItem id={d.id} value={d.id} />
                      <Label htmlFor={d.id} className="cursor-pointer">
                        {d.name}
                      </Label>
                    </div>
                  )
                })}
              </RadioGroup>
              {form.formState.errors.tl && (
                <FieldError errors={[form.formState.errors.tl]} />
              )}
            </div>
          )}
        />
        <Controller
          name="participants"
          control={form.control}
          render={({ field }) => (
            <div className="col-span-2">
              <Label>Contestants</Label>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label key="all" className="flex items-center gap-2">
                  <Checkbox
                    checked={setEquality(new Set(participants.map((x) => x.id)), new Set(field.value))}
                    onCheckedChange={(v) => {
                      if (v) field.onChange(participants.map((x) => x.id))
                      else field.onChange([])
                    }}
                  />
                  <span>Select all</span>
                </label>
                {participantOptions.map((opt) => {
                  const checked = (field.value ?? []).includes(opt.id)
                  return (
                    <label key={opt.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          const current = new Set(field.value ?? [])
                          if (v) current.add(opt.id)
                          else current.delete(opt.id)
                          field.onChange(Array.from(current))
                        }}
                      />
                      <span>{opt.name}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}
        />
        {/* <Controller
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
        /> */}
      </FieldGroup>

      <Button type="submit" form="team-form">Save</Button>
    </form>
  )
}
