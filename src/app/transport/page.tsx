'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Controller, useForm } from 'react-hook-form'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { flightLegSchema, FlightLegForm } from '@/schemas/transport'
import { useEffect } from 'react'
import { fetchTransport, upsertTransport } from '@/services/firebaseApi'
import { toast } from 'sonner'
import { FieldGroup } from '@/components/ui/field'

type FormType = { arrival: FlightLegForm; departure: FlightLegForm }

const formSchema = z.object({
  arrival: flightLegSchema,
  departure: flightLegSchema,
})

const defaultLeg = (direction: 'arrival' | 'departure'): FlightLegForm => ({
  direction,
  terminal: '',
  location: '',
  airline: '',
  flightNo: '',
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
      const a = (legs.find((l) => l.direction === 'arrival') ?? defaultLeg('arrival')) as FlightLegForm
      const d = (legs.find((l) => l.direction === 'departure') ?? defaultLeg('departure')) as FlightLegForm
      // Ensure direction keys are set
      form.reset({ arrival: { ...a, direction: 'arrival' }, departure: { ...d, direction: 'departure' } })
    })
  }, [])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Persist both legs
      await upsertTransport([
        { ...values.arrival, direction: 'arrival' },
        { ...values.departure, direction: 'departure' },
      ])
      toast.success('Transportation details saved')
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to save transportation details')
    }
  }

  return (
    <div className='space-y-4 px-4'>
      <Card>
        <CardHeader>Transportation</CardHeader>
        <CardContent>
          <form id='transport-form' onSubmit={form.handleSubmit(onSubmit)}>
            <div className='space-y-6'>
              <div>
                <div className='font-medium mb-2'>Arrival</div>
                <FieldGroup>
                  <Controller
                    name='arrival.terminal'
                    control={form.control}
                    render={({ field }) => (
                      <div>
                        <Label>Terminal/Airport</Label>
                        <Input {...field} />
                      </div>
                    )}
                  />
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
                    name='arrival.flightNo'
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
                  <Controller
                    name='departure.terminal'
                    control={form.control}
                    render={({ field }) => (
                      <div>
                        <Label>Terminal/Airport</Label>
                        <Input {...field} />
                      </div>
                    )}
                  />
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
                    name='departure.flightNo'
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
