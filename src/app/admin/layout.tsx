'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthProvider'
import { isAdmin } from '@/lib/roles'
import { Skeleton } from '@/components/ui/skeleton'

const NAV_LINKS = [
  { label: 'Overview', href: '/admin' },
  { label: 'Countries', href: '/admin/countries' },
  { label: 'Contacts', href: '/admin/contacts' },
  { label: 'Teams', href: '/admin/teams' },
  { label: 'Members', href: '/admin/members' },
  { label: 'Payment', href: '/admin/payments' },
  { label: 'Invites', href: '/admin/invites' },
  { label: 'Sightseeing', href: '/admin/sightseeing' },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { claims, loading } = useAuth()

  if (loading) {
    return (
      <div className="space-y-6 px-10 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (!isAdmin(claims)) {
    return (
      <div className="px-10 py-8">
        <div className="rounded-md border border-destructive bg-destructive/5 p-6">
          <p className="font-semibold text-destructive">Admin only</p>
          <p className="text-sm text-muted-foreground">You do not have permission to view the admin console.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-10 py-8">
      <header className="space-y-2">
        <div>
          <p className="text-sm text-muted-foreground">Firebase-backed console</p>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        </div>
        <nav className="flex flex-wrap gap-2">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname?.startsWith(`${link.href}/`)
            return (
              <Link
                key={link.href}
                href={link.href as Route}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                  active ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/20 hover:bg-muted'
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
      </header>
      <section>{children}</section>
    </div>
  )
}
