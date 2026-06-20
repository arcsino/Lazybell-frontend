'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { AppShell } from '@/components/layout/app-shell'
import { Spinner } from '@/components/ui/spinner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return <AppShell>{children}</AppShell>
}
