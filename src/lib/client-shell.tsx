'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AppSidebar } from '@/components/sidebar'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/context/AuthProvider'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, loading } = {user: "x", loading: false} as { user: any; loading: boolean }
  // const { user, loading } = useAuth() as { user: any; loading: boolean }

  useEffect(() => {
    if (!loading && !user) router.replace('/signin')
  }, [loading, user, router])

  if (loading || !user) return null
  return <>{children}</>
}

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
   const isAuthRoute = pathname === '/signin'
  // const isAuthRoute = false

  const crumbs = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean)
    return parts.map((part, idx) => {
      const href = '/' + parts.slice(0, idx + 1).join('/')
      const label = part.charAt(0).toUpperCase() + part.slice(1)
      return { href, label }
    })
  }, [pathname])

  if (isAuthRoute) {
    // No sidebar/header on auth route
    return <div className="min-h-screen">{children}</div>
  }

  return (
    <RequireAuth>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <Link href="/">Home</Link>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>
                      {crumbs.map(c => (
                        <Link href={c.href as any} key={c.href}>{c.label}</Link>
                      ))}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </RequireAuth>
  )
}