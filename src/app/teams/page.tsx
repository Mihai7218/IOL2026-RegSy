
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
import { TeamForm, type TeamFormValues } from '@/components/teamForm'
import { deleteTeam, fetchMembers, fetchTeams, type Team, type Member, upsertTeam } from '@/services/firebaseApi'
import { Separator } from '@/components/ui/separator'
import { Item, ItemContent, ItemHeader, ItemMedia, ItemTitle } from '@/components/ui/item'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

type MemberMap = Record<string, Member[]>

const getCapital = (name: string) => {
  return name
    .split(" ")
    .map((n) => (n && n[0] ? n[0].toUpperCase() : ""))
    .join("")
    .slice(0, 2);
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [membersByTeam, setMembersByTeam] = useState<MemberMap>({})
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Team | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Team | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [t, m] = await Promise.all([fetchTeams(), fetchMembers()])
      setTeams(t)
      const map: MemberMap = {}
      for (const mem of m) {
        if (!mem.team) continue
        map[mem.team] = map[mem.team] || []
        map[mem.team].push(mem)
      }
      setMembersByTeam(map)
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to load teams')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate(values: TeamFormValues) {
    try {
      await upsertTeam({
        id: values.id,
        team_name: values.team_name,
        team_language: values.team_language,
        city_tour: values.city_tour,
        excursion_route: values.excursion_route,
      })
      toast.success('Team saved')
      setCreateOpen(false)
      await load()
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to save team')
    }
  }

  async function handleEdit(values: TeamFormValues) {
    try {
      await upsertTeam({
        id: values.id,
        team_name: values.team_name,
        team_language: values.team_language,
        city_tour: values.city_tour,
        excursion_route: values.excursion_route,
      })
      toast.success('Team updated')
      setEditTarget(null)
      await load()
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to update team')
    }
  }

  async function confirmDelete() {
    if (!deleteTarget?.id) return
    try {
      await deleteTeam(deleteTarget.id)
      toast.success('Team deleted')
      setDeleteTarget(null)
      await load()
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to delete team')
    }
  }

  return (
    <div className='space-y-4 px-10'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-semibold'>Teams</h1>
        <Button onClick={() => setCreateOpen(true)}>Create team</Button>
      </div>

      {teams.length === 0 && !loading && (
        <div className='space-y-4'>
          <Card>
            <CardHeader>No teams yet</CardHeader>
            <CardContent>Click &ldquo;Create team&rdquo; to add your first team.</CardContent>
          </Card>

          {/* Sample preview card */}
          <Card>
            <CardHeader>
              <div className='flex items-start justify-between gap-4'>
                <div>
                  <div className='text-lg font-semibold'>Sample Team</div>
                </div>
                <div className='flex items-center gap-2'>
                  <Button variant='outline' size='sm' disabled>Edit</Button>
                  <Button variant='destructive' size='sm' disabled>Delete</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='text-sm'>Contest language: <span className='font-medium'>English (US)</span></div>
              <div className='text-sm'>City tour route: <span className='font-medium'>A</span></div>
              <div className='text-sm'>Excursion route: <span className='font-medium'>B</span></div>

              <div className='pt-2'>
                <div className='text-sm font-medium mb-2'>Leader</div>
                <Separator className='mb-2' />
                <Item variant='muted'>
                  <ItemMedia variant='icon'>
                        <Avatar>
                          <AvatarImage src="/avatars/01.png" />
                          <AvatarFallback>{getCapital('Alice Leader')}</AvatarFallback>
                        </Avatar>
                  </ItemMedia>
                  <ItemContent>
                    <ItemHeader>
                      <ItemTitle>{'Alice Leader'}</ItemTitle>
                    </ItemHeader>
                  </ItemContent>
                </Item>
              </div>

              <div className='pt-2'>
                <div className='text-sm font-medium mb-2'>Contestants</div>
                <Separator className='mb-2' />
                <div className='flex flex-col gap-2'>
                  {['Bob Contestant', 'Carol Contestant'].map((n) => (
                    <Item key={n} variant='muted'>
                      <ItemMedia variant='icon'>
                        <Avatar>
                          <AvatarImage src="/avatars/02.png" />
                          <AvatarFallback>{getCapital(n)}</AvatarFallback>
                        </Avatar>
                      </ItemMedia>
                      <ItemContent>
                        <ItemHeader>
                          <ItemTitle>{n}</ItemTitle>
                        </ItemHeader>
                      </ItemContent>
                    </Item>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className='grid grid-cols-1 gap-4'>
        {teams.map((team) => {
          const tMembers = membersByTeam[team.id ?? ''] || []

          // Classify members by explicit role from the database
          const leader = tMembers.find((m) => m.role === 'Team Leader')
          const contestants = tMembers.filter((m) => m.role === 'Team Contestant')
          const observers = tMembers.filter((m) => m.role === 'Observer')
          return (
            <Card key={team.id ?? team.team_name}>
              <CardHeader>
                <div className='flex items-start justify-between gap-4'>
                  <div>
                    <div className='text-lg font-semibold'>{team.team_name}</div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Button variant='outline' size='sm' onClick={() => setEditTarget(team)}>Edit</Button>
                    <Button variant='destructive' size='sm' onClick={() => setDeleteTarget(team)}>Delete</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='text-sm'>Contest language: <span className='font-medium'>{team.team_language || '—'}</span></div>
                <div className='text-sm'>City tour route: <span className='font-medium'>{team.city_tour || '—'}</span></div>
                <div className='text-sm'>Excursion route: <span className='font-medium'>{team.excursion_route || '—'}</span></div>

                <div className='pt-2'>
                  <div className='text-sm font-medium mb-2'>Leader</div>
                  <Separator className='mb-2' />
                  {leader ? (
                    <Item variant='muted'>
                      <ItemMedia variant='icon'>
                        <Avatar>
                          <AvatarImage src="/avatars/01.png" />
                          <AvatarFallback>{getCapital(leader.display_name)}</AvatarFallback>
                        </Avatar>
                      </ItemMedia>
                      <ItemContent>
                        <ItemHeader>
                          <ItemTitle>{leader.display_name}</ItemTitle>
                        </ItemHeader>
                      </ItemContent>
                    </Item>
                  ) : (
                    <div className='text-sm text-muted-foreground'>No leader yet</div>
                  )}
                </div>

                <div className='pt-2'>
                  <div className='text-sm font-medium mb-2'>Contestants</div>
                  <Separator className='mb-2' />
                  {contestants.length ? (
                    <div className='flex flex-col gap-2'>
                      {contestants.map((m) => (
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

                {observers.length > 0 && (
                  <div className='pt-2'>
                    <div className='text-sm font-medium mb-2'>Observers</div>
                    <Separator className='mb-2' />
                    <div className='flex flex-col gap-2'>
                      {observers.map((m) => (
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
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create team</DialogTitle>
            <DialogDescription>Fill in the team information.</DialogDescription>
          </DialogHeader>
          <TeamForm onSubmit={handleCreate} />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit team</DialogTitle>
            <DialogDescription>Modify the team information.</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <TeamForm
              initialValues={{
                id: editTarget.id,
                team_name: editTarget.team_name,
                team_language: editTarget.team_language,
                city_tour: editTarget.city_tour,
                excursion_route: editTarget.excursion_route,
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
            <DialogTitle>Delete team</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.team_name}&rdquo;? This action cannot be undone.
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
