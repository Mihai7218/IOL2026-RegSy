"use client"

import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { teamSchema, type TeamForm as TeamSchemaForm } from "@/schemas/team"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FieldGroup } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { languages } from "@/lib/languages"

export type TeamFormValues = TeamSchemaForm & { id?: string }

export function TeamForm({
  initialValues,
  onSubmit,
}: {
  initialValues?: Partial<TeamFormValues>
  onSubmit: (values: TeamFormValues) => Promise<void> | void
}) {
  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema as unknown as z.ZodType<TeamSchemaForm>),
    defaultValues: {
      team_name: initialValues?.team_name ?? "",
      team_language: initialValues?.team_language ?? "",
      city_tour: initialValues?.city_tour ?? "",
      excursion_route: initialValues?.excursion_route ?? "",
      id: initialValues?.id,
    },
  })

  async function handleSubmit(values: TeamFormValues) {
    // Preserve id even though it's not part of the zod schema (zod strips unknown by default)
    await onSubmit({ ...values, id: initialValues?.id })
  }

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
                  {['A','B','C'].map((opt) => (
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
                  {['A','B','C'].map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        />
      </FieldGroup>

      <Button type="submit" form="team-form">Save</Button>
    </form>
  )
}
