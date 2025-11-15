
"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Route } from 'next'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { FieldGroup } from '@/components/ui/field'
import { fetchMembers, fetchTeams, deleteMember, type Member, type Team } from '@/services/firebaseApi'

type RoleBucket = 'Team Leader' | 'Team Contestant' | 'Observer'

const ROLE_LABELS: RoleBucket[] = ['Team Leader', 'Team Contestant', 'Observer']
const OBSERVER_MAX = 2 // Assumption: max 2 observers; adjust when wired to backend/payment.

export default function MembersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<Member[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [confirmId, setConfirmId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [m, t] = await Promise.all([fetchMembers(), fetchTeams()])
        setMembers(m)
        setTeams(t)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const teamNameById = useMemo(() => {
    const map = new Map<string, string>()
    teams.forEach((t) => {
      if (t.id) map.set(t.id, t.team_name)
    })
    return map
  }, [teams])

  const grouped = useMemo(() => {
    const buckets: Record<RoleBucket, Member[]> = {
      'Team Leader': [],
      'Team Contestant': [],
      'Observer': [],
    }
    for (const m of members) {
      // We store role text in notes or another field in the stub Member? Until backend exists,
      // we attempt to infer by a loose convention: store role under notes as `role:...` OR assume unknown -> Observer.
      // If wired properly, replace with `m.role`.
      const roleFromNotes = typeof m.notes === 'string' && m.notes.startsWith('role:') ? (m.notes.slice(5) as RoleBucket) : undefined
      const role = (roleFromNotes && ROLE_LABELS.includes(roleFromNotes)) ? roleFromNotes : ('Observer' as RoleBucket)
      buckets[role].push(m)
    }
    // Sort leaders and contestants by team name then by fullName
    const byTeamThenName = (a: Member, b: Member) => {
      const an = a.teamId ? teamNameById.get(a.teamId) ?? '' : ''
      const bn = b.teamId ? teamNameById.get(b.teamId) ?? '' : ''
      if (an !== bn) return an.localeCompare(bn)
      return (a.fullName ?? '').localeCompare(b.fullName ?? '')
    }
    buckets['Team Leader'].sort(byTeamThenName)
    buckets['Team Contestant'].sort(byTeamThenName)
    // Observers sorted by name
    buckets['Observer'].sort((a, b) => (a.fullName ?? '').localeCompare(b.fullName ?? ''))
    return buckets
  }, [members, teamNameById])

  const observerRemaining = Math.max(0, OBSERVER_MAX - grouped['Observer'].length)

  function handleCreate() {
    router.push('/members/create' as Route)
  }

  function handleEdit(id?: string) {
    if (!id) return
    router.push((`/members/${id}/edit` as Route))
  }

  async function handleDelete(id: string) {
    await deleteMember(id)
    setConfirmId(null)
    // refresh list locally
    setMembers((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <div className="space-y-6 px-10">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Members</h1>
        <Button onClick={handleCreate}>Create Member</Button>
      </div>

      {loading ? (
        <Card><CardHeader>Loading…</CardHeader><CardContent /></Card>
      ) : (
        <div className="space-y-8">
          {ROLE_LABELS.map((role) => (
            <Card key={role}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="text-base font-medium">{role}</div>
                {role === 'Observer' && (
                  <div className="text-sm text-muted-foreground">Remaining slots: {observerRemaining}</div>
                )}
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Name</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead className="w-[180px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grouped[role].length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">No members</TableCell>
                      </TableRow>
                    ) : (
                      grouped[role].map((m) => (
                        <TableRow key={m.id ?? m.fullName}>
                          <TableCell className="font-medium">{m.fullName ?? '-'}</TableCell>
                          <TableCell>
                            {role === 'Observer' ? '-' : (m.teamId ? (teamNameById.get(m.teamId) ?? '-') : '-')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEdit(m.id)}>Edit</Button>
                              <Dialog open={confirmId === m.id} onOpenChange={(open) => setConfirmId(open ? (m.id ?? null) : null)}>
                                <DialogTrigger asChild>
                                  <Button variant="destructive" size="sm">Delete</Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Delete member</DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to delete this member? This action cannot be undone.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <FieldGroup>
                                    <div>
                                      <div className="text-sm">Name</div>
                                      <div className="text-sm text-muted-foreground">{m.fullName}</div>
                                    </div>
                                  </FieldGroup>
                                  <DialogFooter>
                                    <DialogClose asChild>
                                      <Button variant="outline">Cancel</Button>
                                    </DialogClose>
                                    <Button variant="destructive" onClick={() => m.id && handleDelete(m.id)}>Delete</Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
