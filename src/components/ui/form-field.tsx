import { cn } from '@/lib/utils'
import { Label } from './label'

interface FormFieldProps {
  label: string
  hint?: string
  error?: string
  required?: boolean
  className?: string
  children: React.ReactNode
}

export function FormField({ label, hint, error, required, className, children }: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label>
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-zinc-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
