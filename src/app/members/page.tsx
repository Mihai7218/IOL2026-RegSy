
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
import { useAuth } from '@/context/AuthProvider'
import { isJuryMember } from '@/lib/roles'

type RoleBucket = 'Team Leader' | 'Team Contestant' | 'Observer' | 'Jury Member' | 'Language Expert'

const COUNTRY_ROLE_LABELS: RoleBucket[] = ['Team Leader', 'Team Contestant', 'Observer']
const JURY_ROLE_LABELS: RoleBucket[] = ['Jury Member', 'Language Expert', 'Observer']

export default function MembersPage() {
  const auth = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<Member[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const roleLabels = (isJuryMember(auth.claims) ? JURY_ROLE_LABELS : COUNTRY_ROLE_LABELS)

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
      'Jury Member': [],
      'Language Expert': [],
    }
    for (const m of members) {
      const role = (m.role as RoleBucket) ?? ('Observer' as RoleBucket)
      const bucket: RoleBucket = roleLabels.includes(role) ? role : 'Observer'
      buckets[bucket].push(m)
    }
    // Sort leaders and contestants by team name then by display_name
    const byTeamThenName = (a: Member, b: Member) => {
      const an = a.team ? teamNameById.get(a.team) ?? '' : ''
      const bn = b.team ? teamNameById.get(b.team) ?? '' : ''
      if (an !== bn) return an.localeCompare(bn)
      return (a.display_name ?? '').localeCompare(b.display_name ?? '')
    }
    buckets['Team Leader'].sort(byTeamThenName)
    buckets['Team Contestant'].sort(byTeamThenName)
    // Observers sorted by name
    buckets['Observer'].sort((a, b) => (a.display_name ?? '').localeCompare(b.display_name ?? ''))
    buckets['Jury Member'].sort((a, b) => (a.display_name ?? '').localeCompare(b.display_name ?? ''))
    buckets['Language Expert'].sort((a, b) => (a.display_name ?? '').localeCompare(b.display_name ?? ''))
    return buckets
  }, [members, teamNameById])

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

  const isTeamMember = (role: RoleBucket) => role === 'Team Contestant' || role === 'Team Leader' 

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
          {roleLabels.map((role) => (
            <Card key={role}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="text-base font-medium">{role}</div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Name</TableHead>
                      {isTeamMember(role) && <TableHead>Team</TableHead>}
                      <TableHead className="w-[180px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grouped[role].length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2 + (isTeamMember(role) ? 1 : 0)} className="text-center text-muted-foreground">No members</TableCell>
                      </TableRow>
                    ) : (
                      grouped[role].map((m) => (
                        <TableRow key={m.id ?? m.display_name}>
                          <TableCell className="font-medium">{m.display_name ?? '-'}</TableCell>
                          {isTeamMember(role) && <TableCell>
                            {m.team ? (teamNameById.get(m.team) ?? '-') : '-'}
                          </TableCell>}
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
                                      <div className="text-sm text-muted-foreground">{m.display_name}</div>
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
