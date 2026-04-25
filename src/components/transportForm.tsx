"use client"

import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { flightLegFormSchema, TERMINAL_OPTIONS, type FlightLegForm } from "@/schemas/transport"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FieldError, FieldGroup } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetchMembers, Member } from "@/services/firebaseApi"
import { useEffect, useMemo, useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"

export type TransportFormValues = FlightLegForm & { id?: string, members: string[]}

export const DIRECTION = ['arrival', 'departure']



export function TransportForm({
  initialValues,
  onSubmit,
}: {
  initialValues?: Partial<TransportFormValues>
  onSubmit: (values: TransportFormValues) => Promise<void> | void
}) {
  const [members, setMembers] = useState<Member[]>([])

  const form = useForm<TransportFormValues>({
    resolver: zodResolver(flightLegFormSchema as unknown as z.ZodType<FlightLegForm>),
    defaultValues: {
      direction: initialValues?.direction ?? undefined,
      terminal_option: initialValues?.terminal_option ?? TERMINAL_OPTIONS[0],
      terminal_other: initialValues?.terminal_other ?? "",
      location: initialValues?.location ?? "",
      airline: initialValues?.airline ?? "",
      flight_no: initialValues?.flight_no ?? "",
      datetime: initialValues?.datetime ?? "",
      id: initialValues?.id,
      members: initialValues?.members ?? [],
    },
  })
  
  useEffect(() => {
      fetchMembers().then(setMembers)
    }, [])

  const membersSelected = form.watch('members')


  async function handleSubmit(values: TransportFormValues) {
    // Preserve id even though it's not part of the zod schema (zod strips unknown by default)
    await onSubmit({ ...values, id: initialValues?.id, members: membersSelected })
  }

  const terminalValue = form.watch('terminal_option')
  const memberOptions = useMemo(() => members.map((m) => ({ id: m.id!, name: m.display_name })), [members])

  function toLocalDatetimeInputValue(iso?: string) {
    if (!iso) return ''
    // Convert ISO to "YYYY-MM-DDTHH:mm" for datetime-local input in EEST (UTC+3)
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    
    // Add 3 hours to convert from UTC to EEST
    const eestDate = new Date(d.getTime() + 3 * 60 * 60 * 1000)
    
    const yyyy = eestDate.getUTCFullYear()
    const mm = pad(eestDate.getUTCMonth() + 1)
    const dd = pad(eestDate.getUTCDate())
    const hh = pad(eestDate.getUTCHours())
    const min = pad(eestDate.getUTCMinutes())
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`
  }

  function fromLocalToISO(value: string) {
    // value like "YYYY-MM-DDTHH:mm" (local time)
    if (!value) return ''
    
    const [datePart, timePart] = value.split('T')
    const [yyyy, mm, dd] = datePart.split('-')
    const [hh, min] = timePart.split(':')
    
    const utcDate = new Date(
      Date.UTC(
        parseInt(yyyy),
        parseInt(mm) - 1,
        parseInt(dd),
        parseInt(hh) - 3,
        parseInt(min),
        0
      )
    )
    
    return isNaN(utcDate.getTime()) ? '' : utcDate.toISOString()
  }



  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} id="transport-form" className="space-y-4">
      <FieldGroup>
        <Controller
          name="direction"
          control={form.control}
          render={({ field }) => (
            <div>
              <Label>Direction</Label>
              <RadioGroup className="mt-2 gap-2" value={field.value} onValueChange={field.onChange}>
                {DIRECTION.map((d) => {
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
              {form.formState.errors.direction && (
                <FieldError errors={[form.formState.errors.direction]} />
              )}
            </div>
          )}
        />
        <Controller
          name="terminal_option"
          control={form.control}
          render={({ field }) => (
            <div>
              <Label>Place of arrival to/departure from Bucharest</Label>
              <RadioGroup className="mt-2 gap-2" value={field.value} onValueChange={field.onChange}>
                {TERMINAL_OPTIONS.map((d) => {
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
              {form.formState.errors.terminal_option && (
                <FieldError errors={[form.formState.errors.terminal_option]} />
              )}
            </div>
          )}
        />
        {terminalValue === TERMINAL_OPTIONS[3] && (
          <Controller
            name="terminal_other"
            control={form.control}
            render={({ field }) => (
              <div>
                <Label>Specify other place</Label>
                <Input placeholder="Enter place" {...field} />
                {form.formState.errors.terminal_other && (
                  <FieldError errors={[form.formState.errors.terminal_other]} />
                )}
              </div>
            )}
          />
        )}
        <Controller
          name="location"
          control={form.control}
          render={({ field }) => (
            <div>
              <Label>Origin/Destination</Label>
              <Input placeholder="Enter location" {...field} />
              {form.formState.errors.location && (
                <FieldError errors={[form.formState.errors.location]} />
              )}
            </div>
          )}
        />
        <Controller
          name="airline"
          control={form.control}
          render={({ field }) => (
            <div>
              <Label>Transport operator (airline, rail operator etc.)</Label>
              <Input placeholder="Enter operator" {...field} />
              {form.formState.errors.airline && (
                <FieldError errors={[form.formState.errors.airline]} />
              )}
            </div>
          )}
        />
        <Controller
          name="flight_no"
          control={form.control}
          render={({ field }) => (
            <div>
              <Label>Transport number (i.e. flight/train/bus no.)</Label>
              <Input placeholder="Enter number" {...field} />
              {form.formState.errors.flight_no && (
                <FieldError errors={[form.formState.errors.flight_no]} />
              )}
            </div>
          )}
        />
        <Controller
          name="datetime"
          control={form.control}
          render={({ field }) => (
            <div>
              <Label>Date/Time</Label>
              <Input
                type='datetime-local'
                value={toLocalDatetimeInputValue(field.value)}
                onChange={(e) => field.onChange(fromLocalToISO(e.target.value))}
              />
              {form.formState.errors.datetime && (
                <FieldError errors={[form.formState.errors.datetime]} />
              )}
            </div>
          )}
        />
      </FieldGroup>

      <Controller
        name="members"
        control={form.control}
        render={({ field }) => (
          <div className="col-span-2">
            <Label>Members</Label>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {memberOptions.map((opt) => {
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

      <Button type="submit" form="transport-form">Save</Button>
    </form>
  )
}
