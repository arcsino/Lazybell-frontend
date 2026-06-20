'use client'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { createContext, useCallback, useContext, useState } from 'react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useState(0)[0]

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitive.Provider>
        {children}
        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            open
            className={cn(
              'group pointer-events-auto relative flex w-full items-center gap-3 overflow-hidden rounded-xl p-4 pr-10 shadow-lg transition-all',
              'data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]',
              'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none',
              'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-bottom-2',
              t.type === 'success' && 'bg-white border border-emerald-200 text-emerald-800',
              t.type === 'error'   && 'bg-white border border-red-200 text-red-800',
              t.type === 'info'    && 'bg-white border border-zinc-200 text-zinc-800'
            )}
          >
            {t.type === 'success' && <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />}
            {t.type === 'error'   && <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />}
            {t.type === 'info'    && <Info className="h-4 w-4 shrink-0 text-zinc-500" />}
            <ToastPrimitive.Description className="text-sm font-medium">{t.message}</ToastPrimitive.Description>
            <ToastPrimitive.Close className="absolute right-2 top-2 rounded p-1 text-zinc-400 hover:text-zinc-600">
              <X className="h-3 w-3" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[360px] max-w-[calc(100vw-2rem)]" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}
