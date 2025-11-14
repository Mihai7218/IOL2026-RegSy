"use client"
import './globals.css'
import AuthProvider from '@/context/AuthProvider'
import {AppSidebar} from '@/components/sidebar'
import Link from 'next/link'
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { usePathname } from 'next/navigation'


export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const parts = pathname.split('/').filter(Boolean)
  const crumbs = parts.map((part, idx) => {
    const href = parts.slice(0, idx + 1)
    return { label: part, href }
  })
  const capitalize = (val: unknown) => {
    if (typeof val === 'string' && val.length > 0) {
      return val.charAt(0).toUpperCase() + val.slice(1);
    }
    return String(val);
  };
  return (
    <html lang='en'>
      <body>
        <AuthProvider>
        <SidebarProvider>
          <AppSidebar/>
          
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-2 px-4">
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="mr-2 h-4" />
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem className="hidden md:block">
                        <Link href="/">
                          Home
                        </Link>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator className="hidden md:block" />
                      <BreadcrumbItem>
                        <BreadcrumbPage>
                          {(() => {
                            return crumbs.map(c => {
                              const label = capitalize(c.label);
                              const href = Array.isArray(c.href) ? '/' + c.href.join('/') : c.href;
                              return <Link href={href} key={href}>{label}</Link>;
                            });
                          })()}
                        </BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>
            </header>
            {children}
          </SidebarInset>

    </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
