'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'
import { useAuth } from '@/contexts/auth-context'
import { authApi } from '@/lib/api/auth'
import { setAccessToken, extractApiError } from '@/lib/api'

const schema = z.object({
  username: z.string().min(3, '3文字以上で入力してください').max(150).regex(/^\w+$/, '英数字とアンダースコアのみ使用できます'),
  nickname: z.string().min(1, 'ニックネームを入力してください').max(150),
  password: z.string()
    .min(8, '8文字以上で入力してください')
    .regex(/[A-Za-z]/, '英字を含める必要があります')
    .regex(/[0-9]/, '数字を含める必要があります')
    .regex(/[!@#$%^&*()\-_=+\[\]{}|;:\'",.<>?/`~\\]/, '特殊文字を含める必要があります'),
  biography: z.string().max(2000).optional(),
})
type FormValues = z.infer<typeof schema>

export default function RegisterPage() {
  const { refreshUser } = useAuth()
  const router = useRouter()
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: FormValues) => {
    setServerError('')
    try {
      await authApi.register(values)
      // Auto-login after registration
      const { default: axios } = await import('axios')
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/login/`,
        { username: values.username, password: values.password },
        { withCredentials: true }
      )
      setAccessToken(data.access)
      await refreshUser()
      router.push('/dashboard')
    } catch (err) {
      setServerError(extractApiError(err))
    }
  }

  return (
    <div className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-white/10">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-zinc-900">アカウント作成</h2>
        <p className="mt-1 text-sm text-zinc-500">Lazybellで始めましょう。</p>
      </div>

      {serverError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="ユーザー名" required error={errors.username?.message}>
            <Input {...register('username')} autoComplete="username" placeholder="john_doe" />
          </FormField>
          <FormField label="ニックネーム" required error={errors.nickname?.message}>
            <Input {...register('nickname')} placeholder="John" />
          </FormField>
        </div>

        <FormField label="パスワード" required error={errors.password?.message}>
          <Input {...register('password')} type="password" autoComplete="new-password" placeholder="••••••••" />
        </FormField>

        <FormField label="自己紹介" error={errors.biography?.message}>
          <Textarea {...register('biography')} placeholder="自己紹介（任意）" rows={2} />
        </FormField>

        <Button type="submit" className="w-full" loading={isSubmitting}>
          アカウントを作成
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-zinc-500">
        既にアカウントをお持ちですか？{' '}
        <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
          ログイン
        </Link>
      </p>
    </div>
  )
}
