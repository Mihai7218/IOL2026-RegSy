'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Controller, useForm } from 'react-hook-form'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { flightLegSchema, FlightLegForm, TERMINAL_OPTIONS, flightLegFormSchema, FlightLegUiForm } from '@/schemas/transport'
import { useEffect } from 'react'
import { fetchTransport, upsertTransport } from '@/services/firebaseApi'
import { toast } from 'sonner'
import { FieldGroup } from '@/components/ui/field'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

type FormType = { arrival: FlightLegUiForm; departure: FlightLegUiForm }

const formSchema = z.object({
  arrival: flightLegFormSchema,
  departure: flightLegFormSchema,
})

const defaultLeg = (direction: 'arrival' | 'departure'): FlightLegUiForm => ({
  direction,
  terminal_option: TERMINAL_OPTIONS[0],
  terminal_other: '',
  location: '',
  airline: '',
  flight_no: '',
  datetime: new Date().toISOString(),
})

function toLocalDatetimeInputValue(iso?: string) {
  if (!iso) return ''
  // Convert ISO to "YYYY-MM-DDTHH:mm" for datetime-local input
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  const yyyy = d.getFullYear()
  const mm = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const hh = pad(d.getHours())
  const min = pad(d.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

function fromLocalToISO(value: string) {
  // value like "YYYY-MM-DDTHH:mm" (local time)
  const d = new Date(value)
  return isNaN(d.getTime()) ? '' : d.toISOString()
}

export default function TransportPage() {
  const form = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: { arrival: defaultLeg('arrival'), departure: defaultLeg('departure') },
  })

  useEffect(() => {
    fetchTransport().then((legs) => {
      const aRaw = legs.find((l) => l.direction === 'arrival')
      const dRaw = legs.find((l) => l.direction === 'departure')

      const toUi = (raw: FlightLegForm | undefined, dir: 'arrival'|'departure'): FlightLegUiForm => {
        if (!raw) return defaultLeg(dir)
        const inOptions = (TERMINAL_OPTIONS as readonly string[]).includes(raw.terminal as any)
        return {
          direction: dir,
          terminal_option: (inOptions ? (raw.terminal as any) : 'Other') as FlightLegUiForm['terminal_option'],
          terminal_other: inOptions ? '' : raw.terminal,
          location: raw.location,
          airline: raw.airline,
          flight_no: raw.flight_no,
          datetime: raw.datetime,
        }
      }

      form.reset({ arrival: toUi(aRaw, 'arrival'), departure: toUi(dRaw, 'departure') })
    })
    // `form` is stable from `useForm`, safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Map UI form to backend FlightLegs
      const toLeg = (ui: FlightLegUiForm): FlightLegForm => ({
        direction: ui.direction,
        terminal: ui.terminal_option === 'Other' ? (ui.terminal_other ?? '') : ui.terminal_option,
        location: ui.location,
        airline: ui.airline,
        flight_no: ui.flight_no,
        datetime: ui.datetime,
      })
      console.log('Submitting transport:', values)
      await upsertTransport([
        toLeg({ ...values.arrival, direction: 'arrival' }),
        toLeg({ ...values.departure, direction: 'departure' }),
      ])
      toast.success('Transportation details saved')
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to save transportation details')
    }
  }

  return (
    <div className='space-y-4 px-10'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-semibold'>Transportation</h1>
      </div>
      <Card>
        <CardContent>
          <form id='transport-form' onSubmit={form.handleSubmit(onSubmit)}>
            <div className='pt-4 space-y-6 pr-10'>
              <div>
                <div className='font-medium mb-2'>Arrival</div>
                <FieldGroup>
                  <div>
                    <Label>Terminal</Label>
                    <Controller
                      name='arrival.terminal_option'
                      control={form.control}
                      render={({ field }) => (
                        <RadioGroup
                          className='mt-2 grid grid-cols-2 gap-2'
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          {TERMINAL_OPTIONS.map((opt) => {
                            const id = `arr-terminal-${opt}`
                            return (
                              <div key={id} className='flex items-center gap-2'>
                                <RadioGroupItem id={id} value={opt} />
                                <Label htmlFor={id} className='cursor-pointer'>{opt}</Label>
                              </div>
                            )
                          })}
                        </RadioGroup>
                      )}
                    />
                    {form.watch('arrival.terminal_option') === 'Other' && (
                      <div className='mt-2'>
                        <Label>Specify terminal</Label>
                        <Input {...form.register('arrival.terminal_other')} placeholder='Enter terminal' />
                      </div>
                    )}
                  </div>
                  <Controller
                    name='arrival.location'
                    control={form.control}
                    render={({ field }) => (
                      <div>
                        <Label>Location</Label>
                        <Input {...field} />
                      </div>
                    )}
                  />
                  <Controller
                    name='arrival.airline'
                    control={form.control}
                    render={({ field }) => (
                      <div>
                        <Label>Airline</Label>
                        <Input {...field} />
                      </div>
                    )}
                  />
                  <Controller
                    name='arrival.flight_no'
                    control={form.control}
                    render={({ field }) => (
                      <div>
                        <Label>Flight No.</Label>
                        <Input {...field} />
                      </div>
                    )}
                  />
                  <Controller
                    name='arrival.datetime'
                    control={form.control}
                    render={({ field }) => (
                      <div className='col-span-2'>
                        <Label>Date & Time</Label>
                        <Input
                          type='datetime-local'
                          value={toLocalDatetimeInputValue(field.value)}
                          onChange={(e) => field.onChange(fromLocalToISO(e.target.value))}
                        />
                      </div>
                    )}
                  />
                </FieldGroup>
              </div>

              <div>
                <div className='font-medium mb-2'>Departure</div>
                <FieldGroup>
                  <div>
                    <Label>Terminal</Label>
                    <Controller
                      name='departure.terminal_option'
                      control={form.control}
                      render={({ field }) => (
                        <RadioGroup
                          className='mt-2 grid grid-cols-2 gap-2'
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          {TERMINAL_OPTIONS.map((opt) => {
                            const id = `dep-terminal-${opt}`
                            return (
                              <div key={id} className='flex items-center gap-2'>
                                <RadioGroupItem id={id} value={opt} />
                                <Label htmlFor={id} className='cursor-pointer'>{opt}</Label>
                              </div>
                            )
                          })}
                        </RadioGroup>
                      )}
                    />
                    {form.watch('departure.terminal_option') === 'Other' && (
                      <div className='mt-2'>
                        <Label>Specify terminal</Label>
                        <Input {...form.register('departure.terminal_other')} placeholder='Enter terminal' />
                      </div>
                    )}
                  </div>
                  <Controller
                    name='departure.location'
                    control={form.control}
                    render={({ field }) => (
                      <div>
                        <Label>Location</Label>
                        <Input {...field} />
                      </div>
                    )}
                  />
                  <Controller
                    name='departure.airline'
                    control={form.control}
                    render={({ field }) => (
                      <div>
                        <Label>Airline</Label>
                        <Input {...field} />
                      </div>
                    )}
                  />
                  <Controller
                    name='departure.flight_no'
                    control={form.control}
                    render={({ field }) => (
                      <div>
                        <Label>Flight No.</Label>
                        <Input {...field} />
                      </div>
                    )}
                  />
                  <Controller
                    name='departure.datetime'
                    control={form.control}
                    render={({ field }) => (
                      <div className='col-span-2'>
                        <Label>Date & Time</Label>
                        <Input
                          type='datetime-local'
                          value={toLocalDatetimeInputValue(field.value)}
                          onChange={(e) => field.onChange(fromLocalToISO(e.target.value))}
                        />
                      </div>
                    )}
                  />
                </FieldGroup>
              </div>
            </div>

            <Button type='submit' form='transport-form' className='mt-4'>
              Save
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
