import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/auth-context'
import { ToastProvider } from '@/components/ui/toast'
import { QueryProvider } from '@/components/providers'

export const metadata: Metadata = {
  title: 'Lazybell',
  description: 'チームのスケジュールとリマインダー管理',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>
        <QueryProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
