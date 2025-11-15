import './globals.css'
import AuthProvider from '@/context/AuthProvider'
import ClientShell from '@/lib/client-shell'
import { Toaster } from '@/components/ui/sonner'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body>
        <AuthProvider>
          <ClientShell>
            {children}
          </ClientShell>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}