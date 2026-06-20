'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { useAuth } from '@/contexts/auth-context'
import { extractApiError } from '@/lib/api'

const schema = z.object({
  username: z.string().min(1, 'ユーザー名を入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
})
type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: FormValues) => {
    setServerError('')
    try {
      await login(values.username, values.password)
      router.push('/dashboard')
    } catch (err) {
      setServerError(extractApiError(err))
    }
  }

  return (
    <div className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-white/10">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-zinc-900">ログイン</h2>
        <p className="mt-1 text-sm text-zinc-500">お帰りなさい。ログイン情報を入力してください。</p>
      </div>

      {serverError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="ユーザー名" required error={errors.username?.message}>
          <Input
            {...register('username')}
            autoComplete="username"
            placeholder="your_username"
          />
        </FormField>

        <FormField label="パスワード" required error={errors.password?.message}>
          <Input
            {...register('password')}
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </FormField>

        <Button type="submit" className="w-full" loading={isSubmitting}>
          ログイン
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-zinc-500">
        アカウントをお持ちでないですか？{' '}
        <Link href="/register" className="font-medium text-brand-600 hover:text-brand-700">
          新規登録
        </Link>
      </p>
    </div>
  )
}
