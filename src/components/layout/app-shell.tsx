'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Sidebar } from './sidebar'
import { cn } from '@/lib/utils'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:shrink-0 border-r border-zinc-200">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 animate-slide-in">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex h-14 items-center gap-4 border-b border-zinc-200 bg-white px-4 lg:hidden shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="text-sm font-semibold text-zinc-900 hover:text-brand-700 transition-colors">Lazybell</Link>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
