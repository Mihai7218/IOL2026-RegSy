"use client"

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TransportForm, type TransportFormValues } from '@/components/transportForm'
import { fetchTransport, upsertTransport, deleteTransport, fetchMembers, type FlightLeg, type Member } from '@/services/firebaseApi'
import { Separator } from '@/components/ui/separator'
import { Item, ItemContent, ItemHeader, ItemMedia, ItemTitle } from '@/components/ui/item'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TERMINAL_OPTIONS } from '@/schemas/transport'
import { formatDatetimeEEST } from '@/lib/utils'

type MemberMap = Record<string, Member[]>

const getCapital = (name: string) => {
  return name
    .split(" ")
    .map((n) => (n && n[0] ? n[0].toUpperCase() : ""))
    .join("")
    .slice(0, 2);
}

export default function TransportPage() {
  const [transports, setTransports] = useState<FlightLeg[]>([])
  const [membersByTransport, setMembersByTransport] = useState<MemberMap>({})
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<FlightLeg | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FlightLeg | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [t, m] = await Promise.all([fetchTransport(), fetchMembers()])
      setTransports(t)
      const map: MemberMap = {}
      for (const mem of m) {
        if (mem.arrival){
          map[mem.arrival] = map[mem.arrival] || []
          map[mem.arrival].push(mem)
        }
        if (mem.departure) {
          map[mem.departure] = map[mem.departure] || []
          map[mem.departure].push(mem)
        }
      }
      setMembersByTransport(map)
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to load transports')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate(values: TransportFormValues) {
    const terminal = values.terminal_option === TERMINAL_OPTIONS[3] ? values.terminal_other ?? "" : values.terminal_option
    try {
      await upsertTransport({
        id: values.id,
        direction: values.direction,
        terminal: terminal,
        location: values.location,
        flight_no: values.flight_no,
        airline: values.airline,
        datetime: values.datetime,
      })
      toast.success('Transport saved')
      setCreateOpen(false)
      await load()
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to save transport')
    }
  }

  async function handleEdit(values: TransportFormValues) {
    const terminal = values.terminal_option === TERMINAL_OPTIONS[3] ? values.terminal_other ?? "" : values.terminal_option
    try {
      await upsertTransport({
        id: values.id,
        direction: values.direction,
        terminal: terminal,
        location: values.location,
        flight_no: values.flight_no,
        airline: values.airline,
        datetime: values.datetime,
      })
      toast.success('Transport updated')
      setEditTarget(null)
      await load()
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to update transport')
    }
  }

  async function confirmDelete() {
    if (!deleteTarget?.id) return
    try {
      await deleteTransport(deleteTarget.id)
      toast.success('Transport deleted')
      setDeleteTarget(null)
      await load()
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to delete transport')
    }
  }

  return (
    <div className='space-y-4 px-10'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-semibold'>Transport</h1>
        <Button onClick={() => setCreateOpen(true)}>Create transport</Button>
      </div>

      <h1 className='text-xl font-semibold'>Arrivals</h1>

      <div className='grid grid-cols-1 gap-4'>
        {transports.filter((t)=> t.direction==="arrival").map((t) => {
          const tMembers = membersByTransport[t.id ?? ''] || []

          return (
            <Card key={t.id ?? `${t.terminal} ${t.location} ${t.datetime}`}>
              <CardHeader>
                <div className='flex items-start justify-between gap-4'>
                  <div className='flex items-center gap-2'>
                    <Button variant='outline' size='sm' onClick={() => setEditTarget(t)}>Edit</Button>
                    <Button variant='destructive' size='sm' onClick={() => setDeleteTarget(t)}>Delete</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='text-sm'>Origin: <span className='font-medium'>{t.location || '—'}</span></div>
                <div className='text-sm'>Arrival location in Bucharest: <span className='font-medium'>{t.terminal || '—'}</span></div>
                <div className='text-sm'>Date/Time: <span className='font-medium'>{formatDatetimeEEST(t.datetime || '—')}</span></div>
                <div className='text-sm'>Transport no.: <span className='font-medium'>{t.flight_no || '—'}</span></div>
                <div className='text-sm'>Transport operator: <span className='font-medium'>{t.airline || '—'}</span></div>

                <div className='pt-2'>
                  <div className='text-sm font-medium mb-2'>Members</div>
                  <Separator className='mb-2' />
                  {tMembers.length ? (
                    <div className='flex flex-col gap-2'>
                      {tMembers.map((m) => (
                        <Item key={m.id ?? m.display_name} variant='muted'>
                          <ItemMedia variant='icon'>
                            <Avatar>
                              <AvatarImage src="/avatars/02.png" />
                              <AvatarFallback>{getCapital(m.display_name)}</AvatarFallback>
                            </Avatar>
                          </ItemMedia>
                          <ItemContent>
                            <ItemHeader>
                              <ItemTitle>{m.display_name}</ItemTitle>
                            </ItemHeader>
                          </ItemContent>
                        </Item>
                      ))}
                    </div>
                  ) : (
                    <div className='text-sm text-muted-foreground'>No members yet</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <h1 className='text-xl font-semibold'>Departures</h1>

      <div className='grid grid-cols-1 gap-4'>
        {transports.filter((t)=> t.direction==="departure").map((t) => {
          const tMembers = membersByTransport[t.id ?? ''] || []
          return (
            <Card key={t.id ?? `${t.terminal} ${t.location} ${t.datetime}`}>
              <CardHeader>
                <div className='flex items-start justify-between gap-4'>
                  <div className='flex items-center gap-2'>
                    <Button variant='outline' size='sm' onClick={() => setEditTarget(t)}>Edit</Button>
                    <Button variant='destructive' size='sm' onClick={() => setDeleteTarget(t)}>Delete</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='text-sm'>Destination: <span className='font-medium'>{t.location || '—'}</span></div>
                <div className='text-sm'>Departure location from Bucharest: <span className='font-medium'>{t.terminal || '—'}</span></div>
                <div className='text-sm'>Date/Time: <span className='font-medium'>{formatDatetimeEEST(t.datetime || '—')}</span></div>
                <div className='text-sm'>Transport no.: <span className='font-medium'>{t.flight_no || '—'}</span></div>
                <div className='text-sm'>Transport operator: <span className='font-medium'>{t.airline || '—'}</span></div>

                <div className='pt-2'>
                  <div className='text-sm font-medium mb-2'>Members</div>
                  <Separator className='mb-2' />
                  {tMembers.length ? (
                    <div className='flex flex-col gap-2'>
                      {tMembers.map((m) => (
                        <Item key={m.id ?? m.display_name} variant='muted'>
                          <ItemMedia variant='icon'>
                            <Avatar>
                              <AvatarImage src="/avatars/02.png" />
                              <AvatarFallback>{getCapital(m.display_name)}</AvatarFallback>
                            </Avatar>
                          </ItemMedia>
                          <ItemContent>
                            <ItemHeader>
                              <ItemTitle>{m.display_name}</ItemTitle>
                            </ItemHeader>
                          </ItemContent>
                        </Item>
                      ))}
                    </div>
                  ) : (
                    <div className='text-sm text-muted-foreground'>No contestants yet</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create transport</DialogTitle>
            <DialogDescription>Fill in the transport details.</DialogDescription>
          </DialogHeader>
          <TransportForm onSubmit={handleCreate} />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit transport</DialogTitle>
            <DialogDescription>Modify the transport information.</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <TransportForm
              initialValues={{
                id: editTarget.id,
                direction: editTarget.direction,
                terminal_option: editTarget.terminal === "✈️ Henri Coandă/Otopeni Airport (OTP)" ? "✈️ Henri Coandă/Otopeni Airport (OTP)" : editTarget.terminal === "✈️ Aurel Vlaicu/Băneasa Airport (BBU)" ? "✈️ Aurel Vlaicu/Băneasa Airport (BBU)" : editTarget.terminal === "🚂 Gara de Nord/București Nord/North Railway Station" ? "🚂 Gara de Nord/București Nord/North Railway Station" : "❓ Other",
                terminal_other: TERMINAL_OPTIONS.slice(0,3).find((x) => x === editTarget.terminal) ? "" : editTarget.terminal,
                location: editTarget.location,
                flight_no: editTarget.flight_no,
                airline: editTarget.airline,
                datetime: editTarget.datetime,
              }}
              onSubmit={handleEdit}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete transport</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transport? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className='flex w-full justify-end gap-2'>
              <Button variant='outline' onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant='destructive' onClick={confirmDelete}>Delete</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
