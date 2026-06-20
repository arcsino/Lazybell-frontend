import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-9 w-full rounded-lg border border-zinc-300 bg-white px-3 py-1 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-brand-500',
        'disabled:cursor-not-allowed disabled:opacity-50',
        error && 'border-red-400 focus-visible:ring-red-400',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'
